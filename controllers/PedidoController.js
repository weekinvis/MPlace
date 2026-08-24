'use strict';

// controllers/PedidoController.js
const { Op } = require('sequelize');
const {
  sequelize,
  Pedido,
  ItemPedido,
  HistoricoEstadoPedido,
  Produto,
  Usuario,
  Endereco,
  PerfilVendedor,
} = require('../models');
const { obterOuCriarCarrinho, montarResumo } = require('./CarrinhoController');
const { notificarUsuario, sincronizarCatalogo } = require('../config/socket');

const ORDEM_ESTADOS = ['aguardando_confirmacao', 'confirmado', 'em_preparacao', 'enviado', 'entregue'];

const ROTULOS_ESTADO = {
  aguardando_confirmacao: 'Aguardando confirmação',
  confirmado: 'Confirmado',
  em_preparacao: 'Em preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

function gerarNumeroPedido() {
  const timestamp = Date.now().toString().slice(-8);
  const aleatorio = Math.floor(100 + Math.random() * 900);
  return `PED-${timestamp}${aleatorio}`;
}

function calcularFrete(formaEntrega, subtotal) {
  if (subtotal >= 200) return 0;
  return formaEntrega === 'expressa' ? 35 : 15;
}

module.exports = {
  ROTULOS_ESTADO,
  ORDEM_ESTADOS,

  // GET /checkout
  async formulario(req, res) {
    const usuario = req.session.usuario;
    const carrinho = await obterOuCriarCarrinho(usuario.id);
    const resumo = await montarResumo(carrinho.id);

    if (resumo.itens.length === 0) {
      req.flash('erro', 'Seu carrinho está vazio.');
      return res.redirect('/carrinho');
    }

    const enderecos = await Endereco.findAll({ where: { usuarioId: usuario.id }, order: [['principal', 'DESC']] });
    if (enderecos.length === 0) {
      req.flash('erro', 'Cadastre um endereço de entrega antes de finalizar a compra.');
      return res.redirect('/enderecos?retorno=checkout');
    }

    // Agrupa por vendedor só para exibir o resumo (o pedido em si é dividido no POST).
    const porVendedor = {};
    resumo.itens.forEach((item) => {
      const vId = item.produto.vendedorId;
      if (!porVendedor[vId]) {
        porVendedor[vId] = {
          vendedor: item.produto.vendedor,
          itens: [],
          subtotal: 0,
        };
      }
      const preco = Number(item.produto.precoPromocional || item.produto.preco);
      porVendedor[vId].itens.push(item);
      porVendedor[vId].subtotal += preco * item.quantidade;
    });

    res.render('cliente/checkout', {
      titulo: 'Finalizar compra',
      enderecos,
      gruposPorVendedor: Object.values(porVendedor),
      subtotalGeral: resumo.subtotal,
    });
  },

  // POST /checkout
  async finalizar(req, res) {
    const usuario = req.session.usuario;
    const { enderecoId, formaPagamento, formaEntrega } = req.body;

    try {
      const endereco = await Endereco.findOne({ where: { id: enderecoId, usuarioId: usuario.id } });
      if (!endereco) {
        req.flash('erro', 'Endereço inválido.');
        return res.redirect('/checkout');
      }

      const carrinho = await obterOuCriarCarrinho(usuario.id);
      const resumo = await montarResumo(carrinho.id);

      if (resumo.itens.length === 0) {
        req.flash('erro', 'Seu carrinho está vazio.');
        return res.redirect('/carrinho');
      }

      // Confere estoque em tempo real antes de fechar o pedido.
      for (const item of resumo.itens) {
        if (item.quantidade > item.produto.estoque) {
          req.flash('erro', `"${item.produto.nome}" não tem mais estoque suficiente (disponível: ${item.produto.estoque}).`);
          return res.redirect('/carrinho');
        }
      }

      const porVendedor = {};
      resumo.itens.forEach((item) => {
        const vId = item.produto.vendedorId;
        if (!porVendedor[vId]) porVendedor[vId] = [];
        porVendedor[vId].push(item);
      });

      const codigoCompra = `COMPRA-${Date.now()}`;
      const pedidosCriados = [];

      await sequelize.transaction(async (t) => {
        for (const vendedorId of Object.keys(porVendedor)) {
          const itensDoVendedor = porVendedor[vendedorId];
          const subtotalVendedor = itensDoVendedor.reduce(
            (soma, item) => soma + Number(item.produto.precoPromocional || item.produto.preco) * item.quantidade,
            0
          );
          const frete = calcularFrete(formaEntrega, subtotalVendedor);

          const pedido = await Pedido.create(
            {
              usuarioId: usuario.id,
              enderecoId: endereco.id,
              numeroPedido: gerarNumeroPedido(),
              codigoCompra,
              valorProdutos: subtotalVendedor,
              valorFrete: frete,
              valorTotal: subtotalVendedor + frete,
              formaPagamento,
              formaEntrega,
              estado: 'aguardando_confirmacao',
            },
            { transaction: t }
          );

          for (const item of itensDoVendedor) {
            const preco = Number(item.produto.precoPromocional || item.produto.preco);
            await ItemPedido.create(
              {
                pedidoId: pedido.id,
                produtoId: item.produto.id,
                vendedorId: item.produto.vendedorId,
                nomeProduto: item.produto.nome,
                imagemProduto: item.produto.imagem,
                precoUnitario: preco,
                quantidade: item.quantidade,
                desconto: 0,
                subtotal: preco * item.quantidade,
              },
              { transaction: t }
            );

            await Produto.decrement('estoque', {
              by: item.quantidade,
              where: { id: item.produto.id },
              transaction: t,
            });
          }

          await HistoricoEstadoPedido.create(
            {
              pedidoId: pedido.id,
              estadoAnterior: null,
              estadoNovo: 'aguardando_confirmacao',
              usuarioId: usuario.id,
              observacao: 'Pedido criado pelo cliente.',
            },
            { transaction: t }
          );

          pedidosCriados.push({ pedido, itens: itensDoVendedor, vendedorId });
        }

        await ItemPedido.sequelize; // no-op, mantém referência
        const { ItemCarrinho } = require('../models');
        await ItemCarrinho.destroy({ where: { carrinhoId: carrinho.id }, transaction: t });
      });

      // Pós-transação: notificações em tempo real (não precisam bloquear a resposta ao cliente).
      for (const { pedido, itens, vendedorId } of pedidosCriados) {
        const { Notificacao } = require('../models');
        const mensagem = `Novo pedido ${pedido.numeroPedido} recebido (${itens.length} item(ns)).`;
        const notificacao = await Notificacao.create({
          usuarioId: vendedorId,
          tipo: 'novo_pedido',
          titulo: 'Nova venda! 🎉',
          mensagem,
          link: `/vendedor/pedidos/${pedido.id}`,
        });
        notificarUsuario(vendedorId, 'notificacao', {
          id: notificacao.id,
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          link: notificacao.link,
          criadoEm: notificacao.createdAt,
        });

        itens.forEach((item) => {
          sincronizarCatalogo('estoque-atualizado', {
            produtoId: item.produto.id,
            estoque: item.produto.estoque - item.quantidade,
            esgotado: item.produto.estoque - item.quantidade <= 0,
          });
        });
      }

      req.flash('sucesso', `Pedido${pedidosCriados.length > 1 ? 's realizados' : ' realizado'} com sucesso!`);
      res.redirect(`/pedidos/confirmacao/${codigoCompra}`);
    } catch (erro) {
      console.error('Erro ao finalizar compra:', erro);
      req.flash('erro', 'Não foi possível concluir a compra. Tente novamente.');
      res.redirect('/checkout');
    }
  },

  // GET /pedidos/confirmacao/:codigoCompra
  async confirmacao(req, res) {
    const pedidos = await Pedido.findAll({
      where: { codigoCompra: req.params.codigoCompra, usuarioId: req.session.usuario.id },
      include: [{ model: ItemPedido, as: 'itens' }],
    });
    if (pedidos.length === 0) {
      return res.status(404).render('error/404', { titulo: 'Pedido não encontrado' });
    }
    res.render('cliente/confirmacao', { titulo: 'Pedido confirmado', pedidos });
  },

  // GET /pedidos
  async meusPedidos(req, res) {
    const pedidos = await Pedido.findAll({
      where: { usuarioId: req.session.usuario.id },
      include: [{ model: ItemPedido, as: 'itens' }],
      order: [['createdAt', 'DESC']],
    });
    res.render('cliente/pedidos', { titulo: 'Meus pedidos', pedidos, ROTULOS_ESTADO });
  },

  // GET /pedidos/:id
  async detalhesCliente(req, res) {
    const pedido = await Pedido.findOne({
      where: { id: req.params.id, usuarioId: req.session.usuario.id },
      include: [
        { model: ItemPedido, as: 'itens', include: [{ model: Usuario, as: 'vendedor', include: [{model: PerfilVendedor, as: 'perfilVendedor'}] }] },
        { model: Endereco, as: 'endereco' },
        { model: HistoricoEstadoPedido, as: 'historico', order: [['createdAt', 'ASC']] },
      ],
    });

    if (!pedido) {
      return res.status(404).render('error/404', { titulo: 'Pedido não encontrado' });
    }

    res.render('cliente/pedido-detalhes', { titulo: `Pedido ${pedido.numeroPedido}`, pedido, ROTULOS_ESTADO });
  },

  // PATCH /pedidos/:id/cancelar
  async cancelar(req, res) {
    const pedido = await Pedido.findOne({
      where: { id: req.params.id, usuarioId: req.session.usuario.id },
      include: [{ model: ItemPedido, as: 'itens' }],
    });

    if (!pedido) {
      req.flash('erro', 'Pedido não encontrado.');
      return res.redirect('/pedidos');
    }
    if (!['aguardando_confirmacao', 'confirmado'].includes(pedido.estado)) {
      req.flash('erro', 'Este pedido não pode mais ser cancelado (já está em preparo ou enviado).');
      return res.redirect(`/pedidos/${pedido.id}`);
    }

    const estadoAnterior = pedido.estado;
    await sequelize.transaction(async (t) => {
      for (const item of pedido.itens) {
        if (item.produtoId) {
          await Produto.increment('estoque', { by: item.quantidade, where: { id: item.produtoId }, transaction: t });
        }
      }
      pedido.estado = 'cancelado';
      await pedido.save({ transaction: t });
      await HistoricoEstadoPedido.create(
        {
          pedidoId: pedido.id,
          estadoAnterior,
          estadoNovo: 'cancelado',
          usuarioId: req.session.usuario.id,
          observacao: 'Cancelado pelo cliente.',
        },
        { transaction: t }
      );
    });

    req.flash('sucesso', 'Pedido cancelado com sucesso.');
    res.redirect(`/pedidos/${pedido.id}`);
  },

  // GET /vendedor/pedidos
  async pedidosVendedor(req, res) {
    const { estado } = req.query;
    const where = {};
    if (estado) where.estado = estado;

    const pedidos = await Pedido.findAll({
      where,
      include: [
        { model: ItemPedido, as: 'itens', where: { vendedorId: req.session.usuario.id }, required: true },
        { model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.render('vendedor/pedidos', { titulo: 'Pedidos recebidos', pedidos, ROTULOS_ESTADO, filtroEstado: estado || '' });
  },

  // GET /vendedor/pedidos/:id
  async detalhesVendedor(req, res) {
    const pedido = await Pedido.findOne({
      where: { id: req.params.id },
      include: [
        { model: ItemPedido, as: 'itens', where: { vendedorId: req.session.usuario.id }, required: true },
        { model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'email', 'telefone'] },
        { model: Endereco, as: 'endereco' },
        { model: HistoricoEstadoPedido, as: 'historico' },
      ],
    });

    if (!pedido) {
      return res.status(404).render('error/404', { titulo: 'Pedido não encontrado' });
    }

    res.render('vendedor/pedido-detalhes', {
      titulo: `Pedido ${pedido.numeroPedido}`,
      pedido,
      ROTULOS_ESTADO,
      ORDEM_ESTADOS,
    });
  },

  // PATCH /vendedor/pedidos/:id/status (AJAX)
  async atualizarStatus(req, res) {
    try {
      const pedido = await Pedido.findOne({
        where: { id: req.params.id },
        include: [{ model: ItemPedido, as: 'itens', where: { vendedorId: req.session.usuario.id }, required: true }],
      });

      if (!pedido) {
        return res.status(404).json({ erro: 'Pedido não encontrado.' });
      }

      const { novoEstado } = req.body;
      const posicaoAtual = ORDEM_ESTADOS.indexOf(pedido.estado);
      const posicaoNova = ORDEM_ESTADOS.indexOf(novoEstado);

      const ehCancelamento = novoEstado === 'cancelado';
      const ehAvancoValido = posicaoNova === posicaoAtual + 1;

      if (!ehCancelamento && !ehAvancoValido) {
        return res.status(400).json({ erro: 'Transição de status inválida.' });
      }
      if (pedido.estado === 'entregue' || pedido.estado === 'cancelado') {
        return res.status(400).json({ erro: 'Este pedido já foi finalizado e não pode mais ser alterado.' });
      }

      const estadoAnterior = pedido.estado;

      await sequelize.transaction(async (t) => {
        if (ehCancelamento) {
          for (const item of pedido.itens) {
            if (item.produtoId) {
              await Produto.increment('estoque', { by: item.quantidade, where: { id: item.produtoId }, transaction: t });
            }
          }
        }
        pedido.estado = novoEstado;
        await pedido.save({ transaction: t });
        await HistoricoEstadoPedido.create(
          {
            pedidoId: pedido.id,
            estadoAnterior,
            estadoNovo: novoEstado,
            usuarioId: req.session.usuario.id,
            observacao: `Atualizado pelo vendedor.`,
          },
          { transaction: t }
        );
      });

      const { Notificacao } = require('../models');
      const mensagem = `Seu pedido ${pedido.numeroPedido} agora está: ${ROTULOS_ESTADO[novoEstado]}.`;
      const notificacao = await Notificacao.create({
        usuarioId: pedido.usuarioId,
        tipo: 'status_pedido',
        titulo: 'Atualização do seu pedido',
        mensagem,
        link: `/pedidos/${pedido.id}`,
      });

      notificarUsuario(pedido.usuarioId, 'notificacao', {
        id: notificacao.id,
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        link: notificacao.link,
        criadoEm: notificacao.createdAt,
      });
      notificarUsuario(pedido.usuarioId, 'pedido-status-atualizado', {
        pedidoId: pedido.id,
        novoEstado,
        rotulo: ROTULOS_ESTADO[novoEstado],
      });

      res.json({ sucesso: true, estado: novoEstado, rotulo: ROTULOS_ESTADO[novoEstado] });
    } catch (erro) {
      console.error('Erro ao atualizar status do pedido:', erro);
      res.status(500).json({ erro: 'Erro ao atualizar status do pedido.' });
    }
  },

  // GET /admin/pedidos
  async listarTodosAdmin(req, res) {
    const { estado } = req.query;
    const where = {};
    if (estado) where.estado = estado;

    const pedidos = await Pedido.findAll({
      where,
      include: [{ model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'email'] }, { model: ItemPedido, as: 'itens' }],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    res.render('admin/pedidos', { titulo: 'Pedidos da plataforma', pedidos, ROTULOS_ESTADO, filtroEstado: estado || '' });
  },
};

'use strict';

// controllers/VendedorController.js
const { Op } = require('sequelize');
const {
  sequelize,
  Usuario,
  PerfilVendedor,
  Produto,
  Pedido,
  ItemPedido,
  Avaliacao,
} = require('../models');

module.exports = {
  // GET /vendedores/:id (perfil público da loja)
  async perfilPublico(req, res) {
    const vendedor = await Usuario.findOne({
      where: { id: req.params.id, tipo: 'vendedor' },
      include: [{ model: PerfilVendedor, as: 'perfilVendedor' }],
    });

    if (!vendedor || !vendedor.perfilVendedor) {
      return res.status(404).render('error/404', { titulo: 'Loja não encontrada' });
    }

    const produtos = await Produto.findAll({
      where: { vendedorId: vendedor.id, estado: 'ativo' },
      order: [['createdAt', 'DESC']],
    });

    const mediaResultado = await Avaliacao.findOne({
      where: { estadoModeracao: 'aprovada' },
      include: [{ model: Produto, as: 'produto', where: { vendedorId: vendedor.id }, attributes: [] }],
      attributes: [[sequelize.fn('AVG', sequelize.col('Avaliacao.nota')), 'media'], [sequelize.fn('COUNT', sequelize.col('Avaliacao.id')), 'total']],
      raw: true,
    });

    res.render('public/vendedor-publico', {
      titulo: vendedor.perfilVendedor.nomeLoja,
      vendedor,
      produtos,
      mediaNota: mediaResultado && mediaResultado.media ? Number(mediaResultado.media).toFixed(1) : null,
      totalAvaliacoes: mediaResultado ? Number(mediaResultado.total) : 0,
    });
  },

  // GET /vendedor/dashboard
  async dashboard(req, res) {
    const vendedorId = req.session.usuario.id;

    const totalProdutos = await Produto.count({ where: { vendedorId } });
    const produtosAtivos = await Produto.count({ where: { vendedorId, estado: 'ativo' } });
    const produtosSemEstoque = await Produto.count({ where: { vendedorId, estoque: 0 } });

    const totalPedidos = await ItemPedido.count({
      where: { vendedorId },
      distinct: true,
      col: 'pedidoId',
    });

    const faturamentoResultado = await ItemPedido.findOne({
      where: { vendedorId },
      include: [{ model: Pedido, as: 'pedido', where: { estado: { [Op.ne]: 'cancelado' } }, attributes: [] }],
      attributes: [[sequelize.fn('SUM', sequelize.col('ItemPedido.subtotal')), 'total']],
      raw: true,
    });
    const faturamentoTotal = faturamentoResultado && faturamentoResultado.total ? Number(faturamentoResultado.total) : 0;

    const pedidosPendentes = await Pedido.count({
      include: [{ model: ItemPedido, as: 'itens', where: { vendedorId }, required: true }],
      where: { estado: { [Op.in]: ['aguardando_confirmacao', 'confirmado', 'em_preparacao'] } },
      distinct: true,
    });

    const maisVendidosRaw = await ItemPedido.findAll({
      where: { vendedorId },
      attributes: [
        'produtoId',
        'nomeProduto',
        [sequelize.fn('SUM', sequelize.col('quantidade')), 'totalVendido'],
      ],
      group: ['produtoId', 'nomeProduto'],
      order: [[sequelize.fn('SUM', sequelize.col('quantidade')), 'DESC']],
      limit: 5,
      raw: true,
    });

    const pedidosRecentes = await Pedido.findAll({
      include: [
        { model: ItemPedido, as: 'itens', where: { vendedorId }, required: true },
        { model: Usuario, as: 'cliente', attributes: ['nome'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.render('vendedor/dashboard', {
      titulo: 'Painel do vendedor',
      totalProdutos,
      produtosAtivos,
      produtosSemEstoque,
      totalPedidos,
      faturamentoTotal,
      pedidosPendentes,
      maisVendidos: maisVendidosRaw,
      pedidosRecentes,
    });
  },

  // GET /vendedor/perfil
  async formularioPerfil(req, res) {
    const perfil = await PerfilVendedor.findOne({ where: { usuarioId: req.session.usuario.id } });
    res.render('vendedor/perfil', { titulo: 'Perfil da loja', perfil, erros: [] });
  },

  // POST /vendedor/perfil
  async atualizarPerfil(req, res) {
    const perfil = await PerfilVendedor.findOne({ where: { usuarioId: req.session.usuario.id } });
    const { nomeLoja, descricao, documento } = req.body;

    try {
      const dados = { nomeLoja, descricao, documento };
      if (req.files) {
        if (req.files.logo) dados.logo = `/images/lojas/${req.files.logo[0].filename}`;
        if (req.files.banner) dados.banner = `/images/lojas/${req.files.banner[0].filename}`;
      }
      await perfil.update(dados);
      req.flash('sucesso', 'Perfil da loja atualizado com sucesso.');
      res.redirect('/vendedor/perfil');
    } catch (erro) {
      const mensagens = erro.errors ? erro.errors.map((e) => e.message) : ['Erro ao atualizar perfil da loja.'];
      res.status(400).render('vendedor/perfil', { titulo: 'Perfil da loja', perfil, erros: mensagens });
    }
  },
};

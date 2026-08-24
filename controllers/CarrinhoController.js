'use strict';

// controllers/CarrinhoController.js
const { Carrinho, ItemCarrinho, Produto, Usuario, PerfilVendedor } = require('../models');

async function obterOuCriarCarrinho(usuarioId) {
  let carrinho = await Carrinho.findOne({ where: { usuarioId } });
  if (!carrinho) {
    carrinho = await Carrinho.create({ usuarioId });
  }
  return carrinho;
}

async function montarResumo(carrinhoId) {
  const itens = await ItemCarrinho.findAll({
    where: { carrinhoId },
    include: [
      {
        model: Produto,
        as: 'produto',
        include: [{ model: Usuario, as: 'vendedor', include: [{ model: PerfilVendedor, as: 'perfilVendedor' }] }],
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  let subtotal = 0;
  let quantidadeTotal = 0;
  const itensValidos = [];

  for (const item of itens) {
    // Se o produto foi removido/desativado nesse meio tempo, ignora no cálculo.
    if (!item.produto || item.produto.estado !== 'ativo') continue;
    const preco = item.produto.precoPromocional || item.produto.preco;
    subtotal += Number(preco) * item.quantidade;
    quantidadeTotal += item.quantidade;
    itensValidos.push(item);
  }

  return { itens: itensValidos, subtotal, quantidadeTotal };
}

module.exports = {
  obterOuCriarCarrinho,
  montarResumo,

  // GET /carrinho
  async ver(req, res) {
    const carrinho = await obterOuCriarCarrinho(req.session.usuario.id);
    const resumo = await montarResumo(carrinho.id);
    res.render('cliente/carrinho', { titulo: 'Meu carrinho', ...resumo });
  },

  // POST /carrinho (AJAX) - adiciona um produto
  async adicionar(req, res) {
    try {
      const { produtoId, quantidade } = req.body;
      const produto = await Produto.findByPk(produtoId);

      if (!produto || produto.estado !== 'ativo') {
        return res.status(404).json({ erro: 'Produto indisponível.' });
      }

      const qtd = Math.max(parseInt(quantidade, 10) || 1, 1);
      if (produto.estoque < qtd) {
        return res.status(400).json({ erro: `Apenas ${produto.estoque} unidade(s) em estoque.` });
      }

      const carrinho = await obterOuCriarCarrinho(req.session.usuario.id);
      let item = await ItemCarrinho.findOne({ where: { carrinhoId: carrinho.id, produtoId } });

      if (item) {
        const novaQuantidade = item.quantidade + qtd;
        if (novaQuantidade > produto.estoque) {
          return res.status(400).json({ erro: `Apenas ${produto.estoque} unidade(s) em estoque.` });
        }
        item.quantidade = novaQuantidade;
        await item.save();
      } else {
        item = await ItemCarrinho.create({ carrinhoId: carrinho.id, produtoId, quantidade: qtd });
      }

      const resumo = await montarResumo(carrinho.id);
      res.json({ sucesso: true, quantidadeTotal: resumo.quantidadeTotal, subtotal: resumo.subtotal });
    } catch (erro) {
      console.error('Erro ao adicionar ao carrinho:', erro);
      res.status(500).json({ erro: 'Erro ao adicionar produto ao carrinho.' });
    }
  },

  // PATCH /carrinho/:itemId (AJAX) - altera quantidade
  async atualizarQuantidade(req, res) {
    try {
      const item = await ItemCarrinho.findByPk(req.params.itemId, {
        include: [{ model: Produto, as: 'produto' }, { model: Carrinho, as: 'carrinho' }],
      });

      if (!item || item.carrinho.usuarioId !== req.session.usuario.id) {
        return res.status(404).json({ erro: 'Item não encontrado no seu carrinho.' });
      }

      const novaQuantidade = Math.max(parseInt(req.body.quantidade, 10) || 1, 1);
      if (novaQuantidade > item.produto.estoque) {
        return res.status(400).json({ erro: `Apenas ${item.produto.estoque} unidade(s) em estoque.` });
      }

      item.quantidade = novaQuantidade;
      await item.save();

      const resumo = await montarResumo(item.carrinhoId);
      const precoItem = Number(item.produto.precoPromocional || item.produto.preco);

      res.json({
        sucesso: true,
        subtotalItem: precoItem * item.quantidade,
        quantidadeTotal: resumo.quantidadeTotal,
        subtotalCarrinho: resumo.subtotal,
      });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao atualizar quantidade.' });
    }
  },

  // DELETE /carrinho/:itemId (AJAX)
  async remover(req, res) {
    try {
      const item = await ItemCarrinho.findByPk(req.params.itemId, {
        include: [{ model: Carrinho, as: 'carrinho' }],
      });

      if (!item || item.carrinho.usuarioId !== req.session.usuario.id) {
        return res.status(404).json({ erro: 'Item não encontrado no seu carrinho.' });
      }

      const carrinhoId = item.carrinhoId;
      await item.destroy();

      const resumo = await montarResumo(carrinhoId);
      res.json({ sucesso: true, quantidadeTotal: resumo.quantidadeTotal, subtotalCarrinho: resumo.subtotal });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao remover item do carrinho.' });
    }
  },
};

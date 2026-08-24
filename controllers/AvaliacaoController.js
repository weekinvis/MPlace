'use strict';

// controllers/AvaliacaoController.js
const { Avaliacao, Produto, Usuario, ItemPedido, Pedido } = require('../models');
const { notificarUsuario } = require('../config/socket');

module.exports = {
  // POST /produtos/:id/avaliacoes
  async criar(req, res) {
    const produtoId = req.params.id;
    const usuarioId = req.session.usuario.id;
    const { nota, comentario, pedidoId } = req.body;

    try {
      // Garante que o cliente realmente comprou e recebeu o produto nesse pedido.
      const itemComprado = await ItemPedido.findOne({
        where: { produtoId, pedidoId },
        include: [{ association: 'pedido', where: { usuarioId, estado: 'entregue' } }],
      });

      if (!itemComprado) {
        req.flash('erro', 'Você só pode avaliar produtos que já recebeu.');
        return res.redirect(`/produtos/${produtoId}`);
      }

      const jaAvaliou = await Avaliacao.findOne({ where: { usuarioId, produtoId, pedidoId } });
      if (jaAvaliou) {
        req.flash('erro', 'Você já avaliou este produto para este pedido.');
        return res.redirect(`/produtos/${produtoId}`);
      }

      const avaliacao = await Avaliacao.create({
        usuarioId,
        produtoId,
        pedidoId,
        nota,
        comentario,
        estadoModeracao: 'pendente',
      });

      const produto = await Produto.findByPk(produtoId);
      if (produto) {
        const { Notificacao } = require('../models');
        const notificacao = await Notificacao.create({
          usuarioId: produto.vendedorId,
          tipo: 'nova_avaliacao',
          titulo: 'Nova avaliação recebida',
          mensagem: `Seu produto "${produto.nome}" recebeu uma nova avaliação (${avaliacao.nota}★).`,
          link: `/produtos/${produto.id}`,
        });
        notificarUsuario(produto.vendedorId, 'notificacao', {
          id: notificacao.id,
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          link: notificacao.link,
          criadoEm: notificacao.createdAt,
        });
      }

      req.flash('sucesso', 'Avaliação enviada! Ela ficará visível após a moderação.');
      res.redirect(`/produtos/${produtoId}`);
    } catch (erro) {
      console.error('Erro ao criar avaliação:', erro);
      req.flash('erro', erro.errors ? erro.errors[0].message : 'Erro ao enviar avaliação.');
      res.redirect(`/produtos/${produtoId}`);
    }
  },

  // GET /vendedor/avaliacoes
  async listarPorVendedor(req, res) {
    const avaliacoes = await Avaliacao.findAll({
      include: [
        { model: Produto, as: 'produto', where: { vendedorId: req.session.usuario.id }, required: true },
        { model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.render('vendedor/avaliacoes', { titulo: 'Avaliações recebidas', avaliacoes });
  },

  // GET /admin/avaliacoes
  async listarParaModeracao(req, res) {
    const { estado } = req.query;
    const where = {};
    if (estado) where.estadoModeracao = estado;

    const avaliacoes = await Avaliacao.findAll({
      where,
      include: [
        { model: Produto, as: 'produto', attributes: ['id', 'nome'] },
        { model: Usuario, as: 'cliente', attributes: ['id', 'nome'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.render('admin/avaliacoes', { titulo: 'Moderação de avaliações', avaliacoes, filtroEstado: estado || '' });
  },

  // PATCH /admin/avaliacoes/:id/moderar (AJAX)
  async moderar(req, res) {
    try {
      const avaliacao = await Avaliacao.findByPk(req.params.id);
      if (!avaliacao) {
        return res.status(404).json({ erro: 'Avaliação não encontrada.' });
      }
      const { acao } = req.body; // 'aprovar' | 'ocultar'
      avaliacao.estadoModeracao = acao === 'aprovar' ? 'aprovada' : 'oculta';
      await avaliacao.save();
      res.json({ sucesso: true, estadoModeracao: avaliacao.estadoModeracao });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao moderar avaliação.' });
    }
  },
};

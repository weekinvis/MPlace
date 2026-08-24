'use strict';

// controllers/NotificacaoController.js
const { Notificacao } = require('../models');

module.exports = {
  // GET /notificacoes
  async listar(req, res) {
    const notificacoes = await Notificacao.findAll({
      where: { usuarioId: req.session.usuario.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.render('cliente/notificacoes', { titulo: 'Notificações', notificacoes });
  },

  // GET /notificacoes/recentes (AJAX - usado pelo sino da navbar)
  async recentesAjax(req, res) {
    const notificacoes = await Notificacao.findAll({
      where: { usuarioId: req.session.usuario.id },
      order: [['createdAt', 'DESC']],
      limit: 8,
    });
    const naoLidas = await Notificacao.count({ where: { usuarioId: req.session.usuario.id, lida: false } });
    res.json({ notificacoes, naoLidas });
  },

  // PATCH /notificacoes/:id/lida (AJAX)
  async marcarComoLida(req, res) {
    try {
      const notificacao = await Notificacao.findOne({
        where: { id: req.params.id, usuarioId: req.session.usuario.id },
      });
      if (!notificacao) return res.status(404).json({ erro: 'Notificação não encontrada.' });

      notificacao.lida = true;
      await notificacao.save();
      res.json({ sucesso: true });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao atualizar notificação.' });
    }
  },

  // PATCH /notificacoes/marcar-todas (AJAX)
  async marcarTodasComoLidas(req, res) {
    try {
      await Notificacao.update(
        { lida: true },
        { where: { usuarioId: req.session.usuario.id, lida: false } }
      );
      res.json({ sucesso: true });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao atualizar notificações.' });
    }
  },
};

'use strict';

// middlewares/roleMiddleware.js
// Verifica se o usuário logado é Cliente, Vendedor ou Admin (autorização
// baseada em tipo de usuário). Isso roda sempre no servidor — nunca
// confiamos apenas em esconder botões/links no navegador, conforme exigido
// na seção 5 do enunciado.

const { isRequisicaoAjax } = require('./authMiddleware');

/**
 * requireRole('admin')            -> só admin
 * requireRole('vendedor', 'admin') -> vendedor OU admin
 */
function requireRole(...tiposPermitidos) {
  return (req, res, next) => {
    const usuario = req.session && req.session.usuario;

    if (!usuario) {
      if (isRequisicaoAjax(req)) {
        return res.status(401).json({ erro: 'Você precisa estar logado.' });
      }
      req.flash('erro', 'Você precisa entrar na sua conta para acessar essa página.');
      return res.redirect('/login');
    }

    if (!tiposPermitidos.includes(usuario.tipo)) {
      if (isRequisicaoAjax(req)) {
        return res.status(403).json({ erro: 'Você não tem permissão para realizar esta ação.' });
      }
      return res.status(403).render('error/403', {
        titulo: 'Acesso negado',
        usuarioLogado: usuario,
      });
    }

    return next();
  };
}

module.exports = { requireRole };

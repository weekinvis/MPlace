'use strict';

// middlewares/authMiddleware.js
// Verifica se o usuário está logado (autenticação). A autorização por tipo
// de usuário fica em roleMiddleware.js — propositalmente separada, porque
// autenticação (quem é você) e autorização (o que você pode fazer) são
// responsabilidades diferentes.

/**
 * Detecta se a requisição é uma chamada assíncrona (AJAX/fetch) para decidir
 * se devemos responder com JSON (401) ou redirecionar/renderizar uma página.
 */
function isRequisicaoAjax(req) {
  return (
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.headers['x-requested-with'] === 'XMLHttpRequest'
  );
}

/**
 * Exige que o usuário esteja autenticado. Usado em rotas privadas
 * (carrinho, checkout, pedidos, áreas de vendedor/admin etc).
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }

  if (isRequisicaoAjax(req)) {
    return res.status(401).json({ erro: 'Você precisa estar logado para realizar esta ação.' });
  }

  req.flash('erro', 'Você precisa entrar na sua conta para acessar essa página.');
  req.session.redirecionarApos = req.originalUrl;
  return res.redirect('/login');
}

/**
 * Usado nas páginas de login/cadastro: se o usuário já estiver logado,
 * não faz sentido mostrar o formulário de novo.
 */
function redirectSeAutenticado(req, res, next) {
  if (req.session && req.session.usuario) {
    return res.redirect('/');
  }
  return next();
}

module.exports = { requireAuth, redirectSeAutenticado, isRequisicaoAjax };

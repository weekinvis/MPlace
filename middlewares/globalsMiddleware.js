'use strict';

// middlewares/globalsMiddleware.js
// Roda em toda requisição e disponibiliza para TODAS as views (via
// res.locals) os dados que a navbar/partials precisam: usuário logado,
// quantidade de itens no carrinho, notificações não lidas e mensagens
// flash de sucesso/erro. Assim nenhuma controller precisa repetir essa
// lógica manualmente.

module.exports = function globalsMiddleware(models) {
  const { Carrinho, ItemCarrinho, Notificacao } = models;

  return async function (req, res, next) {
    const usuario = (req.session && req.session.usuario) || null;

    res.locals.usuarioLogado = usuario;
    res.locals.carrinhoQuantidade = 0;
    res.locals.notificacoesNaoLidas = 0;
    res.locals.mensagensSucesso = req.flash('sucesso');
    res.locals.mensagensErro = req.flash('erro');
    res.locals.caminhoAtual = req.path;

    if (!usuario) {
      return next();
    }

    try {
      if (usuario.tipo === 'cliente') {
        const carrinho = await Carrinho.findOne({ where: { usuarioId: usuario.id } });
        if (carrinho) {
          const itens = await ItemCarrinho.findAll({ where: { carrinhoId: carrinho.id } });
          res.locals.carrinhoQuantidade = itens.reduce((soma, item) => soma + item.quantidade, 0);
        }
      }

      res.locals.notificacoesNaoLidas = await Notificacao.count({
        where: { usuarioId: usuario.id, lida: false },
      });
    } catch (erro) {
      console.error('[globalsMiddleware] falha ao carregar dados globais:', erro.message);
    }

    next();
  };
};

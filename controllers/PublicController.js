'use strict';

// controllers/PublicController.js
const { Produto, Categoria, Usuario, PerfilVendedor } = require('../models');

module.exports = {
  // GET /
  async home(req, res) {
    const produtosDestaque = await Produto.findAll({
      where: { estado: 'ativo', destaque: true },
      include: [{ model: Usuario, as: 'vendedor', include: [{ model: PerfilVendedor, as: 'perfilVendedor' }] }],
      limit: 8,
    });

    const produtosRecentes = await Produto.findAll({
      where: { estado: 'ativo' },
      include: [{ model: Usuario, as: 'vendedor', include: [{ model: PerfilVendedor, as: 'perfilVendedor' }] }],
      order: [['createdAt', 'DESC']],
      limit: 8,
    });

    const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });

    const lojasEmDestaque = await Usuario.findAll({
      where: { tipo: 'vendedor', bloqueado: false },
      include: [{ model: PerfilVendedor, as: 'perfilVendedor', required: true }],
      limit: 4,
    });

    res.render('public/index', {
      titulo: 'Bazari — o marketplace de todo mundo',
      produtosDestaque,
      produtosRecentes,
      categorias,
      lojasEmDestaque,
    });
  },
};

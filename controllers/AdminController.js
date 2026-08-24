'use strict';

// controllers/AdminController.js
const { Op } = require('sequelize');
const {
  sequelize,
  Usuario,
  PerfilVendedor,
  Produto,
  Categoria,
  Pedido,
  Avaliacao,
} = require('../models');

module.exports = {
  // GET /admin/dashboard
  async dashboard(req, res) {
    const totalClientes = await Usuario.count({ where: { tipo: 'cliente' } });
    const totalVendedores = await Usuario.count({ where: { tipo: 'vendedor' } });
    const totalProdutos = await Produto.count();
    const totalPedidos = await Pedido.count();
    const totalCategorias = await Categoria.count();
    const avaliacoesPendentes = await Avaliacao.count({ where: { estadoModeracao: 'pendente' } });
    const usuariosBloqueados = await Usuario.count({ where: { bloqueado: true } });

    const faturamentoResultado = await Pedido.findOne({
      where: { estado: { [Op.ne]: 'cancelado' } },
      attributes: [[sequelize.fn('SUM', sequelize.col('valorTotal')), 'total']],
      raw: true,
    });
    const faturamentoPlataforma = faturamentoResultado && faturamentoResultado.total ? Number(faturamentoResultado.total) : 0;

    const pedidosPorEstado = await Pedido.findAll({
      attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['estado'],
      raw: true,
    });

    const vendedoresRecentes = await Usuario.findAll({
      where: { tipo: 'vendedor' },
      include: [{ model: PerfilVendedor, as: 'perfilVendedor' }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.render('admin/dashboard', {
      titulo: 'Painel administrativo',
      totalClientes,
      totalVendedores,
      totalProdutos,
      totalPedidos,
      totalCategorias,
      avaliacoesPendentes,
      usuariosBloqueados,
      faturamentoPlataforma,
      pedidosPorEstado,
      vendedoresRecentes,
    });
  },

  // GET /admin/usuarios
  async listarUsuarios(req, res) {
    const { tipo, busca } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (busca) {
      where[Op.or] = [{ nome: { [Op.like]: `%${busca}%` } }, { email: { [Op.like]: `%${busca}%` } }];
    }

    const usuarios = await Usuario.findAll({ where, order: [['createdAt', 'DESC']] });
    res.render('admin/usuarios', { titulo: 'Usuários', usuarios, filtroTipo: tipo || '', busca: busca || '' });
  },

  // PATCH /admin/usuarios/:id/bloqueio (AJAX) - alterna bloqueado/desbloqueado
  async alternarBloqueio(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
      if (usuario.tipo === 'admin') {
        return res.status(403).json({ erro: 'Não é possível bloquear um administrador.' });
      }

      usuario.bloqueado = !usuario.bloqueado;
      await usuario.save();
      res.json({ sucesso: true, bloqueado: usuario.bloqueado });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao alterar bloqueio do usuário.' });
    }
  },

  // GET /admin/vendedores
  async listarVendedores(req, res) {
    const vendedores = await Usuario.findAll({
      where: { tipo: 'vendedor' },
      include: [{ model: PerfilVendedor, as: 'perfilVendedor' }],
      order: [['createdAt', 'DESC']],
    });

    const contagemProdutos = await Produto.findAll({
      attributes: ['vendedorId', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['vendedorId'],
      raw: true,
    });
    const mapaContagem = {};
    contagemProdutos.forEach((c) => { mapaContagem[c.vendedorId] = Number(c.total); });

    res.render('admin/vendedores', { titulo: 'Vendedores', vendedores, mapaContagem });
  },

  // GET /admin/produtos
  async listarProdutos(req, res) {
    const { busca, estado } = req.query;
    const where = {};
    if (busca) where.nome = { [Op.like]: `%${busca}%` };
    if (estado) where.estado = estado;

    const produtos = await Produto.findAll({
      where,
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Usuario, as: 'vendedor', include: [{ model: PerfilVendedor, as: 'perfilVendedor' }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.render('admin/produtos', { titulo: 'Produtos da plataforma', produtos, busca: busca || '', filtroEstado: estado || '' });
  },

  // PATCH /admin/produtos/:id/bloqueio (AJAX) - oculta produto inadequado
  async alternarBloqueioProduto(req, res) {
    try {
      const produto = await Produto.findByPk(req.params.id);
      if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

      produto.estado = produto.estado === 'bloqueado' ? 'ativo' : 'bloqueado';
      await produto.save();
      res.json({ sucesso: true, estado: produto.estado });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao alterar status do produto.' });
    }
  },
};

'use strict';

// controllers/CategoriaController.js
const { Categoria, Produto } = require('../models');

function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

module.exports = {
  // GET /admin/categorias
  async listar(req, res) {
    const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
    res.render('admin/categorias', { titulo: 'Categorias', categorias });
  },

  // POST /admin/categorias
  async criar(req, res) {
    const { nome, descricao, icone } = req.body;
    try {
      await Categoria.create({
        nome,
        descricao,
        icone: icone || 'bi-shop',
        slug: gerarSlug(nome),
      });
      req.flash('sucesso', 'Categoria criada com sucesso.');
    } catch (erro) {
      req.flash('erro', erro.errors ? erro.errors[0].message : 'Erro ao criar categoria.');
    }
    res.redirect('/admin/categorias');
  },

  // PUT /admin/categorias/:id
  async atualizar(req, res) {
    const { nome, descricao, icone } = req.body;
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria) {
        req.flash('erro', 'Categoria não encontrada.');
        return res.redirect('/admin/categorias');
      }
      await categoria.update({ nome, descricao, icone, slug: gerarSlug(nome) });
      req.flash('sucesso', 'Categoria atualizada com sucesso.');
    } catch (erro) {
      req.flash('erro', erro.errors ? erro.errors[0].message : 'Erro ao atualizar categoria.');
    }
    res.redirect('/admin/categorias');
  },

  // DELETE /admin/categorias/:id
  async excluir(req, res) {
    try {
      const categoria = await Categoria.findByPk(req.params.id);
      if (!categoria) {
        req.flash('erro', 'Categoria não encontrada.');
        return res.redirect('/admin/categorias');
      }
      const qtdProdutos = await Produto.count({ where: { categoriaId: categoria.id } });
      if (qtdProdutos > 0) {
        req.flash('erro', `Não é possível excluir: existem ${qtdProdutos} produto(s) nessa categoria.`);
        return res.redirect('/admin/categorias');
      }
      await categoria.destroy();
      req.flash('sucesso', 'Categoria excluída com sucesso.');
    } catch (erro) {
      req.flash('erro', 'Erro ao excluir categoria.');
    }
    res.redirect('/admin/categorias');
  },
};

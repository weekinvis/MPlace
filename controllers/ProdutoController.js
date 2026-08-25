'use strict';

// controllers/ProdutoController.js
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { Produto, Categoria, Usuario, PerfilVendedor, Avaliacao, ItemPedido, sequelize } = require('../models');
const { sincronizarCatalogo } = require('../config/socket');

const ITENS_POR_PAGINA = 9;

/**
 * Monta a cláusula "where" + "order" a partir dos filtros da query string.
 * Reaproveitado tanto pela página completa do catálogo quanto pelo endpoint
 * AJAX usado pelo catalogo.js (jQuery) para filtrar sem recarregar a página.
 */
async function buscarProdutosFiltrados(query) {
  const { q, categoria, vendedor, precoMin, precoMax, ordenar, pagina } = query;

  const where = { estado: 'ativo' };

  if (q) {
    where[Op.or] = [{ nome: { [Op.like]: `%${q}%` } }, { descricao: { [Op.like]: `%${q}%` } }];
  }
  if (categoria) {
    where.categoriaId = categoria;
  }
  if (vendedor) {
    where.vendedorId = vendedor;
  }
  if (precoMin || precoMax) {
    where.preco = {};
    if (precoMin) where.preco[Op.gte] = Number(precoMin);
    if (precoMax) where.preco[Op.lte] = Number(precoMax);
  }

  let order = [['createdAt', 'DESC']];
  if (ordenar === 'menor-preco') order = [['preco', 'ASC']];
  if (ordenar === 'maior-preco') order = [['preco', 'DESC']];
  if (ordenar === 'nome') order = [['nome', 'ASC']];

  const paginaAtual = Math.max(parseInt(pagina, 10) || 1, 1);
  const offset = (paginaAtual - 1) * ITENS_POR_PAGINA;

  const { rows: produtos, count: total } = await Produto.findAndCountAll({
    where,
    include: [
      { model: Categoria, as: 'categoria' },
      { model: Usuario, as: 'vendedor', include: [{ model: PerfilVendedor, as: 'perfilVendedor' }] },
    ],
    order,
    limit: ITENS_POR_PAGINA,
    offset,
    distinct: true,
  });

  const totalPaginas = Math.max(Math.ceil(total / ITENS_POR_PAGINA), 1);

  return { produtos, total, paginaAtual, totalPaginas };
}

module.exports = {
  buscarProdutosFiltrados,

  // GET /produtos
  async catalogo(req, res) {
    const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
    const resultado = await buscarProdutosFiltrados(req.query);

    res.render('public/catalogo', {
      titulo: 'Catálogo',
      categorias,
      filtros: req.query,
      ...resultado,
    });
  },

  // GET /produtos/buscar (AJAX - usado pelo public/js/catalogo.js)
  // Renderiza só o HTML do miolo (grade + paginação), sem o layout completo da página,
  // para o jQuery poder trocar o conteúdo sem recarregar a página.
  async buscarAjax(req, res) {
    const resultado = await buscarProdutosFiltrados(req.query);
    res.render('public/_resultado-catalogo', {
      filtros: req.query,
      ...resultado,
    });
  },

  // GET /produtos/:id
  async detalhes(req, res) {
    const produto = await Produto.findOne({
      where: { id: req.params.id },
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Usuario, as: 'vendedor', include: [{ model: PerfilVendedor, as: 'perfilVendedor' }] },
      ],
    });

    if (!produto || produto.estado === 'bloqueado') {
      return res.status(404).render('error/404', { titulo: 'Produto não encontrado' });
    }

    // Visitantes/clientes não devem ver produtos que o próprio vendedor desativou,
    // a não ser que seja o próprio vendedor dono do produto (pré-visualização).
    const usuario = req.session.usuario;
    const ehDono = usuario && usuario.id === produto.vendedorId;
    if (produto.estado === 'inativo' && !ehDono && !(usuario && usuario.tipo === 'admin')) {
      return res.status(404).render('error/404', { titulo: 'Produto não encontrado' });
    }

    const avaliacoes = await Avaliacao.findAll({
      where: { produtoId: produto.id, estadoModeracao: 'aprovada' },
      include: [{ model: Usuario, as: 'cliente', attributes: ['id', 'nome', 'avatar'] }],
      order: [['createdAt', 'DESC']],
    });

    const mediaResultado = await Avaliacao.findOne({
      where: { produtoId: produto.id, estadoModeracao: 'aprovada' },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('nota')), 'media'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      ],
      raw: true,
    });

    const mediaNota = mediaResultado && mediaResultado.media ? Number(mediaResultado.media).toFixed(1) : null;
    const totalAvaliacoes = mediaResultado ? Number(mediaResultado.total) : 0;

    // Só pode avaliar quem realmente comprou o produto (item de algum pedido) e ainda não avaliou.
    let podeAvaliar = false;
    let pedidoParaAvaliar = null;
    if (usuario && usuario.tipo === 'cliente') {
      const itemComprado = await ItemPedido.findOne({
        where: { produtoId: produto.id },
        include: [{ association: 'pedido', where: { usuarioId: usuario.id, estado: 'entregue' } }],
      });
      if (itemComprado) {
        const jaAvaliou = await Avaliacao.findOne({
          where: { usuarioId: usuario.id, produtoId: produto.id, pedidoId: itemComprado.pedidoId },
        });
        if (!jaAvaliou) {
          podeAvaliar = true;
          pedidoParaAvaliar = itemComprado.pedidoId;
        }
      }
    }

    const produtosRelacionados = await Produto.findAll({
      where: { categoriaId: produto.categoriaId, estado: 'ativo', id: { [Op.ne]: produto.id } },
      include: [{ model: Usuario, as: 'vendedor', include: [{ model: PerfilVendedor, as: 'perfilVendedor' }] }],
      limit: 4,
    });

    res.render('public/produto-detalhes', {
      titulo: produto.nome,
      produto,
      avaliacoes,
      mediaNota,
      totalAvaliacoes,
      podeAvaliar,
      pedidoParaAvaliar,
      produtosRelacionados,
    });
  },

  // GET /vendedor/produtos
  async meusProdutos(req, res) {
    const produtos = await Produto.findAll({
      where: { vendedorId: req.session.usuario.id },
      include: [{ model: Categoria, as: 'categoria' }],
      order: [['createdAt', 'DESC']],
    });
    res.render('vendedor/produtos', { titulo: 'Meus produtos', produtos });
  },

  // GET /vendedor/produtos/novo
  async formularioNovo(req, res) {
    const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
    res.render('vendedor/produto-form', {
      titulo: 'Novo produto',
      categorias,
      produto: null,
      erros: [],
    });
  },

  // POST /vendedor/produtos/novo
  async criar(req, res) {
    const { nome, descricao, preco, precoPromocional, estoque, categoriaId, marca, cor, destaque } = req.body;
    const erros = [];

    if (!nome || !descricao || !preco || !categoriaId) {
      erros.push('Preencha todos os campos obrigatórios.');
    }

    if (erros.length > 0) {
      const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
      return res.status(400).render('vendedor/produto-form', {
        titulo: 'Novo produto',
        categorias,
        produto: req.body,
        erros,
      });
    }

    try {
      const produto = await Produto.create({
        vendedorId: req.session.usuario.id,
        categoriaId,
        nome,
        descricao,
        preco,
        precoPromocional: precoPromocional || null,
        estoque: estoque || 0,
        marca,
        cor,
        destaque: destaque === 'on',
        imagem: req.file ? `/images/produtos/${req.file.filename}` : '/images/produtos/default.svg',
      });

      req.flash('sucesso', `Produto "${produto.nome}" cadastrado com sucesso!`);
      res.redirect('/vendedor/produtos');
    } catch (erro) {
      console.error('Erro ao criar produto:', erro);
      const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
      const mensagens = erro.errors ? erro.errors.map((e) => e.message) : ['Erro ao cadastrar produto.'];
      res.status(400).render('vendedor/produto-form', {
        titulo: 'Novo produto',
        categorias,
        produto: req.body,
        erros: mensagens,
      });
    }
  },

  // GET /vendedor/produtos/:id/editar
  async formularioEditar(req, res) {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto || produto.vendedorId !== req.session.usuario.id) {
      return res.status(404).render('error/404', { titulo: 'Produto não encontrado' });
    }
    const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
    res.render('vendedor/produto-form', { titulo: 'Editar produto', categorias, produto, erros: [] });
  },

  // PUT /vendedor/produtos/:id
  async atualizar(req, res) {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto || produto.vendedorId !== req.session.usuario.id) {
      return res.status(404).render('error/404', { titulo: 'Produto não encontrado' });
    }

    const { nome, descricao, preco, precoPromocional, estoque, categoriaId, marca, cor, destaque } = req.body;

    try {
      const dadosAtualizados = {
        nome,
        descricao,
        preco,
        precoPromocional: precoPromocional || null,
        estoque,
        categoriaId,
        marca,
        cor,
        destaque: destaque === 'on',
      };

      if (req.file) {
        dadosAtualizados.imagem = `/images/produtos/${req.file.filename}`;
        // remove a imagem antiga se ela tiver sido um upload (não mexe nas imagens padrão/seed)
        if (produto.imagem && produto.imagem.includes('/images/produtos/') && !produto.imagem.includes('default')) {
          const caminhoAntigo = path.join(__dirname, '..', 'public', produto.imagem);
          fs.unlink(caminhoAntigo, () => {});
        }
      }

      await produto.update(dadosAtualizados);
      req.flash('sucesso', 'Produto atualizado com sucesso.');
      res.redirect('/vendedor/produtos');
    } catch (erro) {
      console.error('Erro ao atualizar produto:', erro);
      const categorias = await Categoria.findAll({ order: [['nome', 'ASC']] });
      const mensagens = erro.errors ? erro.errors.map((e) => e.message) : ['Erro ao atualizar produto.'];
      res.status(400).render('vendedor/produto-form', {
        titulo: 'Editar produto',
        categorias,
        produto: { ...produto.toJSON(), ...req.body, id: produto.id },
        erros: mensagens,
      });
    }
  },

  // PATCH /vendedor/produtos/:id/estoque (AJAX)
  async atualizarEstoque(req, res) {
    try {
      const produto = await Produto.findByPk(req.params.id);
      if (!produto || produto.vendedorId !== req.session.usuario.id) {
        return res.status(404).json({ erro: 'Produto não encontrado.' });
      }

      const novoEstoque = Math.max(parseInt(req.body.estoque, 10) || 0, 0);
      await produto.update({ estoque: novoEstoque });

      // Sincronização em tempo real: qualquer aba com o catálogo/produto aberto
      // atualiza o número de estoque sem precisar recarregar a página.
      sincronizarCatalogo('estoque-atualizado', {
        produtoId: produto.id,
        estoque: produto.estoque,
        esgotado: produto.estoque <= 0,
      });

      res.json({ sucesso: true, estoque: produto.estoque });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao atualizar estoque.' });
    }
  },

  // PATCH /vendedor/produtos/:id/status (AJAX) - ativa/desativa o produto
  async alternarStatus(req, res) {
    try {
      const produto = await Produto.findByPk(req.params.id);
      if (!produto || produto.vendedorId !== req.session.usuario.id) {
        return res.status(404).json({ erro: 'Produto não encontrado.' });
      }
      if (produto.estado === 'bloqueado') {
        return res.status(403).json({ erro: 'Este produto foi bloqueado pelo administrador.' });
      }

      produto.estado = produto.estado === 'ativo' ? 'inativo' : 'ativo';
      await produto.save();

      res.json({ sucesso: true, estado: produto.estado });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao alterar status do produto.' });
    }
  },

  // DELETE /vendedor/produtos/:id
  async excluir(req, res) {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto || produto.vendedorId !== req.session.usuario.id) {
      req.flash('erro', 'Produto não encontrado.');
      return res.redirect('/vendedor/produtos');
    }

    const jaFoiVendido = await ItemPedido.findOne({ where: { produtoId: produto.id } });
    if (jaFoiVendido) {
      // Preserva o histórico de pedidos: em vez de excluir, apenas desativa.
      await produto.update({ estado: 'inativo' });
      req.flash('sucesso', 'Este produto já possui vendas, então ele foi apenas desativado (o histórico de pedidos foi preservado).');
      return res.redirect('/vendedor/produtos');
    }

    await produto.destroy();
    req.flash('sucesso', 'Produto excluído com sucesso.');
    res.redirect('/vendedor/produtos');
  },
};

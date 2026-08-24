'use strict';

// routes/vendedorRoutes.js (montado em /vendedor no routes/index.js)
const express = require('express');
const router = express.Router();

const ProdutoController = require('../controllers/ProdutoController');
const VendedorController = require('../controllers/VendedorController');
const PedidoController = require('../controllers/PedidoController');
const AvaliacaoController = require('../controllers/AvaliacaoController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { uploadProduto, uploadLoja } = require('../config/upload');

router.use(requireAuth, requireRole('vendedor'));

router.get('/dashboard', VendedorController.dashboard);

router.get('/perfil', VendedorController.formularioPerfil);
router.post(
  '/perfil',
  uploadLoja.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]),
  VendedorController.atualizarPerfil
);

router.get('/produtos', ProdutoController.meusProdutos);
router.get('/produtos/novo', ProdutoController.formularioNovo);
router.post('/produtos/novo', uploadProduto.single('imagem'), ProdutoController.criar);
router.get('/produtos/:id/editar', ProdutoController.formularioEditar);
router.put('/produtos/:id', uploadProduto.single('imagem'), ProdutoController.atualizar);
router.patch('/produtos/:id/estoque', ProdutoController.atualizarEstoque); // AJAX
router.patch('/produtos/:id/status', ProdutoController.alternarStatus); // AJAX
router.delete('/produtos/:id', ProdutoController.excluir);

router.get('/pedidos', PedidoController.pedidosVendedor);
router.get('/pedidos/:id', PedidoController.detalhesVendedor);
router.patch('/pedidos/:id/status', PedidoController.atualizarStatus); // AJAX

router.get('/avaliacoes', AvaliacaoController.listarPorVendedor);

module.exports = router;

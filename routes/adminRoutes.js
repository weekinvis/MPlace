'use strict';

// routes/adminRoutes.js (montado em /admin no routes/index.js)
const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/AdminController');
const CategoriaController = require('../controllers/CategoriaController');
const PedidoController = require('../controllers/PedidoController');
const AvaliacaoController = require('../controllers/AvaliacaoController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', AdminController.dashboard);

router.get('/usuarios', AdminController.listarUsuarios);
router.patch('/usuarios/:id/bloqueio', AdminController.alternarBloqueio); // AJAX

router.get('/vendedores', AdminController.listarVendedores);

router.get('/categorias', CategoriaController.listar);
router.post('/categorias', CategoriaController.criar);
router.put('/categorias/:id', CategoriaController.atualizar);
router.delete('/categorias/:id', CategoriaController.excluir);

router.get('/produtos', AdminController.listarProdutos);
router.patch('/produtos/:id/bloqueio', AdminController.alternarBloqueioProduto); // AJAX

router.get('/pedidos', PedidoController.listarTodosAdmin);

router.get('/avaliacoes', AvaliacaoController.listarParaModeracao);
router.patch('/avaliacoes/:id/moderar', AvaliacaoController.moderar); // AJAX

module.exports = router;

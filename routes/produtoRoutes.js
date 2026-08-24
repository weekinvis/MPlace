'use strict';

// routes/produtoRoutes.js
const express = require('express');
const router = express.Router();

const ProdutoController = require('../controllers/ProdutoController');
const VendedorController = require('../controllers/VendedorController');
const AvaliacaoController = require('../controllers/AvaliacaoController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Catálogo público (visitante, cliente, vendedor e admin podem navegar)
router.get('/produtos', ProdutoController.catalogo);
router.get('/produtos/buscar', ProdutoController.buscarAjax); // AJAX (jQuery) - filtros sem reload
router.get('/produtos/:id', ProdutoController.detalhes);

// Avaliação de produto — só cliente autenticado
router.post('/produtos/:id/avaliacoes', requireAuth, requireRole('cliente'), AvaliacaoController.criar);

// Perfil público da loja de um vendedor
router.get('/vendedores/:id', VendedorController.perfilPublico);

module.exports = router;

'use strict';

// routes/carrinhoRoutes.js
const express = require('express');
const router = express.Router();

const CarrinhoController = require('../controllers/CarrinhoController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use('/carrinho', requireAuth, requireRole('cliente'));

router.get('/carrinho', CarrinhoController.ver);
router.post('/carrinho', CarrinhoController.adicionar); // AJAX
router.patch('/carrinho/:itemId', CarrinhoController.atualizarQuantidade); // AJAX
router.delete('/carrinho/:itemId', CarrinhoController.remover); // AJAX

module.exports = router;

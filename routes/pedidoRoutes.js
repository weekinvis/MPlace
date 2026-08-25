'use strict';

// routes/pedidoRoutes.js
const express = require('express');
const router = express.Router();

const PedidoController = require('../controllers/PedidoController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(['/checkout', '/pedidos'], requireAuth, requireRole('cliente'));

router.get('/checkout', PedidoController.formulario);
router.post('/checkout', PedidoController.finalizar);

router.get('/pedidos/confirmacao/:codigoCompra', PedidoController.confirmacao);
router.get('/pedidos', PedidoController.meusPedidos);
router.get('/pedidos/:id', PedidoController.detalhesCliente);
router.patch('/pedidos/:id/cancelar', PedidoController.cancelar);

module.exports = router;

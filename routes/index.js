'use strict';

// routes/index.js
// Ponto central que monta todas as rotas da aplicação.
const express = require('express');
const router = express.Router();

const PublicController = require('../controllers/PublicController');

router.get('/', PublicController.home);

router.use('/', require('./authRoutes'));
router.use('/', require('./produtoRoutes'));
router.use('/', require('./usuarioRoutes'));
router.use('/', require('./carrinhoRoutes'));
router.use('/', require('./pedidoRoutes'));
router.use('/vendedor', require('./vendedorRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/notificacoes', require('./notificacaoRoutes'));

module.exports = router;

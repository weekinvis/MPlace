'use strict';

// routes/notificacaoRoutes.js (montado em /notificacoes no routes/index.js)
const express = require('express');
const router = express.Router();

const NotificacaoController = require('../controllers/NotificacaoController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', NotificacaoController.listar);
router.get('/recentes', NotificacaoController.recentesAjax); // AJAX (sino da navbar)
router.patch('/:id/lida', NotificacaoController.marcarComoLida); // AJAX
router.patch('/marcar-todas', NotificacaoController.marcarTodasComoLidas); // AJAX

module.exports = router;

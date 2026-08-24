'use strict';

// routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();

const UsuarioController = require('../controllers/UsuarioController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/perfil', UsuarioController.perfil);
router.post('/perfil', UsuarioController.atualizarPerfil);
router.post('/perfil/senha', UsuarioController.alterarSenha);

router.get('/enderecos', UsuarioController.listarEnderecos);
router.post('/enderecos', UsuarioController.criarEndereco);
router.put('/enderecos/:id', UsuarioController.atualizarEndereco);
router.delete('/enderecos/:id', UsuarioController.excluirEndereco);

module.exports = router;

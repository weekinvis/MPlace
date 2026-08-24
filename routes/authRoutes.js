'use strict';

// routes/authRoutes.js
const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');
const { redirectSeAutenticado } = require('../middlewares/authMiddleware');

router.get('/cadastro', redirectSeAutenticado, AuthController.formularioCadastro);
router.post('/cadastro', redirectSeAutenticado, AuthController.cadastrar);

router.get('/login', redirectSeAutenticado, AuthController.formularioLogin);
router.post('/login', redirectSeAutenticado, AuthController.login);

router.post('/logout', AuthController.logout);

module.exports = router;

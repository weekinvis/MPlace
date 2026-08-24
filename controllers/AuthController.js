'use strict';

// controllers/AuthController.js
const { Usuario, Carrinho } = require('../models');

module.exports = {
  // GET /cadastro
  formularioCadastro(req, res) {
    res.render('public/cadastro', {
      titulo: 'Criar conta',
      erros: [],
      dadosAntigos: {},
    });
  },

  // POST /cadastro
  async cadastrar(req, res) {
    const { nome, email, senha, confirmarSenha, tipo, telefone, nomeLoja } = req.body;
    const erros = [];

    if (!nome || !email || !senha) {
      erros.push('Preencha todos os campos obrigatórios.');
    }
    if (senha && senha.length < 6) {
      erros.push('A senha deve ter pelo menos 6 caracteres.');
    }
    if (senha !== confirmarSenha) {
      erros.push('As senhas não coincidem.');
    }
    const tipoEscolhido = tipo === 'vendedor' ? 'vendedor' : 'cliente';
    if (tipoEscolhido === 'vendedor' && !nomeLoja) {
      erros.push('Informe o nome da sua loja.');
    }

    if (erros.length > 0) {
      return res.status(400).render('public/cadastro', {
        titulo: 'Criar conta',
        erros,
        dadosAntigos: req.body,
      });
    }

    try {
      const usuarioExistente = await Usuario.findOne({ where: { email } });
      if (usuarioExistente) {
        return res.status(400).render('public/cadastro', {
          titulo: 'Criar conta',
          erros: ['Já existe uma conta com este e-mail.'],
          dadosAntigos: req.body,
        });
      }

      const novoUsuario = await Usuario.create({
        nome,
        email,
        senha,
        telefone,
        tipo: tipoEscolhido,
      });

      if (tipoEscolhido === 'cliente') {
        await Carrinho.create({ usuarioId: novoUsuario.id });
      } else {
        const { PerfilVendedor } = require('../models');
        await PerfilVendedor.create({
          usuarioId: novoUsuario.id,
          nomeLoja,
        });
      }

      req.session.usuario = novoUsuario.paraSessao();
      req.flash('sucesso', `Bem-vindo(a), ${novoUsuario.nome}! Sua conta foi criada com sucesso.`);

      if (tipoEscolhido === 'vendedor') {
        return res.redirect('/vendedor/dashboard');
      }
      return res.redirect('/');
    } catch (erro) {
      console.error('Erro ao cadastrar usuário:', erro);
      const mensagens = erro.errors ? erro.errors.map((e) => e.message) : ['Erro ao criar conta. Tente novamente.'];
      return res.status(400).render('public/cadastro', {
        titulo: 'Criar conta',
        erros: mensagens,
        dadosAntigos: req.body,
      });
    }
  },

  // GET /login
  formularioLogin(req, res) {
    res.render('public/login', { titulo: 'Entrar', erro: null, emailAntigo: '' });
  },

  // POST /login
  async login(req, res) {
    const { email, senha } = req.body;

    try {
      const usuario = await Usuario.findOne({ where: { email } });

      if (!usuario || !(await usuario.verificarSenha(senha))) {
        return res.status(400).render('public/login', {
          titulo: 'Entrar',
          erro: 'E-mail ou senha inválidos.',
          emailAntigo: email,
        });
      }

      if (usuario.bloqueado) {
        return res.status(403).render('public/login', {
          titulo: 'Entrar',
          erro: 'Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte.',
          emailAntigo: email,
        });
      }

      req.session.usuario = usuario.paraSessao();

      const destinoSalvo = req.session.redirecionarApos;
      delete req.session.redirecionarApos;

      if (destinoSalvo) {
        return res.redirect(destinoSalvo);
      }
      if (usuario.tipo === 'vendedor') {
        return res.redirect('/vendedor/dashboard');
      }
      if (usuario.tipo === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      return res.redirect('/');
    } catch (erro) {
      console.error('Erro ao fazer login:', erro);
      return res.status(500).render('public/login', {
        titulo: 'Entrar',
        erro: 'Erro interno. Tente novamente em instantes.',
        emailAntigo: email,
      });
    }
  },

  // POST /logout
  logout(req, res) {
    req.session.destroy(() => {
      res.redirect('/login');
    });
  },
};

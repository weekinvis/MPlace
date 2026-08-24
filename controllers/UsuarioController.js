'use strict';

// controllers/UsuarioController.js
const { Usuario, Endereco } = require('../models');

module.exports = {
  // GET /perfil
  async perfil(req, res) {
    const usuario = await Usuario.findByPk(req.session.usuario.id);
    res.render('cliente/perfil', { titulo: 'Meu perfil', usuario, erros: [] });
  },

  // POST /perfil
  async atualizarPerfil(req, res) {
    const usuario = await Usuario.findByPk(req.session.usuario.id);
    const { nome, telefone } = req.body;

    try {
      await usuario.update({ nome, telefone });
      req.session.usuario.nome = usuario.nome;
      req.flash('sucesso', 'Perfil atualizado com sucesso.');
      res.redirect('/perfil');
    } catch (erro) {
      const mensagens = erro.errors ? erro.errors.map((e) => e.message) : ['Erro ao atualizar perfil.'];
      res.status(400).render('cliente/perfil', { titulo: 'Meu perfil', usuario, erros: mensagens });
    }
  },

  // POST /perfil/senha
  async alterarSenha(req, res) {
    const usuario = await Usuario.findByPk(req.session.usuario.id);
    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

    const senhaCorreta = await usuario.verificarSenha(senhaAtual);
    if (!senhaCorreta) {
      req.flash('erro', 'Senha atual incorreta.');
      return res.redirect('/perfil');
    }
    if (novaSenha !== confirmarNovaSenha) {
      req.flash('erro', 'A confirmação de senha não coincide.');
      return res.redirect('/perfil');
    }
    if (!novaSenha || novaSenha.length < 6) {
      req.flash('erro', 'A nova senha deve ter pelo menos 6 caracteres.');
      return res.redirect('/perfil');
    }

    usuario.senha = novaSenha;
    await usuario.save();
    req.flash('sucesso', 'Senha alterada com sucesso.');
    res.redirect('/perfil');
  },

  // GET /enderecos
  async listarEnderecos(req, res) {
    const enderecos = await Endereco.findAll({
      where: { usuarioId: req.session.usuario.id },
      order: [['principal', 'DESC'], ['createdAt', 'DESC']],
    });
    res.render('cliente/enderecos', { titulo: 'Meus endereços', enderecos, retorno: req.query.retorno || '' });
  },

  // POST /enderecos
  async criarEndereco(req, res) {
    const { apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal, retorno } = req.body;

    try {
      if (principal === 'on') {
        await Endereco.update({ principal: false }, { where: { usuarioId: req.session.usuario.id } });
      }

      const totalExistente = await Endereco.count({ where: { usuarioId: req.session.usuario.id } });

      await Endereco.create({
        usuarioId: req.session.usuario.id,
        apelido: apelido || 'Endereço',
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        principal: principal === 'on' || totalExistente === 0,
      });

      req.flash('sucesso', 'Endereço cadastrado com sucesso.');
      res.redirect(retorno === 'checkout' ? '/checkout' : '/enderecos');
    } catch (erro) {
      req.flash('erro', erro.errors ? erro.errors[0].message : 'Erro ao cadastrar endereço.');
      res.redirect('/enderecos');
    }
  },

  // PUT /enderecos/:id
  async atualizarEndereco(req, res) {
    const endereco = await Endereco.findOne({ where: { id: req.params.id, usuarioId: req.session.usuario.id } });
    if (!endereco) {
      req.flash('erro', 'Endereço não encontrado.');
      return res.redirect('/enderecos');
    }

    const { apelido, cep, logradouro, numero, complemento, bairro, cidade, estado, principal } = req.body;

    if (principal === 'on') {
      await Endereco.update({ principal: false }, { where: { usuarioId: req.session.usuario.id } });
    }

    await endereco.update({
      apelido,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      principal: principal === 'on',
    });

    req.flash('sucesso', 'Endereço atualizado com sucesso.');
    res.redirect('/enderecos');
  },

  // DELETE /enderecos/:id
  async excluirEndereco(req, res) {
    const endereco = await Endereco.findOne({ where: { id: req.params.id, usuarioId: req.session.usuario.id } });
    if (!endereco) {
      req.flash('erro', 'Endereço não encontrado.');
      return res.redirect('/enderecos');
    }
    await endereco.destroy();
    req.flash('sucesso', 'Endereço removido com sucesso.');
    res.redirect('/enderecos');
  },
};

'use strict';

const bcrypt = require('bcryptjs');

// models/Usuario.js
// Entidade central do sistema. O campo "tipo" define o papel do usuário
// (cliente, vendedor ou admin) e é usado pelo roleMiddleware para controle
// de acesso baseado em tipo de usuário (seção 5 do enunciado).
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define(
    'Usuario',
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'O nome é obrigatório.' },
          len: { args: [2, 100], msg: 'O nome deve ter entre 2 e 100 caracteres.' },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'Já existe uma conta cadastrada com este e-mail.' },
        validate: {
          isEmail: { msg: 'Informe um e-mail válido.' },
          notEmpty: { msg: 'O e-mail é obrigatório.' },
        },
      },
      senha: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: { args: [6, 200], msg: 'A senha deve ter pelo menos 6 caracteres.' },
        },
      },
      tipo: {
        type: DataTypes.ENUM('cliente', 'vendedor', 'admin'),
        allowNull: false,
        defaultValue: 'cliente',
      },
      telefone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '/images/avatars/default.svg',
      },
      bloqueado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'usuarios',
      hooks: {
        beforeCreate: async (usuario) => {
          usuario.senha = await bcrypt.hash(usuario.senha, 10);
        },
        beforeUpdate: async (usuario) => {
          if (usuario.changed('senha')) {
            usuario.senha = await bcrypt.hash(usuario.senha, 10);
          }
        },
      },
    }
  );

  Usuario.prototype.verificarSenha = function (senhaDigitada) {
    return bcrypt.compare(senhaDigitada, this.senha);
  };

  // Representação "segura" do usuário (sem a senha) usada na sessão e nas views.
  Usuario.prototype.paraSessao = function () {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      tipo: this.tipo,
      avatar: this.avatar,
    };
  };

  Usuario.associate = (models) => {
    // 1:N — um usuário (cliente) pode ter vários endereços
    Usuario.hasMany(models.Endereco, {
      foreignKey: 'usuarioId',
      as: 'enderecos',
      onDelete: 'CASCADE',
    });

    // 1:1 — um usuário do tipo "vendedor" possui um único perfil de vendedor
    Usuario.hasOne(models.PerfilVendedor, {
      foreignKey: 'usuarioId',
      as: 'perfilVendedor',
      onDelete: 'CASCADE',
    });

    // 1:1 — um usuário do tipo "cliente" possui um único carrinho
    Usuario.hasOne(models.Carrinho, {
      foreignKey: 'usuarioId',
      as: 'carrinho',
      onDelete: 'CASCADE',
    });

    // 1:N — um vendedor possui vários produtos
    Usuario.hasMany(models.Produto, {
      foreignKey: 'vendedorId',
      as: 'produtos',
    });

    // 1:N — um cliente possui vários pedidos
    Usuario.hasMany(models.Pedido, {
      foreignKey: 'usuarioId',
      as: 'pedidos',
    });

    // 1:N — um usuário (cliente) escreve várias avaliações
    Usuario.hasMany(models.Avaliacao, {
      foreignKey: 'usuarioId',
      as: 'avaliacoes',
    });

    // 1:N — um usuário recebe várias notificações
    Usuario.hasMany(models.Notificacao, {
      foreignKey: 'usuarioId',
      as: 'notificacoes',
      onDelete: 'CASCADE',
    });

    // 1:N — histórico de mudanças de estado realizadas por este usuário
    Usuario.hasMany(models.HistoricoEstadoPedido, {
      foreignKey: 'usuarioId',
      as: 'alteracoesDeStatus',
    });
  };

  return Usuario;
};

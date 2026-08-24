'use strict';

// models/PerfilVendedor.js
// Relacionamento 1:1 com Usuario: cada vendedor tem exatamente um perfil de loja.
module.exports = (sequelize, DataTypes) => {
  const PerfilVendedor = sequelize.define(
    'PerfilVendedor',
    {
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: { msg: 'Este usuário já possui um perfil de vendedor.' },
      },
      nomeLoja: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: 'O nome da loja é obrigatório.' } },
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '/images/lojas/default-logo.svg',
      },
      banner: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '/images/lojas/default-banner.svg',
      },
      documento: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    { tableName: 'perfis_vendedor' }
  );

  PerfilVendedor.associate = (models) => {
    PerfilVendedor.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  };

  return PerfilVendedor;
};

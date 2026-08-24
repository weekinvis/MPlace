'use strict';

// models/Endereco.js
module.exports = (sequelize, DataTypes) => {
  const Endereco = sequelize.define(
    'Endereco',
    {
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      apelido: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Endereço',
      },
      cep: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: 'O CEP é obrigatório.' } },
      },
      logradouro: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: 'O logradouro é obrigatório.' } },
      },
      numero: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      complemento: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bairro: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cidade: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },
      principal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    { tableName: 'enderecos' }
  );

  Endereco.associate = (models) => {
    Endereco.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
    Endereco.hasMany(models.Pedido, { foreignKey: 'enderecoId', as: 'pedidos' });
  };

  return Endereco;
};

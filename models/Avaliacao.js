'use strict';

// models/Avaliacao.js
module.exports = (sequelize, DataTypes) => {
  const Avaliacao = sequelize.define(
    'Avaliacao',
    {
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      produtoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nota: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'A nota deve ser um número inteiro.' },
          min: { args: [1], msg: 'A nota mínima é 1.' },
          max: { args: [5], msg: 'A nota máxima é 5.' },
        },
      },
      comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      estadoModeracao: {
        type: DataTypes.ENUM('pendente', 'aprovada', 'oculta'),
        allowNull: false,
        defaultValue: 'pendente',
      },
    },
    {
      tableName: 'avaliacoes',
      indexes: [{ unique: true, fields: ['usuarioId', 'produtoId', 'pedidoId'] }],
    }
  );

  Avaliacao.associate = (models) => {
    Avaliacao.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'cliente' });
    Avaliacao.belongsTo(models.Produto, { foreignKey: 'produtoId', as: 'produto' });
    Avaliacao.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
  };

  return Avaliacao;
};

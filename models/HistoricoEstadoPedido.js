'use strict';

// models/HistoricoEstadoPedido.js
// Registra cada transição de estado de um pedido: estado anterior, novo
// estado, quem fez a alteração, quando e uma observação opcional.
module.exports = (sequelize, DataTypes) => {
  const HistoricoEstadoPedido = sequelize.define(
    'HistoricoEstadoPedido',
    {
      pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estadoAnterior: {
        type: DataTypes.STRING,
        allowNull: true, // nulo no primeiro registro (criação do pedido)
      },
      estadoNovo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      observacao: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    { tableName: 'historico_estado_pedido' }
  );

  HistoricoEstadoPedido.associate = (models) => {
    HistoricoEstadoPedido.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
    HistoricoEstadoPedido.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'responsavel' });
  };

  return HistoricoEstadoPedido;
};

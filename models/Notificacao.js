'use strict';

// models/Notificacao.js
// Notificações persistidas no banco e também emitidas em tempo real via
// Socket.IO (config/socket.js). Guardamos no banco para que o usuário veja
// o histórico mesmo se não estiver com a página aberta no momento do evento.
module.exports = (sequelize, DataTypes) => {
  const Notificacao = sequelize.define(
    'Notificacao',
    {
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.STRING,
        allowNull: false,
        // ex.: 'novo_pedido', 'status_pedido', 'nova_avaliacao', 'estoque_baixo'
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mensagem: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      link: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lida: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    { tableName: 'notificacoes' }
  );

  Notificacao.associate = (models) => {
    Notificacao.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  };

  return Notificacao;
};

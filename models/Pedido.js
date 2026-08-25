'use strict';

// models/Pedido.js
module.exports = (sequelize, DataTypes) => {
  const Pedido = sequelize.define(
    'Pedido',
    {
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      enderecoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      numeroPedido: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      // Uma compra no carrinho pode ter produtos de vendedores diferentes.
      // Nesse caso o checkout gera um Pedido por vendedor (cada um com seu
      // próprio status/rastreio), e todos compartilham o mesmo codigoCompra
      // para o cliente conseguir ver que vieram da mesma finalização de compra.
      codigoCompra: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      valorProdutos: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      valorFrete: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      valorTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      formaPagamento: {
        type: DataTypes.ENUM('cartao', 'pix', 'boleto'),
        allowNull: false,
      },
      formaEntrega: {
        type: DataTypes.ENUM('padrao', 'expressa'),
        allowNull: false,
        defaultValue: 'padrao',
      },
      estado: {
        type: DataTypes.ENUM(
          'aguardando_confirmacao',
          'confirmado',
          'em_preparacao',
          'enviado',
          'entregue',
          'cancelado'
        ),
        allowNull: false,
        defaultValue: 'aguardando_confirmacao',
      },
    },
    { tableName: 'pedidos' }
  );

  Pedido.associate = (models) => {
    Pedido.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'cliente' });
    Pedido.belongsTo(models.Endereco, { foreignKey: 'enderecoId', as: 'endereco' });
    Pedido.hasMany(models.ItemPedido, {
      foreignKey: 'pedidoId',
      as: 'itens',
      onDelete: 'CASCADE',
    });
    Pedido.hasMany(models.HistoricoEstadoPedido, {
      foreignKey: 'pedidoId',
      as: 'historico',
      onDelete: 'CASCADE',
    });
    Pedido.hasMany(models.Avaliacao, { foreignKey: 'pedidoId', as: 'avaliacoes' });
  };

  return Pedido;
};

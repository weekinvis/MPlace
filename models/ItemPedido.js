'use strict';

// models/ItemPedido.js
// A tabela associativa entre Pedido e Produto (relacionamento N:N).
// Guarda uma "fotografia" dos dados do produto no momento da compra
// (nome, preço unitário, desconto, vendedor), pois o produto original
// pode ser alterado ou até excluído depois — o pedido não pode mudar
// retroativamente por causa disso.
module.exports = (sequelize, DataTypes) => {
  const ItemPedido = sequelize.define(
    'ItemPedido',
    {
      pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      produtoId: {
        type: DataTypes.INTEGER,
        allowNull: true, // mantém o histórico mesmo se o produto original for excluído
      },
      vendedorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nomeProduto: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imagemProduto: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      precoUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: { args: [1], msg: 'A quantidade mínima é 1.' } },
      },
      desconto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    { tableName: 'itens_pedido' }
  );

  ItemPedido.associate = (models) => {
    ItemPedido.belongsTo(models.Pedido, { foreignKey: 'pedidoId', as: 'pedido' });
    ItemPedido.belongsTo(models.Produto, { foreignKey: 'produtoId', as: 'produto' });
    ItemPedido.belongsTo(models.Usuario, { foreignKey: 'vendedorId', as: 'vendedor' });
  };

  return ItemPedido;
};

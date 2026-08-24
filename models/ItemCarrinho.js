'use strict';

// models/ItemCarrinho.js
// Tabela associativa entre Carrinho e Produto (relacionamento N:N),
// com o atributo próprio "quantidade".
module.exports = (sequelize, DataTypes) => {
  const ItemCarrinho = sequelize.define(
    'ItemCarrinho',
    {
      carrinhoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      produtoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          isInt: { msg: 'A quantidade deve ser um número inteiro.' },
          min: { args: [1], msg: 'A quantidade mínima é 1.' },
        },
      },
    },
    {
      tableName: 'itens_carrinho',
      indexes: [{ unique: true, fields: ['carrinhoId', 'produtoId'] }],
    }
  );

  ItemCarrinho.associate = (models) => {
    ItemCarrinho.belongsTo(models.Carrinho, { foreignKey: 'carrinhoId', as: 'carrinho' });
    ItemCarrinho.belongsTo(models.Produto, { foreignKey: 'produtoId', as: 'produto' });
  };

  return ItemCarrinho;
};

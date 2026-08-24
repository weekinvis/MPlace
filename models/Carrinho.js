'use strict';

// models/Carrinho.js
// Relacionamento 1:1 com Usuario: cada cliente possui um único carrinho ativo.
module.exports = (sequelize, DataTypes) => {
  const Carrinho = sequelize.define(
    'Carrinho',
    {
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
    },
    { tableName: 'carrinhos' }
  );

  Carrinho.associate = (models) => {
    Carrinho.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
    Carrinho.hasMany(models.ItemCarrinho, {
      foreignKey: 'carrinhoId',
      as: 'itens',
      onDelete: 'CASCADE',
    });
  };

  return Carrinho;
};

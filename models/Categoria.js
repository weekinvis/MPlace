'use strict';

// models/Categoria.js
module.exports = (sequelize, DataTypes) => {
  const Categoria = sequelize.define(
    'Categoria',
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'Já existe uma categoria com esse nome.' },
        validate: { notEmpty: { msg: 'O nome da categoria é obrigatório.' } },
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      descricao: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      icone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'bi-shop',
      },
    },
    { tableName: 'categorias' }
  );

  Categoria.associate = (models) => {
    Categoria.hasMany(models.Produto, { foreignKey: 'categoriaId', as: 'produtos' });
  };

  return Categoria;
};

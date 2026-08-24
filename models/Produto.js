'use strict';

// models/Produto.js
module.exports = (sequelize, DataTypes) => {
  const Produto = sequelize.define(
    'Produto',
    {
      vendedorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'O nome do produto é obrigatório.' },
          len: { args: [2, 150], msg: 'O nome deve ter entre 2 e 150 caracteres.' },
        },
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: { msg: 'A descrição é obrigatória.' } },
      },
      preco: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'O preço deve ser um valor numérico.' },
          min: { args: [0.01], msg: 'O preço deve ser maior que zero.' },
        },
      },
      precoPromocional: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          isMenorQuePreco(value) {
            if (value !== null && value !== undefined && Number(value) >= Number(this.preco)) {
              throw new Error('O preço promocional deve ser menor que o preço original.');
            }
          },
        },
      },
      estoque: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isInt: { msg: 'O estoque deve ser um número inteiro.' },
          min: { args: [0], msg: 'O estoque não pode ser negativo.' },
        },
      },
      marca: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imagem: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '/images/produtos/default.svg',
      },
      estado: {
        type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
        allowNull: false,
        defaultValue: 'ativo',
        // "bloqueado" é usado pelo administrador para ocultar produtos inadequados (seção 4/5),
        // enquanto "inativo" é usado pelo próprio vendedor para desativar o produto.
      },
      destaque: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'produtos',
      indexes: [{ fields: ['categoriaId'] }, { fields: ['vendedorId'] }],
    }
  );

  Produto.associate = (models) => {
    Produto.belongsTo(models.Usuario, { foreignKey: 'vendedorId', as: 'vendedor' });
    Produto.belongsTo(models.Categoria, { foreignKey: 'categoriaId', as: 'categoria' });
    Produto.hasMany(models.ItemCarrinho, { foreignKey: 'produtoId', as: 'itensCarrinho' });
    Produto.hasMany(models.ItemPedido, { foreignKey: 'produtoId', as: 'itensPedido' });
    Produto.hasMany(models.Avaliacao, { foreignKey: 'produtoId', as: 'avaliacoes' });
  };

  return Produto;
};

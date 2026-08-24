// config/database.js
// Configurações de conexão do Sequelize com SQLite.

const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Garante que a pasta "database/" exista antes do SQLite tentar criar o arquivo nela.
const databaseDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const storagePath = process.env.DB_STORAGE
  ? path.join(__dirname, '..', process.env.DB_STORAGE)
  : path.join(databaseDir, 'marketplace.sqlite');

module.exports = {
  dialect: 'sqlite',
  storage: storagePath,
  logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
  define: {
    // Sequelize já adiciona createdAt/updatedAt automaticamente (timestamps exigidos pelo trabalho).
    underscored: false,
  },
};

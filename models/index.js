'use strict';

// models/index.js
// Inicializador dos modelos e associações.
// Lê automaticamente todos os arquivos de modelo desta pasta, instancia
// o Sequelize com as configurações de config/database.js e monta as
// associações declaradas em cada model (Model.associate).

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const basename = path.basename(__filename);
const config = require('../config/database');

const sequelize = new Sequelize({
  dialect: config.dialect,
  storage: config.storage,
  logging: config.logging,
  define: config.define,
});

const db = {};

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

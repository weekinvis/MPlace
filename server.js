'use strict';

// server.js
// Arquivo que "sobe" o servidor HTTP, sincroniza o banco de dados e
// conecta o app Express ao Socket.IO (compartilhando a mesma sessão).

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const socketConfig = require('./config/socket');

const PORT = process.env.PORT || 3000;
const servidor = http.createServer(app);

socketConfig.init(servidor, app.get('sessionMiddleware'));

sequelize
  .authenticate()
  .then(() => {
    console.log('[banco de dados] conexão com o SQLite estabelecida.');
    // Em produção real usaríamos migrations; para fins didáticos, sync()
    // cria/ajusta as tabelas automaticamente a partir dos models.
    return sequelize.sync();
  })
  .then(() => {
    servidor.listen(PORT, () => {
      console.log(`\n🛍️  Bazari Marketplace rodando em http://localhost:${PORT}`);
      console.log('   Rode "npm run seed" (uma vez) para popular o banco com dados de demonstração.\n');
    });
  })
  .catch((erro) => {
    console.error('Não foi possível conectar ao banco de dados:', erro);
    process.exit(1);
  });

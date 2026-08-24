'use strict';

// app.js
// Configuração principal do Express: view engine, middlewares globais,
// sessão (compartilhada depois com o Socket.IO em server.js), rotas e
// tratamento de erros (404/500).

require('dotenv').config();

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const SequelizeStoreFactory = require('connect-session-sequelize');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const models = require('./models');
const globalsMiddleware = require('./middlewares/globalsMiddleware');

const app = express();

// ---------- View engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------- Middlewares globais ----------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Permite que <form> HTML comuns enviem PUT/PATCH/DELETE através de um
// campo oculto "_method" (chamadas AJAX usam o verbo HTTP real direto).
app.use(methodOverride('_method'));

// ---------- Sessão (persistida no mesmo banco SQLite via Sequelize) ----------
const SequelizeStore = SequelizeStoreFactory(session.Store);
const sessionStore = new SequelizeStore({ db: models.sequelize, tableName: 'sessoes' });

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'segredo_padrao_troque_isso',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
  },
});

app.use(sessionMiddleware);
// server.js precisa desta MESMA instância de middleware para compartilhar a
// sessão com o Socket.IO (ver config/socket.js).
app.set('sessionMiddleware', sessionMiddleware);

app.use(flash());

// Disponibiliza usuário logado, contadores de carrinho/notificações e
// mensagens flash para TODAS as views automaticamente.
app.use(globalsMiddleware(models));

// ---------- Rotas ----------
app.use('/', require('./routes/index'));

// ---------- Tratamento de erros ----------

// 404 - rota não encontrada
app.use((req, res) => {
  res.status(404).render('error/404', { titulo: 'Página não encontrada' });
});

// 500 - erro interno (precisa ter os 4 parâmetros para o Express reconhecer como error handler)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).render('error/500', {
    titulo: 'Erro interno',
    detalhe: process.env.NODE_ENV === 'development' ? err.message : null,
  });
});

module.exports = app;

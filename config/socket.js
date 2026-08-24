// config/socket.js
// Configuração e inicialização do WebSocket / Socket.IO.
//
// A ideia central: cada usuário autenticado entra em uma "room" própria
// (ex.: "usuario_7"). Assim conseguimos emitir eventos privados
// (notificações de pedido, por exemplo) só para quem interessa, além de
// eventos públicos (ex.: atualização de estoque) para todo mundo que
// estiver com o catálogo aberto.

const sharedSession = require('express-socket.io-session');

let io = null;

function init(server, sessionMiddleware) {
  io = require('socket.io')(server, {
    cors: { origin: '*' },
  });

  // Compartilha a mesma sessão do Express (cookie de login) com o Socket.IO,
  // assim conseguimos saber, na conexão do socket, quem é o usuário logado.
  io.use(sharedSession(sessionMiddleware, { autoSave: true }));

  io.on('connection', (socket) => {
    const session = socket.handshake.session;

    if (session && session.usuario) {
      const usuario = session.usuario;
      socket.join(`usuario_${usuario.id}`);

      if (usuario.tipo === 'admin') {
        socket.join('admins');
      }

      console.log(`[socket.io] usuário #${usuario.id} (${usuario.nome}) conectado - socket ${socket.id}`);
    } else {
      console.log(`[socket.io] visitante conectado - socket ${socket.id}`);
    }

    // Toda página de catálogo/produto entra nessa room para receber
    // atualizações de estoque em tempo real (funcionalidade de sincronização).
    socket.on('entrar-catalogo', () => {
      socket.join('catalogo');
    });

    socket.on('disconnect', () => {
      console.log(`[socket.io] socket ${socket.id} desconectado`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io ainda não foi inicializado. Chame init(server, sessionMiddleware) primeiro.');
  }
  return io;
}

/**
 * Emite um evento privado para um único usuário (todas as abas/sessões dele).
 */
function notificarUsuario(usuarioId, evento, dados) {
  if (!io) return;
  io.to(`usuario_${usuarioId}`).emit(evento, dados);
}

/**
 * Emite um evento para todos os administradores conectados.
 */
function notificarAdmins(evento, dados) {
  if (!io) return;
  io.to('admins').emit(evento, dados);
}

/**
 * Emite um evento para todo mundo com o catálogo/produto aberto
 * (usado para sincronizar estoque em tempo real).
 */
function sincronizarCatalogo(evento, dados) {
  if (!io) return;
  io.to('catalogo').emit(evento, dados);
}

module.exports = {
  init,
  getIO,
  notificarUsuario,
  notificarAdmins,
  sincronizarCatalogo,
};

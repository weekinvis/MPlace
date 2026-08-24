/**
 * socket-client.js
 * Conecta ao Socket.IO para as duas funcionalidades em tempo real do projeto:
 *
 *  1) NOTIFICAÇÃO — quando um vendedor recebe uma nova venda, ou quando o
 *     status de um pedido muda, o usuário interessado recebe um toast e o
 *     contador do sino da navbar é atualizado na hora (evento "notificacao").
 *
 *  2) SINCRONIZAÇÃO — quando o estoque de um produto muda (por causa de uma
 *     compra ou de um ajuste manual do vendedor), todas as abas com aquele
 *     produto/catálogo abertos atualizam o número de estoque e o selo
 *     "esgotado" sem precisar recarregar a página (evento "estoque-atualizado").
 *
 * O socket conecta para TODO MUNDO (inclusive visitantes), pois a
 * sincronização de estoque é uma funcionalidade pública do catálogo.
 */
$(function () {
  'use strict';

  if (typeof io === 'undefined') return;

  const socket = io();

  function escapeHtml(texto) {
    return $('<div>').text(texto == null ? '' : texto).html();
  }

  // ---------------------------------------------------------------------
  // Toast genérico
  // ---------------------------------------------------------------------
  function garantirToastContainer() {
    let $container = $('#toast-container');
    if ($container.length === 0) {
      $container = $('<div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>').css('z-index', 1080);
      $('body').append($container);
    }
    return $container;
  }

  function mostrarToast(titulo, mensagem, link) {
    const $container = garantirToastContainer();
    const id = 'toast-' + Date.now();
    const linkHtml = link ? `<a href="${escapeHtml(link)}" class="small d-block mt-1">Ver detalhes</a>` : '';

    const $toast = $(
      '<div id="' + id + '" class="toast" role="alert" aria-live="assertive" aria-atomic="true">' +
        '<div class="toast-header">' +
          '<i class="bi bi-bell-fill me-2" style="color: var(--bazari-gold-dark)"></i>' +
          '<strong class="me-auto">' + escapeHtml(titulo) + '</strong>' +
          '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>' +
        '</div>' +
        '<div class="toast-body">' + escapeHtml(mensagem) + linkHtml + '</div>' +
      '</div>'
    );

    $container.append($toast);
    const instancia = new bootstrap.Toast($toast[0], { delay: 7000 });
    instancia.show();
    $toast.on('hidden.bs.toast', function () { $(this).remove(); });
  }

  // Exposto globalmente para outros scripts (carrinho.js etc.) reaproveitarem
  // o mesmo componente visual de toast, em vez de duplicar o HTML.
  window.bazariToast = mostrarToast;

  // ---------------------------------------------------------------------
  // 1) Notificações
  // ---------------------------------------------------------------------
  socket.on('notificacao', function (dados) {
    mostrarToast(dados.titulo, dados.mensagem, dados.link);

    const $badge = $('#badge-notificacoes');
    if ($badge.length) {
      const atual = parseInt($badge.text(), 10) || 0;
      $badge.text(atual + 1);
    }
  });

  socket.on('pedido-status-atualizado', function (dados) {
    const $pagina = $('#pagina-pedido');
    if ($pagina.length && String($pagina.data('pedido-id')) === String(dados.pedidoId)) {
      $('#badge-estado-pedido').text(dados.rotulo);
      $('#timeline-pedido').append(
        '<li><strong>' + escapeHtml(dados.rotulo) + '</strong>' +
        '<span class="text-muted small d-block">' + new Date().toLocaleString('pt-BR') + '</span></li>'
      );
    }
  });

  // ---------------------------------------------------------------------
  // 2) Sincronização de estoque
  // ---------------------------------------------------------------------
  socket.on('estoque-atualizado', function (dados) {
    const textoEstoque = dados.esgotado ? 'Sem estoque' : dados.estoque + ' em estoque';
    $('.js-estoque-texto[data-produto-id="' + dados.produtoId + '"]').text(
      dados.esgotado ? 'Sem estoque no momento' : dados.estoque + ' unidade(s) em estoque'
    );

    // Cards do catálogo usam um texto mais curto.
    $('.card-produto .js-estoque-texto[data-produto-id="' + dados.produtoId + '"]').text(textoEstoque);

    $('.js-badge-estoque[data-produto-id="' + dados.produtoId + '"]').toggle(!!dados.esgotado);
    $('.js-badge-estoque-inline[data-produto-id="' + dados.produtoId + '"]').toggle(!!dados.esgotado);

    $('.js-add-carrinho[data-produto-id="' + dados.produtoId + '"]').prop('disabled', !!dados.esgotado);
  });
});

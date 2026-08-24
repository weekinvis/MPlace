/**
 * notificacoes.js
 * - Busca as notificações recentes via AJAX quando o sino da navbar é aberto
 * - Marca notificações como lidas via AJAX (funciona tanto no dropdown da
 *   navbar quanto na página completa de notificações)
 */
$(function () {
  'use strict';

  function escapeHtml(texto) {
    return $('<div>').text(texto == null ? '' : texto).html();
  }

  // ---------------------------------------------------------------------
  // Dropdown do sino (navbar) — carregado via AJAX ao abrir
  // ---------------------------------------------------------------------
  const $sino = $('#sinoNotificacoes');

  if ($sino.length) {
    $sino.closest('.dropdown').on('show.bs.dropdown', function () {
      const $lista = $('#lista-notificacoes-dropdown');
      $lista.html('<div class="text-center text-muted small py-3">Carregando...</div>');

      $.get('/notificacoes/recentes')
        .done(function (resposta) {
          $('#badge-notificacoes').text(resposta.naoLidas > 0 ? resposta.naoLidas : '');

          if (!resposta.notificacoes || resposta.notificacoes.length === 0) {
            $lista.html('<div class="text-center text-muted small py-3">Nenhuma notificação por aqui.</div>');
            return;
          }

          const html = resposta.notificacoes.map(function (n) {
            const classe = n.lida ? '' : 'nao-lida';
            const href = n.link || '#';
            return (
              '<a href="' + escapeHtml(href) + '" class="item-notificacao-dropdown ' + classe + '">' +
                '<strong class="d-block">' + escapeHtml(n.titulo) + '</strong>' +
                '<span>' + escapeHtml(n.mensagem) + '</span>' +
              '</a>'
            );
          }).join('');

          $lista.html(html);
        })
        .fail(function () {
          $lista.html('<div class="text-center text-danger small py-3">Erro ao carregar notificações.</div>');
        });
    });
  }

  // ---------------------------------------------------------------------
  // Marcar uma notificação como lida (página completa /notificacoes)
  // ---------------------------------------------------------------------
  $(document).on('click', '.js-marcar-lida', function () {
    const $botao = $(this);
    const id = $botao.data('id');

    $.ajax({ url: '/notificacoes/' + id + '/lida', method: 'PATCH' })
      .done(function () {
        const $item = $('.item-notificacao[data-id="' + id + '"]');
        $item.removeClass('notificacao-nao-lida');
        $botao.remove();

        const $badge = $('#badge-notificacoes');
        const atual = parseInt($badge.text(), 10) || 0;
        $badge.text(atual > 1 ? atual - 1 : '');
      })
      .fail(function () {
        alert('Não foi possível marcar a notificação como lida. Tente novamente.');
      });
  });

  // ---------------------------------------------------------------------
  // Marcar todas como lidas
  // ---------------------------------------------------------------------
  $('#btn-marcar-todas-lidas').on('click', function () {
    $.ajax({ url: '/notificacoes/marcar-todas', method: 'PATCH' })
      .done(function () {
        $('.item-notificacao').removeClass('notificacao-nao-lida');
        $('.js-marcar-lida').remove();
        $('#badge-notificacoes').text('');
      })
      .fail(function () {
        alert('Não foi possível atualizar as notificações. Tente novamente.');
      });
  });
});

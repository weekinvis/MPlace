/**
 * admin.js
 * Ações do painel administrativo:
 *  - bloquear/desbloquear usuário (AJAX)
 *  - bloquear/desbloquear produto (AJAX)
 *  - aprovar/ocultar avaliação (AJAX)
 *  - abrir o modal de categoria já preenchido para edição (DOM)
 */
$(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Usuários
  // ---------------------------------------------------------------------
  $(document).on('click', '.js-toggle-bloqueio', function () {
    const $botao = $(this);
    const usuarioId = $botao.data('usuario-id');
    const $linha = $('tr[data-usuario-id="' + usuarioId + '"]');
    const $badge = $linha.find('.js-status-usuario');

    $.ajax({ url: '/admin/usuarios/' + usuarioId + '/bloqueio', method: 'PATCH' })
      .done(function (resposta) {
        if (resposta.bloqueado) {
          $badge.removeClass('bg-success').addClass('bg-danger').text('Bloqueado');
          $botao.removeClass('btn-outline-danger').addClass('btn-outline-success').text('Desbloquear');
        } else {
          $badge.removeClass('bg-danger').addClass('bg-success').text('Ativo');
          $botao.removeClass('btn-outline-success').addClass('btn-outline-danger').text('Bloquear');
        }
      })
      .fail(function (xhr) {
        alert((xhr.responseJSON && xhr.responseJSON.erro) || 'Não foi possível atualizar o usuário.');
      });
  });

  // ---------------------------------------------------------------------
  // Produtos
  // ---------------------------------------------------------------------
  $(document).on('click', '.js-toggle-bloqueio-produto', function () {
    const $botao = $(this);
    const produtoId = $botao.data('produto-id');
    const $linha = $('tr[data-produto-id="' + produtoId + '"]');
    const $badge = $linha.find('.js-status-produto');

    $.ajax({ url: '/admin/produtos/' + produtoId + '/bloqueio', method: 'PATCH' })
      .done(function (resposta) {
        $badge.text(resposta.estado);
        if (resposta.estado === 'bloqueado') {
          $badge.removeClass('bg-success').addClass('bg-danger');
          $botao.removeClass('btn-outline-danger').addClass('btn-outline-success').text('Desbloquear');
        } else {
          $badge.removeClass('bg-danger').addClass('bg-success');
          $botao.removeClass('btn-outline-success').addClass('btn-outline-danger').text('Bloquear');
        }
      })
      .fail(function () {
        alert('Não foi possível atualizar o produto.');
      });
  });

  // ---------------------------------------------------------------------
  // Avaliações
  // ---------------------------------------------------------------------
  $(document).on('click', '.js-moderar-avaliacao', function () {
    const $botao = $(this);
    const id = $botao.data('id');
    const acao = $botao.data('acao');
    const $card = $('[data-avaliacao-id="' + id + '"]');

    $.ajax({ url: '/admin/avaliacoes/' + id + '/moderar', method: 'PATCH', data: { acao: acao } })
      .done(function (resposta) {
        const $badge = $card.find('.js-badge-moderacao');
        $badge.text(resposta.estadoModeracao);
        $badge.removeClass('bg-success bg-warning bg-secondary');
        if (resposta.estadoModeracao === 'aprovada') $badge.addClass('bg-success');
        else if (resposta.estadoModeracao === 'pendente') $badge.addClass('bg-warning');
        else $badge.addClass('bg-secondary');

        $card.find('.js-moderar-avaliacao[data-acao="' + acao + '"]').remove();
      })
      .fail(function () {
        alert('Não foi possível moderar a avaliação.');
      });
  });

  // ---------------------------------------------------------------------
  // Modal de categoria (criar/editar)
  // ---------------------------------------------------------------------
  const $modalCategoria = $('#modalCategoria');
  if ($modalCategoria.length) {
    $('#btn-nova-categoria').on('click', function () {
      $('#tituloModalCategoria').text('Nova categoria');
      $('#form-categoria').attr('action', '/admin/categorias');
      $('#categoria-metodo').val('POST');
      $('#categoria-nome, #categoria-descricao, #categoria-icone').val('');
      bootstrap.Modal.getOrCreateInstance($modalCategoria[0]).show();
    });

    $(document).on('click', '.js-editar-categoria', function () {
      const $botao = $(this);
      $('#tituloModalCategoria').text('Editar categoria');
      $('#form-categoria').attr('action', '/admin/categorias/' + $botao.data('id') + '?_method=PUT');
      $('#categoria-metodo').val('PUT');
      $('#categoria-nome').val($botao.data('nome'));
      $('#categoria-descricao').val($botao.data('descricao'));
      $('#categoria-icone').val($botao.data('icone'));
      bootstrap.Modal.getOrCreateInstance($modalCategoria[0]).show();
    });
  }
});

/**
 * vendedor-produtos.js
 * Na listagem "Meus produtos" do vendedor:
 *  - atualizar o estoque direto na tabela (AJAX, ao sair do campo)
 *  - ativar/desativar o produto pelo switch (AJAX)
 */
$(function () {
  'use strict';

  $(document).on('change', '.js-input-estoque', function () {
    const $input = $(this);
    const produtoId = $input.data('produto-id');
    const estoque = Math.max(parseInt($input.val(), 10) || 0, 0);
    $input.val(estoque);

    $.ajax({ url: '/vendedor/produtos/' + produtoId + '/estoque', method: 'PATCH', data: { estoque: estoque } })
      .done(function () {
        $input.removeClass('is-invalid').addClass('border-success');
        setTimeout(function () { $input.removeClass('border-success'); }, 1000);
      })
      .fail(function () {
        $input.addClass('is-invalid');
        alert('Não foi possível atualizar o estoque. Tente novamente.');
      });
  });

  $(document).on('change', '.js-toggle-status', function () {
    const $checkbox = $(this);
    const produtoId = $checkbox.data('produto-id');
    const $label = $checkbox.closest('.form-check').find('.js-status-label');

    $.ajax({ url: '/vendedor/produtos/' + produtoId + '/status', method: 'PATCH' })
      .done(function (resposta) {
        $label.text(resposta.estado === 'ativo' ? 'Ativo' : 'Inativo');
      })
      .fail(function () {
        $checkbox.prop('checked', !$checkbox.prop('checked'));
        alert('Não foi possível atualizar o status do produto.');
      });
  });
});

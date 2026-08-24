/**
 * carrinho.js
 * - Adicionar produto ao carrinho (AJAX) — funciona em qualquer card de
 *   produto (catálogo, home, loja) e na página de detalhes do produto
 * - Atualizar quantidade de um item (AJAX) — página do carrinho
 * - Remover item do carrinho (AJAX) — página do carrinho
 *
 * Usa delegação de evento porque os cards de produto podem ser recriados
 * dinamicamente pelo catalogo.js (filtros via AJAX).
 */
$(function () {
  'use strict';

  function avisar(mensagem, tipo) {
    if (typeof window.bazariToast === 'function') {
      window.bazariToast(tipo === 'erro' ? 'Ops!' : 'Carrinho', mensagem);
    } else {
      alert(mensagem);
    }
  }

  function atualizarBadgeCarrinho(quantidade) {
    const $badge = $('#badge-carrinho');
    $badge.text(quantidade > 0 ? quantidade : '');
  }

  // ---------------------------------------------------------------------
  // Adicionar ao carrinho
  // ---------------------------------------------------------------------
  $(document).on('click', '.js-add-carrinho', function () {
    const $botao = $(this);
    if ($botao.prop('disabled')) return;

    const produtoId = $botao.data('produto-id');
    let quantidade = 1;

    const inputId = $botao.data('quantidade-input');
    if (inputId) {
      quantidade = parseInt($('#' + inputId).val(), 10) || 1;
    }

    const iconeOriginal = $botao.html();
    $botao.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span>');

    $.ajax({
      url: '/carrinho',
      method: 'POST',
      data: { produtoId: produtoId, quantidade: quantidade },
    })
      .done(function (resposta) {
        atualizarBadgeCarrinho(resposta.quantidadeTotal);
        avisar('Produto adicionado ao carrinho!');
        $botao.html('<i class="bi bi-check2"></i>');
        setTimeout(function () {
          $botao.html(iconeOriginal).prop('disabled', false);
        }, 1200);
      })
      .fail(function (xhr) {
        const erro = xhr.responseJSON && xhr.responseJSON.erro ? xhr.responseJSON.erro : 'Não foi possível adicionar o produto.';
        avisar(erro, 'erro');
        $botao.html(iconeOriginal).prop('disabled', false);
      });
  });

  // ---------------------------------------------------------------------
  // Atualizar quantidade (página do carrinho)
  // ---------------------------------------------------------------------
  $(document).on('change', '.js-quantidade-item', function () {
    const $input = $(this);
    const itemId = $input.data('item-id');
    const quantidade = Math.max(parseInt($input.val(), 10) || 1, 1);
    const $linha = $('.item-carrinho[data-item-id="' + itemId + '"]');

    $.ajax({ url: '/carrinho/' + itemId, method: 'PATCH', data: { quantidade: quantidade } })
      .done(function (resposta) {
        $linha.find('.js-subtotal-item').text('R$ ' + resposta.subtotalItem.toFixed(2).replace('.', ','));
        $('#resumo-subtotal').text('R$ ' + resposta.subtotalCarrinho.toFixed(2).replace('.', ','));
        $('#resumo-quantidade').text(resposta.quantidadeTotal);
        atualizarBadgeCarrinho(resposta.quantidadeTotal);
      })
      .fail(function (xhr) {
        const erro = xhr.responseJSON && xhr.responseJSON.erro ? xhr.responseJSON.erro : 'Não foi possível atualizar a quantidade.';
        avisar(erro, 'erro');
      });
  });

  // ---------------------------------------------------------------------
  // Remover item (página do carrinho)
  // ---------------------------------------------------------------------
  $(document).on('click', '.js-remover-item', function () {
    const itemId = $(this).data('item-id');
    const $linha = $('.item-carrinho[data-item-id="' + itemId + '"]');

    $.ajax({ url: '/carrinho/' + itemId, method: 'DELETE' })
      .done(function (resposta) {
        $linha.addClass('removendo');
        setTimeout(function () {
          $linha.remove();
          if ($('.item-carrinho').length === 0) {
            location.reload(); // mostra o estado de "carrinho vazio"
          }
        }, 200);

        $('#resumo-subtotal').text('R$ ' + resposta.subtotalCarrinho.toFixed(2).replace('.', ','));
        $('#resumo-quantidade').text(resposta.quantidadeTotal);
        atualizarBadgeCarrinho(resposta.quantidadeTotal);
      })
      .fail(function () {
        avisar('Não foi possível remover o item.', 'erro');
      });
  });
});

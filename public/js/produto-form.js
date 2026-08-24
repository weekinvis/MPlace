/**
 * produto-form.js
 * Validação client-side do formulário de produto: avisa visualmente se o
 * preço promocional informado não é menor que o preço normal. A validação
 * definitiva continua acontecendo no servidor (model Produto) — isso aqui
 * é só para dar feedback mais rápido ao vendedor.
 */
$(function () {
  'use strict';

  const $preco = $('input[name="preco"]');
  const $precoPromo = $('input[name="precoPromocional"]');
  if ($preco.length === 0 || $precoPromo.length === 0) return;

  function validarPromocao() {
    const preco = parseFloat($preco.val());
    const promo = parseFloat($precoPromo.val());

    if (!isNaN(promo) && promo > 0 && !isNaN(preco) && promo >= preco) {
      $precoPromo[0].setCustomValidity('O preço promocional deve ser menor que o preço original.');
      $precoPromo.addClass('is-invalid');
    } else {
      $precoPromo[0].setCustomValidity('');
      $precoPromo.removeClass('is-invalid');
    }
  }

  $preco.add($precoPromo).on('input', validarPromocao);
});

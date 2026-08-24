/**
 * checkout.js
 * Recalcula o frete e o total estimado ao vivo quando o cliente troca a
 * forma de entrega, sem precisar reenviar o formulário ao servidor.
 */
$(function () {
  'use strict';

  const $grupos = $('.grupo-resumo');
  if ($grupos.length === 0) return;

  function calcularFrete(formaEntrega, subtotal) {
    if (subtotal >= 200) return 0;
    return formaEntrega === 'expressa' ? 35 : 15;
  }

  function formatarMoeda(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
  }

  function recalcular() {
    const formaEntrega = $('input[name="formaEntrega"]:checked').val();
    let totalGeral = 0;

    $grupos.each(function () {
      const $grupo = $(this);
      const subtotal = parseFloat($grupo.data('subtotal'));
      const frete = calcularFrete(formaEntrega, subtotal);

      $grupo.find('.js-frete-grupo').text(formatarMoeda(frete));
      totalGeral += subtotal + frete;
    });

    $('#total-geral').text(formatarMoeda(totalGeral));
  }

  $('.js-forma-entrega').on('change', recalcular);
});

/**
 * avaliacao.js
 * Widget de avaliação por estrelas no formulário de nova avaliação:
 * clicar em uma estrela define a nota (input escondido) e destaca
 * visualmente as estrelas de 1 até a selecionada.
 */
$(function () {
  'use strict';

  const $estrelas = $('.js-estrela-input');
  const $inputNota = $('#input-nota-avaliacao');
  if ($estrelas.length === 0 || $inputNota.length === 0) return;

  function pintarEstrelas(ateValor) {
    $estrelas.each(function () {
      $(this).toggleClass('selecionada', $(this).data('valor') <= ateValor);
    });
  }

  // Começa com a nota máxima marcada, já que o input hidden começa em 5.
  pintarEstrelas(parseInt($inputNota.val(), 10) || 5);

  $estrelas.on('click', function () {
    const valor = $(this).data('valor');
    $inputNota.val(valor);
    pintarEstrelas(valor);
  });

  $estrelas.on('mouseenter', function () {
    pintarEstrelas($(this).data('valor'));
  });

  $('#estrelas-input').on('mouseleave', function () {
    pintarEstrelas(parseInt($inputNota.val(), 10));
  });
});

/**
 * catalogo.js
 * Filtra, ordena e pagina o catálogo via AJAX, sem recarregar a página.
 * Atualiza a URL com history.pushState para manter o botão "voltar" e o
 * compartilhamento de link funcionando corretamente.
 */
$(function () {
  'use strict';

  const $form = $('#form-filtros');
  const $resultado = $('#resultado-catalogo');

  if ($form.length === 0 || $resultado.length === 0) return;

  function coletarFiltros(paginaForcada) {
    const dados = {
      q: $form.find('input[name="q"]').val() || '',
      categoria: $form.find('[name="categoria"]').val() || '',
      precoMin: $form.find('[name="precoMin"]').val() || '',
      precoMax: $form.find('[name="precoMax"]').val() || '',
      ordenar: $form.find('[name="ordenar"]').val() || '',
      pagina: paginaForcada || 1,
    };
    // remove chaves vazias para uma URL mais limpa
    Object.keys(dados).forEach(function (chave) {
      if (dados[chave] === '' || dados[chave] === null) delete dados[chave];
    });
    return dados;
  }

  function buscarProdutos(paginaForcada) {
    const filtros = coletarFiltros(paginaForcada);

    $resultado.css('opacity', 0.5);

    $.get('/produtos/buscar', filtros)
      .done(function (html) {
        $resultado.html(html);
        $resultado.css('opacity', 1);

        const query = $.param(filtros);
        const novaUrl = '/produtos' + (query ? '?' + query : '');
        window.history.pushState({ filtros: filtros }, '', novaUrl);

        $('html, body').animate({ scrollTop: $resultado.offset().top - 100 }, 200);
      })
      .fail(function () {
        $resultado.css('opacity', 1);
        $resultado.html('<p class="text-danger text-center py-5">Não foi possível carregar os produtos. Tente novamente.</p>');
      });
  }

  $form.on('change', '.js-filtro', function () {
    buscarProdutos(1);
  });

  $('#btn-limpar-filtros').on('click', function () {
    $form.find('[name="categoria"]').val('');
    $form.find('[name="precoMin"]').val('');
    $form.find('[name="precoMax"]').val('');
    $form.find('[name="ordenar"]').val('recentes');
    buscarProdutos(1);
  });

  // Delegado porque a paginação é recriada a cada resposta AJAX.
  $(document).on('click', '.js-pagina-link', function (e) {
    const $link = $(this);
    if ($link.closest('.page-item').hasClass('disabled')) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    buscarProdutos($link.data('pagina'));
  });
});

/**
 * pedido.js
 * Página de detalhes do pedido (vendedor): avançar o status ou cancelar,
 * via AJAX, atualizando o badge e a linha do tempo sem recarregar a página.
 */
$(function () {
  'use strict';

  const $pagina = $('#pagina-pedido-vendedor');
  if ($pagina.length === 0) return;

  const pedidoId = $pagina.data('pedido-id');

  function enviarNovoStatus(novoEstado) {
    $.ajax({ url: '/vendedor/pedidos/' + pedidoId + '/status', method: 'PATCH', data: { novoEstado: novoEstado } })
      .done(function (resposta) {
        $('#badge-estado-pedido-vendedor').text(resposta.rotulo);
        $('#timeline-pedido-vendedor').append(
          '<li><strong>' + resposta.rotulo + '</strong>' +
          '<span class="text-muted small d-block">' + new Date().toLocaleString('pt-BR') + '</span></li>'
        );
        $('#mensagem-status-vendedor').removeClass('text-danger').addClass('text-success').text('Status atualizado com sucesso.');
        // Recarrega para atualizar os botões de próxima ação disponíveis.
        setTimeout(function () { location.reload(); }, 800);
      })
      .fail(function (xhr) {
        const erro = xhr.responseJSON && xhr.responseJSON.erro ? xhr.responseJSON.erro : 'Não foi possível atualizar o status.';
        $('#mensagem-status-vendedor').removeClass('text-success').addClass('text-danger').text(erro);
      });
  }

  $('.js-avancar-status').on('click', function () {
    const novoEstado = $(this).data('novo-estado');

    if (novoEstado === 'cancelado') {
      window.bazariConfirmar('Tem certeza que deseja cancelar este pedido? O estoque será devolvido.', function () {
        enviarNovoStatus(novoEstado);
      });
    } else {
      enviarNovoStatus(novoEstado);
    }
  });
});

/**
 * main.js
 * Utilitários globais usados em várias páginas:
 *  - modal de confirmação de exclusão (reutilizável)
 *  - pré-visualização de imagem antes do upload (FileReader)
 *  - alternância do campo "nome da loja" no cadastro
 *
 * Todos os handlers usam delegação de evento ($(document).on(...)) porque
 * vários elementos (cards de produto, linhas de tabela) podem ser inseridos
 * dinamicamente depois de uma chamada AJAX (ex.: filtros do catálogo).
 */
$(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Modal de confirmação de exclusão (usado em endereços, produtos,
  // categorias, cancelamento de pedido etc.)
  // ---------------------------------------------------------------------
  let $formParaConfirmar = null;
  let acaoPosConfirmacao = null;

  $(document).on('click', '.js-confirmar-exclusao', function () {
    $formParaConfirmar = $(this).closest('form');
    acaoPosConfirmacao = null;

    const mensagem = $(this).data('mensagem');
    $('#modalConfirmacaoMensagem').text(mensagem || 'Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.');

    const elModal = document.getElementById('modalConfirmacao');
    if (elModal) {
      bootstrap.Modal.getOrCreateInstance(elModal).show();
    }
  });

  $('#btnConfirmarExclusao').on('click', function () {
    const elModal = document.getElementById('modalConfirmacao');
    if (elModal) bootstrap.Modal.getOrCreateInstance(elModal).hide();

    if (typeof acaoPosConfirmacao === 'function') {
      acaoPosConfirmacao();
    } else if ($formParaConfirmar && $formParaConfirmar.length) {
      $formParaConfirmar.trigger('submit');
    }
  });

  // Permite que outros scripts (ex.: pedido.js) reaproveitem o MESMO modal
  // de confirmação para ações via AJAX, sem precisar de um form real.
  window.bazariConfirmar = function (mensagem, callback) {
    $formParaConfirmar = null;
    acaoPosConfirmacao = callback;
    $('#modalConfirmacaoMensagem').text(mensagem);
    const elModal = document.getElementById('modalConfirmacao');
    if (elModal) bootstrap.Modal.getOrCreateInstance(elModal).show();
  };

  // ---------------------------------------------------------------------
  // Pré-visualização de imagem (FileReader) — produto, logo e banner da loja
  // ---------------------------------------------------------------------
  $(document).on('change', '.js-preview-imagem', function () {
    const input = this;
    const alvo = $(this).data('preview-target');
    if (!alvo || !input.files || !input.files[0]) return;

    const leitor = new FileReader();
    leitor.onload = function (e) {
      $(alvo).attr('src', e.target.result);
    };
    leitor.readAsDataURL(input.files[0]);
  });

  // ---------------------------------------------------------------------
  // Cadastro: mostra/esconde o campo "nome da loja" conforme o tipo de conta
  // ---------------------------------------------------------------------
  $('input[name="tipo"]').on('change', function () {
    const ehVendedor = $('input[name="tipo"]:checked').val() === 'vendedor';
    $('#campo-nome-loja').toggle(ehVendedor);
    $('#nomeLoja').prop('required', ehVendedor);
  });

  // ---------------------------------------------------------------------
  // Fecha alertas flash automaticamente depois de alguns segundos
  // ---------------------------------------------------------------------
  setTimeout(function () {
    $('.alert-dismissible').each(function () {
      bootstrap.Alert.getOrCreateInstance(this).close();
    });
  }, 6000);
});

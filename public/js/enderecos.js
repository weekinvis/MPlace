/**
 * enderecos.js
 * Preenche o modal de endereço (criar ou editar) dinamicamente, sem
 * precisar de uma página separada para cada ação.
 */
$(function () {
  'use strict';

  const $modal = $('#modalEndereco');
  if ($modal.length === 0) return;

  function limparFormulario() {
    $('#form-endereco')[0].reset();
  }

  $('#btn-novo-endereco').on('click', function () {
    limparFormulario();
    $('#tituloModalEndereco').text('Novo endereço');
    $('#form-endereco').attr('action', '/enderecos');
    $('#endereco-metodo').val('POST');
    bootstrap.Modal.getOrCreateInstance($modal[0]).show();
  });

  $(document).on('click', '.js-editar-endereco', function () {
    const $botao = $(this);

    $('#tituloModalEndereco').text('Editar endereço');
    $('#form-endereco').attr('action', '/enderecos/' + $botao.data('id') + '?_method=PUT');
    $('#endereco-metodo').val('PUT');

    $('#endereco-apelido').val($botao.data('apelido'));
    $('#endereco-cep').val($botao.data('cep'));
    $('#endereco-logradouro').val($botao.data('logradouro'));
    $('#endereco-numero').val($botao.data('numero'));
    $('#endereco-complemento').val($botao.data('complemento'));
    $('#endereco-bairro').val($botao.data('bairro'));
    $('#endereco-cidade').val($botao.data('cidade'));
    $('#endereco-estado').val($botao.data('estado'));
    $('#endereco-principal').prop('checked', String($botao.data('principal')) === 'true');

    bootstrap.Modal.getOrCreateInstance($modal[0]).show();
  });
});

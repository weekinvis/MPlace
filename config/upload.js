'use strict';

// config/upload.js
// Configuração do Multer para uploads de imagem (produtos e imagens da loja
// do vendedor: logo/banner). Cada chamada de criarUpload() gera uma
// instância apontando para a subpasta correta dentro de public/images.

const path = require('path');
const fs = require('fs');
const multer = require('multer');

function garantirPasta(pasta) {
  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta, { recursive: true });
  }
  return pasta;
}

function filtroArquivo(req, file, cb) {
  const tiposPermitidos = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
  const extensao = path.extname(file.originalname).toLowerCase();
  if (tiposPermitidos.includes(extensao)) {
    return cb(null, true);
  }
  cb(new Error('Formato de imagem não suportado. Use PNG, JPG, WEBP, GIF ou SVG.'));
}

function criarUpload(subpasta, prefixo) {
  const pastaDestino = garantirPasta(path.join(__dirname, '..', 'public', 'images', subpasta));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, pastaDestino),
    filename: (req, file, cb) => {
      const sufixo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extensao = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefixo}-${sufixo}${extensao}`);
    },
  });

  return multer({ storage, fileFilter: filtroArquivo, limits: { fileSize: 5 * 1024 * 1024 } });
}

module.exports = {
  uploadProduto: criarUpload('produtos', 'produto'),
  uploadLoja: criarUpload('lojas', 'loja'),
  uploadAvatar: criarUpload('avatars', 'avatar'),
};

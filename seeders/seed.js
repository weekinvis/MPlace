'use strict';

// seeders/seed.js
// Popula o banco do zero com dados suficientes para demonstrar o sistema:
// categorias, vendedores (com perfil de loja), clientes (com endereços),
// produtos, pedidos em vários estados, avaliações e notificações.
//
// Uso: npm run seed   (recria o banco do zero — CUIDADO, isso apaga dados existentes)

require('dotenv').config();

const {
  sequelize,
  Usuario,
  Endereco,
  PerfilVendedor,
  Categoria,
  Produto,
  Carrinho,
  ItemCarrinho,
  Pedido,
  ItemPedido,
  HistoricoEstadoPedido,
  Avaliacao,
  Notificacao,
} = require('../models');

function diasAtras(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function seed() {
  console.log('Recriando as tabelas do banco de dados...');
  await sequelize.sync({ force: true });

  // ---------------------------------------------------------------------
  // Categorias
  // ---------------------------------------------------------------------
  const categoriasData = [
    { nome: 'Eletrônicos', slug: 'eletronicos', icone: 'bi-laptop', descricao: 'Gadgets, acessórios e eletrônicos em geral' },
    { nome: 'Moda', slug: 'moda', icone: 'bi-bag-heart', descricao: 'Roupas, calçados e acessórios' },
    { nome: 'Casa e Decoração', slug: 'casa-e-decoracao', icone: 'bi-house-heart', descricao: 'Itens para deixar sua casa mais aconchegante' },
    { nome: 'Livros', slug: 'livros', icone: 'bi-book', descricao: 'Livros de todos os gêneros' },
    { nome: 'Esporte e Lazer', slug: 'esporte-e-lazer', icone: 'bi-trophy', descricao: 'Equipamentos esportivos e para atividades ao ar livre' },
    { nome: 'Beleza', slug: 'beleza', icone: 'bi-flower1', descricao: 'Cosméticos e cuidados pessoais' },
    { nome: 'Brinquedos', slug: 'brinquedos', icone: 'bi-controller', descricao: 'Brinquedos e jogos para todas as idades' },
    { nome: 'Alimentos', slug: 'alimentos', icone: 'bi-cup-hot', descricao: 'Alimentos e bebidas selecionados' },
  ];
  const categorias = {};
  for (const c of categoriasData) {
    categorias[c.slug] = await Categoria.create(c);
  }
  console.log(`✔ ${categoriasData.length} categorias criadas.`);

  // ---------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------
  await Usuario.create({
    nome: 'Admin Bazari',
    email: 'admin@bazari.com',
    senha: 'admin123',
    tipo: 'admin',
    telefone: '(11) 90000-0000',
  });
  console.log('✔ Usuário administrador criado.');

  // ---------------------------------------------------------------------
  // Vendedores
  // ---------------------------------------------------------------------
  const lojasData = [
    { slug: 'techpoint', nome: 'Rafael Andrade', email: 'rafael@techpoint.com.br', nomeLoja: 'TechPoint', descricao: 'Os melhores gadgets e acessórios de tecnologia com garantia e entrega rápida.' },
    { slug: 'casa-aconchego', nome: 'Marina Costa', email: 'marina@casaaconchego.com.br', nomeLoja: 'Casa Aconchego', descricao: 'Itens selecionados para deixar sua casa com mais estilo e conforto.' },
    { slug: 'vida-ativa', nome: 'Diego Ferreira', email: 'diego@vidaativa.com.br', nomeLoja: 'Vida Ativa Esportes', descricao: 'Equipamentos esportivos para quem leva a vida ativa a sério.' },
    { slug: 'livraria-horizonte', nome: 'Beatriz Nunes', email: 'beatriz@livrariahorizonte.com.br', nomeLoja: 'Livraria Horizonte', descricao: 'Curadoria de livros para todos os gostos e idades.' },
    { slug: 'bela-estacao', nome: 'Camila Rocha', email: 'camila@belaestacao.com.br', nomeLoja: 'Bela Estação', descricao: 'Moda e beleza com curadoria própria e tendências da estação.' },
    { slug: 'mundo-kids', nome: 'Paulo Martins', email: 'paulo@mundokids.com.br', nomeLoja: 'Mundo Kids & Gourmet', descricao: 'Brinquedos educativos e alimentos gourmet selecionados.' },
  ];

  const vendedores = {};
  for (const l of lojasData) {
    const usuario = await Usuario.create({
      nome: l.nome,
      email: l.email,
      senha: 'vendedor123',
      tipo: 'vendedor',
      telefone: '(11) 98888-' + Math.floor(1000 + Math.random() * 9000),
    });
    await PerfilVendedor.create({
      usuarioId: usuario.id,
      nomeLoja: l.nomeLoja,
      descricao: l.descricao,
      logo: `/images/lojas/${l.slug}-logo.svg`,
      banner: `/images/lojas/${l.slug}-banner.svg`,
    });
    vendedores[l.slug] = usuario;
  }
  console.log(`✔ ${lojasData.length} vendedores (com perfil de loja) criados.`);

  // ---------------------------------------------------------------------
  // Clientes + endereços + carrinho
  // ---------------------------------------------------------------------
  const clientesData = [
    { nome: 'Ana Souza', email: 'ana@email.com' },
    { nome: 'Bruno Lima', email: 'bruno@email.com' },
    { nome: 'Carla Mendes', email: 'carla@email.com' },
    { nome: 'Eduardo Alves', email: 'eduardo@email.com' },
  ];

  const clientes = {};
  for (const c of clientesData) {
    const usuario = await Usuario.create({
      nome: c.nome,
      email: c.email,
      senha: 'cliente123',
      tipo: 'cliente',
      telefone: '(11) 97777-' + Math.floor(1000 + Math.random() * 9000),
    });
    await Carrinho.create({ usuarioId: usuario.id });
    clientes[c.email] = usuario;
  }
  console.log(`✔ ${clientesData.length} clientes criados.`);

  const enderecos = {};
  enderecos.ana1 = await Endereco.create({
    usuarioId: clientes['ana@email.com'].id, apelido: 'Casa', cep: '01310-100',
    logradouro: 'Avenida Paulista', numero: '1000', complemento: 'Apto 52',
    bairro: 'Bela Vista', cidade: 'São Paulo', estado: 'SP', principal: true,
  });
  await Endereco.create({
    usuarioId: clientes['ana@email.com'].id, apelido: 'Trabalho', cep: '04538-133',
    logradouro: 'Avenida Brigadeiro Faria Lima', numero: '3477', complemento: '10º andar',
    bairro: 'Itaim Bibi', cidade: 'São Paulo', estado: 'SP', principal: false,
  });
  enderecos.bruno1 = await Endereco.create({
    usuarioId: clientes['bruno@email.com'].id, apelido: 'Casa', cep: '30130-010',
    logradouro: 'Rua da Bahia', numero: '540', complemento: '',
    bairro: 'Centro', cidade: 'Belo Horizonte', estado: 'MG', principal: true,
  });
  enderecos.carla1 = await Endereco.create({
    usuarioId: clientes['carla@email.com'].id, apelido: 'Casa', cep: '80010-000',
    logradouro: 'Rua XV de Novembro', numero: '210', complemento: 'Casa 2',
    bairro: 'Centro', cidade: 'Curitiba', estado: 'PR', principal: true,
  });
  enderecos.eduardo1 = await Endereco.create({
    usuarioId: clientes['eduardo@email.com'].id, apelido: 'Casa', cep: '90010-000',
    logradouro: 'Rua dos Andradas', numero: '1001', complemento: '',
    bairro: 'Centro Histórico', cidade: 'Porto Alegre', estado: 'RS', principal: true,
  });
  console.log('✔ Endereços cadastrados.');

  // ---------------------------------------------------------------------
  // Produtos
  // ---------------------------------------------------------------------
  const produtosData = [
    // TechPoint
    { slug: 'techpoint-fone-bluetooth', vendedor: 'techpoint', categoria: 'eletronicos', nome: 'Fone de Ouvido Bluetooth ProSound', descricao: 'Fone de ouvido sem fio com cancelamento de ruído ativo, até 30h de bateria e microfone integrado para chamadas.', preco: 189.9, precoPromocional: 159.9, estoque: 45, marca: 'ProSound', destaque: true },
    { slug: 'techpoint-smartwatch', vendedor: 'techpoint', categoria: 'eletronicos', nome: 'Smartwatch FitTrack X3', descricao: 'Relógio inteligente com monitor cardíaco, GPS integrado, resistência à água e mais de 20 modos de treino.', preco: 349.0, estoque: 30, marca: 'FitTrack', destaque: true },
    { slug: 'techpoint-caixa-som', vendedor: 'techpoint', categoria: 'eletronicos', nome: 'Caixa de Som Portátil BoomBox Mini', descricao: 'Caixa de som Bluetooth à prova d\'água, graves potentes e até 12 horas de autonomia.', preco: 129.9, estoque: 60, marca: 'BoomBox' },
    { slug: 'techpoint-teclado', vendedor: 'techpoint', categoria: 'eletronicos', nome: 'Teclado Mecânico GameStrike RGB', descricao: 'Teclado mecânico gamer com switches azuis, iluminação RGB customizável e estrutura em alumínio.', preco: 279.9, precoPromocional: 249.9, estoque: 25, marca: 'GameStrike', destaque: true },
    { slug: 'techpoint-mouse', vendedor: 'techpoint', categoria: 'eletronicos', nome: 'Mouse Sem Fio ErgoClick', descricao: 'Mouse ergonômico sem fio com sensor de alta precisão e pilha com autonomia de até 6 meses.', preco: 79.9, estoque: 80, marca: 'ErgoClick' },

    // Casa Aconchego
    { slug: 'aconchego-panelas', vendedor: 'casa-aconchego', categoria: 'casa-e-decoracao', nome: 'Jogo de Panelas Antiaderente 5 Peças', descricao: 'Conjunto de panelas com revestimento antiaderente cerâmico, cabo baquelite e fundo triplo para melhor condução de calor.', preco: 249.9, estoque: 20, marca: 'Aconchego Lar', destaque: true },
    { slug: 'aconchego-luminaria', vendedor: 'casa-aconchego', categoria: 'casa-e-decoracao', nome: 'Luminária de Mesa Minimalista', descricao: 'Luminária de mesa com design minimalista, three níveis de intensidade de luz e base em madeira.', preco: 119.9, estoque: 35, marca: 'LumeCasa' },
    { slug: 'aconchego-difusor', vendedor: 'casa-aconchego', categoria: 'casa-e-decoracao', nome: 'Kit Difusor de Aromas com Varetas', descricao: 'Kit com difusor de vidro e óleo aromático de 250ml, dura até 3 meses.', preco: 89.9, estoque: 50, marca: 'Aromas & Cia' },
    { slug: 'aconchego-manta', vendedor: 'casa-aconchego', categoria: 'casa-e-decoracao', nome: 'Manta Soft para Sofá', descricao: 'Manta extra macia 1,80x1,30m, ideal para os dias mais frios, fácil de lavar.', preco: 99.9, precoPromocional: 79.9, estoque: 40, marca: 'Aconchego Lar' },
    { slug: 'aconchego-cestos', vendedor: 'casa-aconchego', categoria: 'casa-e-decoracao', nome: 'Conjunto de Cestos Organizadores', descricao: 'Kit com 3 cestos organizadores em fibra natural, empilháveis e resistentes.', preco: 139.9, estoque: 28, marca: 'OrganizaCasa' },

    // Vida Ativa Esportes
    { slug: 'vidaativa-tapete-yoga', vendedor: 'vida-ativa', categoria: 'esporte-e-lazer', nome: 'Tapete de Yoga Antiderrapante', descricao: 'Tapete de yoga em TPE ecológico, 6mm de espessura, antiderrapante nos dois lados.', preco: 89.9, estoque: 55, marca: 'ZenFit', destaque: true },
    { slug: 'vidaativa-halteres', vendedor: 'vida-ativa', categoria: 'esporte-e-lazer', nome: 'Kit Halteres Ajustáveis 10kg', descricao: 'Par de halteres ajustáveis de 1 a 10kg cada, ideal para treinos em casa.', preco: 219.9, estoque: 18, marca: 'PowerGym' },
    { slug: 'vidaativa-garrafa', vendedor: 'vida-ativa', categoria: 'esporte-e-lazer', nome: 'Garrafa Térmica Esportiva 1L', descricao: 'Garrafa térmica em aço inox, mantém a temperatura por até 12 horas, livre de BPA.', preco: 69.9, estoque: 70, marca: 'HidraFit' },
    { slug: 'vidaativa-bike', vendedor: 'vida-ativa', categoria: 'esporte-e-lazer', nome: 'Bicicleta Ergométrica Compacta', descricao: 'Bicicleta ergométrica dobrável com 8 níveis de resistência e monitor de treino embutido.', preco: 899.0, precoPromocional: 799.0, estoque: 8, marca: 'PowerGym', destaque: true },
    { slug: 'vidaativa-mochila', vendedor: 'vida-ativa', categoria: 'esporte-e-lazer', nome: 'Mochila Impermeável para Trilha', descricao: 'Mochila de 35L impermeável, compartimento para hidratação e alças ajustáveis acolchoadas.', preco: 159.9, estoque: 32, marca: 'TrailPro' },

    // Livraria Horizonte
    { slug: 'horizonte-jornada-heroi', vendedor: 'livraria-horizonte', categoria: 'livros', nome: 'A Jornada do Herói', descricao: 'Romance de aventura sobre superação, amizade e autoconhecimento. Capa comum, 320 páginas.', preco: 49.9, estoque: 40, marca: 'Editora Horizonte' },
    { slug: 'horizonte-investimentos', vendedor: 'livraria-horizonte', categoria: 'livros', nome: 'Fundamentos de Investimentos', descricao: 'Guia completo e didático para quem está começando a investir, com exemplos práticos.', preco: 64.9, estoque: 25, marca: 'Editora Horizonte', destaque: true },
    { slug: 'horizonte-contos', vendedor: 'livraria-horizonte', categoria: 'livros', nome: 'Coleção Contos Brasileiros', descricao: 'Antologia com 20 contos de autores brasileiros contemporâneos.', preco: 39.9, estoque: 33, marca: 'Editora Horizonte' },
    { slug: 'horizonte-produtividade', vendedor: 'livraria-horizonte', categoria: 'livros', nome: 'Guia Prático de Produtividade', descricao: 'Técnicas práticas e testadas para organizar rotina, foco e metas pessoais.', preco: 44.9, precoPromocional: 34.9, estoque: 50, marca: 'Editora Horizonte' },
    { slug: 'horizonte-atlas', vendedor: 'livraria-horizonte', categoria: 'livros', nome: 'Atlas Ilustrado do Universo', descricao: 'Atlas ilustrado sobre astronomia, com mapas estelares e imagens em alta definição.', preco: 89.9, estoque: 15, marca: 'Editora Horizonte' },

    // Bela Estação
    { slug: 'bela-vestido', vendedor: 'bela-estacao', categoria: 'moda', nome: 'Vestido Midi Floral', descricao: 'Vestido midi estampado, tecido leve e fluido, ideal para o dia a dia ou eventos casuais.', preco: 159.9, estoque: 22, marca: 'Bela Estação', destaque: true },
    { slug: 'bela-jaqueta', vendedor: 'bela-estacao', categoria: 'moda', nome: 'Jaqueta Jeans Oversized', descricao: 'Jaqueta jeans com modelagem oversized, lavagem clara e acabamento premium.', preco: 189.9, estoque: 18, marca: 'Bela Estação' },
    { slug: 'bela-skincare', vendedor: 'bela-estacao', categoria: 'beleza', nome: 'Kit Skincare Hidratação Profunda', descricao: 'Kit com sérum, hidratante facial e água micelar para rotina completa de skincare.', preco: 129.9, precoPromocional: 99.9, estoque: 30, marca: 'Pura Pele', destaque: true },
    { slug: 'bela-perfume', vendedor: 'bela-estacao', categoria: 'beleza', nome: 'Perfume Âmbar Dourado 100ml', descricao: 'Fragrância amadeirada com notas de âmbar, baunilha e toque cítrico. Fixação prolongada.', preco: 219.9, estoque: 20, marca: 'Essência Bela' },
    { slug: 'bela-bolsa', vendedor: 'bela-estacao', categoria: 'moda', nome: 'Bolsa Transversal de Couro Sintético', descricao: 'Bolsa transversal compacta com alça ajustável e compartimentos internos organizadores.', preco: 149.9, estoque: 25, marca: 'Bela Estação' },

    // Mundo Kids & Gourmet
    { slug: 'mundokids-blocos', vendedor: 'mundo-kids', categoria: 'brinquedos', nome: 'Blocos de Montar Criativos 300 Peças', descricao: 'Kit com 300 blocos de montar compatíveis com as principais marcas do mercado, estimula a criatividade.', preco: 99.9, estoque: 40, marca: 'Mundo Kids', destaque: true },
    { slug: 'mundokids-quebracabeca', vendedor: 'mundo-kids', categoria: 'brinquedos', nome: 'Quebra-Cabeça Mapa-Múndi 500 Peças', descricao: 'Quebra-cabeça educativo com mapa-múndi ilustrado, 500 peças, ótimo para toda a família.', preco: 79.9, estoque: 35, marca: 'Mundo Kids' },
    { slug: 'mundokids-cafe', vendedor: 'mundo-kids', categoria: 'alimentos', nome: 'Kit Café Especial Grãos Selecionados', descricao: 'Kit com 3 pacotes de café especial 100% arábica, torra média, grãos selecionados.', preco: 54.9, estoque: 45, marca: 'Gourmet Kids' },
    { slug: 'mundokids-chocolates', vendedor: 'mundo-kids', categoria: 'alimentos', nome: 'Caixa de Chocolates Artesanais', descricao: 'Caixa com 12 unidades de chocolates artesanais sortidos, feitos com cacau selecionado.', preco: 44.9, estoque: 60, marca: 'Gourmet Kids', destaque: true },
    { slug: 'mundokids-pelucia', vendedor: 'mundo-kids', categoria: 'brinquedos', nome: 'Pelúcia Urso Gigante 80cm', descricao: 'Urso de pelúcia macio de 80cm, super fofo e seguro para crianças de todas as idades.', preco: 129.9, estoque: 12, marca: 'Mundo Kids' },
  ];

  const produtos = {};
  for (const p of produtosData) {
    produtos[p.slug] = await Produto.create({
      vendedorId: vendedores[p.vendedor].id,
      categoriaId: categorias[p.categoria].id,
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      precoPromocional: p.precoPromocional || null,
      estoque: p.estoque,
      marca: p.marca,
      destaque: !!p.destaque,
      imagem: `/images/produtos/${p.slug}.svg`,
    });
  }
  console.log(`✔ ${produtosData.length} produtos criados.`);

  // ---------------------------------------------------------------------
  // Pedidos (em vários estados, para demonstrar o fluxo completo)
  // ---------------------------------------------------------------------
  let contadorPedido = 1;
  async function criarPedido({ cliente, endereco, itens, estado, formaPagamento, formaEntrega, historicoDias, observacaoFinal }) {
    const numero = `PED-SEED-${String(contadorPedido).padStart(4, '0')}`;
    const codigoCompra = `COMPRA-SEED-${String(contadorPedido).padStart(4, '0')}`;
    contadorPedido += 1;

    const valorProdutos = itens.reduce((soma, i) => soma + Number(produtos[i.slug].precoPromocional || produtos[i.slug].preco) * i.quantidade, 0);
    const valorFrete = valorProdutos >= 200 ? 0 : (formaEntrega === 'expressa' ? 35 : 15);

    const pedido = await Pedido.create({
      usuarioId: cliente.id,
      enderecoId: endereco.id,
      numeroPedido: numero,
      codigoCompra,
      valorProdutos,
      valorFrete,
      valorTotal: valorProdutos + valorFrete,
      formaPagamento,
      formaEntrega,
      estado,
      createdAt: diasAtras(historicoDias[0]),
      updatedAt: diasAtras(historicoDias[historicoDias.length - 1]),
    });

    let vendedorId = null;
    for (const item of itens) {
      const produto = produtos[item.slug];
      vendedorId = produto.vendedorId;
      await ItemPedido.create({
        pedidoId: pedido.id,
        produtoId: produto.id,
        vendedorId: produto.vendedorId,
        nomeProduto: produto.nome,
        imagemProduto: produto.imagem,
        precoUnitario: produto.precoPromocional || produto.preco,
        quantidade: item.quantidade,
        desconto: 0,
        subtotal: Number(produto.precoPromocional || produto.preco) * item.quantidade,
      });
    }

    const ORDEM = ['aguardando_confirmacao', 'confirmado', 'em_preparacao', 'enviado', 'entregue'];
    const indiceFinal = estado === 'cancelado' ? 0 : ORDEM.indexOf(estado);
    let anterior = null;
    for (let i = 0; i <= indiceFinal; i++) {
      await HistoricoEstadoPedido.create({
        pedidoId: pedido.id,
        estadoAnterior: anterior,
        estadoNovo: ORDEM[i],
        usuarioId: i === 0 ? cliente.id : vendedorId,
        observacao: i === 0 ? 'Pedido criado pelo cliente.' : 'Atualizado pelo vendedor.',
        createdAt: diasAtras(historicoDias[Math.min(i, historicoDias.length - 1)]),
      });
      anterior = ORDEM[i];
    }
    if (estado === 'cancelado') {
      await HistoricoEstadoPedido.create({
        pedidoId: pedido.id,
        estadoAnterior: 'aguardando_confirmacao',
        estadoNovo: 'cancelado',
        usuarioId: cliente.id,
        observacao: observacaoFinal || 'Cancelado pelo cliente.',
        createdAt: diasAtras(historicoDias[historicoDias.length - 1]),
      });
    }

    return pedido;
  }

  const pedidoAnaTechpoint = await criarPedido({
    cliente: clientes['ana@email.com'],
    endereco: enderecos.ana1,
    itens: [{ slug: 'techpoint-fone-bluetooth', quantidade: 1 }, { slug: 'techpoint-mouse', quantidade: 1 }],
    estado: 'entregue',
    formaPagamento: 'cartao',
    formaEntrega: 'padrao',
    historicoDias: [7, 6, 5, 3, 1],
  });

  await criarPedido({
    cliente: clientes['ana@email.com'],
    endereco: enderecos.ana1,
    itens: [{ slug: 'horizonte-produtividade', quantidade: 1 }],
    estado: 'em_preparacao',
    formaPagamento: 'pix',
    formaEntrega: 'padrao',
    historicoDias: [3, 2, 1],
  });

  await criarPedido({
    cliente: clientes['bruno@email.com'],
    endereco: enderecos.bruno1,
    itens: [{ slug: 'vidaativa-tapete-yoga', quantidade: 1 }, { slug: 'vidaativa-garrafa', quantidade: 2 }],
    estado: 'enviado',
    formaPagamento: 'cartao',
    formaEntrega: 'expressa',
    historicoDias: [4, 3, 2, 1],
  });

  const pedidoCarlaBela = await criarPedido({
    cliente: clientes['carla@email.com'],
    endereco: enderecos.carla1,
    itens: [{ slug: 'bela-vestido', quantidade: 1 }],
    estado: 'entregue',
    formaPagamento: 'boleto',
    formaEntrega: 'padrao',
    historicoDias: [10, 9, 7, 5, 2],
  });

  await criarPedido({
    cliente: clientes['eduardo@email.com'],
    endereco: enderecos.eduardo1,
    itens: [{ slug: 'mundokids-blocos', quantidade: 1 }, { slug: 'mundokids-chocolates', quantidade: 2 }],
    estado: 'aguardando_confirmacao',
    formaPagamento: 'pix',
    formaEntrega: 'padrao',
    historicoDias: [0],
  });

  await criarPedido({
    cliente: clientes['bruno@email.com'],
    endereco: enderecos.bruno1,
    itens: [{ slug: 'aconchego-panelas', quantidade: 1 }],
    estado: 'confirmado',
    formaPagamento: 'cartao',
    formaEntrega: 'padrao',
    historicoDias: [1, 0],
  });

  await criarPedido({
    cliente: clientes['carla@email.com'],
    endereco: enderecos.carla1,
    itens: [{ slug: 'techpoint-smartwatch', quantidade: 1 }],
    estado: 'cancelado',
    formaPagamento: 'cartao',
    formaEntrega: 'padrao',
    historicoDias: [6, 5],
    observacaoFinal: 'Cliente desistiu da compra.',
  });

  const pedidoBrunoHorizonte = await criarPedido({
    cliente: clientes['bruno@email.com'],
    endereco: enderecos.bruno1,
    itens: [{ slug: 'horizonte-investimentos', quantidade: 1 }],
    estado: 'entregue',
    formaPagamento: 'pix',
    formaEntrega: 'padrao',
    historicoDias: [12, 11, 9, 7, 4],
  });

  const pedidoEduardoPelucia = await criarPedido({
    cliente: clientes['eduardo@email.com'],
    endereco: enderecos.eduardo1,
    itens: [{ slug: 'mundokids-pelucia', quantidade: 1 }],
    estado: 'entregue',
    formaPagamento: 'cartao',
    formaEntrega: 'expressa',
    historicoDias: [8, 7, 6, 5, 3],
  });

  console.log('✔ 9 pedidos de demonstração criados (em diferentes estados).');

  // ---------------------------------------------------------------------
  // Avaliações
  // ---------------------------------------------------------------------
  await Avaliacao.create({
    usuarioId: clientes['ana@email.com'].id,
    produtoId: produtos['techpoint-fone-bluetooth'].id,
    pedidoId: pedidoAnaTechpoint.id,
    nota: 5,
    comentario: 'Som excelente e o cancelamento de ruído realmente funciona bem. Super recomendo!',
    estadoModeracao: 'aprovada',
  });
  await Avaliacao.create({
    usuarioId: clientes['ana@email.com'].id,
    produtoId: produtos['techpoint-mouse'].id,
    pedidoId: pedidoAnaTechpoint.id,
    nota: 4,
    comentario: 'Bom custo-benefício, só achei um pouco leve, mas funciona bem no dia a dia.',
    estadoModeracao: 'aprovada',
  });
  await Avaliacao.create({
    usuarioId: clientes['carla@email.com'].id,
    produtoId: produtos['bela-vestido'].id,
    pedidoId: pedidoCarlaBela.id,
    nota: 5,
    comentario: 'Caimento perfeito e tecido muito bom. Vou comprar em outras cores!',
    estadoModeracao: 'aprovada',
  });
  await Avaliacao.create({
    usuarioId: clientes['bruno@email.com'].id,
    produtoId: produtos['horizonte-investimentos'].id,
    pedidoId: pedidoBrunoHorizonte.id,
    nota: 3,
    comentario: 'Conteúdo bom, mas esperava mais exemplos práticos.',
    estadoModeracao: 'pendente',
  });
  await Avaliacao.create({
    usuarioId: clientes['eduardo@email.com'].id,
    produtoId: produtos['mundokids-pelucia'].id,
    pedidoId: pedidoEduardoPelucia.id,
    nota: 2,
    comentario: 'ok',
    estadoModeracao: 'oculta',
  });
  console.log('✔ 5 avaliações criadas (aprovadas, pendente e oculta).');

  // ---------------------------------------------------------------------
  // Carrinho de demonstração (Ana já com itens no carrinho, de 2 lojas)
  // ---------------------------------------------------------------------
  const carrinhoAna = await Carrinho.findOne({ where: { usuarioId: clientes['ana@email.com'].id } });
  await ItemCarrinho.create({ carrinhoId: carrinhoAna.id, produtoId: produtos['techpoint-caixa-som'].id, quantidade: 1 });
  await ItemCarrinho.create({ carrinhoId: carrinhoAna.id, produtoId: produtos['aconchego-luminaria'].id, quantidade: 2 });
  console.log('✔ Carrinho de demonstração criado para Ana Souza (2 lojas diferentes).');

  // ---------------------------------------------------------------------
  // Notificações
  // ---------------------------------------------------------------------
  await Notificacao.create({ usuarioId: vendedores['techpoint'].id, tipo: 'novo_pedido', titulo: 'Nova venda! 🎉', mensagem: `Novo pedido ${pedidoAnaTechpoint.numeroPedido} recebido.`, link: `/vendedor/pedidos/${pedidoAnaTechpoint.id}`, lida: true });
  await Notificacao.create({ usuarioId: vendedores['bela-estacao'].id, tipo: 'novo_pedido', titulo: 'Nova venda! 🎉', mensagem: `Novo pedido ${pedidoCarlaBela.numeroPedido} recebido.`, link: `/vendedor/pedidos/${pedidoCarlaBela.id}`, lida: false });
  await Notificacao.create({ usuarioId: clientes['ana@email.com'].id, tipo: 'status_pedido', titulo: 'Atualização do seu pedido', mensagem: `Seu pedido ${pedidoAnaTechpoint.numeroPedido} foi entregue.`, link: `/pedidos/${pedidoAnaTechpoint.id}`, lida: false });
  await Notificacao.create({ usuarioId: vendedores['livraria-horizonte'].id, tipo: 'nova_avaliacao', titulo: 'Nova avaliação recebida', mensagem: 'Seu produto "Fundamentos de Investimentos" recebeu uma nova avaliação (3★).', link: `/produtos/${produtos['horizonte-investimentos'].id}`, lida: false });
  await Notificacao.create({ usuarioId: clientes['bruno@email.com'].id, tipo: 'status_pedido', titulo: 'Atualização do seu pedido', mensagem: `Seu pedido está a caminho!`, link: '/pedidos', lida: true });
  console.log('✔ Notificações de demonstração criadas.');

  console.log('\n=================================================================');
  console.log(' BANCO POPULADO COM SUCESSO! Credenciais para teste (senha entre parênteses):');
  console.log('=================================================================');
  console.log(' ADMIN     admin@bazari.com                 (admin123)');
  console.log(' VENDEDOR  rafael@techpoint.com.br           (vendedor123)  - TechPoint');
  console.log(' VENDEDOR  marina@casaaconchego.com.br       (vendedor123)  - Casa Aconchego');
  console.log(' VENDEDOR  diego@vidaativa.com.br            (vendedor123)  - Vida Ativa Esportes');
  console.log(' VENDEDOR  beatriz@livrariahorizonte.com.br  (vendedor123)  - Livraria Horizonte');
  console.log(' VENDEDOR  camila@belaestacao.com.br         (vendedor123)  - Bela Estação');
  console.log(' VENDEDOR  paulo@mundokids.com.br            (vendedor123)  - Mundo Kids & Gourmet');
  console.log(' CLIENTE   ana@email.com                     (cliente123)');
  console.log(' CLIENTE   bruno@email.com                   (cliente123)');
  console.log(' CLIENTE   carla@email.com                   (cliente123)');
  console.log(' CLIENTE   eduardo@email.com                 (cliente123)');
  console.log('=================================================================\n');
}

seed()
  .then(() => {
    console.log('Seed finalizado.');
    process.exit(0);
  })
  .catch((erro) => {
    console.error('Erro ao popular o banco de dados:', erro);
    process.exit(1);
  });

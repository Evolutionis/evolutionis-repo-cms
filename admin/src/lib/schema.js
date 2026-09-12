// Define as seções editáveis e o tipo de cada campo.
//
// REGRA DE OURO: as chaves aqui têm que ser idênticas às de
// `src/data/defaults.js` no repositório do site. O site mescla o content.json
// publicado sobre esses padrões — uma chave escrita diferente não dá erro,
// simplesmente não aparece na página.
//
// Tipos: 'text' | 'textarea' | 'image' | 'icon' | 'color' | 'numero'
//        | 'select' | 'checkbox' | 'tags' | 'lista'
//
// 'lista' recebe `item: { titulo, rotuloNovo, fields: [...] }`, onde `titulo`
// é a chave usada para rotular o item quando fechado.

const CAMPOS_CABECALHO = (extra = []) => [
  { key: 'eyebrow', label: 'Etiqueta (texto pequeno acima do título)', type: 'text' },
  { key: 'titulo', label: 'Título', type: 'textarea' },
  ...extra,
];

export const SECTION_SCHEMA = {
  identidade: {
    label: 'Identidade Visual',
    descricao: 'logotipos e as duas cores da marca',
    fields: [
      {
        key: 'logo',
        label: 'Logotipo do cabeçalho',
        type: 'image',
        ajuda: 'Versão para fundo claro. Aparece no topo do site.',
      },
      {
        key: 'logoRodape',
        label: 'Logotipo do rodapé',
        type: 'image',
        ajuda: 'Vai sobre fundo escuro. Se ficar vazio, o site reutiliza o do cabeçalho.',
      },
      { key: 'corPrimaria', label: 'Cor primária (botões e destaques)', type: 'color' },
      { key: 'corSecundaria', label: 'Cor secundária (fundos claros)', type: 'color' },
    ],
  },

  cabecalho: {
    label: 'Cabeçalho e menu',
    descricao: 'os seis itens do menu, na ordem das seções',
    fields: [
      { key: 'menu1', label: 'Menu 1 — A operação', type: 'text' },
      { key: 'menu2', label: 'Menu 2 — Serviços', type: 'text' },
      { key: 'menu3', label: 'Menu 3 — Acompanhamento', type: 'text' },
      { key: 'menu4', label: 'Menu 4 — Clientes', type: 'text' },
      { key: 'menu5', label: 'Menu 5 — Diferenciais', type: 'text' },
      { key: 'menu6', label: 'Menu 6 — Contato', type: 'text' },
      { key: 'textoBotao', label: 'Botão do cabeçalho', type: 'text' },
    ],
  },

  hero: {
    label: 'Início',
    descricao: 'primeira tela, os três pilares e os números',
    fields: [
      { key: 'badge', label: 'Etiqueta superior', type: 'text' },
      { key: 'titulo', label: 'Título principal', type: 'textarea' },
      {
        key: 'tituloDestaque',
        label: 'Palavra em destaque',
        type: 'text',
        ajuda: 'Precisa ser uma palavra que exista no título acima, escrita igual — é ela que ganha cor.',
      },
      { key: 'subtitulo', label: 'Subtítulo', type: 'textarea' },
      { key: 'textoBotao1', label: 'Botão primário', type: 'text' },
      { key: 'textoBotao2', label: 'Botão secundário', type: 'text' },
      { key: 'aviso', label: 'Linha de aviso abaixo dos botões', type: 'text' },
      {
        key: 'pilares',
        label: 'Pilares',
        type: 'lista',
        max: 3,
        ajuda: 'Os três cartões da primeira tela. Cada um leva a rolagem até um serviço.',
        item: {
          titulo: 'titulo',
          rotuloNovo: 'Adicionar pilar',
          fields: [
            { key: 'titulo', label: 'Título', type: 'text' },
            { key: 'desc', label: 'Descrição', type: 'text' },
            { key: 'icone', label: 'Ícone', type: 'icon' },
            {
              key: 'alvo',
              label: 'Serviço de destino',
              type: 'select',
              ajuda:
                'Para onde o cartão rola. Tem que bater com a chave de um serviço da seção Serviços — se mudar as chaves lá, atualize esta lista, senão o cartão deixa de rolar para lugar nenhum.',
              opcoes: [
                { valor: 'paisagismo', label: 'Paisagismo' },
                { valor: 'dedetizacao', label: 'Dedetização' },
                { valor: 'pragas', label: 'Controle de pragas' },
                { valor: 'limpeza', label: 'Limpeza profissional' },
              ],
            },
          ],
        },
      },
      {
        key: 'estatisticas',
        label: 'Números',
        type: 'lista',
        max: 4,
        ajuda: 'A faixa de números da primeira tela.',
        item: {
          titulo: 'rotulo',
          rotuloNovo: 'Adicionar número',
          fields: [
            { key: 'valor', label: 'Valor (ex: 20+)', type: 'text' },
            { key: 'rotulo', label: 'Legenda', type: 'text' },
          ],
        },
      },
    ],
  },

  operacao: {
    label: 'A operação',
    descricao: 'o texto institucional e os quatro pontos',
    fields: [
      ...CAMPOS_CABECALHO(),
      { key: 'texto', label: 'Texto de apoio', type: 'textarea' },
      {
        key: 'pontos',
        label: 'Pontos',
        type: 'lista',
        item: {
          titulo: 'titulo',
          rotuloNovo: 'Adicionar ponto',
          fields: [
            { key: 'titulo', label: 'Título', type: 'text' },
            { key: 'texto', label: 'Texto', type: 'textarea' },
          ],
        },
      },
    ],
  },

  servicos: {
    label: 'Serviços',
    descricao: 'a lista que controla o vídeo pela rolagem',
    recolhida: true,
    fields: [
      ...CAMPOS_CABECALHO(),
      { key: 'texto', label: 'Texto de apoio', type: 'textarea' },
      {
        key: 'itens',
        label: 'Serviços',
        type: 'lista',
        ajuda:
          'Cada serviço mostra um trecho do filme public/servicos.mp4. Os campos de tempo recortam esse trecho — mexer neles sem trocar o vídeo faz a cena errada aparecer.',
        item: {
          titulo: 'titulo',
          rotuloNovo: 'Adicionar serviço',
          fields: [
            { key: 'titulo', label: 'Título', type: 'text' },
            {
              key: 'chave',
              label: 'Chave interna',
              type: 'text',
              ajuda: 'Sem espaços nem acentos. É o destino dos links dos pilares — mudar aqui quebra esses links.',
            },
            { key: 'num', label: 'Número exibido (ex: 01)', type: 'text' },
            { key: 'rotulo', label: 'Rótulo curto (usado no painel do vídeo)', type: 'text' },
            { key: 'legenda', label: 'Legenda da cena', type: 'text' },
            { key: 'desc', label: 'Descrição', type: 'textarea' },
            { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Ex: Poda' },
            {
              key: 'a',
              label: 'Início do trecho no vídeo (segundos)',
              type: 'numero',
              step: 0.001,
            },
            {
              key: 'b',
              label: 'Fim do trecho no vídeo (segundos)',
              type: 'numero',
              step: 0.001,
              ajuda: 'Deve ser maior que o início. O vídeo atual tem 10,416s no total.',
            },
          ],
        },
      },
    ],
  },

  acompanhamento: {
    label: 'Acompanhamento em tempo real',
    descricao: 'o portal do cliente e a simulação de ordens',
    recolhida: true,
    fields: [
      ...CAMPOS_CABECALHO(),
      { key: 'texto', label: 'Texto de apoio', type: 'textarea' },
      {
        key: 'itens',
        label: 'O que o cliente vê',
        type: 'lista',
        item: {
          titulo: 'titulo',
          rotuloNovo: 'Adicionar item',
          fields: [
            { key: 'titulo', label: 'Título', type: 'text' },
            { key: 'texto', label: 'Texto', type: 'textarea' },
          ],
        },
      },
      {
        key: 'ordens',
        label: 'Ordens de serviço (ilustração da tela do portal)',
        type: 'lista',
        ajuda: 'É uma demonstração visual, não vem do Field Control. Mantenha um dia plausível.',
        item: {
          titulo: 'titulo',
          rotuloNovo: 'Adicionar ordem',
          fields: [
            { key: 'titulo', label: 'Serviço', type: 'text' },
            { key: 'detalhe', label: 'Detalhe', type: 'text' },
            { key: 'hora', label: 'Horário', type: 'text' },
            {
              key: 'estado',
              label: 'Estado',
              type: 'select',
              opcoes: [
                { valor: 'done', label: 'Concluído' },
                { valor: 'now', label: 'Em execução' },
                { valor: 'next', label: 'Agendado' },
              ],
            },
          ],
        },
      },
    ],
  },

  clientes: {
    label: 'Clientes',
    descricao: 'quem confia na Evolutionis',
    recolhida: true,
    fields: [
      ...CAMPOS_CABECALHO(),
      { key: 'texto', label: 'Texto de apoio', type: 'textarea' },
      {
        key: 'placeholder',
        label: 'Conteúdo ainda fictício',
        type: 'checkbox',
        textoCheck: 'Mostrar aviso de conteúdo ilustrativo na página',
        ajuda: 'Desmarque só quando os nomes forem reais e autorizados a aparecer.',
      },
      {
        key: 'itens',
        label: 'Clientes',
        type: 'lista',
        item: {
          titulo: 'nome',
          rotuloNovo: 'Adicionar cliente',
          fields: [
            { key: 'nome', label: 'Nome', type: 'text' },
            { key: 'setor', label: 'Setor (Condomínio, Empresa, Indústria)', type: 'text' },
            {
              key: 'logo',
              label: 'Logotipo',
              type: 'image',
              ajuda:
                'Opcional. Com logotipo, a célula mostra a marca; sem, mostra o nome e o setor em texto. Envie apenas de cliente que autorizou o uso da marca.',
            },
          ],
        },
      },
    ],
  },

  diferenciais: {
    label: 'Diferenciais',
    descricao: 'os seis cartões com ícone',
    recolhida: true,
    fields: [
      ...CAMPOS_CABECALHO(),
      {
        key: 'itens',
        label: 'Diferenciais',
        type: 'lista',
        item: {
          titulo: 'titulo',
          rotuloNovo: 'Adicionar diferencial',
          fields: [
            { key: 'icone', label: 'Ícone', type: 'icon' },
            { key: 'titulo', label: 'Título', type: 'text' },
            { key: 'texto', label: 'Texto', type: 'textarea' },
          ],
        },
      },
    ],
  },

  depoimentos: {
    label: 'Depoimentos',
    descricao: 'o que dizem os clientes',
    recolhida: true,
    fields: [
      ...CAMPOS_CABECALHO(),
      {
        key: 'placeholder',
        label: 'Conteúdo ainda fictício',
        type: 'checkbox',
        textoCheck: 'Mostrar aviso de conteúdo ilustrativo na página',
        ajuda: 'Desmarque quando os depoimentos forem reais e autorizados.',
      },
      {
        key: 'itens',
        label: 'Depoimentos',
        type: 'lista',
        item: {
          titulo: 'nome',
          rotuloNovo: 'Adicionar depoimento',
          fields: [
            { key: 'texto', label: 'Depoimento', type: 'textarea' },
            { key: 'nome', label: 'Quem disse', type: 'text' },
            { key: 'cargo', label: 'Cargo e local', type: 'text' },
          ],
        },
      },
    ],
  },

  contato: {
    label: 'Contato',
    descricao: 'canais, endereço e urgência',
    recolhida: true,
    fields: [
      ...CAMPOS_CABECALHO(),
      { key: 'texto', label: 'Texto de apoio', type: 'textarea' },
      {
        key: 'whatsapp',
        label: 'WhatsApp (só números, com DDI)',
        type: 'text',
        ajuda: 'Ex: 5511917513230. É para onde o formulário e o botão flutuante levam.',
      },
      { key: 'whatsappVisivel', label: 'WhatsApp como aparece na tela', type: 'text' },
      { key: 'email', label: 'E-mail', type: 'text' },
      { key: 'endereco', label: 'Endereço', type: 'text' },
      { key: 'bairro', label: 'Bairro e cidade', type: 'text' },
      { key: 'horario', label: 'Horário de atendimento', type: 'text' },
      { key: 'urgenciaTitulo', label: 'Título do bloco de urgência', type: 'text' },
      { key: 'urgenciaTexto', label: 'Texto do bloco de urgência', type: 'textarea' },
      {
        key: 'mapaEmbed',
        label: 'Google Maps — URL de incorporação',
        type: 'text',
        ajuda: 'No Maps: Compartilhar › Incorporar um mapa, e copie só o endereço de dentro do src. Vazio esconde o mapa.',
      },
    ],
  },

  rodape: {
    label: 'Rodapé',
    fields: [
      { key: 'sobre', label: 'Texto sobre a empresa', type: 'textarea' },
      { key: 'textoDireitos', label: 'Direitos autorais', type: 'text' },
      // O site só vira link o que for https: (lib/sanitize.js no repositório
      // do site); rede sem URL não ganha ícone no rodapé.
      //
      // Atenção: apagar o campo aqui NÃO tira o ícone do site. A mescla do
      // site (useContent.js) ignora string vazia de propósito — senão publicar
      // com um campo ainda em branco apagaria conteúdo que está no ar — então
      // o valor volta a ser o padrão do defaults.js. Para realmente tirar uma
      // rede do rodapé, é preciso esvaziá-la no defaults.js do site.
      { key: 'instagram', label: 'Instagram (URL completa)', type: 'text' },
      { key: 'linkedin', label: 'LinkedIn (URL completa)', type: 'text' },
      { key: 'facebook', label: 'Facebook (URL completa)', type: 'text' },
    ],
  },

  seo: {
    label: 'Busca e compartilhamento',
    descricao: 'título e descrição no Google e nos links',
    recolhida: true,
    fields: [
      { key: 'titulo', label: 'Título da página', type: 'text', ajuda: 'Até ~60 caracteres no Google.' },
      { key: 'descricao', label: 'Descrição', type: 'textarea', ajuda: 'Até ~155 caracteres.' },
      {
        key: 'cidades',
        label: 'Cidades atendidas',
        type: 'tags',
        placeholder: 'Ex: Mairinque',
        ajuda: 'Entram nos dados estruturados que o Google lê para busca local.',
      },
    ],
  },
};

// Define as seções editáveis e o tipo de cada campo.
// type: 'text' | 'textarea' | 'image' | 'icon'
// Edite livremente para refletir o seu site.

export const SECTION_SCHEMA = {
  identidade: {
    label: 'Identidade Visual',
    fields: [
      { key: 'logo', label: 'Logo Principal', type: 'image' },
      { key: 'corPrimaria', label: 'Cor Primária (Botões e Destaques)', type: 'color' },
      { key: 'corSecundaria', label: 'Cor Secundária (Fundo)', type: 'color' },
      { key: 'corFundo', label: 'Cor do Fundo Principal', type: 'color' },
      { key: 'corTexto', label: 'Cor do Texto', type: 'color' },
    ],
  },
  cabecalho: {
    label: 'Cabeçalho & Menu',
    fields: [
      { key: 'menu1', label: 'Item de Menu 1', type: 'text' },
      { key: 'menu2', label: 'Item de Menu 2', type: 'text' },
      { key: 'menu3', label: 'Item de Menu 3', type: 'text' },
      { key: 'menu4', label: 'Item de Menu 4', type: 'text' },
      { key: 'menu5', label: 'Item de Menu 5', type: 'text' },
      { key: 'textoBotao', label: 'Botão de Contato', type: 'text' },
    ],
  },
  hero: {
    label: 'Início (Hero)',
    fields: [
      { key: 'badge', label: 'Texto do Badge (tag superior)', type: 'text' },
      { key: 'titulo', label: 'Título Principal', type: 'textarea' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'textarea' },
      { key: 'textoBotao1', label: 'Texto do Botão Primário', type: 'text' },
      { key: 'textoBotao2', label: 'Texto do Botão Secundário', type: 'text' },
      { key: 'imagemPrincipal', label: 'Imagem Principal', type: 'image' },
    ],
  },
  rodape: {
    label: 'Rodapé',
    fields: [
      { key: 'textoDireitos', label: 'Texto de Direitos Autorais', type: 'text' },
      { key: 'redesSociais', label: 'Ícone das Redes', type: 'icon' },
    ]
  }
};

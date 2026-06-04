// Define as seções editáveis e o tipo de cada campo.
// type: 'text' | 'textarea' | 'image' | 'icon'
// Edite livremente para refletir o seu site.

export const SECTION_SCHEMA = {
  hero: {
    label: 'Hero',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'text' },
      { key: 'textoBotao', label: 'Texto do botão', type: 'text' },
      { key: 'imagemFundo', label: 'Imagem de fundo', type: 'image' },
    ],
  },
  sobre: {
    label: 'Sobre',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'texto', label: 'Texto', type: 'textarea' },
      { key: 'imagem', label: 'Imagem', type: 'image' },
    ],
  },
  servicos: {
    label: 'Serviços',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'descricao', label: 'Descrição', type: 'textarea' },
      { key: 'icone', label: 'Ícone', type: 'icon' },
    ],
  },
  contato: {
    label: 'Contato',
    fields: [
      { key: 'email', label: 'E-mail', type: 'text' },
      { key: 'telefone', label: 'Telefone', type: 'text' },
      { key: 'endereco', label: 'Endereço', type: 'text' },
      { key: 'iconeRedes', label: 'Ícone redes sociais', type: 'icon' },
    ],
  },
};

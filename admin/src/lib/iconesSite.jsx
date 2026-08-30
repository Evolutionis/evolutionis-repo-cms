// Os ícones que o site realmente sabe desenhar.
//
// O site não usa lucide: `src/components/Icones.jsx` tem um mapa próprio de SVGs
// inline, e o `content.json` guarda o NOME da chave desse mapa. Escolher um ícone
// que não exista aqui faz o site renderizar um espaço vazio, sem erro nenhum.
// Por isso este arquivo é uma cópia fiel do mapa do site — ao acrescentar um
// ícone lá, acrescente aqui também.

export const ICONES_SITE = {
  limpeza: 'M19 5 9 15 M14 4l6 6 M8 16 4 20h6l2-2 M13 21h7',
  planta: 'M12 22V9 M12 9C12 5 9 2 5 2c0 4 3 7 7 7Z M12 12c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z',
  escudo: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-4',
  relogio: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M12 7v5l3 2',
  documento: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  equipe: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z M22 21v-2a4 4 0 0 0-3-3.87',
  local: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  folha: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z M2 21c0-3 1.85-5.36 5.08-6',
  telefone:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z',
  email: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M22 7l-10 6L2 7',
  alerta: 'M12 9v4M12 17h.01 M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  check: 'M5 12l5 5L20 7',
  instagram:
    'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z M18.5 6.5h.01',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
};

export const NOMES_ICONES = Object.keys(ICONES_SITE);

// Desenha o ícone do jeito que o site desenha: traço, sem preenchimento.
export function IconeSite({ nome, size = 22 }) {
  const d = ICONES_SITE[nome];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.split(' M').map((parte, i) => (
        <path key={i} d={i === 0 ? parte : `M${parte}`} />
      ))}
    </svg>
  );
}

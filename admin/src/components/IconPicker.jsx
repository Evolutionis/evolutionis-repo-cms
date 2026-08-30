import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { IconeSite, NOMES_ICONES } from '../lib/iconesSite';

// O seletor mostra os ícones do site, não os do lucide.
// O painel usa lucide na sua própria interface; o conteúdo publicado, não.
export function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    if (!termo) return NOMES_ICONES;
    return NOMES_ICONES.filter((n) => n.includes(termo));
  }, [q]);

  return (
    <div>
      <div className="icon-field">
        <div className="icon-current">
          {value && NOMES_ICONES.includes(value) ? (
            <IconeSite nome={value} size={26} />
          ) : (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
            {value ? `Ícone: ${value}` : 'Escolher ícone'}
          </button>
          {value && (
            <button type="button" className="link" style={{ marginLeft: 10 }} onClick={() => onChange('')}>
              remover
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)} aria-label="Fechar">
              <X size={20} />
            </button>
            <h3>Escolher ícone</h3>
            <p className="hint" style={{ marginBottom: 12 }}>
              Só estes existem no site. Qualquer outro nome faz o ícone sumir da página.
            </p>
            <input placeholder="Buscar ícone…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            <div className="icon-grid">
              {filtrados.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  title={nome}
                  className={`icon-btn ${value === nome ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(nome);
                    setOpen(false);
                  }}
                >
                  <IconeSite nome={nome} size={20} />
                </button>
              ))}
            </div>
            {filtrados.length === 0 && <p className="empty">Nenhum ícone encontrado.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

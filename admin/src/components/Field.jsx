import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical } from 'lucide-react';
import { ImageField } from './ImageField';
import { IconPicker } from './IconPicker';

// Um campo do schema. Os tipos escalares desenham direto; 'lista' e 'tags'
// desenham coleções e são o motivo deste arquivo existir separado do
// SectionEditor — sem eles, seções como serviços e depoimentos só dava para
// editar no código.
export function Field({ def, value, onChange, onToast }) {
  if (def.type === 'lista') {
    return <ListaField def={def} value={value} onChange={onChange} onToast={onToast} />;
  }

  return (
    <div className="field">
      <label>{def.label}</label>
      <Escalar def={def} value={value} onChange={onChange} onToast={onToast} />
      {def.ajuda && <p className="hint">{def.ajuda}</p>}
    </div>
  );
}

function Escalar({ def, value, onChange, onToast }) {
  switch (def.type) {
    case 'textarea':
      return <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;

    case 'image':
      return <ImageField value={value ?? ''} onChange={onChange} onToast={onToast} />;

    case 'icon':
      return <IconPicker value={value ?? ''} onChange={onChange} />;

    case 'color':
      return (
        <div className="color-field">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
          <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
        </div>
      );

    case 'numero':
      return (
        <input
          type="number"
          step={def.step ?? 'any'}
          value={value ?? ''}
          // Campo vazio vira undefined, não 0: 0 é um valor legítimo de tempo
          // do vídeo e gravá-lo por engano moveria o corte do serviço.
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );

    case 'select':
      return (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {def.opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <label className="check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{def.textoCheck || 'Sim'}</span>
        </label>
      );

    case 'tags':
      return <TagsField value={value} onChange={onChange} placeholder={def.placeholder} />;

    default:
      return <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

/* ---------- lista de textos simples (tags de serviço, cidades do SEO) ---------- */

function TagsField({ value, onChange, placeholder }) {
  const itens = Array.isArray(value) ? value : [];
  const [novo, setNovo] = useState('');

  function adicionar() {
    const t = novo.trim();
    if (!t) return;
    onChange([...itens, t]);
    setNovo('');
  }

  return (
    <div>
      <div className="tag-row">
        {itens.map((t, i) => (
          <span className="tag-chip" key={`${t}-${i}`}>
            {t}
            <button
              type="button"
              onClick={() => onChange(itens.filter((_, j) => j !== i))}
              aria-label={`Remover ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        {itens.length === 0 && <span className="hint">nenhum item</span>}
      </div>
      <div className="tag-add">
        <input
          value={novo}
          placeholder={placeholder || 'Novo item'}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              adicionar();
            }
          }}
        />
        <button type="button" className="btn-ghost btn-sm" onClick={adicionar}>
          Adicionar
        </button>
      </div>
    </div>
  );
}

/* ---------- lista de objetos (serviços, depoimentos, clientes…) ---------- */

function ListaField({ def, value, onChange, onToast }) {
  const itens = Array.isArray(value) ? value : [];
  const [aberto, setAberto] = useState(() => new Set());

  function alterna(i) {
    setAberto((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  }

  function mudarItem(i, campo, val) {
    onChange(itens.map((it, j) => (j === i ? { ...it, [campo]: val } : it)));
  }

  function adicionar() {
    const vazio = {};
    def.item.fields.forEach((f) => {
      vazio[f.key] = f.type === 'lista' || f.type === 'tags' ? [] : '';
    });
    onChange([...itens, vazio]);
    // abre o item novo, senão ele entra fechado e parece que nada aconteceu
    setAberto((s) => new Set(s).add(itens.length));
  }

  function remover(i) {
    const rotulo = titulo(itens[i], i);
    if (!confirm(`Remover "${rotulo}" da lista? A remoção só vale depois de publicar.`)) return;
    onChange(itens.filter((_, j) => j !== i));
    setAberto(new Set());
  }

  function mover(i, delta) {
    const alvo = i + delta;
    if (alvo < 0 || alvo >= itens.length) return;
    const copia = [...itens];
    [copia[i], copia[alvo]] = [copia[alvo], copia[i]];
    onChange(copia);
    setAberto(new Set());
  }

  function titulo(item, i) {
    const chave = def.item.titulo || def.item.fields[0]?.key;
    const t = item?.[chave];
    return (typeof t === 'string' && t.trim()) || `Item ${i + 1}`;
  }

  const noLimite = def.max && itens.length >= def.max;

  return (
    <div className="field lista">
      <div className="lista-topo">
        <label>{def.label}</label>
        <span className="hint">
          {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          {def.max ? ` · máx. ${def.max}` : ''}
        </span>
      </div>
      {def.ajuda && <p className="hint lista-ajuda">{def.ajuda}</p>}

      <div className="lista-itens">
        {itens.map((item, i) => (
          <div className={`lista-item ${aberto.has(i) ? 'aberto' : ''}`} key={i}>
            <div className="lista-cab">
              <GripVertical size={15} className="lista-alca" />
              <button type="button" className="lista-titulo" onClick={() => alterna(i)}>
                {titulo(item, i)}
              </button>
              <div className="lista-acoes">
                <button
                  type="button"
                  className="icon-act"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  title="Subir"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  type="button"
                  className="icon-act"
                  onClick={() => mover(i, 1)}
                  disabled={i === itens.length - 1}
                  title="Descer"
                >
                  <ChevronDown size={15} />
                </button>
                <button type="button" className="icon-act perigo" onClick={() => remover(i)} title="Remover">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {aberto.has(i) && (
              <div className="lista-corpo">
                {def.item.fields.map((f) => (
                  <Field
                    key={f.key}
                    def={f}
                    value={item?.[f.key]}
                    onChange={(v) => mudarItem(i, f.key, v)}
                    onToast={onToast}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {itens.length === 0 && <p className="empty" style={{ padding: '22px 0' }}>Nenhum item ainda.</p>}
      </div>

      <button type="button" className="btn-ghost btn-sm" onClick={adicionar} disabled={noLimite}>
        <Plus size={14} /> {def.item.rotuloNovo || 'Adicionar item'}
      </button>
      {noLimite && <p className="hint">O site só mostra {def.max}; remova um antes de acrescentar outro.</p>}
    </div>
  );
}

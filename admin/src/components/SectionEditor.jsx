import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Field } from './Field';

export function SectionEditor({ sectionKey, def, data, onChange, onToast }) {
  // Seções longas (serviços tem 6 itens) fechadas por padrão, senão a página
  // vira uma rolagem de vários metros e achar um campo custa mais que editar.
  const [aberta, setAberta] = useState(!def.recolhida);

  function setField(fieldKey, val) {
    onChange(sectionKey, { ...data, [fieldKey]: val });
  }

  return (
    <div className={`section-card ${aberta ? '' : 'fechada'}`}>
      <button type="button" className="section-cab" onClick={() => setAberta((a) => !a)}>
        <div>
          <h3>{def.label}</h3>
          <p className="hint">
            seção <code>{sectionKey}</code>
            {def.descricao ? ` · ${def.descricao}` : ''}
          </p>
        </div>
        <ChevronDown size={18} className="section-seta" />
      </button>

      {aberta && (
        <div className="section-corpo">
          {def.fields.map((f) => (
            <Field key={f.key} def={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} onToast={onToast} />
          ))}
        </div>
      )}
    </div>
  );
}

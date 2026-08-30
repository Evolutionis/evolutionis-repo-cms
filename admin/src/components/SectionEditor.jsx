import { ChevronDown } from 'lucide-react';
import { Field } from './Field';

// Abrir/fechar é estado do App, não daqui: é o que permite os botões
// "abrir todas" e "fechar todas" da barra de cima agirem sobre o conjunto.
export function SectionEditor({ sectionKey, def, data, aberta, onToggle, onChange, onToast }) {
  function setField(fieldKey, val) {
    onChange(sectionKey, { ...data, [fieldKey]: val });
  }

  const preenchidos = def.fields.filter((f) => {
    const v = data[f.key];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '';
  }).length;

  return (
    <div className={`section-card ${aberta ? '' : 'fechada'}`}>
      <button type="button" className="section-cab" onClick={() => onToggle(sectionKey)}>
        <span className="section-seta"><ChevronDown size={16} /></span>
        <div className="section-tit">
          <h3>{def.label}</h3>
          {def.descricao && <p className="hint">{def.descricao}</p>}
        </div>
        <span className="pill pill-sec">
          {preenchidos}/{def.fields.length} campos
        </span>
        <code className="section-chave">{sectionKey}</code>
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

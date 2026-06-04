import { ImageField } from './ImageField';
import { IconPicker } from './IconPicker';

export function SectionEditor({ sectionKey, def, data, onChange, onToast }) {
  function setField(fieldKey, val) {
    onChange(sectionKey, { ...data, [fieldKey]: val });
  }

  return (
    <div className="section-card">
      <h3>{def.label}</h3>
      <p className="hint">seção <code>{sectionKey}</code></p>

      {def.fields.map((f) => (
        <div className="field" key={f.key}>
          <label>{f.label}</label>
          {f.type === 'text' && (
            <input value={data[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} />
          )}
          {f.type === 'textarea' && (
            <textarea value={data[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} />
          )}
          {f.type === 'image' && (
            <ImageField value={data[f.key] ?? ''} onChange={(v) => setField(f.key, v)} onToast={onToast} />
          )}
          {f.type === 'icon' && (
            <IconPicker value={data[f.key] ?? ''} onChange={(v) => setField(f.key, v)} />
          )}
        </div>
      ))}
    </div>
  );
}

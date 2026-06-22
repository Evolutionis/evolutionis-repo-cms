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
          {f.type === 'color' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={data[f.key] ?? '#000000'} onChange={(e) => setField(f.key, e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
              <input type="text" value={data[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} style={{ flex: 1 }} placeholder="#000000" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

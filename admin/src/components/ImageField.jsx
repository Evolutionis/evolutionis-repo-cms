import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { api } from '../lib/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Resolve a URL pública da imagem. O backend salva caminhos tipo "/images/x.jpg",
// que no site final são servidos pela raiz. Para PREVIEW no admin, você pode
// apontar VITE_SITE_URL pro domínio do site publicado.
const SITE_URL = import.meta.env.VITE_SITE_URL || '';
function resolveUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SITE_URL ? SITE_URL.replace(/\/$/, '') + path : path;
}

export function ImageField({ value, onChange, onToast }) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadImages() {
    setLoading(true);
    try {
      setImages(await api.listImages());
    } catch (e) {
      onToast?.(e.message, 'err');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadImages();
  }, [open]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onToast?.('Selecione um arquivo de imagem.', 'err');
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = () => reject(new Error('Falha ao ler o arquivo'));
        r.readAsDataURL(file);
      });
      const result = await api.uploadImage(file.name, base64, `Upload: ${file.name}`);
      onChange(result.publicUrl);
      onToast?.('Imagem enviada e commitada no repositório.');
      setOpen(false);
    } catch (err) {
      onToast?.(err.message, 'err');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="image-field">
        <div
          className="image-preview"
          style={value ? { backgroundImage: `url(${resolveUrl(value)})` } : {}}
        >
          {!value && 'sem imagem'}
        </div>
        <div className="controls">
          <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
            {value ? 'Trocar imagem' : 'Adicionar imagem'}
          </button>
          {value && (
            <button type="button" className="link" style={{ marginLeft: 10 }} onClick={() => onChange('')}>
              remover
            </button>
          )}
          {value && <div className="url-text">{value}</div>}
        </div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
            <h3>Imagens</h3>

            <label className="btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              {uploading ? <span className="spinner" /> : <Upload size={15} />}
              {uploading ? 'Enviando…' : 'Enviar nova imagem'}
              <input type="file" accept="image/*" hidden onChange={handleFile} disabled={uploading} />
            </label>
            <p className="hint" style={{ marginTop: 8 }}>
              A imagem é commitada no repositório do site e entra no versionamento.
            </p>

            <h3 style={{ fontSize: 15, marginTop: 20 }}>Biblioteca</h3>
            {loading ? (
              <p className="empty">Carregando…</p>
            ) : images.length === 0 ? (
              <p className="empty">Nenhuma imagem enviada ainda.</p>
            ) : (
              <div className="img-grid">
                {images.map((img) => (
                  <div
                    key={img.publicUrl}
                    className={`img-thumb ${value === img.publicUrl ? 'selected' : ''}`}
                    style={{ backgroundImage: `url(${resolveUrl(img.publicUrl)})` }}
                    title={img.name}
                    onClick={() => {
                      onChange(img.publicUrl);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

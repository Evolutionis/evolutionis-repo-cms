import { useState, useEffect, useCallback } from 'react';
import { PencilLine, History } from 'lucide-react';
import { api, getToken, getUser } from './lib/api';
import { SECTION_SCHEMA } from './lib/schema';
import { SectionEditor } from './components/SectionEditor';

function Toast({ toast }) {
  return <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>{toast.msg}</div>;
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [toast, setToast] = useState({ msg: '', type: 'ok', show: false });

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3200);
  }, []);

  if (!authed) return <Login onLogin={() => setAuthed(true)} toast={toast} showToast={showToast} />;
  return <Dashboard onLogout={() => setAuthed(false)} toast={toast} showToast={showToast} />;
}

function Login({ onLogin, toast, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!username || !password) return showToast('Preencha usuário e senha', 'err');
    setBusy(true);
    try {
      await api.login(username, password);
      onLogin();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <Toast toast={toast} />
      <div className="login-card">
        <h1>Painel de Conteúdo</h1>
        <p className="sub">Entre para editar e publicar o site.</p>
        <div className="field">
          <label>Usuário</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={submit} disabled={busy}>
          {busy ? <span className="spinner" /> : 'Entrar'}
        </button>
      </div>
    </div>
  );
}

function Dashboard({ onLogout, toast, showToast }) {
  const [tab, setTab] = useState('edit');
  const [content, setContent] = useState({});
  const [comment, setComment] = useState('');
  const [publishing, setPublishing] = useState(false);

  const loadCurrent = useCallback(async () => {
    try {
      const data = await api.getCurrent();
      setContent(data.content || {});
    } catch (e) {
      showToast(e.message, 'err');
    }
  }, [showToast]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  function updateSection(key, val) {
    setContent((c) => ({ ...c, [key]: val }));
  }

  async function publish() {
    setPublishing(true);
    try {
      await api.publish(content, comment.trim() || undefined);
      setComment('');
      showToast('Publicado! O deploy foi disparado no GitHub.');
      await loadCurrent();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setPublishing(false);
    }
  }

  function logout() {
    api.logout();
    onLogout();
  }

  return (
    <div className="wrap">
      <Toast toast={toast} />
      <header className="top">
        <h1>Conteúdo do site</h1>
        <div className="who">
          Logado como <b>{getUser() || '—'}</b> · <button className="link" onClick={logout}>sair</button>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}>
          <PencilLine size={16} /> Editar
        </button>
        <button className={`tab ${tab === 'versions' ? 'active' : ''}`} onClick={() => setTab('versions')}>
          <History size={16} /> Versões
        </button>
      </div>

      {tab === 'edit' && (
        <>
          {Object.entries(SECTION_SCHEMA).map(([key, def]) => (
            <SectionEditor
              key={key}
              sectionKey={key}
              def={def}
              data={content[key] || {}}
              onChange={updateSection}
              onToast={showToast}
            />
          ))}
          <div className="publish-bar">
            <input
              placeholder="O que mudou? (ex: novo título do hero)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn-primary" onClick={publish} disabled={publishing}>
              {publishing ? <span className="spinner" /> : 'Publicar'}
            </button>
          </div>
        </>
      )}

      {tab === 'versions' && <Versions showToast={showToast} onChanged={loadCurrent} />}
    </div>
  );
}

function Versions({ showToast, onChanged }) {
  const [versions, setVersions] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setVersions(await api.listVersions());
    } catch (e) {
      showToast(e.message, 'err');
      setVersions([]);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function rollback(v) {
    if (!confirm(`Restaurar a versão v${v.versionNum}? Isso cria uma nova versão com esse conteúdo e redeploya o site.`)) return;
    setBusyId(v.id);
    try {
      await api.rollback(v.id);
      showToast(`Rollback para v${v.versionNum} feito! Deploy disparado.`);
      await load();
      await onChanged();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusyId(null);
    }
  }

  if (versions === null) return <p className="empty">Carregando…</p>;
  if (versions.length === 0) return <p className="empty">Nenhuma versão publicada ainda.</p>;

  return (
    <div>
      {versions.map((v) => (
        <div className="version-row" key={v.id}>
          <div>
            <span className="vnum">v{v.versionNum}</span>
            {v.isCurrent && <span className="badge">atual</span>}
            <div className="meta">
              {v.comment || '—'} · {v.author?.username || '?'} · {new Date(v.createdAt).toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            {!v.isCurrent && (
              <button className="btn-ghost btn-sm" onClick={() => rollback(v)} disabled={busyId === v.id}>
                {busyId === v.id ? <span className="spinner" style={{ borderTopColor: 'var(--ink)' }} /> : 'Restaurar'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

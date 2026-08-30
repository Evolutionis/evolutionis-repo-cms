import { useState, useEffect, useCallback, useMemo } from 'react';
import { PencilLine, History, LogOut, Clock, GitCommit, User, RotateCcw } from 'lucide-react';
import { api, getToken, getUser } from './lib/api';
import { SECTION_SCHEMA } from './lib/schema';
import { CONTEUDO_PADRAO } from './lib/conteudoPadrao';
import { SectionEditor } from './components/SectionEditor';

// Seções que nunca foram publicadas voltam vazias da API. Em vez de mostrar
// caixas em branco — que o operador não tem como distinguir de "o site está
// vazio" — abrimos com o conteúdo que está no ar.
function comPadroes(salvo) {
  const out = {};
  for (const chave of Object.keys(SECTION_SCHEMA)) {
    const s = salvo?.[chave];
    out[chave] = s && Object.keys(s).length ? { ...CONTEUDO_PADRAO[chave], ...s } : { ...CONTEUDO_PADRAO[chave] };
  }
  // preserva seções antigas que já foram publicadas e não estão mais no schema
  for (const chave of Object.keys(salvo || {})) if (!(chave in out)) out[chave] = salvo[chave];
  return out;
}

function Toast({ toast }) {
  // Sem mensagem não existe elemento nenhum: a caixa fora da tela ainda assim
  // aparecia como uma lasca colorida no canto e como largura extra no celular.
  if (!toast.msg) return null;
  return (
    <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`} role="status">
      {toast.msg}
    </div>
  );
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
        <h1>Evolutionis</h1>
        <p className="sub">Painel de conteúdo do site.</p>
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

const ABAS = {
  edit: { rotulo: 'Editar', icone: PencilLine, titulo: 'Conteúdo do site', sub: 'Altere o texto e publique quando estiver pronto.' },
  versions: { rotulo: 'Versões', icone: History, titulo: 'Versões publicadas', sub: 'Cada publicação vira uma versão que pode ser restaurada.' },
};

function Dashboard({ onLogout, toast, showToast }) {
  const [tab, setTab] = useState('edit');
  const [content, setContent] = useState({});
  const [versoes, setVersoes] = useState(null);
  const [comment, setComment] = useState('');
  const [publishing, setPublishing] = useState(false);

  const loadCurrent = useCallback(async () => {
    try {
      const data = await api.getCurrent();
      setContent(comPadroes(data.content));
    } catch (e) {
      showToast(e.message, 'err');
      // sem rede, ainda dá para ver e preparar a edição do que está no ar
      setContent(comPadroes(null));
    }
  }, [showToast]);

  const loadVersoes = useCallback(async () => {
    try {
      setVersoes(await api.listVersions());
    } catch {
      setVersoes([]); // o erro já aparece pelo carregamento do conteúdo
    }
  }, []);

  useEffect(() => {
    loadCurrent();
    loadVersoes();
  }, [loadCurrent, loadVersoes]);

  async function publish() {
    setPublishing(true);
    try {
      await api.publish(content, comment.trim() || undefined);
      setComment('');
      showToast('Publicado. O deploy foi disparado no GitHub.');
      await loadCurrent();
      await loadVersoes();
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

  const aba = ABAS[tab];

  return (
    <div className="app">
      <Toast toast={toast} />

      <aside className="side">
        <div className="side-marca">
          <strong>Evolutionis</strong>
          <span>Painel de conteúdo</span>
        </div>
        <nav className="side-nav">
          {Object.entries(ABAS).map(([chave, a]) => {
            const Ico = a.icone;
            return (
              <button key={chave} className={tab === chave ? 'ativo' : ''} onClick={() => setTab(chave)}>
                <Ico size={16} /> {a.rotulo}
              </button>
            );
          })}
        </nav>
        <div className="side-pe">
          <span className="quem">Logado como</span>
          <b>{getUser() || '—'}</b>
          <button className="link" onClick={logout}>
            <LogOut size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
            sair
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="pagina-topo">
          <h1>{aba.titulo}</h1>
          <p>{aba.sub}</p>
        </header>

        <div className="pagina-corpo">
          {tab === 'edit' && (
            <>
              <Metricas versoes={versoes} />
              {Object.entries(SECTION_SCHEMA).map(([key, def]) => (
                <SectionEditor
                  key={key}
                  sectionKey={key}
                  def={def}
                  data={content[key] || {}}
                  onChange={(k, v) => setContent((c) => ({ ...c, [k]: v }))}
                  onToast={showToast}
                />
              ))}
            </>
          )}

          {tab === 'versions' && (
            <Versions versoes={versoes} showToast={showToast} onChanged={async () => { await loadVersoes(); await loadCurrent(); }} />
          )}
        </div>

        {tab === 'edit' && (
          <div className="publish-bar">
            <input
              placeholder="O que mudou? (ex: novo título do início)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="btn-primary" onClick={publish} disabled={publishing}>
              {publishing ? <span className="spinner" /> : 'Publicar'}
            </button>
            <span className="aviso">Publicar grava uma nova versão e dispara o deploy do site.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function quando(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  if (min < 60 * 24) return `há ${Math.round(min / 60)} h`;
  return d.toLocaleDateString('pt-BR');
}

function Metricas({ versoes }) {
  const atual = useMemo(() => versoes?.find((v) => v.isCurrent) || versoes?.[0], [versoes]);
  if (!versoes) return null;

  return (
    <div className="metricas">
      <div className="metrica">
        <div className="rot"><GitCommit size={13} /> Versão no ar</div>
        <div className="val">{atual ? `v${atual.versionNum}` : '—'}</div>
        <div className="sub">{versoes.length} {versoes.length === 1 ? 'publicação' : 'publicações'} no total</div>
      </div>
      <div className="metrica">
        <div className="rot"><Clock size={13} /> Última publicação</div>
        <div className="val">{quando(atual?.createdAt)}</div>
        <div className="sub">{atual ? new Date(atual.createdAt).toLocaleString('pt-BR') : 'nada publicado ainda'}</div>
      </div>
      <div className="metrica">
        <div className="rot"><User size={13} /> Por</div>
        <div className="val">{atual?.author?.username || '—'}</div>
        <div className="sub">{atual?.comment || 'sem descrição'}</div>
      </div>
    </div>
  );
}

function Versions({ versoes, showToast, onChanged }) {
  const [busyId, setBusyId] = useState(null);

  async function rollback(v) {
    if (!confirm(`Restaurar a versão v${v.versionNum}? Isso cria uma nova versão com esse conteúdo e republica o site.`)) return;
    setBusyId(v.id);
    try {
      await api.rollback(v.id);
      showToast(`Restaurada a v${v.versionNum}. Deploy disparado.`);
      await onChanged();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusyId(null);
    }
  }

  if (versoes === null) return <p className="empty">Carregando…</p>;
  if (versoes.length === 0) return <p className="empty">Nenhuma versão publicada ainda.</p>;

  return (
    <div>
      {versoes.map((v) => (
        <div className="version-row" key={v.id}>
          <div>
            <span className="vnum">v{v.versionNum}</span>
            {v.isCurrent && <span className="badge">no ar</span>}
            <div className="titulo">{v.comment || 'sem descrição'}</div>
            <div className="meta">
              {v.author?.username || '?'} · {new Date(v.createdAt).toLocaleString('pt-BR')}
            </div>
          </div>
          <div>
            {!v.isCurrent && (
              <button className="btn-ghost btn-sm" onClick={() => rollback(v)} disabled={busyId === v.id}>
                {busyId === v.id ? (
                  <span className="spinner" style={{ borderColor: 'rgba(30,78,121,.3)', borderTopColor: 'var(--brand)' }} />
                ) : (
                  <><RotateCcw size={13} /> Restaurar</>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

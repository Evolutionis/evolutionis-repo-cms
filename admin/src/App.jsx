import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PencilLine, History, LogOut, Clock, GitCommit, ExternalLink,
  RotateCcw, ChevronsDownUp, ChevronsUpDown, Layers, CheckCircle2, PanelLeftClose,
} from 'lucide-react';
import { api, getToken, getUser } from './lib/api';
import { SECTION_SCHEMA } from './lib/schema';
import { CONTEUDO_PADRAO } from './lib/conteudoPadrao';
import { SectionEditor } from './components/SectionEditor';

// Onde o site está publicado. Vira link no painel para conferir o resultado
// sem sair para o navegador procurar o endereço.
const URL_SITE = import.meta.env.VITE_SITE_URL || 'https://evolutionis.com.br/preview/';

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

function iniciais(nome) {
  return (nome || '?').trim().slice(0, 2).toUpperCase();
}

function quando(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  if (min < 60 * 24) return `há ${Math.round(min / 60)} h`;
  if (min < 60 * 24 * 30) return `há ${Math.round(min / 1440)} d`;
  return d.toLocaleDateString('pt-BR');
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
        <span className="marca-ico grande">E</span>
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
  edit: { rotulo: 'Conteúdo', icone: PencilLine, titulo: 'Conteúdo do site' },
  versions: { rotulo: 'Versões', icone: History, titulo: 'Versões publicadas' },
};

const CHAVES = Object.keys(SECTION_SCHEMA);

function Dashboard({ onLogout, toast, showToast }) {
  const [tab, setTab] = useState('edit');
  const [content, setContent] = useState({});
  const [versoes, setVersoes] = useState(null);
  const [comment, setComment] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [lateral, setLateral] = useState(true);
  // Seções longas começam fechadas: com todas abertas a página vira uma
  // rolagem de vários metros e achar um campo custa mais que editar.
  const [abertas, setAbertas] = useState(() => CHAVES.filter((k) => !SECTION_SCHEMA[k].recolhida));

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

  function alterna(chave) {
    setAbertas((a) => (a.includes(chave) ? a.filter((k) => k !== chave) : [...a, chave]));
  }

  const usuario = getUser() || '—';
  const atual = useMemo(() => versoes?.find((v) => v.isCurrent) || versoes?.[0], [versoes]);

  return (
    <div className={`app ${lateral ? '' : 'sem-lateral'}`}>
      <Toast toast={toast} />

      <aside className="side">
        <div className="side-topo">
          <span className="marca-ico">E</span>
          <strong>Evolutionis</strong>
          <button className="icon-act" onClick={() => setLateral(false)} title="Recolher menu">
            <PanelLeftClose size={16} />
          </button>
        </div>

        <nav className="side-nav">
          <p className="side-grupo">Painel</p>
          {Object.entries(ABAS).map(([chave, a]) => {
            const Ico = a.icone;
            return (
              <button key={chave} className={tab === chave ? 'ativo' : ''} onClick={() => setTab(chave)}>
                <Ico size={16} /> {a.rotulo}
              </button>
            );
          })}

          <p className="side-grupo">Site</p>
          <a className="side-item" href={URL_SITE} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Abrir o site
          </a>
        </nav>

        <div className="side-pe">
          <span className="avatar">{iniciais(usuario)}</span>
          <div className="side-quem">
            <b>{usuario}</b>
            <span>administrador</span>
          </div>
          <button className="icon-act" onClick={logout} title="Sair">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topo">
          <div className="topo-marca">
            {!lateral && (
              <button className="icon-act" onClick={() => setLateral(true)} title="Mostrar menu">
                <PanelLeftClose size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
            <span className="ws">EV</span>
            <h1>{ABAS[tab].titulo}</h1>
            <span className="chip">Site institucional</span>
          </div>
          <div className="topo-acoes">
            <a className="btn-ghost btn-sm" href={URL_SITE} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Ver o site
            </a>
          </div>
        </header>

        {tab === 'edit' && (
          <div className="barra">
            <span className="pill"><Layers size={13} /> {CHAVES.length} seções</span>
            <span className="pill"><Clock size={13} /> publicado {quando(atual?.createdAt)}</span>
            <div className="barra-dir">
              <button className="pill" onClick={() => setAbertas(CHAVES)}>
                <ChevronsUpDown size={13} /> Abrir todas
              </button>
              <button className="pill" onClick={() => setAbertas([])}>
                <ChevronsDownUp size={13} /> Fechar todas
              </button>
            </div>
          </div>
        )}

        <div className={`colunas ${tab === 'edit' ? '' : 'sem-rail'}`}>
          <div className="col-principal">
            {tab === 'edit' && (
              <>
                <Metricas versoes={versoes} atual={atual} />
                {Object.entries(SECTION_SCHEMA).map(([key, def]) => (
                  <SectionEditor
                    key={key}
                    sectionKey={key}
                    def={def}
                    data={content[key] || {}}
                    aberta={abertas.includes(key)}
                    onToggle={alterna}
                    onChange={(k, v) => setContent((c) => ({ ...c, [k]: v }))}
                    onToast={showToast}
                  />
                ))}
              </>
            )}

            {tab === 'versions' && (
              <Versions
                versoes={versoes}
                showToast={showToast}
                onChanged={async () => {
                  await loadVersoes();
                  await loadCurrent();
                }}
              />
            )}
          </div>

          {tab === 'edit' && <Rail versoes={versoes} atual={atual} onVerTudo={() => setTab('versions')} />}
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

function Metricas({ versoes, atual }) {
  if (!versoes) return null;

  return (
    <div className="metricas">
      <div className="metrica">
        <div className="rot"><GitCommit size={13} /> Versão no ar</div>
        <div className="linha">
          <span className="val">{atual ? `v${atual.versionNum}` : '—'}</span>
          {atual && <span className="delta ok"><CheckCircle2 size={12} /> publicada</span>}
        </div>
        <div className="sub">
          {versoes.length} {versoes.length === 1 ? 'publicação' : 'publicações'} no histórico
        </div>
      </div>

      <div className="metrica">
        <div className="rot"><Clock size={13} /> Última publicação</div>
        <div className="linha"><span className="val">{quando(atual?.createdAt)}</span></div>
        <div className="sub">{atual ? new Date(atual.createdAt).toLocaleString('pt-BR') : 'nada publicado ainda'}</div>
      </div>

      <div className="metrica">
        <div className="rot">Publicado por</div>
        <div className="linha">
          <span className="avatar peq">{iniciais(atual?.author?.username)}</span>
          <span className="val val-txt">{atual?.author?.username || '—'}</span>
        </div>
        <div className="sub">{atual?.comment || 'sem descrição'}</div>
      </div>

      <div className="metrica">
        <div className="rot"><Layers size={13} /> Seções</div>
        <div className="linha"><span className="val">{CHAVES.length}</span></div>
        <div className="sub">todas editáveis por aqui</div>
      </div>
    </div>
  );
}

function Rail({ versoes, atual, onVerTudo }) {
  return (
    <aside className="rail">
      <div className="rail-card">
        <div className="rail-cab">
          <h4>Situação do site</h4>
        </div>
        <div className="rail-corpo">
          <div className="ambiente">
            <span className="ponto ok" />
            <div>
              <b>No ar</b>
              <span className="hint">{atual ? `v${atual.versionNum} · ${quando(atual.createdAt)}` : 'nada publicado'}</span>
            </div>
            <a className="link" href={URL_SITE} target="_blank" rel="noreferrer">abrir</a>
          </div>
        </div>
      </div>

      <div className="rail-card">
        <div className="rail-cab">
          <h4>Últimas publicações</h4>
          <button className="link" onClick={onVerTudo}>ver todas</button>
        </div>
        <div className="rail-corpo">
          {versoes === null && <p className="hint">Carregando…</p>}
          {versoes?.length === 0 && <p className="hint">Nada publicado ainda.</p>}
          {versoes?.slice(0, 6).map((v) => (
            <div className="atividade" key={v.id}>
              <span className="avatar peq">{iniciais(v.author?.username)}</span>
              <div className="atv-txt">
                <p>
                  <b>{v.author?.username || 'alguém'}</b> publicou{' '}
                  <span className="chip-mono">v{v.versionNum}</span>
                </p>
                <p className="hint">{v.comment || 'sem descrição'}</p>
                <p className="hint tempo">{quando(v.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
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
    <div className="tabela">
      <div className="tabela-cab">
        <span>Versão</span>
        <span>Descrição</span>
        <span>Autor</span>
        <span>Quando</span>
        <span />
      </div>
      {versoes.map((v) => (
        <div className="tabela-linha" key={v.id}>
          <span className="vnum">v{v.versionNum}{v.isCurrent && <span className="badge">no ar</span>}</span>
          <span className="desc">{v.comment || 'sem descrição'}</span>
          <span className="autor">
            <span className="avatar peq">{iniciais(v.author?.username)}</span>
            {v.author?.username || '?'}
          </span>
          <span className="hint">{new Date(v.createdAt).toLocaleString('pt-BR')}</span>
          <span className="acao">
            {!v.isCurrent && (
              <button className="btn-ghost btn-sm" onClick={() => rollback(v)} disabled={busyId === v.id}>
                {busyId === v.id ? (
                  <span className="spinner escuro" />
                ) : (
                  <><RotateCcw size={13} /> Restaurar</>
                )}
              </button>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

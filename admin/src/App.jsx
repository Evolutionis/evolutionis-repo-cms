import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PencilLine, History, LogOut, Clock, GitCommit, ExternalLink,
  RotateCcw, ChevronsDownUp, ChevronsUpDown, Layers, CheckCircle2, PanelLeftClose,
  Rocket, Eye, Globe, AlertTriangle, KeyRound, Users as IconUsuarios,
  ShieldCheck, ShieldAlert, Plus, Trash2, X,
} from 'lucide-react';
import { api, getToken, getUser, getRoleHint } from './lib/api';
import { SECTION_SCHEMA } from './lib/schema';
import { CONTEUDO_PADRAO } from './lib/conteudoPadrao';
import { SectionEditor } from './components/SectionEditor';

// Os dois endereços do site. Homologação é onde se confere; produção é o que o
// cliente vê. Viram link no painel para não ter que procurar o endereço fora.
const URL_HOMOLOG = import.meta.env.VITE_SITE_URL || 'https://evolutionis.com.br/preview/';
const URL_PROD = import.meta.env.VITE_SITE_PROD_URL || 'https://evolutionis.com.br/';

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
  const [totpCode, setTotpCode] = useState('');
  // Só aparece quando usuário+senha estão certos e a conta tem 2FA ativo —
  // ver AuthService.login no backend, que devolve requiresTotp nesse caso
  // sem contar como tentativa errada.
  const [precisaTotp, setPrecisaTotp] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!username || !password) return showToast('Preencha usuário e senha', 'err');
    if (precisaTotp && !totpCode) return showToast('Informe o código do autenticador', 'err');
    setBusy(true);
    try {
      await api.login(username, password, precisaTotp ? totpCode : undefined);
      onLogin();
    } catch (e) {
      if (e.requiresTotp) {
        setPrecisaTotp(true);
        showToast('Informe o código do aplicativo autenticador.');
      } else {
        showToast(e.message, 'err');
        // Senha recusada depois de já ter passado da 1ª etapa: volta ao
        // início em vez de deixar um código digitado contra credenciais erradas.
        if (precisaTotp) {
          setPrecisaTotp(false);
          setTotpCode('');
        }
      }
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
        {!precisaTotp ? (
          <>
            <div className="field">
              <label>Usuário</label>
              <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </div>
            <div className="field">
              <label>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </div>
          </>
        ) : (
          <div className="field">
            <label>Código do autenticador</label>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <p className="hint">Abra o app autenticador de {username} e digite o código de 6 dígitos.</p>
          </div>
        )}
        <button className="btn-primary" style={{ width: '100%' }} onClick={submit} disabled={busy}>
          {busy ? <span className="spinner" /> : precisaTotp ? 'Confirmar código' : 'Entrar'}
        </button>
        {precisaTotp && (
          <button
            type="button"
            className="link"
            style={{ marginTop: 10 }}
            onClick={() => { setPrecisaTotp(false); setTotpCode(''); }}
          >
            voltar
          </button>
        )}
      </div>
    </div>
  );
}

const ABAS = {
  edit: { rotulo: 'Conteúdo', icone: PencilLine, titulo: 'Conteúdo do site' },
  versions: { rotulo: 'Versões', icone: History, titulo: 'Versões publicadas' },
  // admin:true esconde o item do menu para quem não é ADMIN — o backend já
  // recusa a rota para EDITOR (RolesGuard), isto é só não oferecer o que a
  // pessoa não pode usar.
  users: { rotulo: 'Usuários', icone: IconUsuarios, titulo: 'Usuários do painel', admin: true },
};

const CHAVES = Object.keys(SECTION_SCHEMA);

function Dashboard({ onLogout, toast, showToast }) {
  const [tab, setTab] = useState('edit');
  const [content, setContent] = useState({});
  const [versoes, setVersoes] = useState(null);
  const [estado, setEstado] = useState(null); // situação dos dois ambientes
  const [comment, setComment] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [lateral, setLateral] = useState(true);
  const [contaAberta, setContaAberta] = useState(false);
  // getRoleHint() pinta a tela sem esperar a rede (ex: mostrar/esconder o
  // menu "Usuários" antes do primeiro round-trip); loadPerfil() abaixo troca
  // isto pelo valor fresco do banco assim que a resposta chega.
  const [perfil, setPerfil] = useState({ username: getUser(), role: getRoleHint(), totpEnabled: null });
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

  const loadEstado = useCallback(async () => {
    try {
      setEstado(await api.status());
    } catch {
      setEstado(null); // idem: um erro só, no carregamento do conteúdo
    }
  }, []);

  // Papel e status do 2FA sempre frescos do banco — é o que decide se o menu
  // "Usuários" e o botão de promover aparecem habilitados.
  const loadPerfil = useCallback(async () => {
    try {
      setPerfil(await api.me());
    } catch {
      // se o token expirou, as outras chamadas já mostram o toast de sessão
    }
  }, []);

  useEffect(() => {
    loadCurrent();
    loadVersoes();
    loadEstado();
    loadPerfil();
  }, [loadCurrent, loadVersoes, loadEstado, loadPerfil]);

  // Publicar mexe SÓ em homologação. É de propósito: dá para errar no preview
  // sem o cliente ver. Para o site do cliente mudar, é preciso promover.
  async function publish() {
    setPublishing(true);
    try {
      await api.publish(content, comment.trim() || undefined);
      setComment('');
      showToast('Publicado em homologação. Confira no /preview/ antes de promover.');
      await recarrega();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setPublishing(false);
    }
  }

  // Leva para o site do cliente o que já está no preview. Sem versão nova: é o
  // mesmo conteúdo, só passa a valer também em produção.
  async function promote() {
    const v = atualHomolog ? `v${atualHomolog.versionNum}` : 'o que está em homologação';
    if (!confirm(
      `Publicar ${v} no site do cliente?\n\n` +
      'O que está em produção hoje será substituído. Confira antes no /preview/.',
    )) return;

    setPromoting(true);
    try {
      await api.promote();
      showToast('Promovido. O site do cliente vai atualizar em alguns minutos.');
      await recarrega();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setPromoting(false);
    }
  }

  async function recarrega() {
    await Promise.all([loadCurrent(), loadVersoes(), loadEstado()]);
  }

  function logout() {
    api.logout();
    onLogout();
  }

  function alterna(chave) {
    setAbertas((a) => (a.includes(chave) ? a.filter((k) => k !== chave) : [...a, chave]));
  }

  const usuario = perfil.username || getUser() || '—';
  // Cada ambiente tem a sua marca; vêm da lista porque só ela traz o autor.
  const atualHomolog = useMemo(() => versoes?.find((v) => v.isCurrentHomolog), [versoes]);
  const atualProd = useMemo(() => versoes?.find((v) => v.isCurrentProd), [versoes]);
  // Nada novo para promover quando os dois apontam para a mesma versão.
  const sincronizado = !!atualHomolog && atualHomolog.id === atualProd?.id;

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
            if (a.admin && perfil.role !== 'ADMIN') return null;
            const Ico = a.icone;
            return (
              <button key={chave} className={tab === chave ? 'ativo' : ''} onClick={() => setTab(chave)}>
                <Ico size={16} /> {a.rotulo}
              </button>
            );
          })}

          <p className="side-grupo">Site</p>
          <a className="side-item" href={URL_HOMOLOG} target="_blank" rel="noreferrer">
            <Eye size={16} /> Homologação
          </a>
          <a className="side-item" href={URL_PROD} target="_blank" rel="noreferrer">
            <Globe size={16} /> Site do cliente
          </a>
        </nav>

        <div className="side-pe">
          <span className="avatar">{iniciais(usuario)}</span>
          <div className="side-quem">
            <b>{usuario}</b>
            <span>{perfil.role === 'ADMIN' ? 'administrador' : 'editor'}</span>
          </div>
          <button className="icon-act" onClick={() => setContaAberta(true)} title="Minha conta">
            <KeyRound size={15} />
          </button>
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
            <a className="btn-ghost btn-sm" href={URL_HOMOLOG} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Ver a homologação
            </a>
          </div>
        </header>

        {tab === 'edit' && (
          <div className="barra">
            <span className="pill"><Layers size={13} /> {CHAVES.length} seções</span>
            <span className="pill"><Clock size={13} /> preview {quando(atualHomolog?.createdAt)}</span>
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
                <Metricas
                  versoes={versoes}
                  atualHomolog={atualHomolog}
                  atualProd={atualProd}
                  sincronizado={sincronizado}
                />
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
              <Versions versoes={versoes} showToast={showToast} onChanged={recarrega} role={perfil.role} />
            )}

            {tab === 'users' && perfil.role === 'ADMIN' && (
              <Usuarios showToast={showToast} meId={perfil.id} />
            )}
          </div>

          {tab === 'edit' && (
            <Rail
              versoes={versoes}
              estado={estado}
              atualHomolog={atualHomolog}
              atualProd={atualProd}
              sincronizado={sincronizado}
              onVerTudo={() => setTab('versions')}
            />
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
              {publishing ? <span className="spinner" /> : <><Eye size={14} /> Publicar em homologação</>}
            </button>
            <button
              className="btn-promover"
              onClick={promote}
              disabled={promoting || !atualHomolog || sincronizado || perfil.role !== 'ADMIN'}
              title={
                perfil.role !== 'ADMIN'
                  ? 'Apenas administradores podem promover para produção'
                  : !atualHomolog
                    ? 'Publique em homologação antes de promover'
                    : sincronizado
                      ? 'O site do cliente já está com a versão do preview'
                      : 'Levar o que está no preview para o site do cliente'
              }
            >
              {promoting ? <span className="spinner" /> : <><Rocket size={14} /> Promover para produção</>}
            </button>
            <span className="aviso">
              {sincronizado
                ? 'Preview e site do cliente estão iguais.'
                : atualHomolog
                  ? `v${atualHomolog.versionNum} está no preview, aguardando promoção.`
                  : 'Publicar grava uma versão nova e atualiza só o /preview/.'}
            </span>
          </div>
        )}
      </div>

      {contaAberta && (
        <Conta
          perfil={perfil}
          onClose={() => setContaAberta(false)}
          showToast={showToast}
          onAtualizarPerfil={loadPerfil}
        />
      )}
    </div>
  );
}

function Metricas({ versoes, atualHomolog, atualProd, sincronizado }) {
  if (!versoes) return null;

  return (
    <div className="metricas">
      <div className="metrica">
        <div className="rot"><Eye size={13} /> No preview</div>
        <div className="linha">
          <span className="val">{atualHomolog ? `v${atualHomolog.versionNum}` : '—'}</span>
          {atualHomolog && !sincronizado && (
            <span className="delta aguardando"><Clock size={12} /> a promover</span>
          )}
        </div>
        <div className="sub">{atualHomolog ? quando(atualHomolog.createdAt) : 'nada publicado ainda'}</div>
      </div>

      <div className="metrica">
        <div className="rot"><Globe size={13} /> No site do cliente</div>
        <div className="linha">
          <span className="val">{atualProd ? `v${atualProd.versionNum}` : '—'}</span>
          {atualProd && sincronizado && (
            <span className="delta ok"><CheckCircle2 size={12} /> em dia</span>
          )}
        </div>
        <div className="sub">
          {atualProd ? quando(atualProd.promotedAt || atualProd.createdAt) : 'nunca promovido'}
        </div>
      </div>

      <div className="metrica">
        <div className="rot"><GitCommit size={13} /> Última publicação</div>
        <div className="linha">
          <span className="avatar peq">{iniciais(atualHomolog?.author?.username)}</span>
          <span className="val val-txt">{atualHomolog?.author?.username || '—'}</span>
        </div>
        <div className="sub">{atualHomolog?.comment || 'sem descrição'}</div>
      </div>

      <div className="metrica">
        <div className="rot"><Layers size={13} /> Seções</div>
        <div className="linha"><span className="val">{CHAVES.length}</span></div>
        <div className="sub">{versoes.length} no histórico</div>
      </div>
    </div>
  );
}

function Rail({ versoes, estado, atualHomolog, atualProd, sincronizado, onVerTudo }) {
  return (
    <aside className="rail">
      <div className="rail-card">
        <div className="rail-cab">
          <h4>Os dois ambientes</h4>
        </div>
        <div className="rail-corpo">
          <div className="ambiente">
            <span className={`ponto ${atualHomolog ? 'ok' : ''}`} />
            <div>
              <b>Homologação</b>
              <span className="hint">
                {atualHomolog
                  ? `v${atualHomolog.versionNum} · ${quando(atualHomolog.createdAt)}`
                  : 'nada publicado'}
              </span>
            </div>
            <a className="link" href={URL_HOMOLOG} target="_blank" rel="noreferrer">abrir</a>
          </div>

          <div className="ambiente">
            <span className={`ponto ${atualProd ? 'ok' : ''}`} />
            <div>
              <b>Site do cliente</b>
              <span className="hint">
                {atualProd
                  ? `v${atualProd.versionNum} · ${quando(atualProd.promotedAt || atualProd.createdAt)}`
                  : 'nunca promovido'}
              </span>
            </div>
            <a className="link" href={URL_PROD} target="_blank" rel="noreferrer">abrir</a>
          </div>

          {/* A única pergunta que importa antes de promover: o cliente está
              vendo o que foi conferido no preview, ou está atrás? */}
          {atualHomolog && !sincronizado && (
            <p className="nota-ambiente">
              <AlertTriangle size={13} />
              O site do cliente está na v{atualProd ? atualProd.versionNum : '—'}. A v
              {atualHomolog.versionNum} está no preview esperando promoção.
            </p>
          )}
          {sincronizado && (
            <p className="nota-ambiente ok">
              <CheckCircle2 size={13} /> Os dois estão na mesma versão.
            </p>
          )}
          {estado?.branches && (
            <p className="hint branches">
              branches: {estado.branches.homolog} → preview · {estado.branches.prod} → raiz
            </p>
          )}
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

function Versions({ versoes, showToast, onChanged, role }) {
  const [busyId, setBusyId] = useState(null);

  // Restaurar em homologação grava uma versão nova com o conteúdo antigo — o
  // histórico continua linear e o site do cliente não muda.
  async function restaurar(v) {
    if (!confirm(
      `Restaurar a v${v.versionNum} no preview?\n\n` +
      'Isso grava uma versão nova com esse conteúdo. O site do cliente não muda.',
    )) return;
    setBusyId(v.id);
    try {
      await api.rollback(v.id, 'homolog');
      showToast(`v${v.versionNum} restaurada no preview.`);
      await onChanged();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusyId(null);
    }
  }

  // Promover uma versão antiga é como se volta atrás em produção sem passar de
  // novo pelo preview. Não cria versão nova: é o mesmo conteúdo.
  async function promover(v) {
    if (!confirm(
      `Publicar a v${v.versionNum} no site do cliente?\n\n` +
      'O que está em produção hoje será substituído.',
    )) return;
    setBusyId(v.id);
    try {
      await api.promote(v.id);
      showToast(`v${v.versionNum} promovida para produção.`);
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
          <span className="vnum">
            v{v.versionNum}
            {v.isCurrentHomolog && <span className="badge">preview</span>}
            {v.isCurrentProd && <span className="badge prod">no ar</span>}
          </span>
          <span className="desc">{v.comment || 'sem descrição'}</span>
          <span className="autor">
            <span className="avatar peq">{iniciais(v.author?.username)}</span>
            {v.author?.username || '?'}
          </span>
          <span className="hint">{new Date(v.createdAt).toLocaleString('pt-BR')}</span>
          <span className="acao">
            {busyId === v.id ? (
              <span className="spinner escuro" />
            ) : (
              <>
                {!v.isCurrentHomolog && (
                  <button className="btn-ghost btn-sm" onClick={() => restaurar(v)}>
                    <RotateCcw size={13} /> Restaurar no preview
                  </button>
                )}
                {/* Promover é coisa de ADMIN (RolesGuard recusa para EDITOR no
                    backend) — some da lista em vez de aparecer desabilitado,
                    porque quem não pode nunca vai poder aqui. */}
                {!v.isCurrentProd && role === 'ADMIN' && (
                  <button className="btn-ghost btn-sm" onClick={() => promover(v)}>
                    <Rocket size={13} /> Pôr no ar
                  </button>
                )}
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   Minha conta: troca de senha e 2FA da própria conta logada.
   ================================================================ */

function Conta({ perfil, onClose, showToast, onAtualizarPerfil }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>
        <h3>Minha conta</h3>
        <p className="hint" style={{ marginBottom: 18 }}>
          {perfil.username} · {perfil.role === 'ADMIN' ? 'administrador' : 'editor'}
        </p>
        <TrocarSenha showToast={showToast} />
        <div style={{ height: 1, background: 'var(--line)', margin: '22px 0' }} />
        <DuasEtapas perfil={perfil} showToast={showToast} onAtualizarPerfil={onAtualizarPerfil} />
      </div>
    </div>
  );
}

function TrocarSenha({ showToast }) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [busy, setBusy] = useState(false);

  async function trocar() {
    if (!senhaAtual || !novaSenha) return showToast('Preencha a senha atual e a nova.', 'err');
    if (novaSenha !== confirmar) return showToast('A confirmação não bate com a nova senha.', 'err');
    setBusy(true);
    try {
      await api.changePassword(senhaAtual, novaSenha);
      showToast('Senha alterada.');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h4 style={{ fontSize: 14, marginBottom: 12 }}>Trocar senha</h4>
      <div className="field">
        <label>Senha atual</label>
        <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" />
      </div>
      <div className="field">
        <label>Nova senha</label>
        <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" />
        <p className="hint">Pelo menos 12 caracteres, combinando três tipos entre maiúsculas, minúsculas, números e símbolos.</p>
      </div>
      <div className="field">
        <label>Confirmar nova senha</label>
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && trocar()}
          autoComplete="new-password"
        />
      </div>
      <button className="btn-primary btn-sm" onClick={trocar} disabled={busy}>
        {busy ? <span className="spinner" /> : 'Salvar nova senha'}
      </button>
    </div>
  );
}

function DuasEtapas({ perfil, showToast, onAtualizarPerfil }) {
  // { secret, qrDataUrl } enquanto o QR ainda não foi confirmado, senão null.
  const [configurando, setConfigurando] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [mostrarDesativar, setMostrarDesativar] = useState(false);
  const [senhaDesativar, setSenhaDesativar] = useState('');
  const [busy, setBusy] = useState(false);

  async function iniciar() {
    setBusy(true);
    try {
      setConfigurando(await api.setup2fa());
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  async function confirmarAtivacao() {
    if (!codigo) return showToast('Digite o código do app autenticador.', 'err');
    setBusy(true);
    try {
      await api.enable2fa(codigo);
      showToast('Autenticação em duas etapas ativada.');
      setConfigurando(null);
      setCodigo('');
      await onAtualizarPerfil();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  async function desativar() {
    if (!senhaDesativar) return showToast('Digite a senha para desativar.', 'err');
    setBusy(true);
    try {
      await api.disable2fa(senhaDesativar);
      showToast('Autenticação em duas etapas desativada.');
      setMostrarDesativar(false);
      setSenhaDesativar('');
      await onAtualizarPerfil();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h4 style={{ fontSize: 14, marginBottom: 4 }}>Autenticação em duas etapas</h4>

      {perfil.totpEnabled ? (
        <>
          <p className="hint" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <ShieldCheck size={14} color="var(--ok)" /> Ativada — o login pede a senha e o código do app.
          </p>
          {!mostrarDesativar ? (
            <button className="btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setMostrarDesativar(true)}>
              Desativar
            </button>
          ) : (
            <div style={{ marginTop: 12 }}>
              <div className="field">
                <label>Confirme a senha para desativar</label>
                <input
                  type="password"
                  value={senhaDesativar}
                  onChange={(e) => setSenhaDesativar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && desativar()}
                  autoFocus
                />
              </div>
              <button className="btn-ghost btn-sm" onClick={desativar} disabled={busy}>
                {busy ? <span className="spinner escuro" /> : 'Confirmar desativação'}
              </button>
              <button
                type="button"
                className="link"
                style={{ marginLeft: 12 }}
                onClick={() => { setMostrarDesativar(false); setSenhaDesativar(''); }}
              >
                cancelar
              </button>
            </div>
          )}
        </>
      ) : configurando ? (
        <div style={{ marginTop: 8 }}>
          <p className="hint">Escaneie no app autenticador (Google Authenticator, Authy, 1Password…):</p>
          <img
            src={configurando.qrDataUrl}
            alt="QR code para configurar o 2FA"
            width={160}
            height={160}
            style={{ margin: '10px 0', border: '1px solid var(--line)', borderRadius: 8 }}
          />
          <p className="hint">Ou digite manualmente: <code className="mono">{configurando.secret}</code></p>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Código de confirmação</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && confirmarAtivacao()}
              autoFocus
            />
          </div>
          <button className="btn-primary btn-sm" onClick={confirmarAtivacao} disabled={busy}>
            {busy ? <span className="spinner" /> : 'Confirmar e ativar'}
          </button>
          <button
            type="button"
            className="link"
            style={{ marginLeft: 12 }}
            onClick={() => { setConfigurando(null); setCodigo(''); }}
          >
            cancelar
          </button>
        </div>
      ) : (
        <>
          <p className="hint" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <ShieldAlert size={14} color="var(--espera)" /> Desativada — a conta entra só com senha.
          </p>
          <button className="btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={iniciar} disabled={busy}>
            {busy ? <span className="spinner escuro" /> : 'Ativar autenticação em duas etapas'}
          </button>
        </>
      )}
    </div>
  );
}

/* ================================================================
   Usuários do painel — só ADMIN vê a aba (App.jsx já filtra o menu; o
   backend recusa a rota para quem não é ADMIN de qualquer forma).
   ================================================================ */

function Usuarios({ showToast, meId }) {
  const [usuarios, setUsuarios] = useState(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [resetando, setResetando] = useState(null); // usuário cuja senha está sendo redefinida
  const [busyId, setBusyId] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setUsuarios(await api.listUsers());
    } catch (e) {
      showToast(e.message, 'err');
      setUsuarios([]);
    }
  }, [showToast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarPapel(u, role) {
    setBusyId(u.id);
    try {
      await api.setUserRole(u.id, role);
      showToast(`${u.username} agora é ${role === 'ADMIN' ? 'administrador' : 'editor'}.`);
      await carregar();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusyId(null);
    }
  }

  async function excluir(u) {
    if (!confirm(`Excluir o usuário ${u.username}? Essa ação não pode ser desfeita.`)) return;
    setBusyId(u.id);
    try {
      await api.deleteUser(u.id);
      showToast(`${u.username} removido.`);
      await carregar();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="barra" style={{ padding: 0, marginBottom: 12 }}>
        <span className="pill"><IconUsuarios size={13} /> {usuarios?.length ?? '—'} usuários</span>
        <div className="barra-dir">
          <button className="btn-primary btn-sm" onClick={() => setModalNovo(true)}>
            <Plus size={14} /> Novo usuário
          </button>
        </div>
      </div>

      {usuarios === null && <p className="empty">Carregando…</p>}
      {usuarios?.length === 0 && <p className="empty">Nenhum usuário cadastrado.</p>}

      {usuarios && usuarios.length > 0 && (
        <div className="tabela usuarios-tabela">
          <div className="tabela-cab">
            <span>Usuário</span>
            <span>Papel</span>
            <span>2FA</span>
            <span>Desde</span>
            <span />
          </div>
          {usuarios.map((u) => (
            <div className="tabela-linha" key={u.id}>
              <span className="autor">
                <span className="avatar peq">{iniciais(u.username)}</span>
                {u.username}
                {u.id === meId && <span className="chip" style={{ marginLeft: 6 }}>você</span>}
              </span>
              <span>
                {/* Ninguém muda o próprio papel — backend recusa (UsersService.setRole) — então
                    a própria linha mostra um selo fixo em vez de um seletor que sempre falharia. */}
                {u.id === meId ? (
                  <span className="badge">{u.role === 'ADMIN' ? 'administrador' : 'editor'}</span>
                ) : (
                  <select
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => mudarPapel(u, e.target.value)}
                    style={{ width: 'auto', padding: '5px 8px', fontSize: 13 }}
                  >
                    <option value="EDITOR">editor</option>
                    <option value="ADMIN">administrador</option>
                  </select>
                )}
              </span>
              <span className="hint">
                {u.totpEnabled ? <ShieldCheck size={14} color="var(--ok)" /> : <ShieldAlert size={14} color="var(--muted-2)" />}
              </span>
              <span className="hint">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
              <span className="acao">
                {busyId === u.id ? (
                  <span className="spinner escuro" />
                ) : u.id !== meId ? (
                  <>
                    <button className="icon-act" title="Redefinir senha" onClick={() => setResetando(u)}>
                      <KeyRound size={15} />
                    </button>
                    <button className="icon-act perigo" title="Excluir" onClick={() => excluir(u)}>
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      )}

      {modalNovo && (
        <NovoUsuario
          onClose={() => setModalNovo(false)}
          onCreated={() => { setModalNovo(false); carregar(); }}
          showToast={showToast}
        />
      )}

      {resetando && (
        <ResetarSenha
          usuario={resetando}
          onClose={() => setResetando(null)}
          onDone={() => { setResetando(null); carregar(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function NovoUsuario({ onClose, onCreated, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [busy, setBusy] = useState(false);

  async function criar() {
    if (!username || !password) return showToast('Preencha usuário e senha.', 'err');
    setBusy(true);
    try {
      await api.createUser(username.trim(), password, role);
      showToast(`Usuário ${username.trim()} criado.`);
      onCreated();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>
        <h3>Novo usuário</h3>
        <div className="field">
          <label>Usuário</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <p className="hint">
            Pelo menos 12 caracteres, combinando três tipos entre maiúsculas, minúsculas, números e símbolos.
            Repasse por um canal seguro — a pessoa pode trocar depois em &quot;Minha conta&quot;.
          </p>
        </div>
        <div className="field">
          <label>Papel</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="EDITOR">Editor — publica em homologação</option>
            <option value="ADMIN">Administrador — publica, promove e gerencia usuários</option>
          </select>
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={criar} disabled={busy}>
          {busy ? <span className="spinner" /> : 'Criar usuário'}
        </button>
      </div>
    </div>
  );
}

function ResetarSenha({ usuario, onClose, onDone, showToast }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function salvar() {
    if (!password) return showToast('Digite a nova senha.', 'err');
    setBusy(true);
    try {
      await api.resetUserPassword(usuario.id, password);
      showToast(`Senha de ${usuario.username} redefinida. Repasse por um canal seguro.`);
      onDone();
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>
        <h3>Redefinir senha de {usuario.username}</h3>
        <div className="field">
          <label>Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && salvar()}
            autoComplete="new-password"
            autoFocus
          />
          <p className="hint">
            Pelo menos 12 caracteres, combinando três tipos entre maiúsculas, minúsculas, números e símbolos.
            {' '}{usuario.username} vai precisar dela para entrar de novo.
          </p>
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={salvar} disabled={busy}>
          {busy ? <span className="spinner" /> : 'Redefinir senha'}
        </button>
      </div>
    </div>
  );
}

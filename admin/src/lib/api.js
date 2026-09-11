// Cliente da API do backend NestJS (Railway).
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let token = localStorage.getItem('cms_token') || null;

export function getToken() {
  return token;
}
export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('cms_token', t);
  else localStorage.removeItem('cms_token');
}
export function getUser() {
  return localStorage.getItem('cms_user');
}
// Guardado só para pintar a tela sem esperar a rede (ex: mostrar/esconder o
// menu "Usuários" antes do primeiro round-trip). A fonte de verdade é sempre
// api.me(), que o Dashboard chama ao carregar — este valor é só o palpite
// inicial, e pode estar desatualizado se o papel mudou em outro dispositivo.
export function getRoleHint() {
  return localStorage.getItem('cms_role');
}

async function request(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error('Sessão expirada. Entre novamente.');
  }
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))).message || 'Erro na requisição';
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Não passa por request(): o login em duas etapas (2FA) precisa distinguir
  // "senha errada" de "senha certa, falta o código", e request() achata todo
  // erro não-2xx numa Error só com a mensagem, sem esse sinal.
  async login(username, password, totpCode) {
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, ...(totpCode ? { totpCode } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message || 'Erro ao entrar';
      const err = new Error(msg);
      if (data.requiresTotp) err.requiresTotp = true;
      throw err;
    }
    setToken(data.access_token);
    localStorage.setItem('cms_user', data.username);
    localStorage.setItem('cms_role', data.role);
    return data;
  },
  logout() {
    setToken(null);
  },
  // Dados frescos da conta logada (username, role, totpEnabled) — sempre do
  // banco. Também atualiza o palpite local usado por getRoleHint().
  async me() {
    const data = await request('/auth/me');
    localStorage.setItem('cms_role', data.role);
    return data;
  },
  changePassword: (senhaAtual, novaSenha) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ senhaAtual, novaSenha }) }),
  setup2fa: () => request('/auth/2fa/setup', { method: 'POST' }),
  enable2fa: (code) => request('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2fa: (password) => request('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }),

  // Sem ambiente vem homologação — é o que o painel edita.
  getCurrent: (ambiente = 'homolog') =>
    request('/content/current?ambiente=' + encodeURIComponent(ambiente)),
  // Situação dos dois ambientes de uma vez, para os cartões e o botão de promover.
  status: () => request('/content/status'),
  listVersions: () => request('/content/versions'),
  // Publicar mexe só em homologação (o /preview/).
  publish: (sections, comment) =>
    request('/content/publish', {
      method: 'POST',
      body: JSON.stringify({ sections, comment }),
    }),
  // Promover leva para produção o que já está em homologação. Com versionId,
  // promove aquela versão — é assim que se volta produção para algo antigo.
  // Só ADMIN — o backend recusa para EDITOR (RolesGuard).
  promote: (versionId) =>
    request('/content/promote', {
      method: 'POST',
      body: JSON.stringify(versionId ? { versionId } : {}),
    }),
  rollback: (versionId, ambiente = 'homolog') =>
    request(
      '/content/rollback/' + versionId + '?ambiente=' + encodeURIComponent(ambiente),
      { method: 'POST' },
    ),
  listImages: () => request('/images'),
  uploadImage: (fileName, base64, comment) =>
    request('/images/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, base64, comment }),
    }),

  // Gerenciar contas — só ADMIN (RolesGuard no backend recusa o resto).
  listUsers: () => request('/users'),
  createUser: (username, password, role) =>
    request('/users', { method: 'POST', body: JSON.stringify({ username, password, role }) }),
  setUserRole: (id, role) =>
    request('/users/' + id + '/role', { method: 'PATCH', body: JSON.stringify({ role }) }),
  resetUserPassword: (id, password) =>
    request('/users/' + id + '/password', { method: 'PATCH', body: JSON.stringify({ password }) }),
  deleteUser: (id) => request('/users/' + id, { method: 'DELETE' }),
};

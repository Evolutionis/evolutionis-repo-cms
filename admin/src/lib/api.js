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
  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    localStorage.setItem('cms_user', data.username);
    return data;
  },
  logout() {
    setToken(null);
  },
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
};

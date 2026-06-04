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
  getCurrent: () => request('/content/current'),
  listVersions: () => request('/content/versions'),
  publish: (sections, comment) =>
    request('/content/publish', {
      method: 'POST',
      body: JSON.stringify({ sections, comment }),
    }),
  rollback: (versionId) =>
    request('/content/rollback/' + versionId, { method: 'POST' }),
  listImages: () => request('/images'),
  uploadImage: (fileName, base64, comment) =>
    request('/images/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, base64, comment }),
    }),
};

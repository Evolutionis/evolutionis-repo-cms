// Configuração do rate limit em um lugar só (achado A3).
//
// Vive fora do AppModule para que o teste automatizado exercite exatamente os
// mesmos valores que rodam em produção — um teste que declara os próprios
// limites passa mesmo depois de alguém afrouxar os de verdade.

/** Limite geral da API: 60 requisições por minuto, por IP. */
export const THROTTLE_PADRAO = { name: 'default', ttl: 60_000, limit: 60 };

/** Limite do login, mais apertado que o geral: 5 por minuto, por IP. */
export const THROTTLE_LOGIN = { limit: 5, ttl: 60_000 };

/**
 * Quantos proxies existem na frente da aplicação.
 *
 * O throttler identifica o cliente por `req.ip`. Sem `trust proxy`, o Express
 * devolve o endereço do peer TCP — que no Railway é o proxy de borda, igual
 * para todo mundo. O limite "por IP" viraria um balde único: um atacante
 * queimaria as 5 tentativas do minuto e o administrador legítimo levaria 429
 * sem nunca ter tentado.
 *
 * O valor é a quantidade de saltos confiáveis contados da direita para a
 * esquerda no X-Forwarded-For. Não usar `true`: aí o cabeçalho inteiro passa a
 * ser confiável e qualquer cliente forja o próprio IP, o que devolve o
 * problema pelo outro lado.
 */
export const PROXIES_CONFIAVEIS = Number(process.env.TRUST_PROXY_HOPS ?? 1);

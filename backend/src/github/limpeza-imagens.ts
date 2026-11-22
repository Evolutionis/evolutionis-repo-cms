/**
 * Regras (puras, sem rede nem banco) da limpeza de imagens órfãs que roda ao
 * promover para produção. Separadas do serviço para poderem ser testadas.
 *
 * Contexto: o painel envia a imagem no instante em que o arquivo é escolhido
 * (e para as DUAS branches), muito antes de qualquer conteúdo passar a citá-la.
 * Quem desiste, ou troca de imagem, deixa um arquivo que ninguém usa e que o
 * painel não tem como apagar. A promoção é o único momento em que se sabe o
 * que está de fato em uso.
 */

/** Quantas versões recentes do histórico continuam protegidas (para rollback). */
export const VERSOES_PROTEGIDAS = 5;

/** Imagem enviada há menos que isto pode estar num rascunho ainda sem salvar. */
export const IDADE_MINIMA_MS = 24 * 60 * 60 * 1000;

/** Se a lista de remoção passar disto, algo está errado: não apaga nada. */
export const LIMITE_REMOCOES = 20;

export type ModoLimpeza = 'desligado' | 'simular' | 'ligado';

/** LIMPAR_IMAGENS: "simular" (padrão) só registra no log; "ligado" apaga. */
export function modoLimpeza(valor = process.env.LIMPAR_IMAGENS): ModoLimpeza {
  const v = (valor ?? '').trim().toLowerCase();
  if (v === 'ligado' || v === 'desligado') return v;
  return 'simular';
}

/** Nomes de arquivo citados como /images/<arquivo> em qualquer ponto dos conteúdos. */
export function imagensCitadas(...conteudos: unknown[]): Set<string> {
  const citadas = new Set<string>();
  for (const c of conteudos) {
    const texto = JSON.stringify(c ?? {});
    for (const m of texto.matchAll(/\/images\/([^"\\\s)?#]+)/g)) {
      try {
        citadas.add(decodeURIComponent(m[1]));
      } catch {
        citadas.add(m[1]); // % solto: guarda como veio, é só mais conservador
      }
    }
  }
  return citadas;
}

/**
 * Quais arquivos de uma pasta de imagens podem ser apagados.
 * - sem o carimbo `Date.now()-` no nome: não foi enviado pelo painel, não mexe;
 * - com menos de IDADE_MINIMA_MS: pode estar num rascunho, não mexe;
 * - citado por algum conteúdo protegido: não mexe;
 * - lista acima do limite: devolve vazio (trava contra bug / JSON vazio).
 */
export function imagensParaApagar(opcoes: {
  arquivos: string[];
  citadas: Set<string>;
  agora?: number;
  limite?: number;
}): string[] {
  const { arquivos, citadas, agora = Date.now(), limite = LIMITE_REMOCOES } = opcoes;
  const apagar = arquivos.filter((nome) => {
    const m = /^(\d{13})-/.exec(nome);
    if (!m) return false;
    if (agora - Number(m[1]) < IDADE_MINIMA_MS) return false;
    return !citadas.has(nome);
  });
  return apagar.length > limite ? [] : apagar;
}

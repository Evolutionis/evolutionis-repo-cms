/**
 * Teste da limpeza de imagens órfãs ao promover para produção.
 *
 * Roda com `npm test`, sem framework e sem banco nem rede: as regras puras são
 * chamadas direto, e o ContentService real roda com o Prisma e o GitHub
 * trocados por dublês que anotam o que lhes foi pedido.
 */
import 'reflect-metadata';
import { ContentService } from '../src/content/content.service';
import {
  IDADE_MINIMA_MS,
  LIMITE_REMOCOES,
  imagensCitadas,
  imagensParaApagar,
  modoLimpeza,
} from '../src/github/limpeza-imagens';

let falhas = 0;
let total = 0;

function ok(condicao: boolean, descricao: string, detalhe = '') {
  total++;
  if (condicao) {
    console.log(`  \x1b[32m✓\x1b[0m ${descricao}`);
  } else {
    falhas++;
    console.log(`  \x1b[31m✗\x1b[0m ${descricao}${detalhe ? `\n      ${detalhe}` : ''}`);
  }
}
function igual(recebido: unknown, esperado: unknown, descricao: string) {
  ok(
    JSON.stringify(recebido) === JSON.stringify(esperado),
    descricao,
    `esperado ${JSON.stringify(esperado)}, recebido ${JSON.stringify(recebido)}`,
  );
}

const AGORA = Date.UTC(2026, 10, 22, 12);
const velha = (nome: string) => `${AGORA - 5 * 24 * 3600_000}-${nome}`;
const recente = `${AGORA - 3600_000}-recem.png`;

// ----------------------------------------------------------- regras puras

function testeRegras() {
  console.log('\nRegras de decisão');
  const prod = { logos: [{ img: `/images/${velha('em-prod.png')}` }] };
  const rascunho = { depo: { foto: `/images/${velha('so-no-rascunho.png')}` }, css: `url(/images/${velha('css.png')})` };
  const v17 = { banner: `/images/${velha('so-na-v17.png')}` };
  const citadas = imagensCitadas(prod, rascunho, v17);
  const arquivos = [
    velha('em-prod.png'), velha('so-no-rascunho.png'), velha('css.png'),
    velha('so-na-v17.png'), velha('orfa.png'), recente, 'icone-manual.png',
  ];
  igual(imagensParaApagar({ arquivos, citadas, agora: AGORA }), [velha('orfa.png')],
    'só a órfã antiga sai (citadas em prod, rascunho, CSS e versão antiga ficam)');
  ok(!imagensParaApagar({ arquivos, citadas, agora: AGORA }).includes(recente),
    'imagem com menos de 24 h fica (pode estar num rascunho sem salvar)');
  ok(!imagensParaApagar({ arquivos, citadas, agora: AGORA }).includes('icone-manual.png'),
    'arquivo sem o carimbo do painel nunca é tocado');
  ok(IDADE_MINIMA_MS === 24 * 3600_000, 'idade mínima é de 24 horas');

  const muitos = Array.from({ length: LIMITE_REMOCOES + 1 }, (_, i) => velha(`f${i}.png`));
  igual(imagensParaApagar({ arquivos: muitos, citadas: new Set(), agora: AGORA }), [],
    `mais de ${LIMITE_REMOCOES} candidatas: trava e não apaga nada`);

  ok(imagensCitadas({ a: '/images/123-a%20b.png' }).has('123-a b.png'), 'nome codificado na URL é decodificado');
  ok(imagensCitadas({ a: '/images/123-a%ZZ.png' }).has('123-a%ZZ.png'), '% solto não derruba a leitura');
  ok(imagensCitadas(null, undefined).size === 0, 'conteúdo nulo não quebra');

  igual([modoLimpeza(undefined), modoLimpeza('LIGADO'), modoLimpeza('desligado'), modoLimpeza('qualquer')],
    ['simular', 'ligado', 'desligado', 'simular'], 'modo: padrão é simular; valor desconhecido também');
}

// ------------------------------------------------------ promote() de ponta a ponta

type Gancho = { branch: string; remover: string[]; content?: unknown };

function montar(opcoes: {
  arquivosProd?: string[]; arquivosHomolog?: string[];
  jsonProd?: unknown; jsonHomolog?: unknown;
  recentes?: unknown[]; homologAtual?: unknown; alvo?: unknown;
  falhaCommitComRemocoes?: boolean; falhaLeitura?: boolean;
}) {
  const commits: Gancho[] = [];
  const simples: unknown[] = [];
  const alvo = { id: 'v-alvo', versionNum: 9, comment: 'x', content: opcoes.alvo ?? {} };
  const github: any = {
    branchProd: 'main',
    branchHomolog: 'homolog',
    modoLocal: false,
    async commitContent(content: unknown) { simples.push(content); return 'sha-simples'; },
    async commitComRemocoes(branch: string, _m: string, remover: string[], content?: unknown) {
      if (opcoes.falhaCommitComRemocoes) throw new Error('422 simulado');
      commits.push({ branch, remover, content });
      return 'sha-com-remocoes';
    },
    async lerContentDoBranch(branch: string) {
      if (opcoes.falhaLeitura) throw new Error('rede simulada');
      return branch === 'main' ? opcoes.jsonProd ?? {} : opcoes.jsonHomolog ?? {};
    },
    async listarNomesDeImagens(branch: string) {
      return branch === 'main' ? opcoes.arquivosProd ?? [] : opcoes.arquivosHomolog ?? [];
    },
  };
  const prisma: any = {
    contentVersion: {
      findUnique: async () => alvo,
      findFirst: async ({ where }: any) =>
        where.isCurrentProd ? { id: 'outra' } : { id: 'h', content: opcoes.homologAtual ?? {} },
      findMany: async () => (opcoes.recentes ?? []).map((content) => ({ content })),
      updateMany: async () => ({}),
      update: async () => ({ ok: true }),
    },
    $transaction: async (ops: unknown[]) => Promise.all(ops),
  };
  return { servico: new ContentService(prisma, github), commits, simples };
}

async function testePromote() {
  console.log('\npromote() com a limpeza');
  const alvo = { logos: [`/images/${velha('usada.png')}`] };
  const arquivos = [velha('usada.png'), velha('orfa.png'), velha('do-rascunho.png'), velha('na-v17.png')];
  const base = {
    arquivosProd: arquivos, arquivosHomolog: arquivos, alvo,
    homologAtual: { x: `/images/${velha('do-rascunho.png')}` },
    recentes: [{ y: `/images/${velha('na-v17.png')}` }],
  };

  // 1. SIMULAR (padrão): nada é apagado, o commit é o simples de sempre
  delete process.env.LIMPAR_IMAGENS;
  let t = montar(base);
  await t.servico.promote('v-alvo');
  ok(t.commits.length === 0 && t.simples.length === 1, 'modo simular: nada é apagado, só o commit simples do content.json');

  // 2. LIGADO: um commit na main (content + remoção) e um na homolog (só remoção)
  process.env.LIMPAR_IMAGENS = 'ligado';
  t = montar(base);
  await t.servico.promote('v-alvo');
  igual(t.commits.map((c) => [c.branch, c.remover, c.content !== undefined]),
    [['main', [velha('orfa.png')], true], ['homolog', [velha('orfa.png')], false]],
    'ligado: main recebe content+remoção num commit só; homolog recebe só a remoção');
  ok(t.simples.length === 0, 'ligado: não há commit simples extra na main');

  // 3. nada a apagar: commit simples, homolog intocada
  t = montar({ ...base, arquivosProd: [velha('usada.png')], arquivosHomolog: [velha('usada.png')] });
  await t.servico.promote('v-alvo');
  ok(t.commits.length === 0 && t.simples.length === 1, 'sem órfãs: promove com o commit simples, sem tocar na homolog');

  // 4. falha no commit com remoções: a promoção continua pelo commit simples
  t = montar({ ...base, falhaCommitComRemocoes: true });
  const r = await t.servico.promote('v-alvo');
  ok(!!r && t.simples.length === 1, 'commit com remoções falhou: promoção segue pelo commit simples');

  // 5. falha ao ler as branches: não apaga nada, promoção segue
  t = montar({ ...base, falhaLeitura: true });
  await t.servico.promote('v-alvo');
  ok(t.commits.length === 0 && t.simples.length === 1, 'falha ao ler o GitHub: não apaga nada e promove normalmente');

  // 6. conteúdo que não cita imagem alguma, mas há arquivos: aborta
  t = montar({ ...base, alvo: {}, homologAtual: {}, recentes: [], jsonProd: {}, jsonHomolog: {} });
  await t.servico.promote('v-alvo');
  ok(t.commits.length === 0, 'nenhum conteúdo cita imagem: aborta em vez de apagar tudo');

  // 7. desligado
  process.env.LIMPAR_IMAGENS = 'desligado';
  t = montar(base);
  await t.servico.promote('v-alvo');
  ok(t.commits.length === 0 && t.simples.length === 1, 'desligado: não lista nem apaga');

  // 8. imagem citada só pelo content.json real da main (corrigido à mão) fica
  process.env.LIMPAR_IMAGENS = 'ligado';
  t = montar({ ...base, jsonProd: { z: `/images/${velha('orfa.png')}` } });
  await t.servico.promote('v-alvo');
  ok(t.commits.length === 0, 'citada só no content.json real da main: fica');
  delete process.env.LIMPAR_IMAGENS;
}

(async () => {
  console.log('Limpeza de imagens órfãs ao promover');
  testeRegras();
  await testePromote();
  console.log(`\n${total - falhas}/${total} verificações passaram.`);
  process.exit(falhas > 0 ? 1 : 0);
})();

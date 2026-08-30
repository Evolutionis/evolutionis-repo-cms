import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { GithubService } from '../github/github.service';

type ContentMap = Record<string, unknown>; // { hero: {...}, sobre: {...}, ... }

/**
 * Dois ambientes:
 *
 *   homolog -> branch de homologação -> public_html/preview/  (o /preview do site)
 *   prod    -> branch de produção    -> public_html/          (o site que o cliente vê)
 *
 * Publicar mexe SÓ em homologação. Produção só muda por promoção explícita,
 * que republica o conteúdo já conferido no preview. É essa separação que
 * permite errar no preview sem o cliente ver.
 */
export type Ambiente = 'homolog' | 'prod';

const AMBIENTES: Ambiente[] = ['homolog', 'prod'];

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private github: GithubService,
  ) {}

  private valida(ambiente: string | undefined): Ambiente {
    const a = (ambiente || 'homolog') as Ambiente;
    if (!AMBIENTES.includes(a)) {
      throw new BadRequestException(`Ambiente inválido: ${ambiente}. Use homolog ou prod.`);
    }
    return a;
  }

  private versaoAtual(ambiente: Ambiente) {
    const where =
      ambiente === 'prod' ? { isCurrentProd: true } : { isCurrentHomolog: true };
    return this.prisma.contentVersion.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Conteúdo do ambiente pedido (homologação por padrão — é o que o painel edita).
   * Objeto vazio se aquele ambiente ainda não recebeu nada.
   */
  async getCurrent(
    ambiente?: string,
  ): Promise<{ content: ContentMap; versionNum: number | null; ambiente: Ambiente }> {
    const amb = this.valida(ambiente);
    const atual = await this.versaoAtual(amb);
    return {
      content: (atual?.content as ContentMap) ?? {},
      versionNum: atual?.versionNum ?? null,
      ambiente: amb,
    };
  }

  /**
   * Situação dos dois ambientes de uma vez — é o que o painel mostra antes de
   * deixar promover. `sincronizado` responde à única pergunta que importa:
   * o que está no ar em produção é o mesmo que foi conferido no preview?
   */
  async status() {
    const [homolog, prod] = await Promise.all([
      this.versaoAtual('homolog'),
      this.versaoAtual('prod'),
    ]);

    return {
      homolog: homolog && {
        id: homolog.id,
        versionNum: homolog.versionNum,
        comment: homolog.comment,
        createdAt: homolog.createdAt,
      },
      prod: prod && {
        id: prod.id,
        versionNum: prod.versionNum,
        comment: prod.comment,
        createdAt: prod.createdAt,
        promotedAt: prod.promotedAt,
      },
      sincronizado: !!homolog && homolog.id === prod?.id,
      branches: { homolog: this.github.branchHomolog, prod: this.github.branchProd },
    };
  }

  /**
   * Publica em HOMOLOGAÇÃO. Recebe as seções alteradas, mescla com o que já
   * está em homologação, grava uma nova versão e commita no branch de preview.
   * Produção não é tocada.
   */
  async publish(sections: ContentMap, comment: string | undefined, authorId: string) {
    const { content: atual } = await this.getCurrent('homolog');
    const mesclado: ContentMap = { ...atual, ...sections };
    return this.novaVersaoHomolog(mesclado, comment ?? 'Publicação via painel', authorId);
  }

  /**
   * Promove para PRODUÇÃO o conteúdo que está em homologação (ou o de uma
   * versão específica, para poder voltar a algo antigo sem passar de novo pelo
   * preview). Não cria versão nova: marca a MESMA versão como no ar em produção,
   * porque é literalmente o mesmo conteúdo — criar outra só duplicaria o
   * histórico sem nada ter mudado.
   */
  async promote(versionId?: string) {
    const alvo = versionId
      ? await this.prisma.contentVersion.findUnique({ where: { id: versionId } })
      : await this.versaoAtual('homolog');

    if (!alvo) {
      throw new NotFoundException(
        versionId ? 'Versão não encontrada' : 'Nada publicado em homologação para promover',
      );
    }

    const atualProd = await this.versaoAtual('prod');
    if (atualProd?.id === alvo.id) {
      throw new BadRequestException(`A v${alvo.versionNum} já está no ar em produção.`);
    }

    const sha = await this.github.commitContent(
      alvo.content,
      `Promove v${alvo.versionNum} para producao${alvo.comment ? `: ${alvo.comment}` : ''}`,
      this.github.branchProd,
    );

    // Desmarcar antes de marcar: o índice único parcial da migração recusa duas
    // versões marcadas ao mesmo tempo, então a ordem aqui não é decorativa.
    const [, promovida] = await this.prisma.$transaction([
      this.prisma.contentVersion.updateMany({
        where: { isCurrentProd: true },
        data: { isCurrentProd: false },
      }),
      this.prisma.contentVersion.update({
        where: { id: alvo.id },
        data: { isCurrentProd: true, deployShaProd: sha, promotedAt: new Date() },
      }),
    ]);

    return promovida;
  }

  /** Histórico (sem o conteúdo pesado, só metadados). */
  async listVersions() {
    return this.prisma.contentVersion.findMany({
      orderBy: { versionNum: 'desc' },
      select: {
        id: true,
        versionNum: true,
        comment: true,
        isCurrentHomolog: true,
        isCurrentProd: true,
        deploySha: true,
        deployShaProd: true,
        promotedAt: true,
        createdAt: true,
        author: { select: { username: true } },
      },
    });
  }

  /** Conteúdo completo de uma versão específica. */
  async getVersion(id: string) {
    const v = await this.prisma.contentVersion.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Versão não encontrada');
    return v;
  }

  /**
   * Rollback dentro de um ambiente. Em homologação grava uma versão nova com o
   * conteúdo antigo (o histórico continua linear). Em produção é uma promoção
   * da versão antiga — sem versão nova, pelo mesmo motivo do promote().
   */
  async rollback(versionId: string, authorId: string, ambiente?: string) {
    const amb = this.valida(ambiente);
    if (amb === 'prod') return this.promote(versionId);

    const alvo = await this.prisma.contentVersion.findUnique({ where: { id: versionId } });
    if (!alvo) throw new NotFoundException('Versão não encontrada');

    return this.novaVersaoHomolog(
      alvo.content as ContentMap,
      `Rollback para v${alvo.versionNum}`,
      authorId,
    );
  }

  /** Grava nova versão, commita no branch de homologação e marca como atual lá. */
  private async novaVersaoHomolog(content: ContentMap, message: string, authorId: string) {
    // 1. Commit no branch de preview -> Actions -> FTP em public_html/preview/
    const deploySha = await this.github.commitContent(
      content,
      message,
      this.github.branchHomolog,
    );

    // 2. Desmarca a anterior e cria a nova, na mesma transação
    const [, nova] = await this.prisma.$transaction([
      this.prisma.contentVersion.updateMany({
        where: { isCurrentHomolog: true },
        data: { isCurrentHomolog: false },
      }),
      this.prisma.contentVersion.create({
        data: {
          content: content as Prisma.InputJsonValue,
          comment: message,
          isCurrentHomolog: true,
          deploySha,
          authorId,
        },
      }),
    ]);

    return nova;
  }
}

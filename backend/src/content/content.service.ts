import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { GithubService } from '../github/github.service';

type ContentMap = Record<string, unknown>; // { hero: {...}, sobre: {...}, ... }

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private github: GithubService,
  ) {}

  /** Retorna o conteúdo da versão atual (ou objeto vazio se ainda não há nenhuma). */
  async getCurrent(): Promise<{ content: ContentMap; versionNum: number | null }> {
    const current = await this.prisma.contentVersion.findFirst({
      where: { isCurrent: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      content: (current?.content as ContentMap) ?? {},
      versionNum: current?.versionNum ?? null,
    };
  }

  /**
   * Publica uma alteração. Recebe APENAS as seções alteradas (patch parcial),
   * mescla com o conteúdo atual, grava uma nova versão e commita no GitHub.
   * Ex: body = { sections: { hero: { titulo: "Novo" } }, comment: "ajuste hero" }
   */
  async publish(
    sections: ContentMap,
    comment: string | undefined,
    authorId: string,
  ) {
    const { content: currentContent } = await this.getCurrent();

    // Merge raso por seção: substitui as seções enviadas, mantém o resto.
    const merged: ContentMap = { ...currentContent, ...sections };

    return this.commitNewVersion(merged, comment ?? 'Publicação via admin', authorId);
  }

  /** Lista o histórico de versões (sem o conteúdo pesado, só metadados). */
  async listVersions() {
    return this.prisma.contentVersion.findMany({
      orderBy: { versionNum: 'desc' },
      select: {
        id: true,
        versionNum: true,
        comment: true,
        isCurrent: true,
        deploySha: true,
        createdAt: true,
        author: { select: { username: true } },
      },
    });
  }

  /** Retorna o conteúdo completo de uma versão específica (para preview). */
  async getVersion(id: string) {
    const v = await this.prisma.contentVersion.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Versão não encontrada');
    return v;
  }

  /**
   * Rollback: promove o conteúdo de uma versão antiga como NOVA versão atual.
   * Nada é apagado — o histórico permanece linear e o rollback fica registrado.
   */
  async rollback(versionId: string, authorId: string) {
    const target = await this.prisma.contentVersion.findUnique({
      where: { id: versionId },
    });
    if (!target) throw new NotFoundException('Versão não encontrada');

    return this.commitNewVersion(
      target.content as ContentMap,
      `Rollback para v${target.versionNum}`,
      authorId,
    );
  }

  /** Núcleo: grava nova versão no banco, commita no GitHub, marca como atual. */
  private async commitNewVersion(
    content: ContentMap,
    message: string,
    authorId: string,
  ) {
    // 1. Commita no GitHub -> dispara o Actions -> deploy FTP Locaweb
    const deploySha = await this.github.commitContent(content, message);

    // 2. Transação: desmarca a atual e cria a nova como atual
    const [, novaVersao] = await this.prisma.$transaction([
      this.prisma.contentVersion.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      }),
      this.prisma.contentVersion.create({
        data: {
          content: content as Prisma.InputJsonValue,
          comment: message,
          isCurrent: true,
          deploySha,
          authorId,
        },
      }),
    ]);

    return novaVersao;
  }
}

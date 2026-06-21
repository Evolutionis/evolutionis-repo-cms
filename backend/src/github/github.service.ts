import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Commita o content.json no repositório via GitHub Contents API.
 * Cada commit no branch principal dispara o workflow de deploy (deploy.yml),
 * que builda o site e envia por FTP pra Locaweb.
 *
 * Variáveis de ambiente (configurar no Railway):
 *   GITHUB_TOKEN  - Personal Access Token (fine-grained) com permissão Contents: Read & Write
 *   GITHUB_OWNER  - dono do repo (seu usuário ou org), ex: "fernando"
 *   GITHUB_REPO   - nome do repo, ex: "projeto-agencianovaera"
 *   GITHUB_BRANCH - branch alvo (default: "main")
 *   CONTENT_PATH  - caminho do arquivo no repo (default: "content.json")
 */
@Injectable()
export class GithubService {
  private readonly owner = process.env.GITHUB_OWNER!;
  private readonly repo = process.env.GITHUB_REPO!;
  private readonly branch = process.env.GITHUB_BRANCH || 'main';
  private readonly path = process.env.CONTENT_PATH || 'public/content.json';
  private readonly token = process.env.GITHUB_TOKEN!;
  private readonly api = 'https://api.github.com';

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    };
  }

  /** Busca o SHA atual do arquivo (necessário para atualizar um arquivo existente). */
  private async getCurrentSha(): Promise<string | undefined> {
    const url = `${this.api}/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(
      this.path,
    )}?ref=${this.branch}`;
    const res = await fetch(url, { headers: this.headers() });
    if (res.status === 404) return undefined; // arquivo ainda não existe
    if (!res.ok) {
      throw new InternalServerErrorException(
        `GitHub getContent falhou: ${res.status} ${await res.text()}`,
      );
    }
    const data = await res.json();
    return data.sha;
  }

  /**
   * Cria/atualiza o content.json com o conteúdo dado.
   * Retorna o SHA do commit gerado (para registrar no banco como deploySha).
   */
  async commitContent(content: unknown, message: string): Promise<string> {
    const localSitePath = process.env.LOCAL_SITE_PATH;
    if (localSitePath) {
      const fullPath = path.join(localSitePath, this.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf-8');
      return `local-sha-${Date.now()}`;
    }

    const sha = await this.getCurrentSha();
    const url = `${this.api}/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(
      this.path,
    )}`;

    const body = {
      message,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      branch: this.branch,
      ...(sha ? { sha } : {}),
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new InternalServerErrorException(
        `GitHub commit falhou: ${res.status} ${await res.text()}`,
      );
    }

    const data = await res.json();
    return data.commit?.sha ?? '';
  }

  /**
   * Commita um arquivo de imagem no repo do site (pasta de imagens).
   * Recebe o conteúdo já em base64. Retorna o caminho relativo onde a imagem
   * ficará servida no site (para guardar como URL no content.json).
   *
   * IMAGE_DIR  - pasta no repo onde as imagens vão (default: "public/images")
   * IMAGE_PUBLIC_PREFIX - prefixo da URL pública no site (default: "/images")
   */
  async commitImage(
    fileName: string,
    base64Content: string,
    message: string,
  ): Promise<{ path: string; publicUrl: string }> {
    const dir = process.env.IMAGE_DIR || 'public/images';
    const publicPrefix = process.env.IMAGE_PUBLIC_PREFIX || '/images';

    // Sanitiza o nome e adiciona timestamp pra evitar colisão/cache
    const safe = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/-+/g, '-');
    const finalName = `${Date.now()}-${safe}`;
    const repoPath = `${dir}/${finalName}`;

    const localSitePath = process.env.LOCAL_SITE_PATH;
    if (localSitePath) {
      const fullPath = path.join(localSitePath, repoPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, Buffer.from(base64Content, 'base64'));
      return { path: repoPath, publicUrl: `${publicPrefix}/${finalName}` };
    }

    const url = `${this.api}/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(
      repoPath,
    )}`;

    // Imagem é arquivo novo: não precisa de sha anterior.
    const body = {
      message,
      content: base64Content, // já em base64, sem o prefixo data:
      branch: this.branch,
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new InternalServerErrorException(
        `GitHub upload de imagem falhou: ${res.status} ${await res.text()}`,
      );
    }

    return { path: repoPath, publicUrl: `${publicPrefix}/${finalName}` };
  }

  /** Lista as imagens já enviadas (lê o diretório de imagens do repo). */
  async listImages(): Promise<{ name: string; publicUrl: string }[]> {
    const dir = process.env.IMAGE_DIR || 'public/images';
    const publicPrefix = process.env.IMAGE_PUBLIC_PREFIX || '/images';

    const localSitePath = process.env.LOCAL_SITE_PATH;
    if (localSitePath) {
      const fullPath = path.join(localSitePath, dir);
      if (!fs.existsSync(fullPath)) return [];
      const files = fs.readdirSync(fullPath);
      return files
        .filter(f => fs.statSync(path.join(fullPath, f)).isFile())
        .map(f => ({ name: f, publicUrl: `${publicPrefix}/${f}` }));
    }
    const url = `${this.api}/repos/${this.owner}/${this.repo}/contents/${encodeURIComponent(
      dir,
    )}?ref=${this.branch}`;

    const res = await fetch(url, { headers: this.headers() });
    if (res.status === 404) return []; // pasta ainda não existe
    if (!res.ok) {
      throw new InternalServerErrorException(
        `GitHub listImages falhou: ${res.status} ${await res.text()}`,
      );
    }
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .filter((f: any) => f.type === 'file')
      .map((f: any) => ({ name: f.name, publicUrl: `${publicPrefix}/${f.name}` }));
  }
}

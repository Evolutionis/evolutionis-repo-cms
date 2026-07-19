import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    let url = process.env.DATABASE_URL;
    if (url && !url.includes('connection_limit')) {
      url = url.includes('?') ? `${url}&connection_limit=3` : `${url}?connection_limit=3`;
    }
    
    super(url ? {
      datasources: {
        db: { url },
      },
    } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    // Non-blocking connection warm-up so server starts immediately and Prisma connects on demand
    this.$connect().catch((err: any) => {
      console.warn('Prisma background connection warm-up notice:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

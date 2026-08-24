import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    // Prisma 7 não conecta mais direto via DATABASE_URL: exige um driver
    // adapter explícito. Trocar de provider (ex.: MySQL) implica trocar
    // este adapter também — ver prisma/schema.prisma.
    super({
      adapter: new PrismaPg({
        connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

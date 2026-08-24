import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Importado uma única vez em AppModule. Não redeclarar PrismaService como
 * provider em cada módulo de feature — ver AS-IS-api.md seção 1.4 (o
 * legado marca este módulo como @Global() mas nunca o importa em
 * AppModule, e cada módulo redeclara PrismaService por conta própria).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

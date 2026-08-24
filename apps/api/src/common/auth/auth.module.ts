import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

/**
 * Infraestrutura de autenticação JWT (guard global + strategy + emissão de
 * token). Não inclui um AuthController de login: o fluxo de login depende
 * do schema de domínio (users/companies), que ainda não existe — ver
 * prisma/schema.prisma e PROGRESS.md ("Bloqueado por"). Quando o schema
 * chegar, um AuthController novo injeta JwtService (exportado aqui) para
 * assinar o token de login.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // `expiresIn` do jsonwebtoken só tipa literais conhecidos (`StringValue`);
          // aqui vem de env var, então o valor é validado em runtime por
          // envValidationSchema, não pelo compilador.
          expiresIn: configService.getOrThrow<string>(
            'JWT_EXPIRES_IN',
          ) as unknown as number,
        },
      }),
    }),
  ],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [JwtModule],
})
export class AuthModule {}

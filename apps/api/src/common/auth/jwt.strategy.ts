import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from './jwt-payload.interface';

/**
 * Ao contrário do legado (ver AS-IS-api.md, seção 3.1), o guard delega de
 * verdade para esta strategy via Passport — não há segunda checagem manual
 * de token no guard.
 *
 * `validate()` hoje só repassa o payload assinado (não consulta uma tabela
 * de usuário, porque ela ainda não existe). Quando o schema de domínio
 * nascer do TO-BE, trocar por uma consulta real via PrismaService e manter
 * a mesma assinatura de retorno.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return payload;
  }
}

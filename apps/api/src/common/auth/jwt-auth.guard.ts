import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global (registrado via APP_GUARD em AppModule) — protege toda rota por
 * padrão, com opt-out via @Public(). Delega para AuthGuard('jwt')/
 * JwtStrategy de verdade (super.canActivate), diferente do legado, que
 * reimplementava a validação manualmente e deixava a JwtStrategy
 * registrada mas sem efeito (ver AS-IS-api.md, seção 3.1).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

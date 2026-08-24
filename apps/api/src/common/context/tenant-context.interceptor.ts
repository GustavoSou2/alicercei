import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { TenantContextService } from './tenant-context.service';

/**
 * Registrado como APP_INTERCEPTOR (depois do JwtAuthGuard global) — roda
 * após a autenticação, então `request.user` já está populado quando
 * existe. Envolve o handler inteiro (controller + services) no contexto
 * de tenant, para que qualquer service leia `TenantContextService.
 * getCompanyId()` em vez de receber `companyId` manualmente do controller.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const companyId = request.user?.companyId;

    if (!companyId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.tenantContext.run({ companyId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}

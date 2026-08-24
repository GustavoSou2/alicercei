import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  companyId: string;
}

/**
 * Ponto único de acesso ao company_id do request atual. Substitui o
 * padrão do legado de passar/filtrar `company_id` manualmente em cada
 * service (ver AS-IS-api.md, seção 3.5) — os services de domínio devem ler
 * o tenant daqui, nunca receber `companyId` cru do controller.
 *
 * Populado por TenantContextMiddleware a partir de `request.user`, depois
 * que o JwtAuthGuard já validou o token.
 */
@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  run<T>(store: TenantStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  getCompanyId(): string {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error(
        'TenantContextService.getCompanyId() chamado fora de um request autenticado.',
      );
    }
    return store.companyId;
  }
}

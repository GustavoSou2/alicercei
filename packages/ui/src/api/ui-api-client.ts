import { InjectionToken } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

/**
 * TableDataSource e SelectComponent (legado: `table.component.ts`,
 * `select.component.ts`) chamavam `ApiService` (`core/api/api.service.ts`)
 * direto, um serviço concreto do app consumidor. Um pacote de design
 * system não deve depender de uma classe concreta de um app específico —
 * por isso a dependência vira este token: cada app consumidor provê sua
 * própria implementação (`{ provide: UI_API_CLIENT, useExisting:
 * ApiService }`), mantendo o comportamento de busca via API do legado sem
 * acoplar @alicercei/ui a um `ApiService`/`environment` de um app só.
 */
export interface UiApiClient {
  get<T>(endpoint: string, params?: HttpParams): Observable<T>;
  post<T>(endpoint: string, data?: unknown): Observable<T>;
  put<T>(endpoint: string, data?: unknown): Observable<T>;
  delete<T>(endpoint: string): Observable<T>;
}

export const UI_API_CLIENT = new InjectionToken<UiApiClient>("UI_API_CLIENT");

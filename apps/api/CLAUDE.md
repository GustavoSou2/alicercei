# CLAUDE.md — apps/api

Stack: NestJS 11.x + Prisma 7 (driver adapter `@prisma/adapter-pg`,
Postgres — ver DECISIONS.md sobre a escolha do banco, ainda uma suposição
a confirmar).

## Convenções não-negociáveis (não herdar os débitos do legado)

Ver `legado/AS-IS-api.md` para o detalhamento de cada achado abaixo.

- `ValidationPipe({ whitelist: true })` global (`src/main.ts`) — todo DTO
  novo usa `class-validator`. O legado não tinha nenhuma validação de
  payload; não repetir.
- `AllExceptionsFilter` global (`src/common/filters/all-exceptions.filter.ts`)
  — nunca usar `catch { throw new BadRequestException(\`Erro: ${error}\`) }`.
  Exceções HTTP conhecidas mantêm status/mensagem; qualquer outra vira 500
  genérico ao cliente, com o erro real só no log do servidor.
- Segredo (`JWT_SECRET`, qualquer chave de criptografia) só via variável de
  ambiente, validada em `src/config/env.validation.ts` — sem fallback
  hardcoded. Se faltar, a aplicação falha ao subir. Não copiar o padrão do
  legado (secret hardcoded repetido em 5+ arquivos).
- CORS restrito a `ALLOWED_ORIGINS` (env, lista separada por vírgula) —
  nunca `origin: "*"`.
- Upload de arquivo (quando existir) não usa base64 em coluna de banco —
  planejar para object storage desde o início.

## PrismaModule

`src/prisma/prisma.module.ts` é `@Global()` e é importado **uma única vez**
em `AppModule`. Nunca redeclarar `PrismaService` como provider em outro
módulo — é assim que o legado fazia (mesmo marcando `@Global()`) e o AS-IS
aponta isso como achado a corrigir.

`PrismaService` recebe um driver adapter no construtor (Prisma 7 não
conecta mais só a partir de `DATABASE_URL` — ver DECISIONS.md). Trocar de
banco implica trocar o adapter (`@prisma/adapter-pg` → equivalente do novo
provider) e o `provider` em `prisma/schema.prisma`.

## Autenticação e multi-tenancy

- `src/common/auth/` — `JwtAuthGuard` (global via `APP_GUARD`, opt-out com
  `@Public()`) delega de verdade para `JwtStrategy`/Passport. Não
  reimplementar validação manual de token no guard (era o bug do legado).
- `JwtStrategy.validate()` hoje só repassa o payload assinado — não
  consulta uma tabela `users` porque ela ainda não existe (schema de
  domínio pendente, ver CLAUDE.md da raiz). Quando o schema chegar, trocar
  por uma consulta real via `PrismaService`.
- Multi-tenancy: nunca filtrar `company_id` manualmente em cada service.
  Usar `TenantContextService.getCompanyId()`
  (`src/common/context/tenant-context.service.ts`), populado pelo
  `TenantContextInterceptor` global a partir de `request.user.companyId`
  depois que o guard já autenticou. Um novo service de domínio lê o tenant
  daqui, nunca recebe `companyId` cru do controller.

## Multi-tenancy e "status configurável por empresa" — pendentes de schema

`prisma/schema.prisma` está vazio de propósito (só `datasource`/
`generator`). Não inventar entidades de domínio (`companies`, `users`,
tabela de status por empresa) — isso nasce do TO-BE validado com o caso
fundador. Ver PROGRESS.md, "Bloqueado por".

## Regra de processamento pesado

Qualquer operação de I/O longo ou processamento em lote vai para
fila/job assíncrono — não bloqueia a resposta do request. (Ainda não há
fila configurada; ao introduzir a primeira, documentar aqui qual foi
escolhida e por quê, em DECISIONS.md.)

## Rodando localmente

```bash
cp .env.example .env   # preencher DATABASE_URL/JWT_SECRET reais
npm install
npm run start:dev --workspace=apps/api
```

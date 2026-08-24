# Progresso — Alicercei

## Fase atual
setup (PLANO-EXECUCAO.md concluído até onde o schema de domínio permite)

## Feito
Todos os passos do PLANO-EXECUCAO.md que não dependem do schema de
domínio (bloqueado — ver abaixo) estão concluídos e **verificados
rodando** (build/lint/test reais, não só leitura de código):

- **Passo 0** — AS-IS-api.md, AS-IS-web.md, README.md lidos.
- **Passo 1** — `apps/web` (Angular 22.1.x) e `apps/api` (NestJS,
  fixado `^11.2`) criados com os CLIs oficiais.
- **Passo 2** — `packages/config/{eslint,typescript,prettier}`;
  `package.json` raiz com workspaces + scripts `dev:web`/`dev:api`/
  `build:web`/`build:api` (testados rodando da raiz); `apps/web` e
  `apps/api` estendem `packages/config/typescript/base.json`
  (`strict: true`).
- **Passo 3/3.1** — `packages/ui` com `paths` mapeado em
  `apps/web/tsconfig.json` (`@alicercei/ui` → `packages/ui/src/index.ts`),
  testado com um import real + `ng build`.
- **Passo 4.1 (API)** — guard JWT global (delega de verdade para
  Passport, ao contrário do legado), `PrismaModule` `@Global()` importado
  uma vez, multi-tenancy centralizada via `AsyncLocalStorage`
  (`TenantContextService`/`Interceptor`), `ValidationPipe`/
  `AllExceptionsFilter` globais, CORS restrito, env com fail-fast (sem
  fallback hardcoded — testado forçando `JWT_SECRET` vazio), bcrypt.
  Schema Prisma **intencionalmente vazio** (ver bloqueio). Prisma 7 com
  driver adapter (`@prisma/adapter-pg`, Postgres — confirmado com o
  usuário).
- **Passo 4.2 (Web)** — 18 itens extraídos para `packages/ui/src`
  (avatar, button, calendar, confirmation-dialog, dialog, dynamic-tabs,
  input+máscaras BR, loader, select, skeleton-loader, table,
  textarea-custom, toast, uploader, + `api/ui-api-client.ts` novo). Fix
  do vazamento de domínio em `TableDataSource` (removido
  `ActionPlanStatus`, `getAvailableActions()` generalizado). Verificado
  com `tsc` real contra `@angular/*` E com `ng build` de `apps/web` de
  verdade — isso revelou e corrigiu 2 bugs que só um compilador Angular
  real pega (não `tsc` puro): `handleAction(action)` passando o objeto
  inteiro em vez de `action.type`, e tipo de retorno de
  `getAvailableActions()` sem o campo `disabled`.
- **Passo 5 (Tailwind)** — Tailwind v4 (config-free, como o legado já
  usa — não `tailwind.config.ts`), tokens de cor/fonte portados de
  `_colors.global.scss`/`_fontes.global.scss`, `@source` apontando para
  `packages/ui/src` (testado: classe usada só ali sobrevive ao build de
  produção). Tema do Angular Material também portado (necessário para
  `MatDialog`/`MatTooltip` usados por componentes já extraídos).
- **Passo 6 (Ícones)** — identificado que o legado usa pasta própria de
  SVGs (não MatIcon/lib de terceiro). Copiados os 2 ícones que
  `packages/ui` referencia direto no template (`Export.svg`, `Info.svg`),
  com `angular.json` configurado para servi-los em `./icons/*.svg`
  (testado no output do build). Convenção documentada em
  `apps/web/CLAUDE.md` — os outros ~113 ícones do legado só entram quando
  uma tela real precisar.
- **CLAUDE.md** — raiz, `apps/api`, `apps/web` — todos os três criados.
- **DECISIONS.md** — log completo de todas as decisões acima (inclusive
  as que exigiram sair do que o texto literal do plano previa, como
  Tailwind v4 em vez de `tailwind.config.ts`, e Prisma 7 exigindo driver
  adapter).
- **Infra local (Docker)** — `apps/api/Dockerfile` (multi-stage,
  Node 24-alpine), `apps/web/Dockerfile` (multi-stage → `nginx:1.27-alpine`)
  + `apps/web/nginx.conf`, `infra/docker-compose.yml` (postgres + api +
  web) e `infra/.env.example` criados. Caminho de build de `apps/web`
  (`dist/web/browser`) conferido rodando o build de verdade — bate com o
  `COPY` já escrito no Dockerfile. `docker compose --env-file .env config`
  validado sem erro (containers não subidos). `.dockerignore` na raiz do
  monorepo.
- **Deploy Vercel (apps/web)** — `apps/web/vercel.json` criado
  (`buildCommand` customizado subindo até a raiz do monorepo,
  `outputDirectory: "dist/web/browser"`, conferido contra o build real).
  **Pendente de ação manual, fora do código**: habilitar no painel da
  Vercel (Settings → Build and Deployment) a opção "Include source files
  outside of the Root Directory in the Build Step" — sem isso o build na
  Vercel falha porque `packages/ui`/`packages/config` ficam fora do
  Root Directory (`apps/web`). Ver DECISIONS.md.

## Em andamento
Nenhum passo do plano em execução ativa. O que resta é bloqueado (abaixo)
ou é trabalho de feature (fora do escopo de "setup").

## Bloqueado por

**Entrevista de AS-IS real com o pai do usuário** (define o schema de
domínio de Orçamento/Execução antes de implementar a lógica de negócio).
Isso trava, especificamente:
- `apps/api/prisma/schema.prisma` continua sem nenhum model.
- Não existe `AuthController` de login real (a `JwtStrategy` valida
  assinatura de token, mas não consulta uma tabela `users` que ainda não
  existe).
- Nenhuma tela de domínio em `apps/web` (só o design system está lá).

Os dois bloqueios anteriores já foram resolvidos nesta sessão, com
autorização explícita do usuário:
- Node atualizado para 24.19.0 (LTS) via `nvm-windows` — ver DECISIONS.md.
- Banco de dados confirmado como Postgres (não MySQL) — ver DECISIONS.md.

## Próximo passo

A entrevista de AS-IS com o caso fundador (pai do usuário, gesseiro
autônomo) — sem ela, o próximo trabalho de verdade (schema Prisma,
`AuthController`, primeira tela) não tem em cima do que ser desenhado sem
reinventar suposições de domínio que o próprio plano pede para evitar.

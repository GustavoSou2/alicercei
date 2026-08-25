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
- Resposta HTTP nunca trafega campo que o cliente não pediu — nunca
  `return` da entidade Prisma crua num endpoint; usar DTO de saída
  explícito (`class-transformer` `@Exclude()`/`plainToInstance`, ou um
  `select`/mapeamento manual listando os campos permitidos). É o único
  jeito confiável de um campo novo no schema (hash de senha, campo
  interno) não vazar por padrão.
- Logs nunca contêm senha, token (JWT ou de reset), dado de pagamento, ou
  documento pessoal completo (CPF/CNPJ) — nem em nível `debug`. Payload
  que precise ser logado para diagnóstico é mascarado (`***`) nesses
  campos antes, nunca logado como objeto bruto de request/response.
- Rate limiting por IP e/ou usuário em endpoints sensíveis (login, criação
  de recurso) — `429 Too Many Requests` com header `Retry-After`. Usar
  `@nestjs/throttler` (padrão do ecossistema Nest) quando esses endpoints
  existirem; não precisa em toda rota, só nas expostas a força-bruta ou
  abuso de criação em massa.
- Menor privilégio: cada rota/service acessa só o que a própria operação
  precisa. A credencial de banco (`DATABASE_URL`) usada pela API em
  produção não tem permissão de `DROP`/`TRUNCATE` — `GRANT` explícito
  (`SELECT`/`INSERT`/`UPDATE`/`DELETE`) num role de aplicação, nunca o
  superusuário de criação do banco. Container da API não roda como
  `root` (`USER` não-privilegiado no Dockerfile) — **pendente hoje**:
  `apps/api/Dockerfile` ainda não define `USER`, ver PROGRESS.md.

## Erros e resposta — padrão exigido vs. formato já implementado

**Padrão exigido a partir de agora:** toda resposta de erro segue Problem
Details (RFC 7807) — campos `type`, `title`, `status`, `detail`,
`instance`.

**Conflito com o que já está em produção de código, não alterado nesta
edição:** `AllExceptionsFilter`
(`src/common/filters/all-exceptions.filter.ts`) hoje retorna `{
statusCode, message, error, path, timestamp }` — o formato default do
Nest, não Problem Details. Esse filtro é o mesmo já registrado em
`DECISIONS.md` como a correção do débito de segurança do legado (não
vazar erro cru); mudar o formato da resposta é uma mudança de contrato de
API. Não alterei o filtro nem essa decisão — como ainda não há nenhum
client real dependendo do formato atual (schema de domínio ainda vazio),
este é o momento mais barato para migrar, mas a escolha de migrar agora
ou manter o formato atual fica para você.

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
- Validação de role/permissão sempre no backend — a claim `role` no JWT é
  atalho de UX, não fonte de verdade. Para qualquer ação sensível (alterar
  dado de outro usuário, aprovar, excluir, mudar papel de alguém),
  revalidar o papel consultando o banco no momento da ação, porque o JWT
  pode estar desatualizado se o papel mudou depois de emitido.
- Toda checagem de permissão inclui o `companyId` do **recurso** sendo
  acessado, não só o papel do usuário — um `admin` da empresa A não age
  sobre um recurso da empresa B só por ser admin.
- Toda query Prisma que lê/escreve dado de domínio filtra por
  `companyId`. Hoje isso é manual em cada service — ler
  `TenantContextService.getCompanyId()` e passar em `where: { companyId,
  ... }` explicitamente, porque o interceptor centraliza o valor mas
  **não** injeta o filtro sozinho ainda. Migrar para uma Prisma Client
  Extension que injeta esse filtro automaticamente em todo
  `findMany`/`findFirst`/`update`/`delete` é o próximo passo assim que
  existir ao menos uma tabela com `companyId` — já era o plano descrito na
  decisão de multi-tenancy centralizada (ver DECISIONS.md); até lá,
  filtrar manualmente em cada service não é opcional.
- Buscar recurso por id sempre filtra também por `companyId` do usuário
  autenticado na mesma query (`where: { id, companyId }`, nunca `where: {
  id }` seguido de um `if` de permissão depois). Se não bater — recurso
  não existe OU pertence a outro tenant — retorna **404**, nunca 403 (403
  revelaria que o recurso existe em outro tenant).

## Banco de dados e performance de query

- Toda coluna usada com frequência em `WHERE`/`JOIN` tem índice —
  especialmente `companyId` (tenant) e toda foreign key. **Atenção
  Postgres**: diferente do MySQL, o Postgres não cria índice automático
  em coluna de foreign key — cada relação no `schema.prisma` precisa de
  `@@index([nomeDaColunaFk])` explícito (ou composto com outro filtro
  frequente, ex.: `@@index([companyId, status])`).
- Nunca fazer query dentro de loop (N+1). Usar `select`/`include` do
  Prisma de forma deliberada para trazer a relação numa única query, ou
  agrupar buscas relacionadas com `findMany` + `where: { id: { in: [...]
  } }` quando `include` não servir.
- Operação que grava em mais de uma tabela relacionada usa
  `prisma.$transaction([...])` (ou a forma interativa, `$transaction(async
  (tx) => {...})`, quando uma escrita depende do resultado da anterior) —
  nunca deixa estado parcialmente escrito se uma escrita no meio falhar.
- Onde consistência eventual for aceitável (contador agregado, cache,
  projeção de leitura), documentar explicitamente — comentário no
  código e entrada em `DECISIONS.md` — que a defasagem é intencional e
  qual o tempo máximo aceitável, para não ser confundida depois com bug
  de sincronização.

## Multi-tenancy e "status configurável por empresa" — pendentes de schema

`prisma/schema.prisma` está vazio de propósito (só `datasource`/
`generator`). Não inventar entidades de domínio (`companies`, `users`,
tabela de status por empresa) — isso nasce do TO-BE validado com o caso
fundador. Ver PROGRESS.md, "Bloqueado por".

**Princípio geral, independente de a entidade existir ainda:** todo campo
de status com ciclo de vida (empresa, projeto, orçamento, etc.) nasce com
valor inicial explícito, definido em enum/tabela — nunca `null` nem
ausência de status representando "recém-criado". Isso vale para qualquer
entidade futura, mas **a existência de uma entidade `Company`/`Tenant`
própria — mesmo a v1 sendo usuário único — é uma pergunta em aberto,
registrada em `PROGRESS.md`; não decidir isso aqui nem no schema antes da
resposta.** O isolamento por `companyId` nas queries (seção acima) já é
exigido desde já, independente dessa resposta.

## Escalabilidade e processamento assíncrono

**Stateless:** `apps/api` não guarda estado em memória entre requests que
impeça rodar múltiplas réplicas (nada de `Map`/array em nível de módulo
usado como cache ou fila improvisada, nenhum contador em variável de
módulo). `TenantContextService` usa `AsyncLocalStorage` — é estado
por-request, não estado compartilhado entre requests/réplicas, então não
viola isso. Algo que precise sobreviver entre requests vai para Postgres
ou um store externo (Redis, quando existir), nunca em memória do
processo Node.

**Quando usar fila em vez de processar inline:** antes de implementar
qualquer endpoint, avaliar se a operação é I/O-bound longa (chamada a
serviço externo lenta), processamento em lote, ou não crítica para a
resposta imediata do usuário. Se qualquer uma das três, vai para fila/job
assíncrono (ex.: BullMQ) — nunca bloqueia a resposta HTTP principal.
Exemplos concretos: geração de PDF, envio de notificação, qualquer
chamada a serviço terceiro não essencial ao corpo da resposta. (Ainda não
há fila configurada; ao introduzir a primeira, documentar aqui qual foi
escolhida e por quê, em DECISIONS.md.)

**Workers concorrentes:** qualquer fila/job introduzida suporta múltiplos
workers processando em paralelo sem duplicar efeito — usar o mecanismo de
concorrência da própria fila (ex.: `concurrency` do BullMQ) em vez de
dedup em memória do processo, que quebra com mais de uma réplica.

**Chamada a serviço externo** (PDF, notificação, gateway de pagamento
etc.) sempre com timeout explícito e circuito que para de tentar depois
de falhas repetidas — N falhas consecutivas abrem o circuito por um tempo
fixo antes de tentar de novo (biblioteca tipo `cockatiel`/`opossum`, ou
implementação própria simples), para não travar fila/worker numa cascata
de retry contra um serviço fora do ar.

## Paginação

Toda rota de listagem usa paginação cursor-based (`?cursor=<id-ou-token
opaco>&limit=N`), não `offset`/`limit` de página numerada — cursor evita
resultado duplicado/pulado quando linhas são inseridas/removidas entre
páginas (comum em listagem de projeto/orçamento que muda com frequência).
`packages/ui` (`TableDataSourceService`/`UI_API_CLIENT`) não assume um
formato específico de paginação — o parâmetro é um `HttpParams` genérico
— então adotar cursor na API não exige mudar o design system.

## Cache

Cache só em dado que tolera alguma defasagem (ex.: contador agregado de
dashboard — não o saldo exato de um orçamento recém-editado). Toda
escrita que muda o dado invalida explicitamente a chave de cache
correspondente no mesmo fluxo da escrita — nunca depender só de TTL.
(Nenhum cache implementado ainda; ao introduzir o primeiro, documentar em
DECISIONS.md qual store foi escolhido — cache em memória do processo é
inválido pelo requisito de stateless acima assim que houver mais de uma
réplica.)

## Idempotência

Endpoint de criação que pode ser re-tentado pelo cliente (timeout de
rede, retry automático do frontend) aceita uma chave de idempotência
(header `Idempotency-Key`, gerada pelo cliente) — a API guarda o
resultado da primeira execução associado à chave e devolve a mesma
resposta em vez de duplicar o recurso numa segunda tentativa com a mesma
chave. Não precisa em toda rota `POST` — só nas que criam um recurso que
seria um problema real duplicar (ex.: criar orçamento, não um `POST` de
log/telemetria).

## Identificadores públicos

Recurso voltado a exibição/compartilhamento fora do sistema (ex.: link de
orçamento enviado ao cliente) usa um slug legível na URL — nunca o UUID
cru nem um id sequencial de banco no link público (id sequencial permite
enumerar registros de outro tenant; UUID cru não é legível/profissional
num link mandado pro cliente). O id interno continua sendo a chave
primária normalmente — o slug é só a identidade pública, gerado uma vez
na criação do recurso.

## Nomenclatura

Nome de variável, função, tabela e coluna descreve intenção por extenso —
sem abreviação obscura (`qtd`, `vlr`, `dt`: não; `quantity`/`amount`/
`date`, ou os equivalentes em português por extenso: sim). **Idioma do
schema: inglês**, para tabela/coluna/entidade — consistente com o que o
código já usa hoje (`companyId`, `TenantContextService`, `JWT_SECRET`,
`envValidationSchema`) e com o legado (`projects`, `budgets`,
`company_id`). Não misturar (`orcamentos` numa tabela e `budgets` na
vizinha). Rota/DTO exposto na API pode usar vocabulário de domínio em
português quando fizer sentido pro produto — decisão de produto, não de
nomenclatura técnica; a consistência de idioma exigida aqui é sobre
schema/código interno, não sobre texto voltado ao usuário.

## Feature flags

Mecanismo simples para ligar/desligar uma funcionalidade sem novo deploy
— hoje, uma variável de ambiente booleana lida via `ConfigService`
(seguindo o padrão de `env.validation.ts`) já resolve; uma tabela de
flags só se precisar mudar em runtime sem redeploy nem restart. Usar para
funcionalidade arriscada ou em teste (ex.: uma reprecificação automática
ainda não validada com o caso fundador) — não é obrigatório criar uma
flag para toda feature trivial.

## Responsabilidade única

Se a descrição do que uma função/service faz precisa de "e" no meio
("busca o orçamento **e** envia notificação", "valida **e** persiste **e**
dispara o PDF"), considerar dividir em duas — cada uma testável e
reaproveitável isoladamente.

## Rodando localmente

```bash
cp .env.example .env   # preencher DATABASE_URL/JWT_SECRET reais
npm install
npm run start:dev --workspace=apps/api
```

# 00b — Autenticação e múltiplos usuários

Origem: decisão consciente do responsável pelo projeto — não do
`alicercei-to-be.md`, que registrava a existência de um segundo usuário
como "decisão em aberto, não resolvida ainda" (seção 5) e a v1 como
"usuário único (sem tela de login)" até essa pergunta ser respondida. Essa
pergunta foi respondida: a v1 nasce com registro de usuário, login e
suporte a múltiplos usuários por empresa. Ver `DECISIONS.md`,
"Autenticação completa com múltiplos usuários decidida para a v1".

## Objetivo

Um usuário se registra, faz login, e — quando for o caso (ex.: o caso
fundador tem uma segunda pessoa, o filho, formalizando orçamento) — um
segundo usuário se junta à mesma empresa, todos com acesso igual aos
dados daquela empresa.

## Critério de sucesso mensurável

- Um usuário novo se registra informando nome, e-mail, senha, e cria uma
  empresa nova (`companyName`) ou se junta a uma existente
  (`companyJoinCode`) — e recebe um token válido na própria resposta do
  registro, sem precisar de um segundo passo de login imediatamente
  depois.
- Um usuário já registrado loga com e-mail+senha e recebe um token que a
  `TenantContextService` (via `JwtStrategy`) resolve para o `companyId`
  correto em qualquer rota protegida subsequente, sem consulta extra ao
  banco a cada request.
- Dois usuários da mesma empresa (ex.: pai + filho) acessam exatamente os
  mesmos dados de domínio (mesmos projetos/orçamentos) — nenhuma
  diferença de permissão entre eles.
- Tentativa de registro com e-mail já cadastrado, ou login com credencial
  inválida, nunca cria usuário nem emite token — só retorna erro.

## Decisões já tomadas (não reabrir)

- Modelos `Company` e `User` existem desde já como entidades separadas
  — spec 00 (schema), atualizada por causa desta decisão. A v1 tem, na
  prática, uma única empresa real (o caso fundador), mas o isolamento por
  `companyId` já exigido em toda query (`apps/api/CLAUDE.md`,
  "Autenticação e multi-tenancy") depende de `Company` existir como
  entidade própria — não de uma suposição de "usuário único" codificada
  no schema.
- **Papéis granulares/permissões finas ficam fora da v1**: todo usuário
  registrado tem acesso completo aos dados da própria empresa, a menos
  que o TO-BE diga o contrário no futuro. Não existe distinção
  admin/membro nesta spec.
- `JwtAuthGuard` global (`APP_GUARD`, opt-out com `@Public()`) e
  `JwtStrategy` via Passport já existem (`apps/api/CLAUDE.md`,
  "Autenticação e multi-tenancy") — esta spec é quem finalmente faz
  `JwtStrategy.validate()` consultar a tabela `User` de verdade (hoje só
  repassa o payload assinado, porque a tabela não existia).
  `POST /auth/register` e `POST /auth/login` são `@Public()` por
  definição — ninguém tem token antes de logar.
- `JWT_SECRET` só via variável de ambiente validada em
  `env.validation.ts`, sem fallback hardcoded — `apps/api/CLAUDE.md`,
  "Convenções não-negociáveis".
- Senha nunca armazenada em texto plano — hash (bcrypt, já instalado no
  projeto conforme `PROGRESS.md`) antes de persistir; `passwordHash`
  nunca aparece em nenhuma resposta HTTP (DTO de saída explícito,
  `apps/api/CLAUDE.md`, "Convenções não-negociáveis").
- Logs nunca contêm senha nem token, nem em nível `debug` —
  `apps/api/CLAUDE.md`, "Convenções não-negociáveis".
- Rate limiting por IP em `POST /auth/login` e `POST /auth/register`
  (`429` + `Retry-After`, `@nestjs/throttler`) — são exatamente os
  endpoints sensíveis a força-bruta/abuso citados em
  `apps/api/CLAUDE.md`, mesma seção.
- Toda query de domínio continua filtrando `companyId` manualmente (a
  Prisma Client Extension que injetaria isso automaticamente ainda não
  existe) — `apps/api/CLAUDE.md`, "Autenticação e multi-tenancy". Esta
  spec é quem primeiro popula `request.user.companyId` de verdade a
  partir de um login real.
- **Pendência técnica registrada aqui, não resolvida nesta spec:**
  Problem Details (RFC 7807) é o padrão de erro correto a partir de
  agora — o formato que `AllExceptionsFilter` de fato produz hoje
  (`statusCode`/`message`/`error`, default do Nest) está desalinhado com
  esse padrão, e é o filtro que precisa ser corrigido, não o contrário.
  Esta spec é a primeira a expor erros de negócio relevantes (401 de
  login, 409 de e-mail duplicado) — a correção do `AllExceptionsFilter`
  para emitir Problem Details é trabalho a fazer durante a implementação
  desta spec (ou da spec 01, se a ordem de implementação inverter por
  algum motivo), não uma decisão a tomar agora no papel.

## Os 3 cenários

- **Happy**: usuário se registra criando uma empresa nova, recebe token
  na resposta do próprio registro, e usa esse token para acessar rotas
  protegidas sem precisar logar de novo.
- **Sad**: usuário tenta logar com senha errada — erro `401` genérico
  ("credenciais inválidas"), igual ao que apareceria se o e-mail nem
  existisse (não revela qual dos dois está errado, evita enumerar
  e-mails cadastrados); nenhum token é emitido.
- **Edge**: um segundo usuário (ex.: o filho) se registra informando o
  `companyJoinCode` da empresa do primeiro usuário (o pai) — os dois
  passam a compartilhar o mesmo `companyId` e veem exatamente os mesmos
  projetos/orçamentos, sem nenhuma etapa de aprovação do primeiro usuário
  para o segundo entrar.

## Contrato de interface

`POST /auth/register`

Request:
```json
{
  "name": "string, obrigatório",
  "email": "string, obrigatório, formato de e-mail, único no sistema",
  "password": "string, obrigatório, mínimo 8 caracteres",
  "companyName": "string, obrigatório só se companyJoinCode não for informado — nome da empresa nova a criar",
  "companyJoinCode": "string, opcional — código de convite de uma empresa já existente; se informado, o usuário se junta a ela em vez de criar uma nova"
}
```
Regra: exatamente uma origem de empresa deve se resolver — nem
`companyName` nem `companyJoinCode` informados é `400`; `companyJoinCode`
informado mas que não corresponde a nenhuma empresa também é `400`
("código de convite inválido", não `404` — não é busca de recurso por
id, é validação de entrada). E-mail já cadastrado é `409 Conflict`.

Response `201`:
```json
{
  "userId": "uuid",
  "companyId": "uuid",
  "accessToken": "string, JWT",
  "companyJoinCode": "string, presente só quando uma empresa nova foi criada nesta chamada"
}
```
`companyJoinCode` na resposta precisa ser compartilhado manualmente pelo
usuário com quem for se juntar depois (ex.: por WhatsApp, o mesmo canal
que o TO-BE já registra como uso real) — não existe fluxo de convite por
e-mail nesta spec.

`POST /auth/login`

Request:
```json
{ "email": "string, obrigatório", "password": "string, obrigatório" }
```

Response `200`:
```json
{ "accessToken": "string, JWT", "userId": "uuid", "companyId": "uuid" }
```
Erro `401` para credenciais inválidas (e-mail inexistente ou senha
errada — mesma mensagem para os dois casos).

Payload do JWT emitido por ambos os endpoints: `{ "sub": userId,
"companyId": string, "email": string }` — o suficiente para
`JwtStrategy.validate()` popular `request.user` sem round-trip extra ao
banco a cada request.

Erros desta spec (`401`, `409`, `400`) seguem a pendência técnica
registrada acima — o formato real depende de quando o
`AllExceptionsFilter` for corrigido para Problem Details.

## Escopo negativo

- Papéis granulares/permissões finas (admin vs. membro) — fora da v1;
  todo usuário registrado tem acesso completo, a menos que o TO-BE diga
  o contrário no futuro.
- Recuperação de senha ("esqueci minha senha").
- Verificação de e-mail por link de confirmação no cadastro.
- Refresh token/renovação de sessão — token único com expiração fixa;
  expirar exige logar de novo.
- Login social (Google/Apple/etc.).
- Usuário pertencer a mais de uma empresa — a relação é sempre 1
  empresa : N usuários, nunca N:N.
- Regenerar ou revogar `companyJoinCode` depois de criado — fixo desde a
  criação da empresa nesta spec.
- Remover ou desativar um usuário depois de criado.
- Onboarding assistido em múltiplas etapas — é um único formulário de
  registro, não um wizard.

## Dependências

- Spec 00 (schema) — os models `Company`/`User` usados aqui já estão
  definidos lá (spec 00 foi atualizada para incluir essas duas entidades
  a partir das decisões desta spec). Na ordem de implementação o schema
  precisa existir primeiro (migração rodada) para esta spec ser
  implementada, mesmo que o *conteúdo* desses dois models tenha nascido
  das decisões descritas aqui.

# Decisions — Alicercei

Log append-only, uma entrada por decisão real (não por tarefa).

## [2026-08-24] Tailwind v4 (config-free), não tailwind.config.ts
**Decisão:** `apps/web` usa Tailwind v4 (`@import "tailwindcss"` +
`.postcssrc.json` + tokens via `@theme` em CSS/SCSS), não um
`tailwind.config.ts` com `content: [...]` como o texto original do passo
5 do plano sugeria.
**Motivo:** `legado/whale-ui` já usa Tailwind v4 (`"tailwindcss": "^4.1.8"`
no `package.json`, sem nenhum `tailwind.config.*` no repositório) — v4
não usa mais arquivo de config JS/TS por padrão. O equivalente ao
`content` (garantir que classes usadas só em `packages/ui` não sejam
purgadas) é a diretiva `@source "../../packages/ui/src";` em
`src/styles.scss` — testado de verdade (classe `bg-tropaz-500` referenciada
num template, build de produção, confirmado no CSS gerado).
**Tokens portados:** paleta de cor completa de
`legado/whale-ui/src/assets/scss/_colors.global.scss` (9 cores, escalas
50–950) e o `@import` de fontes do Google
(`_fontes.global.scss`) — copiados como estão (são os tokens de marca
reais, não específicos do domínio de construção civil). Nenhum token de
espaçamento portado porque o legado não tinha um arquivo de espaçamento
customizado (só cor e fonte existiam).
**Tema do Material incluído:** `mat.define-theme` (paleta azure/blue,
igual ao legado) também foi portado para `src/styles.scss`, apesar de não
estar no texto literal do passo 5 — sem tema, `MatDialog`/`MatTooltip`
(usados por `confirmation-dialog`/`table` em `packages/ui`) renderizariam
sem estilo. Tratado como parte de fazer os componentes já extraídos
funcionarem de verdade, não como escopo novo.

## [2026-08-24] Ícones: só os 2 obrigatórios copiados, resto sob demanda
**Decisão:** Copiados só `Export.svg` e `Info.svg` (identificados em
DECISIONS.md, entrada anterior sobre pesquisa de ícones) para
`apps/web/src/assets/imgs/icons/`, com `angular.json` → `assets` incluindo
`{ glob: "**/*", input: "src/assets/imgs" }` — testado: aparecem em
`dist/web/browser/icons/*.svg` depois do build, no mesmo path
(`./icons/X.svg`) que os componentes de `packages/ui` referenciam.
**Motivo:** O plano pede extrair "o conjunto de ícones efetivamente
usados nas telas (não a lib inteira)". Como nenhuma tela de domínio existe
ainda (só o design system foi extraído, sem features construídas em
`apps/web`), "efetivamente usado" hoje significa só os 2 ícones
referenciados direto no template de um componente do design system — os
outros 113 SVGs do legado (`Check.svg`, `Close.svg`, etc.) só entram
quando uma tela real os referenciar via `@Input() icon`/`action.icon`.

## [2026-08-24] Migração para monorepo
**Decisão:** Separar reaproveitamento de código (design system, padrão
técnico de backend) de lógica de domínio (redesenhada do zero) num monorepo
novo (`v2/alicercei`), mantendo `legado/` como referência histórica
somente leitura.
**Motivo:** O legado (`whale-ui`/`alicerce-api`) foi construído para um
domínio (ERP de obra para empresas grandes) sem validação real de uso. O
caso fundador atual (autônomo, gesseiro) exige um domínio diferente; o
valor comprovado do legado é técnico (design system, padrão de backend),
não o schema/regras de negócio.

## [2026-08-24] Deploy split
**Decisão:** `apps/web` publica na Vercel (root directory `apps/web`);
`apps/api` roda em VPS própria.
**Motivo:** Frontend Angular se beneficia de deploy estático/edge da
Vercel; API com banco relacional próprio faz mais sentido em VPS
controlada pelo time.

## [2026-08-24] Fluxo core único
**Decisão:** Um único fluxo (Projeto → Orçamento → Execução → Fechamento)
para qualquer perfil de conta (autônomo ou empresa).
**Motivo:** Evitar dois modelos de domínio paralelos como o legado tinha
(dois sistemas de aprovação, dois subsistemas de orçamento não
reconciliados — ver AS-IS-api.md, achados 2.3/2.4). Um fluxo único,
parametrizável por perfil de uso, não por tipo de cadastro.

## [2026-08-24] Execução e Recebimento como trilhas independentes
**Decisão:** Status de execução do serviço e status de pagamento evoluem
separadamente; um serviço pode estar concluído com pagamento pendente.
**Motivo:** Esse é o estado mais comum no caso fundador e o que mais
importa para a previsibilidade financeira que é o núcleo do produto (ver
README, "O ponto central").

## [2026-08-24] Camadas disponíveis a qualquer perfil, gatilho por uso
**Decisão:** Plano de ação, Aprovação formal, Colaboradores/terceiros e
Custos e perdas ficam disponíveis a qualquer perfil de conta; o gatilho
para usá-las é padrão de uso, não tipo de cadastro. Só folha CLT e cálculo
de imposto dependem de CPF/CNPJ.
**Motivo:** Evitar reproduzir a suposição do legado de que só empresas
grandes precisam dessas camadas — o caso fundador (autônomo) também pode
ter colaboradores/terceiros pontuais.

## [2026-08-24] Segurança da API é não-negociável na extração
**Decisão:** Nenhum débito de segurança do legado (segredo hardcoded,
ausência de validação de payload, CORS aberto, tratamento de erro que
mascara causa raiz) é herdado no novo `apps/api`, mesmo que o padrão
estrutural (guard, módulo, PrismaModule) seja reaproveitado.
**Motivo:** AS-IS-api.md documenta esses débitos como achados de
auditoria, não como padrão a seguir — ver seção 3.1/3.2/3.3.

## [2026-08-24] apps/web não criado nesta rodada — bloqueado por versão do Node
**Decisão:** `npx @angular/cli@22 new` não foi executado. `apps/web` segue
como diretório vazio.
**Motivo:** Angular CLI 22.1.5 exige Node `^22.22.3 || ^24.15.0 || >=26.0.0`;
o ambiente tem Node v22.18.0. Resolver isso exigiria atualizar a versão
global do Node ou usar um gerenciador de versão (nvm-windows, instalado no
ambiente) para trocar a versão ativa — ambas as ações são alteração de
versão global de Node, explicitamente fora do escopo autorizado deste
plano (ver PLANO-EXECUCAO.md, "Escopo e limites de execução"). Registrado
como bloqueio em PROGRESS.md em vez de contornado.
**Alternativas consideradas:** baixar a versão-alvo do Angular (ex.: 20 ou
21) para caber no Node instalado — não escolhido unilateralmente porque o
plano pede explicitamente Angular 22; fica como pergunta para o usuário.

## [2026-08-24] apps/api: Prisma 7 com driver adapter explícito, gerador clássico
**Decisão:** `apps/api` usa Prisma 7.9.1 com `generator client { provider =
"prisma-client-js" }` (gerador clássico, saída em `node_modules/@prisma/client`)
em vez do novo gerador default `"prisma-client"`, e `PrismaService` recebe
um driver adapter explícito (`@prisma/adapter-pg`, `PrismaPg`) construído a
partir de `DATABASE_URL`.
**Motivo:** O novo gerador `"prisma-client"` emite código ESM puro (usa
`import.meta.url`), incompatível com o build CommonJS padrão do Nest CLI
usado aqui — o app falhava no boot com `ReferenceError: exports is not
defined in ES module scope`. Separadamente, Prisma 7 removeu a engine de
conexão implícita: `PrismaClient` não conecta mais só a partir de
`DATABASE_URL`, exige um adapter (`@prisma/adapter-pg` para Postgres, ou
o equivalente para outro banco) passado no construtor. Isso é diferente do
legado (Prisma 6.4, sem driver adapter), mas é exigência da versão nova,
não escolha de arquitetura.

## [2026-08-24] apps/api: Postgres como datasource (não MySQL como o legado)
**Decisão:** `prisma/schema.prisma` usa `provider = "postgresql"`.
**Motivo:** Nenhuma parte do plano ou do README especifica o banco do v2;
`prisma init` (ferramenta que o plano pede para usar) tem Postgres como
default atual. Fica marcado como suposição a confirmar com o usuário, não
como decisão fechada — ver PROGRESS.md.

## [2026-08-24] apps/api: schema.prisma nasce vazio, auth não consulta banco ainda
**Decisão:** O schema Prisma tem só `datasource`/`generator`, sem nenhum
model. `JwtStrategy.validate()` devolve o payload assinado do token
diretamente, sem consultar uma tabela `users` (que ainda não existe) — o
guard/strategy validam a assinatura do token, mas não há ainda um
`AuthController` de login real.
**Motivo:** O schema de domínio (que inclui como `companies`/`users` são
modelados — pessoa física vs. jurídica, autônomo vs. empresa) depende da
entrevista de AS-IS real com o pai do usuário, ainda não realizada (ver
PROGRESS.md, "Bloqueado por"). Construir a infraestrutura técnica (guard,
strategy, multi-tenancy centralizada) sem inventar esse schema evita
retrabalho quando a entrevista definir o modelo real.

## [2026-08-24] packages/ui: TableDataSource/SelectComponent desacoplados de ApiService via injection token
**Decisão:** Criado `UI_API_CLIENT` (`packages/ui/src/api/ui-api-client.ts`),
um `InjectionToken<UiApiClient>` com a mesma forma (get/post/put/delete) do
`ApiService` do legado. `TableDataSource` e `SelectComponent` injetam esse
token em vez da classe concreta `ApiService`. O app consumidor (`apps/web`,
quando existir) precisa prover `{ provide: UI_API_CLIENT, useExisting:
ApiService }`.
**Motivo:** Os dois componentes importavam `ApiService` de
`core/api/api.service.ts` do app legado direto — um import que não resolve
fora daquele app e, mesmo se resolvesse, acoplaria o pacote de design
system a uma classe concreta de um app específico. `ApiService` em si é
genérico (AS-IS-web.md classifica como "Não — genérico"), mas não estava
na lista de itens a extrair no passo 4.2; o token evita tanto duplicar
`ApiService` dentro de `packages/ui` quanto deixar o import quebrado.

## [2026-08-24] packages/ui: TableDataSource.getAvailableActions() recebe dicionário de ações via novo @Input
**Decisão:** `getAvailableActions()` passou a receber `actionsConfig:
RowActionConfig<T>[]` como parâmetro (removido o import de
`ActionPlanStatus` e os 4 tipos de ação hardcoded). Adicionado
`@Input() actionsConfig` no componente e `action.label` opcional em
`RowActionConfig`, porque o template usava `ACTIONS_GROUPS[action.type]`
para rotular cada ação — com tipos agora arbitrários (definidos por quem
consome a tabela), um tipo fora do dicionário fixo de 5 rótulos originais
não teria label sem esse campo.
**Motivo:** Era o vazamento de domínio explícito apontado em
PLANO-EXECUCAO.md passo 4.2 e AS-IS-web.md seção 3.1/4 — `ACTIONS_GROUPS`/
`ActionType` (rótulos genéricos: Novo/Aprovar/Reprovar/Excluir/Editar)
não foram tocados além disso, por não estarem classificados como vazamento
de domínio no AS-IS.

## [2026-08-24] packages/ui: correções obrigatórias para compilar em Angular 22
**Decisão:** Removido o import morto de `ComponentFactoryResolver` em
`dynamic-tabs.component.ts` (API removida do `@angular/core` no Angular
22 — não é mais deprecada, deixou de existir). Adicionadas
`date-fns` (calendar) e `ng-dynamic-component` (table/dynamic-tabs) como
dependências reais de `packages/ui/package.json`, e `@angular/forms`,
`@angular/animations`, `@angular/cdk`, `@angular/material` como
peerDependencies (a lista original do plano só citava `@angular/core`/
`@angular/common`; os componentes de fato usam Material — `MatDialog` em
`confirmation-dialog`, `MatTooltipModule` em `table` — e ReactiveForms/
animations).
**Motivo:** Sem essas correções o pacote não compila contra Angular 22
(verificado com `tsc` real contra os pacotes `@angular/*` instalados —
ver nota abaixo sobre como isso foi possível apesar do bloqueio de
`apps/web`). `@angular/animations` está oficialmente deprecada em favor de
`animate.enter`/`animate.leave` no Angular 22 (aviso do npm), mas ainda
funciona — não migrado agora porque testar a substituição exige um app
Angular real rodando no browser, que está bloqueado (ver decisão sobre
Node acima). Fica como follow-up depois que `apps/web` existir.
**Nota:** Foi possível rodar `tsc --noEmit` real contra os tipos
`@angular/core`/`@angular/material`/etc. mesmo sem o Angular CLI, porque o
gate de versão de Node (`^22.22.3`) vive só no binário `ng`, não nos
pacotes `@angular/*` em si — `npm install` os instala com warning, não
erro. Isso NÃO substitui rodar `ng build`/`ng serve` de verdade (templates
HTML, sintaxe `@if`/`@for`, DI em runtime continuam não verificados até
`apps/web` existir), mas validou toda a extração de `packages/ui` no nível
de tipos TypeScript.

## [2026-08-24] Node atualizado para 24.19.0 (LTS) via nvm-windows, com autorização do usuário
**Decisão:** Instalada e ativada a versão 24.19.0 do Node (LTS, satisfaz
`^24.15.0` exigido pelo Angular CLI 22) via `nvm-windows`, substituindo a
22.18.0 que bloqueava o passo 1.1. Reverificado depois: `apps/api` (build,
lint, testes, boot, fail-fast de env) e a extração de `packages/ui`
seguem funcionando sem regressão nessa versão nova de Node.
**Motivo:** Essa troca contraria literalmente o limite "nenhuma alteração
de versão global de Node" do PLANO-EXECUCAO.md — só foi executada depois
de perguntar e receber autorização explícita do usuário para este passo
específico, não por decisão unilateral.
**Efeito colateral resolvido:** o `npm` que veio junto (11.17.x) trouxe um
gate novo de segurança (`allowScripts`) que bloqueia scripts de instalação
nativos por padrão — isso impediu bcrypt/Prisma/esbuild/etc. de rodar seus
scripts de build. Aprovados explicitamente via `npm approve-scripts`
(registrado em `package.json` → `allowScripts`) só os pacotes esperados
(bcrypt, prisma, @prisma/engines, esbuild, @parcel/watcher, lmdb,
msgpackr-extract, unrs-resolver) — todos dependências diretas ou
transitivas já escolhidas neste plano, não pacotes novos.

## [2026-08-24] apps/web criado; bugs reais só visíveis com o compilador Angular real
**Decisão:** `apps/web` criado com `ng new` (Angular 22.1.x). Ao integrar
`@alicercei/ui` de verdade (path mapping + `ng build`), o compilador AOT
encontrou 2 erros que nem `tsc` puro nem a extração anterior detectaram
(templates HTML não são checados por `tsc` sozinho):
1. `table.component.html` chamava `handleAction(action)` passando o
   objeto de ação inteiro em vez de `action.type` — bug pré-existente no
   legado (nunca decorado por type-checking real lá). Corrigido para
   `handleAction(action.type)`, e `handleAction`/`emitTableAction` tiveram
   o parâmetro ampliado para `ActionType | string`, coerente com
   `RowActionConfig.type` agora ser `string` livre (ver decisão de
   generalização do passo 4.2).
2. `getAvailableActions()` retornava um objeto com campo `disabled` sem
   isso estar no tipo de retorno (`RowActionConfig<T>[]`, que não declara
   `disabled`). Criado `ResolvedRowAction<T>` (`RowActionConfig<T> &
   { disabled: boolean }`) como tipo de retorno correto.
Depois dos dois ajustes, `ng build` de `apps/web` conclui com sucesso
(restam só 2 warnings pré-existentes e inofensivos em
`dynamic-tabs.component.html`, não bloqueantes).
**Motivo:** Esses dois bugs só existiam porque nenhuma ferramenta tinha
rodado o compilador de templates do Angular sobre esse código antes desta
extração — nem no legado (sem strict/AOT rigoroso o suficiente para
pegar), nem na verificação anterior com `tsc` puro (que não entende
`.html`). Ficam como prova de que a extração para `packages/ui` só pode
ser considerada validada de verdade depois de compilar contra um app
Angular real — o que só foi possível depois da atualização do Node.
**Wiring de verificação:** feito com um arquivo `_ui-wiring-check.ts`
temporário em `apps/web/src/app/`, importando de `@alicercei/ui` e
apagado logo depois do `ng build` confirmar — não ficou nenhum uso
"decorativo" do design system dentro do app gerado, já que nenhuma tela
real foi pedida ainda.

## [2026-08-24] apps/web/CLAUDE.md e ícones: adiados até apps/web existir
**Decisão:** Não criado `apps/web/CLAUDE.md` nem copiado nenhum ícone SVG
para dentro de `apps/web/` nesta rodada.
**Motivo:** `apps/web/` precisa continuar vazio para `ng new` funcionar
quando o bloqueio de Node for resolvido (Angular CLI recusa rodar em
diretório não-vazio). Pesquisa do passo 6 (identificar como o legado
resolve ícones) foi feita: `legado/whale-ui` usa uma pasta própria de SVGs
(`src/assets/imgs/icons/*.svg`, 115 arquivos, copiada para a raiz do build
via `angular.json` → `assets`), referenciada como `<img src="./icons/X.svg">`
— não é `MatIcon`/Lucide/Heroicons. Dos componentes já extraídos para
`packages/ui`, dois ícones são referenciados direto no template do
componente (não vêm de `@Input()` do app consumidor): `Export.svg`
(uploader) e `Info.svg` (cabeçalho da tabela) — esses dois são obrigação
mínima para `@alicercei/ui` funcionar visualmente; os demais (`Check.svg`,
`Close.svg`, `Delete.svg`, `Edit.svg`, ...) só são necessários se o app
consumidor os referenciar via `action.icon`/`icon` input.

## [2026-08-24] apps/api: multi-tenancy centralizada via contexto de request (AsyncLocalStorage)
**Decisão:** `TenantContextService` (AsyncLocalStorage) + `TenantContextInterceptor`
global centralizam o `companyId` do request autenticado, em vez de cada
service receber/filtrar `company_id` manualmente.
**Motivo:** PLANO-EXECUCAO.md pede centralização "via Prisma
middleware/extension ou contexto de request" — contexto de request foi
escolhido porque não depende de nenhum model Prisma existir ainda (ver
decisão acima), enquanto uma Prisma Client Extension de fato só faz
sentido depois que houver tabelas com `company_id` para filtrar. Um
middleware Express comum não serviria porque roda antes dos guards no
pipeline do Nest — só um interceptor (que roda depois do guard) tem acesso
a `request.user` já populado.

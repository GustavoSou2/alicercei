# Decisions — Alicercei

Log append-only, uma entrada por decisão real (não por tarefa).

## [2026-08-25] Investigação: nenhum modificador de alpha dinâmico (`bg-${cor}/${valor}`) em packages/ui
**Pedido do usuário:** atenção específica a um sub-caso do bug de `@source`/
purge já corrigido (ver entrada abaixo) — classes Tailwind com modificador
de opacidade construído via variável (ex.: `bg-teal-600/${opacity}`), que
passam despercebidas do mesmo problema mesmo quando o resto da classe é
escrito de forma literal, porque o scanner de conteúdo do Tailwind não
resolve a parte interpolada.
**Verificado:** busca por `${...}` combinado com prefixos de utilitário
Tailwind (`bg-`, `text-`, `border-`, `ring-`, `from-`, `via-`, `to-`, etc.)
em todo `.ts`/`.html`/`.scss` de `packages/ui/src`. **Nenhuma ocorrência
encontrada:**
- Todo `${...}` existente em `.ts` é classe BEM própria do componente
  (`avatar--${size()}`, `button-custom--${variant()}`), valor de pixel
  (`${width}px`) ou texto de mensagem — nenhum monta nome de utilitário
  Tailwind.
- `[ngClass]`/`[class]` nos templates resolvem para essas mesmas classes
  BEM (`avatarSize`, `buttonClass`, `iconClass`), não para utilitários
  Tailwind.
- Nenhum `@apply` nem interpolação SCSS (`#{$var}`) em nenhum `.scss` do
  pacote.
**Motivo de registrar um achado negativo:** é o mesmo tipo de bug de purge
silencioso (Tailwind não avisa, só deixa de gerar a classe) já encontrado
nesta sessão via `@source` incorreto — registrar a verificação evita que
alguém repita essa mesma investigação depois, e marca que esse vetor
específico está limpo hoje. Se um componente futuro precisar de opacidade
dinâmica, a forma seguindo o purge de produção é escrever cada combinação
inteira por extenso (ex. via `class:`/`[ngClass]` mapeando cada variante
para uma classe completa), nunca interpolar string dentro do nome da
classe.

## [2026-08-25] Investigação: tailwind.config.js vazio/órfão — @theme prevalece, sem conflito real
**Achado (investigação, não presumida):** `apps/web/package.json` tem
`tailwindcss@^4.3.3` (v4 confirmado; subiu de `^4.1.8` por resolução de
`^` normal do npm, não é uma troca deliberada). Existe um
`apps/web/tailwind.config.js` no working tree — **não foi criado por
nenhuma etapa registrada neste log**, está com **0 bytes**, sem entrada
no git (`??`, sem histórico). Confirmado via build real (`ng build`) e
inspeção do CSS gerado: nenhum warning/erro menciona esse arquivo, e o
Tailwind v4 só carrega um config JS legado se houver uma diretiva
`@config "caminho";` explícita em algum CSS — não existe nenhuma em
`src/styles.scss` nem em nenhum outro `.scss` do app. Ou seja, esse
arquivo está **inerte hoje**: não é lido pelo pipeline de build, não
compete com o `@theme` de `_colors.global.scss`, não há conflito real
para arbitrar.
**Decisão sobre qual fonte prevalece:** `@theme` em
`src/assets/scss/_colors.global.scss` (importado por `src/styles.scss`)
é a **única fonte de tokens de tema** deste projeto. Se um
`tailwind.config.js` ganhar conteúdo no futuro, ele só passa a valer se
alguém adicionar `@config` apontando pra ele — nesse momento, os dois
teriam que ser reconciliados explicitamente (Tailwind v4 deixa o config
JS coexistir com `@theme`, mas quem for mexer nisso precisa saber que
`@theme` é hoje a fonte de verdade, não um "extra"). Não removido nesta
sessão porque não foi criado nesta sessão nem por este agente — reportado
para o usuário decidir se apaga o arquivo órfão.

## [2026-08-25] Bug real encontrado: `@source` apontava para caminho inexistente
**Achado (via teste real, não só configuração escrita):** A verificação
anterior (sessão passada) de que classes usadas só em `packages/ui`
sobrevivem ao build de produção **não provava o que dizia provar** — o
teste anterior colocava a classe de teste dentro de `apps/web/src/app/
app.html` (sempre varrido por padrão, independente do `@source`) ou,
pior, um comentário em `_colors.global.scss` continha o texto literal de
nomes de classe completos (`bg-tropaz-500`, `text-cornflower-300`) — o
scanner do Tailwind v4 é baseado em regex sobre texto bruto de qualquer
arquivo varrido, **inclusive comentários**, então essas classes apareciam
no CSS final mesmo sem nenhum uso real dentro de `packages/ui`. Um teste
rigoroso agora (classe real `bg-emerald-700 text-tranquil-200
rounded-3xl` inserida de verdade em `packages/ui/src/avatar/
avatar.component.html`, revertida depois) **falhou** com a configuração
anterior: `@source "../../packages/ui/src";` em `apps/web/src/
styles.scss` resolve, a partir de `apps/web/src/`, para
`apps/web/packages/ui/src` — um diretório que **não existe** (faltava um
`../`; `packages/ui` é irmão de `apps/`, não de `apps/web/src/..`).
Tailwind não avisa quando um `@source` aponta para um caminho
inexistente, só encontra zero arquivos ali e segue em frente — por isso
o erro não apareceu em nenhum warning/build anterior.
**Corrigido:** `@source "../../../packages/ui/src";` (três níveis acima
de `apps/web/src/` até a raiz do monorepo, depois `packages/ui/src`).
**Reverificado com teste positivo E negativo**: classe real em
`packages/ui` sobrevive ao build depois do fix; depois de remover a
classe de teste E os dois textos de comentário/doc que continham nomes
de classe completos por extenso (`_colors.global.scss` e
`apps/web/CLAUDE.md`, ambos ajustados para descrever o padrão
`bg-{cor}-{escala}` em vez de escrever a classe inteira), o build limpo
(cache `.angular` apagado) **não** contém mais nenhuma dessas classes —
prova de que o purge de produção agora funciona de verdade para
`packages/ui`, não só na config escrita.
**Motivo de registrar isso com tanto detalhe:** a sessão anterior já
tinha declarado esse mesmo teste como "validado" em uma entrada anterior
deste arquivo — essa validação estava errada. Fica registrado aqui para
quem for confiar em testes de purge no futuro saber que o scanner do
Tailwind v4 pega qualquer string de texto bruto (inclusive prosa/
comentário), então "a classe aparece no CSS" só é prova de uso real se o
texto de teste não existir em nenhum outro lugar varrido (docs,
comentários, etc.) — e que caminho de `@source` errado falha em
silêncio, não em erro.

## [2026-08-25] Cor/tipografia global aplicada a partir do uso real do legado, não da config declarada
**Investigação (uso real, não configuração declarada):** análise
estatística de todos os `.scss` de `legado/whale-ui/src` (não só o
design system, também telas/módulos de domínio, para capturar o estilo
de fato aplicado):
- **Cor de texto:** não existe um `color` global no legado (o reset
  `* {}` de `styles.scss` não define `color`) — cada componente repete a
  cor manualmente. `var(--waterloo-600)` é a cor de texto mais usada de
  longe (46+ ocorrências diretas, típico em parágrafo/data/texto
  secundário); `var(--waterloo-800)` é a cor consistentemente usada em
  títulos/headings (amostrado em `h1-h4`/`.title`/`.heading` de vários
  módulos). `big-stone-*` aparece como segunda família mais comum, mas
  sem o mesmo padrão consistente de "corpo vs. título" que `waterloo`
  tem.
- **Achado à parte (não portado):** `var(--indigo-*)` e
  `var(--shuttle-gray-*)` aparecem usados em alguns componentes
  (`card`, `notification`, telas de `account`) mas **nunca são
  definidos** em nenhum `.scss` do legado — são custom properties
  quebradas/mortas (resolvem pra nada em runtime). Nenhum desses
  componentes está entre os extraídos para `packages/ui` (são 🔴/🟡 no
  AS-IS-web.md), então isso não afeta o design system novo, só fica
  registrado como achado de auditoria.
- **Espaçamento:** `gap`/`padding` reais concentram em `0.5rem` (8px),
  `1rem` (16px), `1.5rem` (24px), `2rem` (32px) — bate quase exatamente
  com a escala default do Tailwind v4 (`spacing` base 4px:
  2=8px/4=16px/6=24px/8=32px). **Nenhum token de espaçamento customizado
  foi criado** — o default do Tailwind já reflete o uso real, sobrescrever
  seria inventar uma escala paralela sem necessidade.
- **Border-radius:** valores reais concentram em 4px, 6px, 8px, 12px,
  24px, 50% (círculos/avatar) — também próximo o suficiente da escala
  default do Tailwind v4 (`--radius-sm/md/lg/xl` ≈ 4/6/8/12px,
  `rounded-full` para círculo). **Não sobrescrito** pelo mesmo motivo do
  espaçamento; os componentes já extraídos para `packages/ui` mantêm seu
  `border-radius` explícito por componente (herdado do legado tal como
  estava).
- **Sombra:** **não existe um token de sombra reutilizado** no legado —
  cada `box-shadow` encontrado é um valor único, específico do
  componente (dropdown, modal, etc.), sem repetição suficiente para
  extrair um padrão. Não foi criado nenhum token de sombra por não haver
  um real para portar.
**Aplicado:** `body { color: var(--waterloo-600); }` e `h1..h6 { color:
var(--waterloo-800); }` em `apps/web/src/styles.scss` — agora qualquer
tela ou componente herda a cor de texto certa por padrão, sem precisar
declarar `color` manualmente (correção sobre o próprio legado, que nunca
teve essa herança global e repetia a cor em cada componente). Fonte
global (`Poppins`) já estava aplicada desde o passo 5 original.

## [2026-08-24] apps/web na Vercel: buildCommand customizado + toggle manual obrigatório
**Decisão:** `apps/web/vercel.json` define `"framework": null` e um
`buildCommand` customizado (`cd ../.. && npm install && npm run build
--workspace=apps/web`) em vez de deixar a Vercel autodetectar o build de
um projeto Angular isolado, com `outputDirectory: "dist/web/browser"`
(conferido rodando o build de verdade a partir da raiz — bate com o que
já estava escrito).
**Motivo:** Com Root Directory = `apps/web` (ver README/CLAUDE.md raiz,
plano de deploy), o autodetect padrão da Vercel rodaria o build só dentro
de `apps/web`, sem visibilidade do resto do monorepo — mas `apps/web`
depende de `packages/ui` (via `@alicercei/ui`, path fora da Root
Directory) e do `package-lock.json`/workspaces da raiz. O `buildCommand`
sobe até a raiz do repo antes de instalar/buildar para resolver isso.
**Passo manual obrigatório, não configurável via `vercel.json`:** é
preciso habilitar manualmente, no painel do projeto na Vercel
(Settings → Build and Deployment), a opção **"Include source files
outside of the Root Directory in the Build Step"** — sem isso, a Vercel
não envia `packages/ui`/`packages/config`/o `package-lock.json` da raiz
para o ambiente de build, e o `cd ../..` do `buildCommand` encontra um
diretório vazio/incompleto. Documentado aqui porque é fácil esquecer
esse passo, já que ele não deixa rastro nenhum no código do repositório.

## [2026-08-24] Infra local: docker-compose com paridade total (api + web + postgres)
**Decisão:** `infra/docker-compose.yml` sobe os três serviços de
desenvolvimento local — `postgres` (16-alpine), `api` (build via
`apps/api/Dockerfile`, multi-stage Node 24-alpine) e `web` (build via
`apps/web/Dockerfile`, multi-stage Node 24-alpine → servido por
`nginx:1.27-alpine`) — com `infra/.env.example` documentando as variáveis
necessárias (`POSTGRES_*`, `NODE_ENV`, `PORT`, `JWT_SECRET`,
`CORS_ORIGIN`, `API_URL`). Banco confirmado como **PostgreSQL** (já
decidido nesta sessão — ver entrada anterior sobre a escolha do banco).
**Motivo:** Ambiente local precisa ser capaz de rodar o monorepo inteiro
(banco + api + web) de forma reprodutível, sem depender de instalação
manual de Postgres/Node na máquina de quem desenvolve.
**Deploy de produção não muda:** continua `apps/web` → Vercel,
`apps/api` → VPS própria (ver decisão de deploy split, no topo deste
arquivo) — os Dockerfiles criados aqui são para paridade de ambiente
local (e, no caso de `apps/api`, reaproveitáveis para a VPS depois), não
uma mudança de estratégia de deploy do frontend.
**Validado:** `docker compose --env-file .env config` (de dentro de
`infra/`, com `.env` copiado de `.env.example`) parseia sem erro; o
caminho de output do build de `apps/web` (`dist/web/browser`) foi
conferido rodando `npm run build --workspace=apps/web` de verdade e bate
com o que já estava escrito em `apps/web/Dockerfile`. Os containers em si
não foram subidos nesta sessão (não pedido).

## [2026-08-24] Tailwind v4 (config-free), não tailwind.config.ts
**Decisão:** `apps/web` usa Tailwind v4 (`@import "tailwindcss"` +
`.postcssrc.json` + tokens via `@theme` em CSS/SCSS), não um
`tailwind.config.ts` com `content: [...]` como o texto original do passo
5 do plano sugeria.
**Motivo:** `legado/whale-ui` já usa Tailwind v4 (`"tailwindcss": "^4.1.8"`
no `package.json`, sem nenhum `tailwind.config.*` no repositório) — v4
não usa mais arquivo de config JS/TS por padrão. O equivalente ao
`content` (garantir que classes usadas só em `packages/ui` não sejam
purgadas) é a diretiva `@source` em `src/styles.scss`.
**Correção (2026-08-25):** o caminho escrito originalmente aqui
(`../../packages/ui/src`) estava errado (faltava um nível — resolvia para
um diretório inexistente) e o "teste" descrito nesta entrada não provava
o que dizia provar. Ver entrada "Bug real encontrado: `@source` apontava
para caminho inexistente" (2026-08-25) para o path correto
(`../../../packages/ui/src`) e a verificação de verdade.
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

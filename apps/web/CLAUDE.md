# CLAUDE.md — apps/web

Stack: Angular 22 (standalone components, signals, zoneless por padrão,
`OnPush` como estratégia padrão — vem assim do `ng new`, não precisa
configurar).

## Arquitetura e organização

- **Estrutura por feature/domínio**, não por tipo de arquivo: cada
  feature nova vive em `src/app/<feature>/` (ex.: `orcamentos/`,
  `projetos/`) com seus próprios componentes/services dentro — nunca uma
  pasta `components/`/`services/` na raiz de `src/app/` juntando arquivos
  de features diferentes. Hoje `src/app/` só tem o esqueleto do `ng new`
  (`app.ts`/`app.routes.ts` vazio) — nenhuma feature criada ainda, então
  não há nada para migrar, só a convenção a seguir a partir da primeira
  tela real.
- **Standalone em tudo, nenhum `NgModule` novo** a menos que exista razão
  técnica concreta — e aí a razão é documentada em `DECISIONS.md` no
  mesmo commit que cria o módulo, não só um comentário no código.
- **Smart vs. dumb**: componente de tela (smart, geralmente o que uma
  rota do `app.routes.ts` aponta) cuida de estado e chama service/HTTP;
  componente de apresentação (dumb) só recebe `@Input()`/emite
  `@Output()` (ou `input()`/`output()` signal-based), sem `HttpClient` nem
  service de domínio injetado. Os componentes de `packages/ui` já seguem
  o papel dumb (recebem dado via `@Input`, emitem evento — só chamam
  `UI_API_CLIENT` genérico quando precisam buscar opção de um
  `select`/linha de `table`, nunca um endpoint de domínio direto).
- **Barrel file (`index.ts`) só em `packages/ui`** (já existe, é o
  contrato público do design system). Dentro de cada feature de
  `apps/web`, evitar barrel próprio — importar direto do arquivo, para
  não criar risco de dependência circular entre features que cada uma
  reexporta tudo por um `index.ts` próprio.

## Performance

- `OnPush` em todo componente novo de `apps/web`, sem exceção não
  justificada — Angular 22 já gera isso por padrão via `ng generate
  component`. **Atenção**: isso vale para componente novo de `apps/web`,
  não necessariamente para o que vem de `packages/ui` — a maioria dos
  componentes extraídos do legado (`button`, `input`, `select`, `avatar`,
  `toast`, `dialog`, `calendar`, `uploader`, `dynamic-tabs`,
  `confirmation-dialog`, `textarea-custom`) **não** tem
  `ChangeDetectionStrategy.OnPush` explícito — só `table` e
  `skeleton-loader` têm. Usável do mesmo jeito, só não presumir que "todo
  componente do app é OnPush" cobre o design system também; isso não foi
  corrigido nesta tarefa.
- Signals como base do estado local de todo componente novo (`signal()`/
  `computed()`), não `BehaviorSubject` para estado que só o próprio
  componente usa. RxJS continua legítimo para stream assíncrona real
  (HTTP, WebSocket, evento de DOM) — o template lê um signal, convertido
  de observable com `toSignal()` quando o dado vem de uma stream.
- Lazy loading por rota de feature (`loadComponent` para tela única,
  `loadChildren` para feature com sub-rotas) em `app.routes.ts` — nenhuma
  feature importada eager na rota.
- `@defer` em bloco pesado sem necessidade de renderização imediata (ex.:
  gráfico de previsibilidade financeira, se/quando existir) — usar
  `@placeholder`/`@loading` do próprio bloco em vez de um loading state
  separado por fora.
- `track` nativo do `@for` em toda lista renderizada (ou `trackBy` onde
  ainda for `*ngFor`) — nunca lista sem identidade de item definida.
- Angular CDK Virtual Scroll em qualquer lista que possa crescer além de
  ~50 itens (ex.: listagem de orçamentos ao longo do tempo). `table-custom`
  (`packages/ui`) hoje não tem virtual scroll embutido — decidir se o
  componente ganha essa opção (afeta todo consumidor) ou a tela usa
  virtual scroll por fora quando a primeira listagem grande existir, não
  especular a API agora.

## Estado e dados

- Signals são a fonte de verdade do estado local de uma feature. Estado
  global (NgRx ou equivalente) só entra se houver dado genuinamente
  compartilhado entre features distantes — não é o padrão default. Os
  services cross-cutting de `packages/ui` que já usam `BehaviorSubject`
  (`LoaderService`, `ToastService`, `DialogService`) são o exemplo do
  caso legítimo: são singletons de infraestrutura de UI usados por
  qualquer tela, não estado de uma feature — não contradiz "signal como
  padrão", é o próprio caso de exceção que a regra prevê.
- Escolher **uma** estratégia de cache de requisição (`shareReplay`
  manual num service, ou uma lib dedicada) e aplicar consistentemente —
  registrar a escolha em `DECISIONS.md` quando a primeira tela que busca
  dado remoto for criada. Nenhuma tela consome API ainda, então não há
  necessidade real de decidir agora; a exigência é não misturar
  abordagens diferentes em partes diferentes do app depois que a primeira
  escolha for feita.
- Optimistic UI com rollback em escrita usa a **mesma** chave de
  idempotência já especificada em `apps/api/CLAUDE.md`: header
  `Idempotency-Key`, gerado no cliente (ex.: UUID v4) — não inventar um
  formato/nome de header à parte no front.
- Invalidação de cache ao trocar de tenant/empresa: **não implementar
  ainda** — depende da pergunta em aberto sobre `Company`/`Tenant`
  registrada em `PROGRESS.md`. Desenhar a chave de cache já pensando em
  incluir escopo de tenant no futuro (deixar claro no código/comentário
  que um prefixo de tenant entra na chave quando essa decisão for
  tomada), sem implementar a troca de contexto agora.

## Resiliência de UI

- Toda tela que busca dado trata os três estados — loading, error, empty
  — nenhuma tela nova sobe sem os três. `SkeletonLoaderComponent`
  (`packages/ui`) é o padrão de loading — **skeleton, não spinner
  genérico** — para qualquer lista/card que busca dado.
- Retry com feedback visual específico do que falhou (ex.: "Não foi
  possível carregar os orçamentos — tentar de novo"), nunca um genérico
  "algo deu errado" sem contexto do que o usuário estava tentando fazer.
- Parar de tentar automaticamente depois de falhas repetidas e avisar o
  usuário — mesmo conceito do circuit breaker do backend (ver
  `apps/api/CLAUDE.md`, "Escalabilidade e processamento assíncrono"),
  aplicado no cliente: um retry automático (ex. polling/reconexão) para
  depois de N tentativas em vez de martelar um endpoint fora do ar
  indefinidamente.

## Formulários

- Reactive Forms em qualquer formulário não-trivial (mais de 2-3 campos
  ou com validação condicional) — `input-custom`/`textarea-custom`/
  `select-custom` (`packages/ui`) já implementam `ControlValueAccessor`
  exatamente para isso, não Template-driven Forms.
- Validação client-side é UX (feedback rápido), nunca a validação real —
  o backend (`ValidationPipe`/DTOs em `apps/api`) é quem garante os
  dados; nunca confiar que o form já validou o suficiente antes de
  enviar.
- Debounce de 300–500ms (ponto de partida razoável, ajustar por caso) em
  todo campo de busca/autocomplete que dispara chamada HTTP a cada
  digitação. Hoje nenhum componente de `packages/ui` tem busca "ao
  digitar" ligada a HTTP (`select-custom` carrega a lista via `source`,
  não por keystroke) — não há debounce faltando em código existente, é
  convenção para quando essa tela for construída.

## Design system

Sempre usar `@alicercei/ui` quando o componente já existe lá — nunca
duplicar um componente que já foi extraído (ver `packages/ui/src/index.ts`
para o que já existe: avatar, button, calendar, confirmation-dialog,
dialog, dynamic-tabs, input, loader, select, skeleton-loader, table,
textarea-custom, toast, uploader, + máscaras BR).

`packages/ui` não depende de nenhuma classe concreta deste app — `table`/
`select` esperam um provider para `UI_API_CLIENT`
(`packages/ui/src/api/ui-api-client.ts`). Antes de usar `<table-custom>`
ou `<select-custom>` em qualquer tela, este app precisa ter seu próprio
serviço HTTP (equivalente ao `ApiService` do legado — ainda não criado
aqui, ver `legado/AS-IS-web.md` seção 1.1 para a forma de referência) e
prover:

```ts
{ provide: UI_API_CLIENT, useExisting: ApiService }
```

## Tailwind

Tailwind v4 (config-free, via `@import "tailwindcss"` em `src/styles.scss`
+ `.postcssrc.json`, não `tailwind.config.ts` — é como o legado
(`whale-ui`) já usava). Tokens de cor portados em
`src/assets/scss/_colors.global.scss` (paleta tropaz/cornflower/
tranquil/burnt-sienna/big-stone/victoria/royal-blue/waterloo/emerald,
cada uma com escala 50–950), expostos tanto como variáveis CSS soltas
(formato `var(--{cor}-{escala})`, usado pelos componentes de
`packages/ui`) quanto como tokens Tailwind (bloco `@theme`, que gera as
classes utilitárias equivalentes de cor/fundo/borda por cor e escala).
Cor de texto padrão herdada globalmente (sem precisar declarar em cada
componente): `body` usa a cor de corpo mais usada no legado, títulos
(`h1`–`h6`) usam a cor de heading mais usada — ver `src/styles.scss` e
DECISIONS.md para os valores exatos e a análise que embasou a escolha.

**Qualquer novo componente em `packages/ui` precisa estar coberto pelo
`content`/`@source` do Tailwind do app que o consome** — aqui isso é a
diretiva `@source` em `src/styles.scss`, apontando para
`packages/ui/src` (caminho relativo a partir de `apps/web/src/` — três
níveis acima até a raiz do monorepo, depois `packages/ui/src`). Sem isso
o build de produção remove (purga) classes usadas só dentro do design
system. **Cuidado ao documentar exemplos de classes Tailwind em prosa**
(aqui ou em qualquer `.md`/comentário dentro de `apps/web` ou
`packages/ui`): o scanner do Tailwind v4 é baseado em regex sobre texto
bruto, não em AST — uma string como um nome de classe completo escrito
por extenso num comentário ou neste arquivo é o suficiente para o
Tailwind "achar" que a classe está em uso e gerá-la, mesmo sem nenhum
template referenciando-a de verdade. Isso mascara silenciosamente um
teste de purge (já aconteceu nesta sessão — ver DECISIONS.md). Prefira
descrever o padrão (`bg-{cor}-{escala}`) em vez de escrever a classe
completa quando for só ilustrar a convenção.

Tema do Angular Material (`mat.define-theme`, paleta azure/blue) também
está em `src/styles.scss` — necessário porque `confirmation-dialog` e
`table` (em `packages/ui`) usam `MatDialog`/`MatTooltip`.

## Ícones

Convenção herdada do legado: **pasta própria de SVGs**, não `MatIcon` nem
lib de terceiro (Lucide/Heroicons). Arquivos em
`src/assets/imgs/icons/*.svg`, copiados para a raiz do build via
`angular.json` → `assets` (`{ glob: "**/*", input: "src/assets/imgs" }`) e
referenciados nos templates como `<img src="./icons/NomeDoIcone.svg">`.

Só os ícones **efetivamente usados** foram trazidos até agora —
`Export.svg` e `Info.svg`, porque são os únicos referenciados direto no
template de um componente de `packages/ui` (não vêm de `@Input()` de quem
consome). Qualquer outro ícone (ex.: `Check.svg`, `Close.svg`,
`Delete.svg`, `Edit.svg` — usados via `action.icon` em `<table-custom>`)
só precisa ser copiado de `legado/whale-ui/src/assets/imgs/icons/` quando
uma tela de verdade passar a usá-lo — não copiar a pasta inteira (115
arquivos) de uma vez.

## Máscaras de mercado BR

CPF/CNPJ, telefone e moeda já disponíveis via `@alicercei/ui`
(`input-custom` com `type="cpf-cnpj"|"phone"|"currency"`) — não recriar.

## Acessibilidade e nomenclatura

- HTML semântico antes de estilização — `<button>` real para qualquer
  elemento clicável, nunca `<div>`/`<i>` com `(click)`. **Achado real,
  não hipotético**: `toast.component.html` (`packages/ui`) tem `<i
  class="fa-solid fa-xmark close" (click)="removeToast(toast.id)"></i>` —
  ícone com clique, não um `<button>`. É exatamente o padrão herdado do
  legado que este requisito pede pra não repetir. Não corrigido nesta
  tarefa (fora do escopo de validar `apps/web/CLAUDE.md`), registrado
  aqui para não virar referência ao construir uma tela nova.
- ARIA label em componente customizado sem texto visível óbvio — o mesmo
  ícone de fechar do `toast` acima não tem `aria-label`/`aria-hidden`;
  serve de exemplo do que evitar.
- Nome de componente/variável consistente com a nomenclatura já usada em
  `packages/ui` — não introduzir convenção nova só em `apps/web`.
  `packages/ui` usa seletor kebab-case sem prefixo (`button-custom`,
  `input-custom`, `select-custom`, `table-custom`, `avatar`, `toast`,
  `dialog`, `calendar`, `uploader`), sufixo `-custom` só quando o nome
  puro colide com tag HTML nativa. Seguir esse padrão em componentes de
  feature de `apps/web`, que usam prefixo `app-` (já configurado em
  `angular.json` → `"prefix": "app"` — ex. `app-orcamento-form`, não um
  terceiro estilo). **Achado**: `confirmation-dialog.component.ts` é o
  único componente de `packages/ui` com seletor `app-confirmation-dialog`
  (prefixo `app-`, inconsistente com todos os outros) — não seguir esse
  outlier como referência, ele é a exceção, não o padrão.

## Testabilidade

- Componente pequeno, responsabilidade única — mesma régua já registrada
  em `apps/api/CLAUDE.md` ("Responsabilidade única"): se a descrição do
  que o componente faz precisa de "e" no meio, dividir.
- Lógica de negócio (cálculo, formatação, regra de validação condicional)
  em service/função pura, testável sem `TestBed` completo — o componente
  chama o service, o teste do service não monta o Angular inteiro.
- Teste de integração cobre pelo menos um cenário de erro (ex.: API
  retorna 404/500), não só o caminho feliz — liga direto com "Resiliência
  de UI" acima (o teste de erro é o que garante que o estado de erro
  realmente aparece).

## Segurança de front

- Nunca `[innerHTML]` com dado não confiável, nem
  `DomSanitizer.bypassSecurityTrustHtml`/equivalente sem necessidade real
  documentada. **Já existe um uso de `[innerHTML]` em `packages/ui`**:
  `confirmation-dialog.component.html` (`[innerHTML]="messageHTML"`),
  com `messageHTML` vindo cru de `MAT_DIALOG_DATA` (quem abre o dialog
  decide o conteúdo). Não usa `bypassSecurityTrustHtml` — o sanitizador
  default do Angular permanece ativo, não é XSS aberto — mas qualquer
  novo uso desse padrão continua sem bypass, a menos que haja necessidade
  real e documentada aqui.
- **Achado à parte, no mesmo arquivo**: `confirmation-dialog.component.ts`
  tem um `console.log(data)` (linha 40) — log de debug esquecido, loga o
  payload inteiro passado ao dialog. Não removido nesta tarefa (fora do
  escopo desta validação), mas é exatamente o tipo de coisa que a regra
  de "remover console.log" abaixo pede pra pegar antes do build de
  produção.
- CSP no nível de deploy — **não configurado hoje**: nem
  `apps/web/nginx.conf` (sem `add_header Content-Security-Policy`) nem
  `apps/web/vercel.json` (sem bloco `headers`) definem CSP. Lacuna real
  encontrada agora, não implementada nesta tarefa (mudar
  `nginx.conf`/`vercel.json` é além do escopo de validar o `CLAUDE.md`).
- **Token em cookie httpOnly — reportar antes de implementar, não
  implementado nesta tarefa.** Estado atual da API
  (`apps/api/src/common/auth/jwt.strategy.ts`): o token é extraído de
  `Authorization: Bearer` via `ExtractJwt.fromAuthHeaderAsBearerToken()`,
  não de cookie. Trocar para cookie httpOnly exigiria, no mínimo: a API
  emitir `Set-Cookie` no login (endpoint ainda não existe — bloqueado
  pelo schema pendente) com `SameSite=None; Secure` (obrigatório porque
  `apps/web`/`apps/api` são domínios diferentes — Vercel + VPS), e o
  `JwtStrategy` trocar a extração para ler o cookie em vez do header. O
  CORS da API já tem `credentials: true` (`apps/api/src/main.ts`) — pré-
  requisito para isso funcionar, mas não é a decisão de usar cookie em
  si. Reportado; aguardando decisão antes de implementar dos dois lados.
- Guard de rota (`CanActivate`) é UX (evita renderizar tela pra quem
  claramente não devia ver), nunca autorização real — a validação de
  verdade é responsabilidade do backend (ver `apps/api/CLAUDE.md`,
  "Autenticação e multi-tenancy"). Guard que "esconde" uma tela não
  substitui o endpoint validar de novo no servidor.
- IDs na URL: navegação interna do app usa o identificador não sequencial
  já existente (UUID, chave interna) — nunca id sequencial. Link público
  compartilhável (ex.: orçamento enviado ao cliente) usa o **slug** já
  especificado em `apps/api/CLAUDE.md` ("Identificadores públicos"). Os
  dois não se contradizem: slug é para o que é deliberadamente
  compartilhado fora do sistema, UUID é para navegação interna que não
  deveria ser adivinhável por quem só tem acesso ao app.
- 403 e 404 tratados de forma visualmente idêntica na UI (mesma tela de
  "não encontrado", nunca uma mensagem que distinga "existe mas você não
  pode ver" de "não existe") — consistente com a API sempre devolver 404
  (nunca 403) quando o recurso pertence a outro tenant (ver
  `apps/api/CLAUDE.md`).
- Nunca esconder dado sensível só via `*ngIf`/CSS quando ele não deveria
  ter chegado do backend em primeiro lugar — se uma tela não pode mostrar
  um campo, a responsabilidade é o backend não enviar esse campo (ver
  `apps/api/CLAUDE.md`, "resposta HTTP nunca trafega campo não
  solicitado"), não o front receber e esconder visualmente.
- Remover `console.log` de dado sensível do build de produção — **hoje
  não há nada automatizado garantindo isso**: `apps/web` não tem
  `eslint.config.js` próprio (a regra `no-console` de
  `packages/config/eslint/base.js` existe mas não está conectada a este
  app), e o builder de produção (`@angular/build:application`, em
  `angular.json`) não remove `console.*` automaticamente (esbuild só faz
  isso com a opção `drop`, que o Angular CLI não expõe por padrão). Até
  isso ser resolvido — criar `eslint.config.js` em `apps/web` estendendo
  o base compartilhado e/ou decidir uma forma de strip em build — a
  prevenção é disciplina de code review, não presumir que o build já
  protege.

## Feature flags

- Flag consumida via service/guard, escondendo rota (`canActivate`) ou
  funcionalidade (`@if` no template) condicionalmente — nunca espalhar
  `if` de flag direto em vários componentes sem passar por um único
  service que resolve o valor.
- Se a flag esconde algo sensível, confirmar que o backend também
  bloqueia o mesmo endpoint/ação — flag de front nunca é a camada de
  segurança real, só UX de "ainda não mostrar isso".
- **Não criar um segundo sistema de flag só no front.** O mecanismo
  definido em `apps/api/CLAUDE.md` (env var lida por `ConfigService`, ou
  tabela) vive no backend — uma env var Angular (`environment.ts`) seria
  compilada no bundle e exigiria novo deploy pra mudar, o que anula o
  ponto de a flag não exigir deploy. Na prática: o valor da flag é lido
  do backend em runtime (ex.: endpoint de config/sessão que expõe as
  flags ativas), o front nunca mantém sua própria cópia independente
  como fonte de verdade.

## Ordem de prioridade ao implementar a primeira tela

1. `OnPush` + Signals em todo componente novo (ver "Performance"/"Estado
   e dados").
2. Loading / error / empty state em toda tela (ver "Resiliência de UI").
3. Estrutura por feature desde o início, mesmo com poucas telas ainda
   (ver "Arquitetura e organização") — não adiar a organização por
   feature "pra quando tiver mais telas".

## Rodando localmente

```bash
npm install
npm run start --workspace=apps/web
```

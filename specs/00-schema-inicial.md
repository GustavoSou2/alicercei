# 00 — Schema inicial

> Diferente das specs 01–05, esta não é um corte vertical de comportamento
> de usuário — é a fundação técnica que todas as outras dependem. Existe
> como spec própria porque o schema é um contrato fechado (nomes de
> campo, tipos, enums) que não pode ficar "a decidir durante a
> implementação" sem quebrar o corte vertical das specs seguintes.

## Objetivo

O schema Prisma tem todas as entidades e campos que as specs 00b/01–05
precisam para serem implementadas sem nenhuma alteração de schema no meio
do caminho, com isolamento por tenant já desenhado.

## Critério de sucesso mensurável

- `npx prisma validate` e `npx prisma migrate dev` rodam sem erro contra
  um Postgres vazio.
- Cada uma das specs 00b/01–05 consegue expressar 100% do seu "Contrato
  de interface" usando só os modelos/campos definidos aqui — se uma spec
  precisar de um campo novo, esta spec (00) está incompleta, não a outra.
- Toda tabela de domínio tem `companyId` indexado e com FK real para
  `Company` (isolamento por tenant).
- Todo enum de status tem um valor inicial explícito como `@default`, sem
  nenhum status representado por `null`.

## Decisões já tomadas (não reabrir)

- Índice em `companyId` e toda FK — `apps/api/CLAUDE.md`, "Banco de dados
  e performance de query".
- Nomenclatura do schema em inglês, sem abreviação obscura —
  `apps/api/CLAUDE.md`, "Nomenclatura".
- `Company` e `User` existem desde já como entidades próprias — spec 00b
  (autenticação), que decidiu registro/login com múltiplos usuários para
  a v1. `companyId` nas tabelas de domínio (`Project`/`Budget`) agora é
  FK real para `Company`, não mais coluna solta sem FK; a pergunta em
  aberto que existia em `PROGRESS.md` sobre a existência do model
  `Company` está resolvida por essa mesma decisão.
- Todo campo de status nasce com valor inicial explícito — mesma seção
  acima.
- Prisma 7 com driver adapter `@prisma/adapter-pg` (Postgres) — já
  configurado em `PrismaService`, nenhuma mudança aqui.

## Os 3 cenários (adaptado — spec técnica, não de usuário)

- **Happy**: `prisma migrate dev` roda contra um Postgres vazio, cria as
  5 tabelas de domínio + índices, `prisma validate` não acusa nada.
- **Sad**: alguém tenta adicionar um campo obrigatório sem `@default` a
  uma tabela que already tem linhas — n/a para esta migração inicial
  (banco vazio), mas é a regra a seguir em qualquer migração futura sobre
  este schema (nunca `NOT NULL` sem `@default` ou um passo de backfill).
- **Edge**: uma query de domínio é escrita sem filtrar `companyId` — como
  não há Prisma Client Extension ainda (adiada, ver
  `apps/api/CLAUDE.md`), nada impede isso automaticamente hoje; a
  prevenção é code review, não o schema.

## Contrato de interface — modelos Prisma propostos

```prisma
enum ProjectStatus {
  ACTIVE
  CLOSED
}

enum BudgetStatus {
  DRAFT
  SENT
  APPROVED
  REJECTED
}

enum ExecutionStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum PaymentStatus {
  PENDING
  RECEIVED
}

model Company {
  id                     String    @id @default(uuid())
  name                   String
  joinCode               String    @unique
  savedCashBalance       Decimal?
  savedCashBalanceUpdatedAt DateTime?
  createdAt              DateTime  @default(now())
  users                  User[]
  projects               Project[]
  budgets                Budget[]

  @@index([joinCode])
}

model User {
  id           String   @id @default(uuid())
  companyId    String
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  company      Company  @relation(fields: [companyId], references: [id])

  @@index([companyId])
}

model Project {
  id                String          @id @default(uuid())
  companyId         String
  clientName        String
  clientContact     String?
  serviceDescription String
  status            ProjectStatus   @default(ACTIVE)
  executionStatus   ExecutionStatus @default(NOT_STARTED)
  paymentStatus     PaymentStatus   @default(PENDING)
  createdAt         DateTime        @default(now())
  closedAt          DateTime?
  company           Company         @relation(fields: [companyId], references: [id])
  budgets           Budget[]

  @@index([companyId])
}

model Budget {
  id            String       @id @default(uuid())
  companyId     String
  projectId     String
  publicSlug    String       @unique
  status        BudgetStatus @default(DRAFT)
  markupPercent Decimal      @default(20)
  validUntil    DateTime
  totalAmount   Decimal      @default(0)
  createdAt     DateTime     @default(now())
  sentAt        DateTime?
  approvedAt    DateTime?
  company       Company      @relation(fields: [companyId], references: [id])
  project       Project      @relation(fields: [projectId], references: [id])
  items         BudgetItem[]

  @@index([companyId])
  @@index([projectId])
}

model BudgetItem {
  id                String    @id @default(uuid())
  budgetId          String
  description       String
  quantity          Decimal
  unitPrice         Decimal
  originalUnitPrice Decimal?
  repricedAt        DateTime?
  budget            Budget    @relation(fields: [budgetId], references: [id])

  @@index([budgetId])
}
```

**Campos marcados como inferência, não texto literal do TO-BE** (aplicando
o teste do gap de inferência — declarados aqui para não virar suposição
silenciosa):
- `Project.clientContact`: TO-BE não pede explicitamente um campo de
  contato estruturado; incluído porque a spec 02 (PDF/link público)
  precisa de algum jeito de "enviar ao cliente". Confirmar se isso é
  telefone, e-mail, ou nenhum dos dois (só um link copiável).
- `Budget.markupPercent` com default 20: TO-BE seção 4 diz que o pai "já
  aplica cerca de 20%" informalmente — usado aqui como default editável,
  não como regra fixa do sistema.
- `PaymentStatus` com só `PENDING`/`RECEIVED` (sem parcial): TO-BE não
  menciona pagamento parcial; se isso existir na prática, é extensão
  futura, não construída agora.
- `totalAmount` armazenado (não calculado on-the-fly): decisão técnica
  para evitar recalcular a soma dos itens a cada leitura — recalculado e
  persistido a cada escrita em `BudgetItem` (dentro da mesma
  `$transaction`, ver `apps/api/CLAUDE.md`).
- `Company.joinCode`, `Company.savedCashBalance`/
  `savedCashBalanceUpdatedAt`: não vêm do TO-BE literal. `joinCode` é
  exigido pelo fluxo de registro da spec 00b (segundo usuário se junta a
  uma empresa existente por código, não por convite de e-mail).
  `savedCashBalance`/`savedCashBalanceUpdatedAt` são exigidos pela spec
  05 (fôlego de caixa, escopo simplificado — saldo informado
  manualmente).

## Escopo negativo

- Nenhuma tabela para as camadas opcionais (Plano de ação, Aprovação
  formal, Colaboradores/terceiros, Custos e perdas, Folha CLT) — TO-BE
  seção 6/8, fora da v1.
- Nenhuma tabela de auditoria/histórico genérico — `originalUnitPrice`/
  `repricedAt` cobrem só o caso específico de reprecificação que a spec
  03 precisa, não um log genérico de mudanças.
- Nenhuma modelagem de custo/despesa própria (contas a pagar, categorias
  de gasto) — a spec 05 deriva o gasto médio direto de
  `Budget.totalAmount`/`markupPercent`, sem precisar de uma tabela de
  custos.
- Nenhum papel/permissão por usuário (`User` não tem campo de role) —
  spec 00b, escopo negativo.

## Dependências

Spec 00b (autenticação) — os models `Company`/`User` acima existem por
causa das decisões tomadas ali; na ordem de implementação o schema
(esta spec) ainda vem primeiro, mas o *conteúdo* desses dois models é
definido pela 00b, não por esta spec isoladamente.

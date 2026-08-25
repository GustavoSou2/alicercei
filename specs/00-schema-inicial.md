# 00 — Schema inicial

> Diferente das specs 01–05, esta não é um corte vertical de comportamento
> de usuário — é a fundação técnica que todas as outras dependem. Existe
> como spec própria porque o schema é um contrato fechado (nomes de
> campo, tipos, enums) que não pode ficar "a decidir durante a
> implementação" sem quebrar o corte vertical das specs seguintes.

## Objetivo

O schema Prisma tem todas as entidades e campos que as specs 01–05
precisam para serem implementadas sem nenhuma alteração de schema no meio
do caminho, com isolamento por tenant já desenhado.

## Critério de sucesso mensurável

- `npx prisma validate` e `npx prisma migrate dev` rodam sem erro contra
  um Postgres vazio.
- Cada uma das specs 01–05 consegue expressar 100% do seu "Contrato de
  interface" usando só os modelos/campos definidos aqui — se uma spec
  precisar de um campo novo, esta spec (00) está incompleta, não a outra.
- Toda tabela de domínio tem `companyId` indexado (isolado por tenant,
  mesmo sem model `Company` — ver "Decisão pendente" abaixo).
- Todo enum de status tem um valor inicial explícito como `@default`, sem
  nenhum status representado por `null`.

## Decisões já tomadas (não reabrir)

- Índice em `companyId` e toda FK — `apps/api/CLAUDE.md`, "Banco de dados
  e performance de query".
- Nomenclatura do schema em inglês, sem abreviação obscura —
  `apps/api/CLAUDE.md`, "Nomenclatura".
- Não criar model `Company`/`Tenant` ainda; `companyId` existe como
  coluna solta (sem FK) — `apps/api/CLAUDE.md`, "Multi-tenancy e 'status
  configurável por empresa' — pendentes de schema"; pergunta em aberto
  registrada em `PROGRESS.md`.
- Todo campo de status nasce com valor inicial explícito — mesma seção
  acima.
- Prisma 7 com driver adapter `@prisma/adapter-pg` (Postgres) — já
  configurado em `PrismaService`, nenhuma mudança aqui.

## ⚠️ Decisão pendente, não resolvida nesta spec — bloqueia a implementação

`alicercei-to-be.md`, seção 5, registra que a v1 é "usuário único (sem
tela de login)". As specs 01–05 abaixo assumem que existe alguma forma de
identificar `companyId` em cada request (a infraestrutura de
`JwtAuthGuard`/`JwtStrategy` já existe em `apps/api` e assume um token
Bearer). **Sem tela de login, de onde vem esse token/`companyId`?** Duas
saídas possíveis, nenhuma decidida:

1. Um usuário/token é provisionado uma vez via seed (não uma tela de
   criação de conta) e o app guarda esse token localmente — mantém o
   guard JWT ativo, sem exigir login visível.
2. As rotas de domínio ficam `@Public()` para a v1 (sem autenticação
   real), aceitando o risco por ser uso interno de uma pessoa só.

Isso muda o schema (opção 1 exige pelo menos uma tabela `users` mínima
para o seed existir; opção 2 não exige nenhuma). **Não decidido aqui —
reportar ao usuário antes de implementar esta spec.** O restante deste
documento assume a opção 1 (menor risco, reaproveita infraestrutura já
construída) só para poder especificar algo concreto — trocar para a
opção 2 remove o model `User` abaixo sem afetar mais nada.

## Os 3 cenários (adaptado — spec técnica, não de usuário)

- **Happy**: `prisma migrate dev` roda contra um Postgres vazio, cria as
  4 tabelas de domínio + índices, `prisma validate` não acusa nada.
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

## Escopo negativo

- Nenhum model `Company`/`Tenant` (pergunta em aberto em `PROGRESS.md`).
- Nenhum model de segundo usuário/multi-perfil (TO-BE seção 5/8, decisão
  pendente).
- Nenhuma tabela para as camadas opcionais (Plano de ação, Aprovação
  formal, Colaboradores/terceiros, Custos e perdas, Folha CLT) — TO-BE
  seção 6/8, fora da v1.
- Nenhuma tabela de auditoria/histórico genérico — `originalUnitPrice`/
  `repricedAt` cobrem só o caso específico de reprecificação que a spec
  03 precisa, não um log genérico de mudanças.
- Nenhuma modelagem de custo/despesa (necessária só se a spec 05 decidir
  incluir cálculo de fôlego de caixa — ver "Decisão a confirmar" na spec
  05).

## Dependências

Nenhuma — é a base das specs 01–05.

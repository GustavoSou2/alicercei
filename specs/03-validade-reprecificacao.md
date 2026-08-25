# 03 — Validade do orçamento + reprecificação fácil antes de aprovar

Origem: `alicercei-to-be.md`, seção 3, prioridade 3, e seção 7 (os 3
cenários já vêm prontos do TO-BE) — "geralmente o prejuízo sai do meu
bolso" quando material sobe de preço entre o orçamento e a aprovação
[pai disse].

## Objetivo

O usuário sabe quando um orçamento está prestes a vencer ou já venceu, e
consegue corrigir o preço de um item específico sem refazer o orçamento
inteiro, deixando claro que algo mudou desde a criação.

## Critério de sucesso mensurável

- Todo `Budget` com `status = SENT` expõe, em toda leitura, se está
  vencido (`isExpired`, calculado a partir de `validUntil` vs. agora) —
  não existe um estado intermediário "talvez vencido".
- Reprecificar um item exige só o novo `unitPrice` — nenhum outro campo
  do orçamento precisa ser reenviado.
- Depois de reprecificar, o item mostra visualmente que o preço mudou
  desde a criação (comparação com `originalUnitPrice`) — não é uma
  mudança silenciosa.
- Aprovar um orçamento vencido é bloqueado pela API (não só pela UI) —
  tentar aprovar com `isExpired = true` retorna erro, não sucesso.

## Decisões já tomadas (não reabrir)

- Validação de regra de negócio (orçamento vencido não pode ser
  aprovado) acontece no backend, não só escondida no front —
  `apps/web/CLAUDE.md`, "Segurança de front": "guard de rota é UX, nunca
  autorização real"; o mesmo vale para regra de negócio exposta só como
  botão desabilitado.
- `originalUnitPrice`/`repricedAt` já existem no schema (spec 00) — esta
  spec é quem primeiro os usa de verdade.
- `Budget.totalAmount` é recalculado e persistido a cada reprecificação,
  dentro de uma transação junto com a atualização do item —
  `apps/api/CLAUDE.md`, "Banco de dados e performance de query"
  (`$transaction`).
- Resposta de erro ao tentar aprovar orçamento vencido segue o formato
  de erro documentado (e ainda em conflito, não resolvido) em
  `apps/api/CLAUDE.md`, "Erros e resposta".
- Tela mostra loading/error/empty e usa Signals/OnPush —
  `apps/web/CLAUDE.md`, "Performance"/"Resiliência de UI".

## Os 3 cenários

Reaproveitados de `alicercei-to-be.md`, seção 7 ("Orçamento (com validade
e reprecificação)"), sem reescrever:

- **Happy**: orçamento criado rápido, com margem aplicada, PDF exportado
  na hora, cliente aprova dentro da validade.
- **Sad**: cliente demora a aprovar e a validade expira — sistema
  sinaliza que o preço pode estar desatualizado antes de qualquer ação
  (não deixa aprovar sem esse aviso).
- **Edge**: preço de material sobe entre a criação e a aprovação —
  sistema permite reprecificar o item específico sem refazer o orçamento
  inteiro, e deixa claro pro usuário que algo mudou desde a criação.

## Contrato de interface

`PATCH /budgets/:budgetId/items/:itemId`

Request:
```json
{ "unitPrice": "number >= 0, obrigatório" }
```
Regra: só permitido se `Budget.status` for `DRAFT` ou `SENT` (não
`APPROVED`/`REJECTED`). Ao aplicar: se `originalUnitPrice` ainda é nulo,
recebe o valor atual de `unitPrice` antes da troca; `repricedAt` recebe
a data/hora atual; `Budget.totalAmount` é recalculado.

Response `200`:
```json
{
  "itemId": "uuid",
  "unitPrice": "number",
  "originalUnitPrice": "number, presente só se já foi repricado",
  "repricedAt": "string ISO 8601, presente só se já foi repricado",
  "budgetTotalAmount": "number, total recalculado do orçamento inteiro"
}
```

`GET /budgets/:budgetId` (leitura usada pela tela) inclui, além dos
campos já existentes:
```json
{
  "isExpired": "boolean, calculado: validUntil < agora",
  "items": [
    { "...": "campos existentes", "wasRepriced": "boolean" }
  ]
}
```

`POST /budgets/:budgetId/approve`

Response `200` (sucesso): `{ "status": "APPROVED", "approvedAt": "string ISO 8601" }`

Response erro (quando `isExpired = true` no momento da aprovação): `409
Conflict`, corpo no formato de erro vigente (ver nota no spec 01 sobre o
conflito Problem Details ainda não resolvido), mensagem indicando que o
orçamento venceu e precisa de reprecificação/nova validade antes de
aprovar.

## Escopo negativo

- Não inclui renovar a validade de um orçamento vencido automaticamente
  — se isso for necessário, é uma ação explícita (ex.: reabrir como
  `DRAFT` com nova `validUntil`), não coberta por esta spec.
- Não inclui reprecificar mais de um item numa única chamada (é item por
  item, deliberado — TO-BE: "reprecificar o item específico", não o
  orçamento inteiro).
- Não inclui notificar o cliente automaticamente quando um item é
  repricado — o usuário reenvia o link/PDF manualmente (spec 02).
- Não inclui workflow de aprovação formal/múltiplos aprovadores — TO-BE
  seção 6, camada opcional fora da v1.

## Dependências

- Spec 00 (schema).
- Spec 01 (orçamento rápido — precisa de um `Budget` com itens já
  criado).

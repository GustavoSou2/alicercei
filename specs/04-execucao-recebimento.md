# 04 — Execução → Recebimento (trilhas independentes)

Origem: `alicercei-to-be.md`, seção 2 e 3 (prioridade 4) — "esse é o
estado mais comum e o que mais importa para a previsibilidade financeira"
[pai disse].

## Objetivo

O usuário acompanha, para um projeto com orçamento aprovado, o status do
serviço (execução) e o status do pagamento (recebimento) como duas
informações independentes uma da outra.

## Critério de sucesso mensurável

- `executionStatus` e `paymentStatus` de um `Project` mudam por
  chamadas/ações separadas — mudar um nunca muda o outro como efeito
  colateral.
- É possível representar e visualizar o estado "serviço concluído,
  pagamento pendente" sem nenhum campo/flag adicional além dos dois
  status já existentes (spec 00) — é o estado mais comum no caso
  fundador (TO-BE seção 3/7) e não pode exigir gambiarra pra existir.
- Só é possível mudar `executionStatus`/`paymentStatus` de um projeto
  cujo `Budget` está `APPROVED` — TO-BE section 2 (core flow: execução
  vem depois de orçamento aprovado, não antes).

## Decisões já tomadas (não reabrir)

- Execução e Recebimento são trilhas de estado independentes — já
  registrado em `DECISIONS.md`, "[2026-08-24] Execução e Recebimento
  como trilhas independentes" — esta spec implementa essa decisão, não a
  reabre.
- Toda checagem de permissão/regra de negócio (aqui: só mudar status se
  o orçamento estiver aprovado) valida no backend — `apps/api/CLAUDE.md`,
  "Autenticação e multi-tenancy"/"Segurança de front" (lado do guard de
  rota, que é só UX).
- Toda query filtra por `companyId` — `apps/api/CLAUDE.md`,
  "Autenticação e multi-tenancy".
- Tela usa loading/error/empty e Signals/OnPush —
  `apps/web/CLAUDE.md`, "Performance"/"Resiliência de UI".

## Os 3 cenários

Reaproveitados de `alicercei-to-be.md`, seção 7 ("Execução /
Recebimento"):

- **Happy**: serviço concluído e pagamento recebido no mesmo período.
- **Sad**: pagamento não registrado depois do prazo esperado — sistema
  sinaliza, não bloqueia (não impede o usuário de continuar usando o
  projeto).
- **Edge**: serviço concluído, pagamento pendente — estado comum e
  esperado, aparece com destaque (não como um erro/alerta agressivo).

## Contrato de interface

`PATCH /projects/:id/execution-status`

Request: `{ "status": "IN_PROGRESS" | "COMPLETED" }`
(transição de `NOT_STARTED` só é permitida via essas duas; não existe
transição de volta para `NOT_STARTED` nesta spec — se for necessário
desfazer, é fora de escopo aqui.)

Response `200`: `{ "executionStatus": "string", "updatedAt": "string ISO 8601" }`

Erro `409` se o `Project` não tiver nenhum `Budget` com `status =
APPROVED`.

`PATCH /projects/:id/payment-status`

Request: `{ "status": "RECEIVED" }`
(de `PENDING` para `RECEIVED` — unidirecional nesta spec; reverter para
`PENDING` não é um caso de uso descrito no TO-BE.)

Response `200`: `{ "paymentStatus": "string", "updatedAt": "string ISO 8601" }`

`GET /projects/:id` (leitura usada pela tela) inclui:
```json
{
  "executionStatus": "NOT_STARTED | IN_PROGRESS | COMPLETED",
  "paymentStatus": "PENDING | RECEIVED"
}
```
Os dois campos aparecem sempre juntos e claramente rotulados como
independentes — a tela nunca combina os dois num único "status do
projeto".

## Escopo negativo

- Não inclui pagamento parcial (`PaymentStatus` só tem `PENDING`/
  `RECEIVED` — spec 00 já registra isso como possível extensão futura,
  não construída agora).
- Não inclui datas de previsão/vencimento de pagamento — isso é o que a
  spec 05 (previsibilidade) consome a partir destes status, não algo que
  esta spec adiciona ao schema.
- Não inclui múltiplas etapas de execução (ex.: 30%/60%/100%) — TO-BE
  descreve um status único de execução, não um percentual.
- Não inclui notificação automática de pagamento pendente vencido.

## Dependências

- Spec 00 (schema).
- Spec 01 (orçamento rápido — precisa de `Project`/`Budget`).
- Spec 03 (validade/reprecificação — precisa que o `Budget` chegue a
  `APPROVED`, que é implementado ali).

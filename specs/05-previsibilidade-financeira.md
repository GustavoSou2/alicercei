# 05 — Previsibilidade financeira simplificada

Origem: `alicercei-to-be.md`, seção 3, prioridade 5 — "só é confiável se
o item 3 existir — sem reprecificação, a previsão parte de um preço já
defasado" [pai disse + dependência técnica].

## Decisão (antes "a confirmar", agora resolvida)

TO-BE (ponto central, seção 1) descreve dois números: "o que já está
garantido pra entrar" **e** "por quanto tempo o caixa aguenta". O
primeiro é 100% derivável dos dados já modelados (specs 00–04). O
segundo (fôlego de caixa) exigiria, na leitura literal, saber a
despesa/custo mensal do usuário — e isso é o que a TO-BE seção 6/8 marca
como camada opcional "Custos e perdas", fora da v1.

**Resolvido com um escopo simplificado, sem depender de nenhuma camada
de custos/perdas:** o fôlego de caixa combina um saldo guardado
informado manualmente pelo usuário (`Company.savedCashBalance`, spec 00)
com um gasto médio mensal *derivado* dos próprios orçamentos já
registrados — não de uma tabela de custos nova, não de um segundo campo
manual de "gasto fixo mensal". A ideia: `Budget.totalAmount` já é preço
com markup aplicado (`totalAmount = custoBase × (1 + markupPercent /
100)`); revertendo essa conta, `custoBase = totalAmount / (1 +
markupPercent / 100)` é uma estimativa razoável de quanto o usuário
gastou (material/mão de obra) para entregar aquele orçamento — dado que
já existe no schema desde a spec 00, sem precisar de nenhum registro de
despesa real.

## Objetivo

O usuário vê, num único lugar, quanto já está garantido para entrar
(orçamentos aprovados, serviço concluído, pagamento ainda pendente) e
por quantos meses o saldo guardado aguenta no ritmo atual de gasto —
sem precisar somar isso manualmente nem manter um módulo de custos.

## Critério de sucesso mensurável

- O valor de "garantido pra entrar" é a soma de `Budget.totalAmount` de
  todo `Project` cujo `Budget` está `APPROVED`, `executionStatus =
  COMPLETED` e `paymentStatus = PENDING` — nenhuma soma manual, nenhuma
  planilha.
- O número reflete reprecificações já aplicadas (spec 03) — nunca soma
  um `unitPrice` desatualizado, porque `totalAmount` já é recalculado a
  cada reprecificação (spec 00/03).
- Atualiza (na próxima leitura, não precisa ser tempo real) assim que um
  projeto muda para `paymentStatus = RECEIVED` — o valor sai da soma.
- O gasto médio mensal é calculado automaticamente a partir dos
  `Budget` com `status = APPROVED` — sem exigir nenhum input de custo
  do usuário além do saldo guardado.
- O fôlego de caixa (em meses) é `savedCashBalance / averageMonthlySpend`
  — recalculado a cada leitura, nunca armazenado desatualizado.

## Decisões já tomadas (não reabrir)

- Depende de `Budget.status = APPROVED` (spec 03) e dos dois status
  independentes de execução/recebimento (spec 04) — já decidido que são
  trilhas separadas, `DECISIONS.md`.
- Se esta consulta virar uma agregação pesada (muitos projetos), avaliar
  índice composto (`companyId`, `executionStatus`, `paymentStatus`) —
  `apps/api/CLAUDE.md`, "Banco de dados e performance de query" — não
  necessário no volume esperado da v1 (uso de uma pessoa só), mas
  registrado aqui como critério, não decisão a aplicar já.
- Toda query filtra por `companyId` — `apps/api/CLAUDE.md`,
  "Autenticação e multi-tenancy".
- Se este valor for cacheado no futuro, é dado que tolera alguma
  defasagem (contador agregado) — `apps/api/CLAUDE.md`, "Cache" —
  mas a v1 não implementa cache aqui, calcula direto na leitura.
- **Cálculo do gasto médio mensal:** soma de `totalAmount / (1 +
  markupPercent / 100)` de todo `Budget` com `status = APPROVED` nos
  últimos 3 meses corridos (ou desde o `Budget` aprovado mais antigo, se
  o histórico do usuário tiver menos de 3 meses), dividida pelo número
  de meses considerados. Não depende de nenhuma tabela de custo — só de
  campos que já existem em `Budget` desde a spec 00.
- `Company.savedCashBalance` é sempre informado manualmente pelo
  usuário — nenhuma integração bancária, nenhum cálculo automático a
  partir de outro dado do sistema.

## Os 3 cenários

Não há cenário pronto na TO-BE seção 7 para esta prioridade
especificamente — adaptados a partir do objetivo, sem inventar um
genérico solto:

- **Happy**: usuário abre a tela e vê a soma de tudo que está garantido
  pra entrar (batendo com o que ele calcularia à mão) e, como já
  informou o saldo guardado e tem orçamentos aprovados recentes, vê por
  quantos meses esse saldo aguenta no ritmo atual de gasto.
- **Sad**: usuário ainda não informou `savedCashBalance` — a tela mostra
  um estado vazio explícito pedindo essa informação ("informe seu saldo
  guardado pra ver o fôlego de caixa"), não um número zerado ou ausente
  sem explicação.
- **Edge**: usuário já informou o saldo, mas ainda não tem nenhum
  `Budget APPROVED` (empresa nova, sem histórico) — `averageMonthlySpend`
  e `monthsOfRunway` vêm como `null` com uma mensagem de "sem histórico
  suficiente pra estimar", nunca uma divisão por zero ou um número
  enganoso.

## Contrato de interface

`GET /forecast/guaranteed-incoming`

Response `200`:
```json
{
  "totalAmount": "number, soma de Budget.totalAmount qualificados",
  "projectCount": "number, quantos projetos compõem essa soma",
  "projects": [
    {
      "projectId": "uuid",
      "clientName": "string",
      "amount": "number"
    }
  ]
}
```
Lista `projects` existe para o usuário conseguir ver o detalhe por trás
do número agregado (TO-BE: previsibilidade não é uma caixa preta) — mas
não traz nenhum campo interno além do necessário para identificar cada
projeto (resposta HTTP não trafega campo não solicitado,
`apps/api/CLAUDE.md`).

`GET /forecast/cash-runway`

Response `200`:
```json
{
  "savedCashBalance": "number, null se o usuário ainda não informou",
  "savedCashBalanceUpdatedAt": "string ISO 8601, null se nunca informado",
  "averageMonthlySpend": "number, null se não há Budget APPROVED suficiente pra estimar",
  "monthsOfRunway": "number, savedCashBalance / averageMonthlySpend; null se qualquer um dos dois for null"
}
```

`PUT /forecast/cash-balance` — único jeito de definir/atualizar o saldo
guardado.

Request:
```json
{ "savedCashBalance": "number >= 0, obrigatório, em reais (ex.: 15000.50)" }
```

Response `200`:
```json
{ "savedCashBalance": "number", "savedCashBalanceUpdatedAt": "string ISO 8601" }
```

## Escopo negativo

- Não inclui rastreamento de custo/despesa real por item ou por projeto
  (camada "Custos e perdas", TO-BE seção 6, fora da v1) —
  `averageMonthlySpend` é uma estimativa derivada do markup do próprio
  orçamento, não um registro de gasto real.
- Não inclui múltiplas contas/saldos (ex.: conta corrente + reserva
  separada) — um único `savedCashBalance` por empresa.
- Não inclui histórico do saldo informado — só o valor atual e quando
  foi atualizado por último (`savedCashBalanceUpdatedAt`), sem log de
  valores anteriores.
- Não inclui integração bancária/atualização automática do saldo —
  sempre um input manual do usuário.
- Não inclui comparação com período parado do ano anterior — TO-BE
  seção 8, explicitamente fora de escopo até existir um ciclo completo
  de uso registrado.
- Não inclui projeção/previsão de data futura de recebimento — só soma o
  que já está no estado qualificado hoje, não estima quando o pagamento
  pendente vai efetivamente entrar.
- Não inclui gráfico/visualização temporal — é um número agregado e uma
  lista, não um dashboard com série histórica.

## Dependências

- Spec 00 (schema — inclui `Company.savedCashBalance`/
  `savedCashBalanceUpdatedAt`, exigidos pelo fôlego de caixa desta spec).
- Spec 00b (autenticação — `Company` só existe no schema por causa
  dessa decisão; o saldo manual é um campo por empresa, não por usuário).
- Spec 01 (orçamento rápido).
- Spec 03 (validade/reprecificação — `totalAmount` correto depende
  disso, e `Budget.status = APPROVED` vem de lá — também é o status
  usado pelo cálculo de `averageMonthlySpend`).
- Spec 04 (execução/recebimento — os dois status que definem o que
  "qualifica" para a soma de garantido pra entrar).

# 05 — Previsibilidade financeira simplificada

Origem: `alicercei-to-be.md`, seção 3, prioridade 5 — "só é confiável se
o item 3 existir — sem reprecificação, a previsão parte de um preço já
defasado" [pai disse + dependência técnica].

## ⚠️ Decisão a confirmar antes de implementar (não decidida nesta spec)

TO-BE (ponto central, seção 1) descreve dois números: "o que já está
garantido pra entrar" **e** "por quanto tempo o caixa aguenta". O
primeiro é 100% derivável dos dados já modelados (specs 00–04). O
segundo (fôlego de caixa) exige saber a despesa/custo mensal do usuário
— e isso é exatamente o que a TO-BE seção 6/8 marca como camada opcional
"Custos e perdas", **fora da v1**. Ou seja: a prioridade 5 do jeito que
está escrita na TO-BE depende de um dado que a própria TO-BE não
autorizou coletar ainda na v1.

Duas saídas possíveis — **reportar ao usuário, não decidir sozinho**:
1. Escopo desta spec cobre só "garantido pra entrar" (metade totalmente
   suportada pelos dados existentes); "fôlego de caixa" fica para quando
   custos/despesas entrarem no produto.
2. Esta spec pede **um único número manual** (ex.: "gasto fixo mensal
   estimado", inserido direto pelo usuário, sem virar um módulo de
   custos completo) só para calcular o fôlego — não é a camada "Custos e
   perdas" da TO-BE, é um atalho mínimo.

O restante deste documento especifica a opção 1 (não exige nenhum dado
novo, não há risco de invadir escopo de "Custos e perdas") e trata a
opção 2 como decisão em aberto — se o usuário preferir a opção 2, os
campos do "Contrato de interface" abaixo precisam de um input adicional
que não existe no schema da spec 00.

## Objetivo

O usuário vê, num único lugar, quanto já está garantido para entrar
(orçamentos aprovados, serviço concluído, pagamento ainda pendente) sem
precisar somar isso manualmente.

## Critério de sucesso mensurável

- O valor mostrado é a soma de `Budget.totalAmount` de todo `Project`
  cujo `Budget` está `APPROVED`, `executionStatus = COMPLETED` e
  `paymentStatus = PENDING` — nenhuma soma manual, nenhuma planilha.
- O número reflete reprecificações já aplicadas (spec 03) — nunca soma
  um `unitPrice` desatualizado, porque `totalAmount` já é recalculado a
  cada reprecificação (spec 00/03).
- Atualiza (na próxima leitura, não precisa ser tempo real) assim que um
  projeto muda para `paymentStatus = RECEIVED` — o valor sai da soma.

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

## Os 3 cenários

Não há cenário pronto na TO-BE seção 7 para esta prioridade
especificamente — adaptados a partir do objetivo, sem inventar um
genérico solto:

- **Happy**: usuário abre a tela e vê a soma de tudo que está garantido
  pra entrar, batendo com o que ele calcularia somando os projetos
  concluídos com pagamento pendente à mão.
- **Sad**: nenhum projeto está no estado "concluído + pagamento
  pendente" — a tela mostra o estado empty explícito ("nada garantido
  pra entrar no momento"), não um "R$ 0,00" ambíguo (que poderia ser lido
  como erro de cálculo).
- **Edge**: um projeto tem `Budget` vencido (`isExpired`, spec 03) mas
  ainda `APPROVED` (aprovado antes de vencer) — continua entrando na
  soma normalmente; expiração só bloqueia uma aprovação nova, não afeta
  orçamento já aprovado.

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

## Escopo negativo

- Não inclui "por quanto tempo o caixa aguenta" (fôlego de caixa) — ver
  "Decisão a confirmar" no topo; depende de dado de custo que não existe
  na v1.
- Não inclui comparação com período parado do ano anterior — TO-BE
  seção 8, explicitamente fora de escopo até existir um ciclo completo
  de uso registrado.
- Não inclui projeção/previsão de data futura de recebimento — só soma o
  que já está no estado qualificado hoje, não estima quando o pagamento
  pendente vai efetivamente entrar.
- Não inclui gráfico/visualização temporal — é um número agregado e uma
  lista, não um dashboard com série histórica.

## Dependências

- Spec 00 (schema).
- Spec 01 (orçamento rápido).
- Spec 03 (validade/reprecificação — `totalAmount` correto depende
  disso, e `Budget.status = APPROVED` vem de lá).
- Spec 04 (execução/recebimento — os dois status que definem o que
  "qualifica" para a soma).

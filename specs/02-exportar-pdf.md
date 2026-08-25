# 02 — Exportar orçamento em PDF profissional, na hora

Origem: `alicercei-to-be.md`, seção 3, prioridade 2 — resposta direta à
pergunta "se o sistema resolvesse UMA coisa só" [pai disse].

## Objetivo

O usuário gera, a partir de um orçamento já criado, um PDF com
apresentação profissional, pronto para enviar ao cliente, e recebe um
link público para esse mesmo orçamento.

## Critério de sucesso mensurável

- A partir de um `Budget` existente, o usuário consegue obter um PDF
  contendo: dados do cliente, descrição do serviço, todos os itens
  (descrição/quantidade/preço/subtotal), total com markup aplicado, e
  validade do orçamento.
- O PDF fica disponível para download em até poucos segundos após o
  pedido (não precisa ser síncrono na mesma request — ver "Decisões já
  tomadas" — mas a espera percebida pelo usuário é curta, não um
  processo em lote de minutos).
- Existe uma URL pública (`/{publicSlug}`) que não exige login e serve o
  PDF (ou uma página que o disponibiliza) do orçamento correspondente.

## Decisões já tomadas (não reabrir)

- Geração de PDF é o exemplo citado literalmente em
  `apps/api/CLAUDE.md`, "Escalabilidade e processamento assíncrono", como
  operação que **nunca bloqueia a resposta HTTP principal** — vai para
  fila (ex.: BullMQ). "Na hora" (TO-BE) é sobre percepção do usuário, não
  sobre a request ser síncrona — o contrato abaixo já é assíncrono
  (job + polling) para não violar essa convenção.
- Chamada a serviço externo (se a geração de PDF usar um serviço/lib
  externa) tem timeout e circuit breaker — mesma seção acima.
- `publicSlug` é o identificador da URL pública, não o UUID interno do
  `Budget` — `apps/api/CLAUDE.md`, "Identificadores públicos". Já existe
  desde a criação do orçamento (spec 00/01).
- Rota pública não exige guard de rota como camada de segurança — ela é
  pública por design (o slug já é o controle de acesso: só quem tem o
  link vê); não confundir com bypass de autenticação em rota que deveria
  ser protegida.
- Resposta HTTP nunca trafega campo não solicitado — a rota pública
  devolve só o necessário para exibir/baixar o orçamento (não devolve
  `companyId` nem qualquer campo interno).

## Os 3 cenários

- **Happy**: usuário pede o PDF de um orçamento com itens preenchidos,
  recebe o arquivo com layout profissional em poucos segundos, e tem um
  link pra mandar por WhatsApp.
- **Sad**: a geração do PDF falha (ex.: erro na lib de renderização) — o
  usuário vê um erro específico ("não foi possível gerar o PDF, tentar de
  novo"), não um genérico "algo deu errado" (`apps/web/CLAUDE.md`,
  "Resiliência de UI"), e pode tentar de novo sem duplicar nada.
- **Edge**: o orçamento já expirou (`validUntil` no passado) quando o
  cliente abre o link público — o PDF/página pública ainda é acessível
  (histórico não desaparece), mas sinaliza visualmente que a validade
  passou, coerente com a spec 03.

## Contrato de interface

`POST /budgets/:budgetId/pdf-exports` — inicia a geração (assíncrona).

Response `202 Accepted`:
```json
{
  "jobId": "uuid",
  "status": "PENDING"
}
```

`GET /budgets/:budgetId/pdf-exports/:jobId` — consulta o status.

Response `200`:
```json
{
  "status": "PENDING | READY | FAILED",
  "downloadUrl": "string, presente só quando status = READY"
}
```

`GET /public/budgets/:publicSlug` — rota pública (sem autenticação), usada
no link enviado ao cliente.

Response `200`:
```json
{
  "clientName": "string",
  "serviceDescription": "string",
  "items": [
    { "description": "string", "quantity": "number", "unitPrice": "number", "subtotal": "number" }
  ],
  "totalAmount": "number",
  "validUntil": "string ISO 8601",
  "isExpired": "boolean",
  "pdfUrl": "string"
}
```
Nenhum campo interno (`id` UUID, `companyId`, `status` interno do fluxo
de aprovação) aparece nesta resposta pública — só o que o cliente
precisa ver.

## Escopo negativo

- Não inclui customização de template/marca do PDF por empresa (não há
  entidade `Company` ainda — spec 00).
- Não inclui envio automático (e-mail/WhatsApp) do PDF — o usuário
  continua enviando manualmente pelo canal que já usa (TO-BE seção 4:
  áudio de WhatsApp), esta spec só entrega o arquivo/link pra ele
  compartilhar.
- Não inclui assinatura eletrônica nem aprovação via PDF — aprovação é
  tratada na spec 03, por outro mecanismo.
- Não inclui histórico de quantas vezes o PDF foi baixado/visualizado.

## Dependências

- Spec 00 (schema — `publicSlug` já existe no `Budget`).
- Spec 01 (orçamento rápido — precisa de um `Budget` com itens já criado
  para gerar o PDF a partir dele).

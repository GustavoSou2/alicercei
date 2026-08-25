# 01 — Orçamento rápido, mobile-first

Origem: `alicercei-to-be.md`, seção 3, prioridade 1 — "Um chute eu dou na
hora — o sistema só precisa ser tão rápido quanto ele já é hoje de
cabeça" [pai disse].

## Objetivo

O usuário cria um projeto com seu orçamento (cliente, serviço e itens
com preço) pelo celular, numa única ação, e vê o valor total calculado
na hora.

## Critério de sucesso mensurável

- Criar um orçamento com até 10 itens exige preencher só: nome do
  cliente, descrição do serviço, e por item (descrição, quantidade,
  preço unitário) — nenhum outro campo é obrigatório.
- O valor total (itens + markup) aparece na tela sem reload e sem uma
  segunda chamada de rede depois do submit — a resposta do próprio
  `POST` já traz o total calculado.
- Um `POST` com sucesso cria o `Project` e o `Budget` (com seus itens)
  atomicamente — não existe estado onde um foi criado e o outro não.
- Funciona em viewport mobile (não é um requisito "responsivo bonito",
  é o critério de sucesso da v1 inteira — TO-BE seção 9: "consegue,
  sozinho... pelo celular").

## Decisões já tomadas (não reabrir)

- Escrita em mais de uma tabela usa `$transaction` — `apps/api/CLAUDE.md`,
  "Banco de dados e performance de query". `Project`+`Budget`+
  `BudgetItem[]` nascem juntos, numa transação.
- Resposta HTTP nunca trafega campo não solicitado — `apps/api/CLAUDE.md`,
  "Convenções não-negociáveis". A resposta do `POST` devolve só o que a
  tela seguinte precisa, não a entidade Prisma crua.
- Todo campo de status nasce com valor inicial explícito —
  `apps/api/CLAUDE.md`, "Multi-tenancy e 'status configurável por
  empresa'". `Project.status = ACTIVE`, `Budget.status = DRAFT` desde a
  criação.
- Toda query de domínio filtra por `companyId` — `apps/api/CLAUDE.md`,
  "Autenticação e multi-tenancy". `companyId` vem do JWT emitido no
  login/registro (spec 00b) — esta spec depende de 00b estar
  implementada antes.
- Tela: `OnPush` + Signals, os três estados (loading/error/empty — aqui
  "empty" não se aplica a um formulário de criação, mas o estado de erro
  de submit sim), estrutura por feature (`src/app/orcamentos/` ou
  `src/app/projetos/`, a decidir no nome da pasta ao implementar) —
  `apps/web/CLAUDE.md`, "Performance"/"Resiliência de UI"/"Arquitetura e
  organização".
- Formulário usa Reactive Forms (mais de 2-3 campos, lista de itens de
  tamanho variável) — `apps/web/CLAUDE.md`, "Formulários". Validação
  client-side é só UX — a validação real é o `ValidationPipe`/DTO do
  backend.

## Os 3 cenários

- **Happy**: usuário preenche cliente + serviço + N itens, toca em criar,
  vê o projeto criado com o orçamento e o total calculado, sem sair da
  tela.
- **Sad**: usuário tenta submeter sem nenhum item — o backend rejeita
  (400, `ValidationPipe`, DTO exige `items: min 1`), a tela mostra o erro
  perto do campo de itens, não um toast genérico.
- **Edge**: usuário digita um preço unitário com vírgula decimal (padrão
  BR: `150,00`) — `input-custom` já tem máscara de moeda
  (`type="currency"`, `packages/ui`) que resolve isso na entrada; o
  contrato de API sempre recebe/devolve número (`150.00`), a máscara é
  só de apresentação.

## Contrato de interface

`POST /projects`

Request:
```json
{
  "clientName": "string, obrigatório",
  "clientContact": "string, opcional",
  "serviceDescription": "string, obrigatório",
  "markupPercent": "number, opcional, default 20",
  "validUntil": "string ISO 8601 (data), obrigatório",
  "items": [
    {
      "description": "string, obrigatório",
      "quantity": "number > 0, obrigatório",
      "unitPrice": "number >= 0, obrigatório"
    }
  ]
}
```
`items` exige no mínimo 1 elemento — `ValidationPipe`/DTO rejeita array
vazio com 400.

Response `201`:
```json
{
  "projectId": "uuid",
  "budgetId": "uuid",
  "publicSlug": "string",
  "status": "DRAFT",
  "totalAmount": "number (soma dos itens + markupPercent)",
  "createdAt": "string ISO 8601"
}
```

Erro (400/422): Problem Details (RFC 7807) é o formato correto adotado
a partir de agora — o `AllExceptionsFilter` hoje produz o formato Nest
default (`statusCode`/`message`/`error`), não Problem Details; é o
filtro que precisa ser corrigido, não o formato-alvo que muda (pendência
técnica registrada na spec 00b, a primeira a tocar erro de negócio de
verdade). Esta spec não corrige o filtro — usa o que estiver valendo no
momento da implementação, seguindo o que já tiver sido ajustado em 00b
(ou ajustando aqui, se 01 for implementada antes por algum motivo).

`validUntil` é coletado aqui (campo existe desde a criação) mas seu
**comportamento** (aviso de expirado, bloqueio de aprovação) é
responsabilidade da spec 03, não desta.

## Escopo negativo

- Não inclui editar um orçamento já criado (isso é reprecificação —
  spec 03) nem excluir/duplicar projeto.
- Não inclui envio do orçamento ao cliente nem geração de PDF (spec 02).
- Não inclui aprovação do orçamento pelo cliente (spec 03).
- Não inclui múltiplos orçamentos por projeto (revisão de orçamento) —
  o schema permite (`Project.budgets: Budget[]`), mas esta spec só cria
  o primeiro.
- Não inclui autenticação/tela de login — spec 00b, dependência desta.
- Não inclui categorização de item (material vs. mão de obra) — TO-BE
  não pede isso para a v1, item é só descrição+quantidade+preço.

## Dependências

- Spec 00 (schema inicial).
- Spec 00b (autenticação) — `companyId` do request vem do JWT emitido
  ali; esta spec não pode ser implementada antes dela.

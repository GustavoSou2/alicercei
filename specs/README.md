# Specs — v1 do Alicercei

Cada arquivo aqui é um corte vertical (API + tela, quando aplicável) de
um item da prioridade da v1, na ordem definida em `alicercei-to-be.md`,
seção 3. Nenhuma foi implementada ainda — são especificações fechadas
para reduzir o gap de inferência de quem for implementar.

## Ordem de implementação recomendada

1. **[00 — Schema inicial](./00-schema-inicial.md)** — fundação técnica,
   sem a qual nenhuma das outras specs pode ser implementada. Já inclui
   `Company`/`User` desde o início (spec 00b).
2. **[00b — Autenticação](./00b-autenticacao.md)** — registro, login e
   múltiplos usuários por empresa; toda spec seguinte depende do
   `companyId` que só existe no request depois de um login real.
3. **[01 — Orçamento rápido](./01-orcamento-rapido.md)** — cria o
   projeto e o orçamento; toda spec seguinte depende de um `Budget`
   existir.
4. **[02 — Exportar PDF](./02-exportar-pdf.md)** — depende só de 00/00b/01.
5. **[03 — Validade e reprecificação](./03-validade-reprecificacao.md)**
   — depende de 00/00b/01; leva o `Budget` até `APPROVED`, pré-requisito
   da spec 04.
6. **[04 — Execução e recebimento](./04-execucao-recebimento.md)** —
   depende de 00/00b/01/03.
7. **[05 — Previsibilidade financeira](./05-previsibilidade-financeira.md)**
   — depende de 00/00b/01/03/04.

A ordem acima é também a ordem de dependência estrita — 02 pode ser
feita em paralelo com 03/04 (ambas só dependem de 01), mas 03 precisa
vir antes de 04 e 05.

## O que toca API, web, ou os dois

| Spec | API | Web | Observação | Depende de |
|---|---|---|---|---|
| 00 — Schema inicial | ✅ | — | Só `schema.prisma`/migração; nenhuma tela. | 00b |
| 00b — Autenticação | ✅ | ✅ | Registro/login + tela correspondente. | 00 |
| 01 — Orçamento rápido | ✅ | ✅ | Endpoint de criação + formulário mobile-first. | 00, 00b |
| 02 — Exportar PDF | ✅ | ✅ | Job de geração + rota pública; tela pra disparar o export e exibir o link. | 00, 00b, 01 |
| 03 — Validade e reprecificação | ✅ | ✅ | Endpoint de reprecificar/aprovar + indicador visual de vencido/repricado. | 00, 00b, 01 |
| 04 — Execução e recebimento | ✅ | ✅ | Dois endpoints de status + exibição das duas trilhas na tela do projeto. | 00, 00b, 01, 03 |
| 05 — Previsibilidade financeira | ✅ | ✅ | Endpoint de agregação + tela de resumo. | 00, 00b, 01, 03, 04 |

## Decisões que já eram pendentes e foram resolvidas

- **Origem do `companyId`/autenticação sem tela de login** — resolvida:
  a v1 tem registro de usuário, login e múltiplos usuários por empresa
  desde o início (spec 00b; ver `DECISIONS.md`). `Company`/`User` agora
  existem como entidades próprias no schema (spec 00).
- **Escopo do "fôlego de caixa"** (spec 05) — resolvida com escopo
  simplificado: saldo guardado manual + gasto médio derivado dos
  próprios orçamentos aprovados, sem depender de uma camada de
  custos/perdas.

## Pendência técnica que atravessa mais de uma spec

Formato de erro (Problem Details vs. o que `AllExceptionsFilter` já
implementa) — Problem Details (RFC 7807) é o padrão correto adotado a
partir de agora; o `AllExceptionsFilter` real ainda produz o formato
Nest default e precisa ser corrigido. Essa correção é trabalho de
implementação, registrado na spec 00b (primeira a expor erro de negócio
relevante) — não decidida de novo em cada spec que menciona erro (00b,
01, 03).

# Specs — v1 do Alicercei

Cada arquivo aqui é um corte vertical (API + tela, quando aplicável) de
um item da prioridade da v1, na ordem definida em `alicercei-to-be.md`,
seção 3. Nenhuma foi implementada ainda — são especificações fechadas
para reduzir o gap de inferência de quem for implementar.

## Ordem de implementação recomendada

1. **[00 — Schema inicial](./00-schema-inicial.md)** — fundação técnica,
   sem a qual nenhuma das outras specs pode ser implementada. Contém uma
   decisão pendente (origem do `companyId`/autenticação sem tela de
   login) que bloqueia a spec 01 até ser respondida.
2. **[01 — Orçamento rápido](./01-orcamento-rapido.md)** — cria o
   projeto e o orçamento; toda spec seguinte depende de um `Budget`
   existir.
3. **[02 — Exportar PDF](./02-exportar-pdf.md)** — depende só de 00/01.
4. **[03 — Validade e reprecificação](./03-validade-reprecificacao.md)**
   — depende de 00/01; leva o `Budget` até `APPROVED`, pré-requisito da
   spec 04.
5. **[04 — Execução e recebimento](./04-execucao-recebimento.md)** —
   depende de 00/01/03.
6. **[05 — Previsibilidade financeira](./05-previsibilidade-financeira.md)**
   — depende de 00/01/03/04; tem uma decisão em aberto própria (escopo
   do "fôlego de caixa"), separada da decisão pendente da spec 00.

A ordem acima é também a ordem de dependência estrita — 02 pode ser
feita em paralelo com 03/04 (ambas só dependem de 01), mas 03 precisa
vir antes de 04 e 05.

## O que toca API, web, ou os dois

| Spec | API | Web | Observação |
|---|---|---|---|
| 00 — Schema inicial | ✅ | — | Só `schema.prisma`/migração; nenhuma tela. |
| 01 — Orçamento rápido | ✅ | ✅ | Endpoint de criação + formulário mobile-first. |
| 02 — Exportar PDF | ✅ | ✅ | Job de geração + rota pública; tela pra disparar o export e exibir o link. |
| 03 — Validade e reprecificação | ✅ | ✅ | Endpoint de reprecificar/aprovar + indicador visual de vencido/repricado. |
| 04 — Execução e recebimento | ✅ | ✅ | Dois endpoints de status + exibição das duas trilhas na tela do projeto. |
| 05 — Previsibilidade financeira | ✅ | ✅ | Endpoint de agregação + tela de resumo. |

## Decisões pendentes que atravessam mais de uma spec

Duas decisões não foram tomadas por esta rodada de especificação —
ambas reportadas dentro da spec correspondente, não decididas
unilateralmente:

- **Origem do `companyId`/autenticação sem tela de login** (spec 00) —
  bloqueia a implementação de todas as specs 01–05, porque todas
  dependem de identificar o tenant do request.
- **Escopo do "fôlego de caixa"** (spec 05) — só afeta essa spec
  especificamente, não bloqueia as demais.

Além dessas, todas as specs herdam (sem repetir) as duas contradições já
registradas e não resolvidas em `apps/api/CLAUDE.md`/`apps/web/CLAUDE.md`:
formato de erro (Problem Details vs. o que `AllExceptionsFilter` já
implementa) e a pergunta em aberto sobre a entidade `Company`/`Tenant`
(`PROGRESS.md`).

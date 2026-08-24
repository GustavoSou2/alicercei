# CLAUDE.md — Alicercei (raiz do monorepo)

## North Star

> Quem trabalha na construção civil, sobretudo por conta própria, vive
> períodos sazonais sem serviço. A ansiedade não é falta de reserva — é não
> saber **quando** o período sem trabalho vai chegar, nem **por quanto
> tempo** vai durar.

Toda decisão de escopo se mede por uma pergunta: **isso aproxima alguém de
saber quando o próximo período parado chega e quando acaba, ou é uma boa
ideia que não toca nisso?** Se a resposta for "boa ideia, mas não toca", a
feature é bem-vinda no roadmap — não no núcleo do produto. Ver README.md
para o detalhamento completo do produto (fluxo core, módulos, escopo da v1).

## Visão geral do monorepo

```
alicercei/
  apps/
    api/       — NestJS + Prisma (VPS própria)
    web/       — Angular (Vercel)
  packages/
    ui/        — @alicercei/ui, design system compartilhado
    config/    — eslint/typescript/prettier compartilhados
  infra/       — docker-compose, env, CI
```

- `apps/api`: ver `apps/api/CLAUDE.md`.
- `apps/web`: ver `apps/web/CLAUDE.md` (só existe depois que o app for
  criado — ver PROGRESS.md, bloqueio de versão do Node).
- `packages/ui`: componentes extraídos de `legado/whale-ui`, sem
  dependência de nenhuma classe concreta de um app específico (ver
  `packages/ui/src/api/ui-api-client.ts`).

## Deploy

- `apps/web` → Vercel, root directory `apps/web`.
- `apps/api` → VPS própria (container).
- Deploy independente por app — ver README.md, "Arquitetura — monorepo".

## `legado/` é somente leitura

`legado/alicerce-api` e `legado/whale-ui` são referência histórica. Nunca
editar, criar ou apagar nada dentro de `legado/`, mesmo para "corrigir" um
bug documentado no AS-IS — a correção acontece no código novo
(`v2/alicercei`), nunca no legado. `legado/AS-IS-api.md` e
`legado/AS-IS-web.md` documentam o que é `[padrão técnico reaproveitável]`
vs. `[lógica de domínio, não herdar sem validação]`; tratar essa
classificação como já validada, não reabrir a discussão sem motivo novo.

## Schema de domínio: ainda não existe

O schema de Orçamento/Execução/Projeto nasce do TO-BE validado com o
caso fundador (pai do usuário, gesseiro autônomo), não do legado. Está
bloqueado até essa entrevista de AS-IS real acontecer — ver PROGRESS.md,
"Bloqueado por". Não inventar entidades de domínio para "adiantar"
trabalho.

## Gerenciador de pacotes

`npm` exclusivamente, workspaces (`apps/*`, `packages/*`). Não usar
`pnpm`/`yarn`/`bun`.

## Outros documentos

- `DECISIONS.md` — log append-only de decisões reais (não de tarefas).
- `PROGRESS.md` — foto do estado atual (não um log crescente).
- `legado/AS-IS-api.md`, `legado/AS-IS-web.md` — auditoria técnica do
  legado, insumo para o que reaproveitar vs. redesenhar.

# CLAUDE.md — apps/web

Stack: Angular 22 (standalone components, signals, zoneless por padrão,
`OnPush` como estratégia padrão — vem assim do `ng new`, não precisa
configurar).

## Design system

Sempre usar `@alicercei/ui` quando o componente já existe lá — nunca
duplicar um componente que já foi extraído (ver `packages/ui/src/index.ts`
para o que já existe: avatar, button, calendar, confirmation-dialog,
dialog, dynamic-tabs, input, loader, select, skeleton-loader, table,
textarea-custom, toast, uploader, + máscaras BR).

`packages/ui` não depende de nenhuma classe concreta deste app — `table`/
`select` esperam um provider para `UI_API_CLIENT`
(`packages/ui/src/api/ui-api-client.ts`). Antes de usar `<table-custom>`
ou `<select-custom>` em qualquer tela, este app precisa ter seu próprio
serviço HTTP (equivalente ao `ApiService` do legado — ainda não criado
aqui, ver `legado/AS-IS-web.md` seção 1.1 para a forma de referência) e
prover:

```ts
{ provide: UI_API_CLIENT, useExisting: ApiService }
```

## Tailwind

Tailwind v4 (config-free, via `@import "tailwindcss"` em `src/styles.scss`
+ `.postcssrc.json`, não `tailwind.config.ts` — é como o legado
(`whale-ui`) já usava). Tokens de cor portados em
`src/assets/scss/_colors.global.scss` (paleta `tropaz`/`cornflower`/
`tranquil`/`burnt-sienna`/`big-stone`/`victoria`/`royal-blue`/`waterloo`/
`emerald`, cada uma com escala 50–950), expostos tanto como variáveis CSS
soltas (`var(--tropaz-500)`, formato que os componentes de
`packages/ui` já usam) quanto como tokens Tailwind (`@theme`, geram
`bg-tropaz-500`, `text-cornflower-300`, etc.).

**Qualquer novo componente em `packages/ui` precisa estar coberto pelo
`content`/`@source` do Tailwind do app que o consome** — aqui isso é o
`@source "../../packages/ui/src";` em `src/styles.scss`. Sem isso o build
de produção remove (purga) classes usadas só dentro do design system.

Tema do Angular Material (`mat.define-theme`, paleta azure/blue) também
está em `src/styles.scss` — necessário porque `confirmation-dialog` e
`table` (em `packages/ui`) usam `MatDialog`/`MatTooltip`.

## Ícones

Convenção herdada do legado: **pasta própria de SVGs**, não `MatIcon` nem
lib de terceiro (Lucide/Heroicons). Arquivos em
`src/assets/imgs/icons/*.svg`, copiados para a raiz do build via
`angular.json` → `assets` (`{ glob: "**/*", input: "src/assets/imgs" }`) e
referenciados nos templates como `<img src="./icons/NomeDoIcone.svg">`.

Só os ícones **efetivamente usados** foram trazidos até agora —
`Export.svg` e `Info.svg`, porque são os únicos referenciados direto no
template de um componente de `packages/ui` (não vêm de `@Input()` de quem
consome). Qualquer outro ícone (ex.: `Check.svg`, `Close.svg`,
`Delete.svg`, `Edit.svg` — usados via `action.icon` em `<table-custom>`)
só precisa ser copiado de `legado/whale-ui/src/assets/imgs/icons/` quando
uma tela de verdade passar a usá-lo — não copiar a pasta inteira (115
arquivos) de uma vez.

## Máscaras de mercado BR

CPF/CNPJ, telefone e moeda já disponíveis via `@alicercei/ui`
(`input-custom` com `type="cpf-cnpj"|"phone"|"currency"`) — não recriar.

## Rodando localmente

```bash
npm install
npm run start --workspace=apps/web
```

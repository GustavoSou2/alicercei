# Alicercei

Gestão e previsibilidade financeira para quem trabalha na construção civil —
do autônomo que atua sozinho até a empresa que gerencia equipe e obra
completa.

---

## O ponto central

> Quem trabalha na construção civil, sobretudo por conta própria, vive
> períodos sazonais sem serviço. Mesmo com dinheiro guardado, a ansiedade
> não é falta de reserva — é não saber **quando** o período sem trabalho vai
> chegar, nem **por quanto tempo** vai durar.

O Alicercei existe para resolver essa ansiedade específica. Tudo que o
sistema faz — orçamento, execução, controle de recebimento — é
infraestrutura a serviço dessa resposta. Toda decisão de escopo, daqui em
diante, se mede por uma pergunta: **isso aproxima alguém de saber quando o
próximo período parado chega e quando acaba, ou é uma boa ideia que não
toca nisso?**

Se a resposta for "boa ideia, mas não toca", a feature é bem-vinda no
roadmap — só não no núcleo do produto.

---

## Origem

O Alicercei nasceu como whale-ui, um ERP de orçamentos para construção
civil construído numa fase anterior ao uso intensivo de IA no
desenvolvimento. A retomada não reaproveita o projeto inteiro: extrai o que
tem valor comprovado (design system, componentes, padrão técnico de
backend) e redesenha do zero a lógica de domínio, que na primeira versão
foi pensada para empresas grandes de engenharia sem nenhuma validação real
de uso.

O caso fundador é o pai do criador do projeto: gesseiro, empresa própria,
sem nenhum sistema de gestão hoje.

---

## Stack

- **Frontend:** Angular 22, Tailwind, design system próprio
  (smart-table, notifications, skeleton)
- **Backend:** NestJS + Prisma ORM
- **Deploy:** frontend na Vercel, API em VPS própria

## Arquitetura — monorepo

```
alicercei/
  apps/
    api/       — NestJS + Prisma
    web/       — Angular
  packages/
    ui/        — componentes de design system, reutilizáveis entre projetos
    config/    — eslint, tsconfig, prettier compartilhados
  infra/       — docker-compose, env, CI
```

Deploy independente por app: `apps/web` publica direto na Vercel (root
directory apontado para essa pasta); `apps/api` roda em container na VPS,
junto ou separado do banco, conforme definido em `infra/`.

---

## Fluxo core

```
Novo projeto → Orçamento → Execução → Fechamento
```

Igual para qualquer perfil de uso — pessoa física ou jurídica, autônomo ou
empresa com equipe. Camadas adicionais se conectam a este fluxo por
referência; nenhuma o modifica ou o torna dependente dela.

**Execução e Recebimento são trilhas independentes.** Um serviço pode estar
concluído com o pagamento ainda pendente — esse é o estado mais comum, e o
que mais importa para a previsibilidade que o produto entrega.

---

## Módulos

### Core (MVP — v1)
- Cadastro de projeto
- Orçamento: itens, quantidade, preço, valor total, data prevista de
  recebimento
- Execução: status do serviço
- Recebimento: status do pagamento, independente da execução
- Fechamento do projeto

### Previsibilidade financeira (MVP — v1, escopo simplificado)
- Quanto já está garantido para entrar (orçamentos aprovados + data
  prevista)
- Quanto tempo o caixa guardado aguenta no ritmo atual de gasto

### Previsibilidade e projeção (roadmap — pós-MVP)
Extensão do módulo acima, dependente de histórico de uso:
- Comparação com o mesmo período do ano anterior — só funciona a partir de
  um ciclo completo de uso registrado
- Projeção de faturamento por janela de tempo (30/60/90 dias)
- Indicadores de sazonalidade construídos a partir do próprio histórico do
  usuário, não de dado de mercado externo

### Detalhamento de ganhos de colaboradores/terceiros (roadmap)
- Vínculo de colaborador ou terceiro (subcontratado, outro autônomo, outra
  empresa) a um projeto ou execução
- Registro de horas trabalhadas ou participação combinada
- Cálculo de quanto cada colaborador/terceiro tem a receber, separado do
  que é da empresa/autônomo
- Disponível a qualquer perfil — contratar terceiro não exige CNPJ de quem
  contrata
- Sub-módulo restrito a CNPJ: folha de pagamento CLT (funcionário
  registrado), por exigência legal, não de produto

### Plano de ação (roadmap)
Organização de tarefas dentro de um projeto, com responsáveis e status por
etapa. Disponível a qualquer perfil que trabalhe com múltiplas pessoas ou
etapas.

### Aprovação formal (roadmap)
Etapa de revisão antes do fechamento de um orçamento ou projeto —
relevante tanto para um autônomo com contador terceirizado revisando quanto
para uma empresa com hierarquia de aprovação.

### Custos e perdas (roadmap)
Comparação entre material orçado e material usado; identificação dos
maiores centros de gasto por projeto.

### Fiscal (roadmap, não iniciado)
Cálculo de imposto por serviço conforme regime (pessoa física ou jurídica).
Depende de validação com contador antes de qualquer regra ser
implementada — nunca hardcoded.

---

## Escopo da v1 (o que está sendo construído agora)

Apenas Core + Previsibilidade financeira simplificada. Critério de sucesso:
uma pessoa real usa o sistema sozinha para orçar um serviço real e ver
quanto está previsto para entrar nos próximos dias.

Todo módulo listado como "roadmap" está desenhado no nível conceitual (para
não exigir retrabalho de schema depois), mas não implementado.

---

## Brainstorm — ideias de features diferenciais

**Importante: nada nesta seção é compromisso de escopo.** São ideias que
poderiam diferenciar o produto no futuro, listadas para não se perder —
cada uma precisa passar pelo ponto central e por validação real antes de
virar roadmap de verdade.

- **Simulador "e se"** — antes de aceitar um orçamento novo, mostrar o
  impacto dele no caixa previsto, sem precisar aprovar de verdade para ver
- **Semáforo de saúde financeira** — indicador visual simples (verde/
  amarelo/vermelho), não número cru, para quem não quer interpretar
  planilha
- **Precificação sugerida por histórico próprio** — sugerir preço de um
  novo orçamento com base no que o próprio usuário já cobrou por serviços
  parecidos, sem depender de busca de preço de mercado externo
- **Ficha de confiabilidade de terceiros** — histórico de prazo cumprido e
  qualidade por colaborador/terceiro contratado, para decidir quem chamar
  de novo
- **Alerta de sazonalidade proativo** — avisar com antecedência, baseado em
  padrão histórico, que o período parado está se aproximando
- **Modo offline em obra** — registro de execução funciona sem internet,
  sincroniza depois
- **Exportação simplificada para contador** — relatório pronto no formato
  que um contador espera, sem o usuário precisar entender o que é DRE
- **Envio de orçamento por WhatsApp** — gerar link/PDF do orçamento direto
  para compartilhar com o cliente, sem sair do fluxo
- **Timeline visual multi-obra** — visão tipo Gantt simplificado de todos
  os projetos em andamento, pensada para quem gerencia mais de uma obra ao
  mesmo tempo
- **Divisão automática de pagamento entre colaboradores** — split
  proporcional às horas ou participação registrada, reduzindo cálculo manual

---

## Rodando localmente

```
# instalar dependências do monorepo
npm install

# rodar api
npm run dev --workspace=apps/api

# rodar web
npm run dev --workspace=apps/web
```

*(ajustar conforme o gerenciador de pacotes e scripts definidos em
`package.json` de cada app)*

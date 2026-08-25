# TO-BE — Alicercei

## 1. Ponto central (dois pilares, validados por entrevista real)

> O Alicercei existe para o autônomo da construção civil não perder
> dinheiro nem perder cliente por falta de informação na hora certa:
> **(1)** um orçamento rápido, no celular, com apresentação profissional,
> pra fechar a venda antes do concorrente; e **(2)** saber o que já está
> garantido pra entrar e por quanto tempo o caixa aguenta — incluindo
> proteção contra preço de material que muda entre o orçamento e a
> aprovação do cliente.

Toda decisão de escopo se mede por uma pergunta: **isso toca a velocidade/
apresentação do orçamento, a previsibilidade financeira, ou nenhum dos
dois?** Se nenhum dos dois, a ideia é boa mas não é v1.

---

## 2. Core — igual para todos os perfis

```
Novo projeto → Orçamento → Execução → Fechamento
```

| Etapa | O que resolve | Decisão que habilita | Origem |
|---|---|---|---|
| Novo projeto | Dados básicos do cliente e do serviço | Ter onde registrar o que foi combinado | [minha suposição] |
| Orçamento | Itens, quantidade, preço, valor total | Responder rápido "quanto vai custar" — hoje ele já faz isso de cabeça em segundos | [pai disse] |
| Execução | Status do serviço em andamento | Saber o que está pendente de fazer | [pai disse] |
| Fechamento | Encerramento do projeto | Fechar o ciclo, gerar histórico | [minha suposição] |

**Execução e Recebimento são trilhas independentes** (não um único campo de
status): um projeto pode estar com o serviço concluído e o pagamento ainda
pendente. Esse é o estado mais comum e o que mais importa para o pilar de
previsibilidade.

**Material pertence ao projeto desde o cadastro do item no orçamento** —
não é um módulo novo, é uma garantia de que a UI deixe claro a qual obra
cada material pertence, resolvendo o achado de que material de uma obra
"vai parar em outra" quando o controle é feito no caderno/WhatsApp.
[pai disse]

---

## 3. Prioridade da v1, na ordem validada pela entrevista

| # | O quê | Por quê essa ordem | Origem |
|---|---|---|---|
| 1 | Orçamento rápido, mobile-first | "Um chute eu dou na hora" — o sistema só precisa ser tão rápido quanto ele já é hoje de cabeça | [pai disse] |
| 2 | Exportar orçamento em PDF profissional, na hora | Resposta direta à pergunta "se o sistema resolvesse UMA coisa só" | [pai disse] |
| 3 | Validade do orçamento + reprecificação fácil antes de aprovar | "Geralmente o prejuízo sai do meu bolso" quando material sobe de preço entre o orçamento e a aprovação | [pai disse] |
| 4 | Execução → Recebimento (trilhas independentes) | Já validado, sustenta o pilar de previsibilidade | [pai disse] |
| 5 | Previsibilidade financeira simplificada (garantido pra entrar + fôlego de caixa) | Só é confiável se o item 3 existir — sem reprecificação, a previsão parte de um preço já defasado | [pai disse] + dependência técnica do item 3 |

---

## 4. O que a entrevista confirmou, tradução de vocabulário

| Termo técnico | O que ele de fato faz/sente hoje | Origem |
|---|---|---|
| Markup | Já aplica cerca de 20% em cima do valor calculado, "pra garantir" — informal, sem nome, mas existe | [pai disse] |
| Registro de orçamento | Caderno de espiral no painel da caminhonete | [pai disse] |
| Comunicação com cliente | Áudio de WhatsApp; às vezes o filho digita no Word à noite | [pai disse] |
| Perda de controle multi-obra | Material de uma obra "vai parar" em outra | [pai disse] |

---

## 5. Decisão em aberto (não resolvida ainda, não presumir)

**Segundo usuário (filho digitando à noite):** a entrevista revelou que
hoje existe uma segunda pessoa envolvida na formalização do orçamento.
Isso pode significar necessidade real de mais de um usuário no sistema, ou
pode desaparecer sozinho se o orçamento rápido (prioridade 1) já resolver
a lentidão que motivava pedir ajuda ao filho. **Não decidir isso por
suposição — perguntar diretamente na próxima conversa.** Até lá, a v1
segue como usuário único (sem tela de login), decisão herdada do
dossiê original.

---

## 6. Camadas opcionais (sem mudança em relação ao que já estava decidido)

Disponíveis a qualquer perfil (CPF ou CNPJ) — gatilho é padrão de uso, não
tipo de cadastro: Plano de ação, Aprovação formal, Colaboradores e
terceiros vinculados à obra, Custos e perdas. Única exceção legal real:
Folha de pagamento CLT, exclusiva de CNPJ. Nenhuma dessas camadas foi
validada por usuário real ainda — todas seguem `[minha suposição]`, fora
da v1.

---

## 7. Os 3 cenários — apenas para o que já tem origem `[pai disse]`

**Orçamento (com validade e reprecificação)**
- Happy: orçamento criado rápido, com margem aplicada, PDF exportado na
  hora, cliente aprova dentro da validade
- Sad: cliente demora a aprovar e a validade expira — sistema sinaliza
  que o preço pode estar desatualizado antes de qualquer ação
- Edge: preço de material sobe entre a criação e a aprovação — sistema
  permite reprecificar o item específico sem refazer o orçamento inteiro,
  e deixa claro pro usuário que algo mudou desde a criação

**Execução / Recebimento**
- Happy: serviço concluído e pagamento recebido no mesmo período
- Sad: pagamento não registrado depois do prazo esperado — sinaliza, não
  bloqueia
- Edge: serviço concluído, pagamento pendente — estado comum e esperado,
  aparece com destaque na previsibilidade

---

## 8. Fora de escopo desta primeira versão

- Segundo usuário / autenticação multi-perfil — decisão pendente (ver
  seção 5), não presumir nenhum dos dois lados
- Plano de ação, Aprovação formal, Colaboradores/terceiros, Custos e
  perdas, Folha CLT, cálculo de imposto — todas `[minha suposição]`
- Comparação com período parado do ano anterior — precisa de um ciclo
  completo de uso registrado antes de existir

---

## 9. Critério de sucesso da v1

O pai do usuário consegue, sozinho, criar um orçamento real de um cliente
real pelo celular em poucos minutos (não mais "domingo de manhã"), exportar
em PDF profissional na hora, e ver quanto está previsto pra entrar nos
próximos dias.

---

## 10. Tabela de rastreabilidade

| Item | Disponível para | Status |
|---|---|---|
| Core | Qualquer perfil | Validado por entrevista real (autônomo) |
| Orçamento rápido + PDF | Qualquer perfil | Validado, prioridade 1 e 2 |
| Reprecificação/validade | Qualquer perfil | Validado, prioridade 3 |
| Previsibilidade financeira | Qualquer perfil | Validado, depende da prioridade 3 |
| Segundo usuário | A definir | Pendente de pergunta direta |
| Camadas opcionais (Plano de ação, Aprovação, Colaboradores, Custos, Folha CLT) | Qualquer perfil (Folha CLT exclusivo CNPJ) | Não construídas, sem validação real |

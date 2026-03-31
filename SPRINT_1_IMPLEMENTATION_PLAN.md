# Sprint 1 - Plano Tecnico de Implementacao

## Status
Sprint 1 concluido ✅

### Entregas realizadas
1. S1-01 Home com CTA inteligente implementado com priorizacao contextual.
2. S1-02 Questao do dia refinada com preview curto e CTA direto.
3. S1-03 Resultados com insights acionaveis, comparacao com historico e CTA de revisao de erros.
4. S1-04 Barra fixa de acoes no quiz mobile com testes de estado.

### Validacao final do sprint
- lint: aprovado
- testes: aprovado
- build: aprovado

## Objetivo do Sprint
Entregar melhorias de UX com maior impacto em inicio rapido de sessao e acao pos-resultado.

## Escopo do Sprint 1
- S1-01 Home com CTA inteligente
- S1-02 Questao do dia com foco em acao
- S1-03 Resultado orientado a proxima acao
- S1-04 Barra de acoes fixa no quiz mobile

---

## S1-01 Home com CTA inteligente

### Resultado esperado
A Home deve exibir uma acao principal dinamica de acordo com o contexto do usuario.

### Arquivos alvo
- src/features/home/HomeScreen.tsx
- src/hooks/useQuizFlow.ts
- src/types/app.ts
- src/domain/state.ts
- src/features/home/HomeScreen.test.tsx (novo)

### Tarefas tecnicas
1. Adicionar bloco "Proximo passo" no topo da Home.
2. Definir regra de priorizacao do CTA:
   - meta pendente -> continuar estudo
   - sem questoes -> criar primeira questao
   - meta concluida -> revisar erros
3. Conectar CTA aos fluxos ja existentes (inicio quiz, abrir perguntas, revisar erros).
4. Garantir texto de apoio contextual (faltam X questoes para meta).
5. Cobrir com testes de renderizacao condicional e acao do CTA.

### Criterios de pronto tecnico
- CTA primario renderiza sem scroll no mobile.
- Regra de priorizacao funciona em 3 cenarios.
- Testes unitarios da Home cobrindo cenarios principais.

---

## S1-02 Questao do dia com foco em acao

### Resultado esperado
Card mais enxuto e orientado a "resolver agora" com contexto minimo.

### Arquivos alvo
- src/features/home/HomeScreen.tsx
- src/hooks/useQuizFlow.ts (ja possui startDailyQuestionById, validar uso)
- src/features/home/HomeScreen.test.tsx (novo)

### Tarefas tecnicas
1. Ajustar layout do card para leitura rapida (titulo, preview curto, badges).
2. Truncar enunciado longo para evitar excesso de altura.
3. Garantir botao primario com label clara e acionamento de sessao unica.
4. Validar retorno de fluxo apos concluir questao do dia.
5. Testar render do card e clique em "Resolver agora".

### Criterios de pronto tecnico
- Card cabe em viewport mobile sem poluicao visual.
- Clique inicia sessao de 1 questao corretamente.
- Testes cobrindo render e interacao.

---

## S1-03 Resultado orientado a proxima acao

### Resultado esperado
Tela de resultados deve transformar desempenho em recomendacao acionavel.

### Arquivos alvo
- src/features/quiz/ResultsScreen.tsx
- src/features/quiz/ResultsScreen.test.tsx
- src/domain/utils.ts (se necessario para regras de insight)

### Tarefas tecnicas
1. Adicionar bloco "Seus insights" com 3 cards:
   - ponto forte
   - principal erro
   - recomendacao
2. Adicionar CTA primario "Revisar apenas erros".
3. Adicionar comparativo simples com historico recente (quando houver dados).
4. Manter acoes atuais de compartilhar/copiar sem regressao.
5. Expandir testes para validar novos cards e CTA principal.

### Criterios de pronto tecnico
- 3 insights visiveis com fallback quando sem historico.
- CTA de revisao de erros funcional.
- Testes cobrindo insight + acao + fallback.

---

## S1-04 Barra de acoes fixa no quiz mobile

### Resultado esperado
Acoes principais do quiz devem permanecer acessiveis na area de polegar em telas pequenas.

### Arquivos alvo
- src/features/quiz/QuizScreen.tsx
- src/styles/appStyles.ts
- src/features/quiz/QuizScreen.test.tsx

### Tarefas tecnicas
1. Criar container de acao fixo no rodape para mobile.
2. Inserir botoes principais no container:
   - quando nao respondido: Pular
   - quando respondido: Proxima / Ver resultados
3. Ajustar espacamento inferior do conteudo para nao sobrepor alternativas.
4. Preservar layout atual no desktop.
5. Expandir testes para garantir presenca dos botoes por estado.

### Criterios de pronto tecnico
- Barra fixa aparece apenas em breakpoints mobile.
- Sem sobreposicao de conteudo do quiz.
- Testes cobrindo estados de resposta.

---

## Ordem recomendada de execucao
1. S1-01 Home CTA inteligente
2. S1-02 Questao do dia (aproveitando contexto da Home)
3. S1-04 Barra fixa no quiz mobile
4. S1-03 Resultados com insights e CTA

---

## Estrategia de validacao por entrega
1. Lint apos cada historia.
2. Testes focados do modulo alterado.
3. Validacao completa ao fim do sprint:
   - npm run lint
   - npm run test:run
   - npm run build

---

## Riscos e mitigacao
1. Risco: acoplamento entre CTA da Home e regras de estado.
   - Mitigacao: isolar regras em funcao auxiliar testavel.
2. Risco: barra fixa no quiz afetar acessibilidade/toque.
   - Mitigacao: manter area de clique grande e foco visivel.
3. Risco: insights de resultado sem dados historicos suficientes.
   - Mitigacao: fallback textual simples e nao bloqueante.

---

## Checklist de inicio imediato
- [x] Criar testes base para HomeScreen (CTA condicional)
- [x] Implementar bloco "Proximo passo"
- [x] Revisar card de Questao do dia
- [x] Executar lint e testes da Home

## Encerramento
Sprint finalizado com todos os itens de escopo entregues e validados.

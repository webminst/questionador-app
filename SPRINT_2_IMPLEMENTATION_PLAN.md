# Sprint 2 - Plano Tecnico de Implementacao

## Objetivo do Sprint
Melhorar a leitura de evolucao e tomada de decisao com graficos mais explicativos e acessiveis.

## Escopo inicial (fase 1)
- S2-01 Grafico de evolucao com anotacoes (Must) - concluido
- S2-03 Tabela acessivel alternativa para charts (Must) - concluido
- S2-04 Ranking e perfil com foco em habitos (Should) - concluido
- Extensao S3 (S3-01 a S3-04): concluida

---

## S2-04 Ranking e perfil com foco em habitos

### Resultado esperado
Melhorar leitura de consistencia com heatmap semanal e insights acionaveis de tendencia/habito.

### Arquivos alvo
- src/features/profile/ProfileScreen.tsx
- src/features/profile/ProfileScreen.test.tsx

### Tarefas tecnicas
1. Adicionar heatmap semanal de atividade (ultimos 28 dias) no painel de streak.
2. Exibir indicador textual de tendencia semanal (subindo/estavel/caindo).
3. Exibir recomendacao automatica com base em lacunas por dia da semana.
4. Cobrir renderizacao dos novos blocos com testes.
5. Exibir comparativo semanal simples por usuario no ranking.
6. Exibir recomendacao automatica no ranking quando houver queda de habito.

### Criterios de pronto tecnico
- Heatmap semanal visivel e com niveis de intensidade.
- Texto de tendencia semanal exibido e coerente.
- Recomendacao automatica visivel no contexto de streak.
- Testes cobrindo render dos novos blocos.

---

## S2-03 Tabela acessivel alternativa para charts

### Resultado esperado
Cada grafico relevante da aba Historico deve oferecer uma visao tabular equivalente, semantica e navegavel por teclado.

### Arquivos alvo
- src/features/profile/ProfileScreen.tsx
- src/features/profile/ProfileScreen.test.tsx

### Tarefas tecnicas
1. Adicionar acao "Ver dados em tabela" para cada grafico da aba Historico.
2. Renderizar tabela equivalente com:
   - caption descritiva
   - cabecalho semantico com th
   - linhas coerentes com os dados exibidos no grafico
3. Garantir fallback textual quando nao houver dados suficientes para tabela de evolucao.
4. Cobrir interacao e render das tabelas com testes.
5. Adicionar tabela para "Ultimas sessoes" com ordenacao por data.
6. Adicionar exportacao CSV para tabelas do Historico.

### Criterios de pronto tecnico
- Existe acao de tabela para os graficos de evolucao e acerto por sessao.
- Tabelas exibem os mesmos dados-base dos graficos.
- Estrutura semantica minima valida (caption, thead, tbody).
- Testes cobrindo abertura das tabelas e conteudo principal.

---

## S2-01 Grafico de evolucao com anotacoes

### Resultado esperado
O grafico de evolucao deve mostrar nao apenas a curva, mas tambem marcos e contexto para facilitar interpretacao.

### Arquivos alvo
- src/features/profile/ProfileScreen.tsx
- src/domain/utils.ts (se necessario para formatacao/anotacoes)
- src/features/profile/ProfileScreen.test.tsx (novo, se ainda nao existir)

### Tarefas tecnicas
1. Adicionar anotacoes visuais no grafico de evolucao de nivel:
   - marco de subida de nivel
   - destaque de eventos recentes
2. Exibir tooltip enriquecido com:
   - data
   - nivel
   - pontos acumulados (quando disponivel)
3. Incluir linha de referencia/meta quando houver base para comparacao.
4. Adicionar resumo textual abaixo do grafico com leitura rapida:
   - tendencia atual
   - ultimo marco relevante
5. Garantir fallback claro quando nao houver dados suficientes.

### Criterios de pronto tecnico
- Grafico mostra anotacoes em marcos de nivel.
- Tooltip inclui contexto minimo (data + nivel).
- Fallback sem dados nao quebra layout.
- Cobertura de testes para render com/sem dados.

---

## Estrategia de implementacao recomendada
1. Implementar modelo de dados derivado para anotacoes em ProfileScreen.
2. Renderizar anotacoes e tooltip enriquecido.
3. Inserir bloco textual de interpretacao da tendencia.
4. Adicionar testes focados do perfil.
5. Rodar validacao completa (lint, testes, build).

---

## Riscos e mitigacao
1. Risco: grafico poluido visualmente.
   - Mitigacao: limitar quantidade de anotacoes exibidas (ex: ultimos 5 marcos).
2. Risco: performance com muitos pontos.
   - Mitigacao: memoizacao dos dados e recorte por periodo atual.
3. Risco: semantica confusa para leitor de tela.
   - Mitigacao: manter resumo textual paralelo ao grafico.

---

## Checklist de inicio do Sprint 2
- [x] Mapear dados de marcos de evolucao no ProfileScreen
- [x] Definir formato de anotacao e tooltip
- [x] Implementar fallback sem dados
- [x] Criar testes focados de evolucao
- [x] Validar lint/testes/build
- [x] Iniciar S2-03 com acoes de "Ver dados em tabela" nos charts
- [x] Cobrir tabelas com testes focados no Profile
- [x] Adicionar tabela acessivel para "Ultimas sessoes" com ordenacao por data
- [x] Adicionar exportacao CSV para evolucao, acerto e sessoes
- [x] Concluir S2-03 (tabela acessivel alternativa para charts)
- [x] Iniciar S2-04 com heatmap semanal e insights de habito
- [x] Exibir comparativo semanal simples por usuario no ranking
- [x] Exibir recomendacao automatica no ranking quando houver queda de habito
- [x] Concluir S2-04 (perfil + ranking focados em habitos)
- [x] Iniciar S3-01 com wizard de criacao em 3 etapas
- [x] Adicionar barra de progresso e tela de resumo final (S3-01 Phase 2)
- [x] Adicionar validacoes de negocio: duplicata + resposta correta (S3-01 Phase 3)
- [x] Concluir S3-02 (edição e deleção com confirmação)
- [x] Concluir S3-03 (importação CSV robusta com edge cases)
- [x] Concluir S3-04 (auto-save criação/edição com TTL e UX refinada)

---

## S3-01 Wizard de Criacao de Questao - Status Concluído

### Fases entregues
- [x] **Phase 1**: 3-step wizard com validacao inline (Step 1: Enunciado, Step 2: Alternativas, Step 3: Metadados)
- [x] **Phase 2**: Barra de progresso visual + Step 4 com resumo antes de salvar
- [x] **Phase 3**: Validacoes de negocio (duplicata, resposta correta válida)

### Validacoes de negocio implementadas
1. ✅ Duplicata: Detecta pergunta existente (case-insensitive) antes de salvar
   - Mensagem: "Esta pergunta já existe na base de dados."
   - Bloqueia avanco no Step 1 se duplicata detectada

2. ✅ Resposta correta: Valida que respostaCorreta ∈ opcoes
   - Mensagem: "A resposta correta deve estar na lista de opções."
   - Bloqueia avanco no Step 2 se invalida

### Testes cobrindo validacoes
- "rejeita pergunta duplicada" - verifica bloqueio no Step 1
- "rejeita resposta correta fora das opcoes" - verifica continuidade no Step 2

### Bundle size (após Phase 3)
- QuestionsScreen: 29.02 kB (gzip 7.02 kB)
- Sem regressoes observadas

### Escopo concluído em S3-01
✅ Criacao com 4 passos (enunciado → alternativas → metadados → resumo)
✅ Validacao inline em campo + barra de progresso
✅ Regras de negocio (duplicata + resposta valida)
✅ Testes cobrindo happy path + validacoes
✅ 98/98 testes passando (full suite)

---

## S3-02 Edicao de Questoes - Status Concluído

### Tarefas entregues
- [x] Fluxo de edição reutiliza o wizard de 4 passos
- [x] Validação de duplicata não bloqueia edit da mesma questão
- [x] Pré-preenche todos os campos com dados existentes
- [x] Teste cobrindo fluxo de edição completo

### Funcionalidades
1. ✅ Abre modal de edição com "✏️ Editar" nos cards de questão
2. ✅ Wizard pré-preenchido com dados da questão
3. ✅ Navegação pelos 4 passos + resumo final
4. ✅ Validação permite editar a mesma pergunta (skip duplicata check para initialQuestion)
5. ✅ Botão final: "💾 Atualizar" em vez de "Salvar"

### Escopo concluído em S3-02
✅ Edição com 4 passos (reutiliza wizard)
✅ Deleção com confirmação modal
✅ Testes cobrindo edição e deleção completas
✅ 101/101 testes passando

---

## S3-02 Phase 2 Deleção de Questões - Status Concluído

### Tarefas entregues
- [x] Fluxo de deleção com confirmação modal
- [x] Teste para deleção com confirmação aceita
- [x] Teste para cancelamento de deleção
- [x] Validação que dispatch recebe DEL_QUESTION
- [x] Validação que toast de sucesso é exibido

### Funcionalidades
1. ✅ Botão "🗑 Excluir" em cada card de questão
2. ✅ Modal de confirmação: "Excluir esta questão? Esta ação não pode ser desfeita."
3. ✅ Se confirmar: dispatch({ type: "DEL_QUESTION", id })
4. ✅ Se confirmar: toast "Questão excluída 🗑️" com tipo success
5. ✅ Se cancelar: não executa nenhuma ação

### Testes adicionados
- "deleta questao com confirmacao"
  - Verifica que window.confirm é chamado
  - Verifica que dispatch recebe DEL_QUESTION
  - Verifica que addToast recebe mensagem de sucesso

- "cancela delecao quando usuario nega confirmacao"
  - Verifica que window.confirm é chamado
  - Verifica que dispatch NÃO é chamado se cancelar
  - Verifica que addToast NÃO é chamado se cancelar

### Melhorias ao renderQuestions helper
- Adicionado parâmetro dispatch para mockar chamadas
- Adicionado parâmetro addToast para mockar chamadas
- Retorna objeto com render + dispatch + addToast para testes

### Validação Final
```
✓ ESLint: 0 erros
✓ Testes focados (QuestionsScreen): 7/7 passando
✓ Suite completa: 101/101 testes passando (14 arquivos) ⬆️
✓ Build: 604 módulos transformados, sucesso
✓ Sem regressões em outros módulos
```

---

## S3-03 Importação em lote via CSV - Status Concluído

### Phase 1 Entregue

#### Parsing de CSV com validação
- [x] Função parseQuestionsCsv() com 14 colunas esperadas
- [x] Suporte RFC 4180: quoted fields, comma-separated, escaped quotes
- [x] Helpers: parseCsvLine(), unescapeCsv()
- [x] Erro collection strategy: continua parsing, retorna parcial success + erros

#### Validações implementadas (8 checks)
1. ✅ CSV não vazio e cabeçalho correto (14 colunas: Pergunta, Disciplina, Dificuldade, NivelEnsino, TipoResposta, OpcaoA-E, RespostaCorreta, Comentario, Origem, Tags)
2. ✅ Pergunta: não-vazia obrigatória
3. ✅ Disciplina: não-vazia obrigatória
4. ✅ RespostaCorreta: não-vazia obrigatória
5. ✅ Multipla-escolha: mínimo 2 opções (A+B)
6. ✅ Multipla-escolha: respostaCorreta ∈ opcoes
7. ✅ NivelEnsino: fallback "Fundamental" se vazio
8. ✅ Origem: fallback "Livro" se vazio, casting seguro

#### UI Integration
- [x] File input overlay em .upload-z div (position absolute)
- [x] handleImportCsv() com FileReader API
- [x] Dispatch automático: cria id + dataCadastro para ADD_QUESTION
- [x] Error display: card mostra até 5 erros + truncation notice
- [x] Success display: card verde com contagem importada
- [x] Toast notifications: sucesso + aviso de linhas ignoradas

#### Testes cobrindo import
- [x] "parse valido com uma questao" ✓
- [x] "rejeita cabecalho invalido" ✓
- [x] "rejeita linha com colunas faltando" ✓
- [x] "rejeita questao sem pergunta" ✓
- [x] "rejeita multipla-escolha com menos de 2 opcoes" ✓
- [x] "rejeita resposta correta fora das opcoes" ✓
- Tests: 9/9 passando (3 export + 6 import)

#### Validação Final Phase 1
```
✓ ESLint: 0 erros
✓ Testes CSV: 9/9 passando
✓ Suite completa: 107/107 testes passando (14 arquivos)
✓ Build: 604 módulos transformados, sucesso
✓ Tipo safety: NivelEnsino, Origem com casting seguro
✓ Sem regressões
```

### Phase 2 Entregue (Edge Cases)

#### Robustez adicional do parser
- [x] Suporte a multiline em campos quoted (quebras de linha dentro de aspas)
- [x] Suporte a caracteres especiais e aspas escapadas (double quotes)
- [x] Parsing de registros por estado (quotes-aware), sem split simples por linha
- [x] Validação de tipoResposta inválido (somente multipla-escolha ou verdadeiro-falso)
- [x] Validação de resposta correta para verdadeiro-falso (Verdadeiro/Falso)

#### Testes adicionados na Phase 2
- [x] "aceita pergunta multiline quando campo esta quoted" ✓
- [x] "aceita aspas escapadas em campos quoted" ✓
- [x] "rejeita verdadeiro-falso com resposta invalida" ✓
- [x] "importa arquivo grande com 1000 linhas" ✓
- Tests CSV: 13/13 passando (3 export + 10 import)

#### Validação Final S3-03
```
✓ ESLint: 0 erros
✓ Testes CSV: 13/13 passando
✓ Suite completa: 113/113 testes passando (14 arquivos)
✓ Build: 604 módulos transformados, sucesso
✓ Parser robusto para multiline/special chars/large file
✓ Sem regressões
```

### Próximo item do roadmap
- [x] **S3-04**: Auto-save draft na wizard

---

## S3-04 Auto-save de Rascunho - Status Concluído

### Phase 1 Entregue
- [x] Auto-save de rascunho no wizard de criação de questão
- [x] Persistência em localStorage (key: qdr_add_question_draft_v1)
- [x] Restauração automática ao reabrir o modal de Nova Questão
- [x] Limpeza automática do rascunho após salvar
- [x] Ação manual para limpar rascunho (botão "🗑 Limpar rascunho")
- [x] Indicador visual de estado de rascunho no modal

### Testes adicionados
- [x] "restaura rascunho ao reabrir modal de nova questao"
- [x] "limpa rascunho apos salvar nova questao"
- [x] "ignora rascunho expirado"
- [x] "pede confirmacao ao fechar modal com alteracoes nao salvas"
- [x] "fecha sem confirmacao quando nao ha alteracoes"
- [x] "restaura rascunho no fluxo de edicao da mesma questao"
- [x] "limpa rascunho de edicao apos atualizar"

### Phase 2 Entregue
- [x] Política de expiração de rascunho (TTL de 24h)
- [x] Limpeza automática de rascunho expirado ao abrir modal
- [x] Confirmação ao fechar modal quando há alterações não salvas
- [x] Sem confirmação quando não há alterações

### Phase 3 Entregue
- [x] Reaproveitamento de rascunho no fluxo de edição
- [x] Chave de rascunho isolada por questão (qdr_edit_question_draft_v1:<id>)
- [x] Auto-save + restore + clear também para edição
- [x] Sem conflito entre rascunho de criação e rascunho de edição

### Phase 4 Entregue (UX refinada)
- [x] Mensagens contextuais distintas para criação vs edição ao fechar com alterações
- [x] Mensagens contextuais no banner de rascunho restaurado (criação/edição)
- [x] Linguagem de confirmação mais explícita para reduzir ambiguidade
- [x] Microcopy reduzida e padronizada (textos curtos, diretos e consistentes)

### Validação da etapa
```
✓ ESLint: 0 erros
✓ QuestionsScreen tests: 15/15 passando
✓ Suite completa: 119/119 testes passando
✓ Build: sucesso
✓ Sem regressões
```

### Fechamento do S3-04
✅ Auto-save concluído para criação e edição
✅ Restauração e limpeza de rascunho por contexto
✅ TTL de 24h para descarte automático de draft expirado
✅ Confirmação segura de fechamento com alterações não salvas
✅ UX refinada com microcopy curta e contextual

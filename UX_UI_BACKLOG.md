# Backlog UX/UI - Questionador App

## Objetivo
Melhorar a experiencia de uso com foco em:
- inicio rapido de sessao
- melhor compreensao de desempenho
- aumento de uso de revisao de erros
- reducao de friccao em criacao de questoes

## Priorizacao (MoSCoW)

### Must
- Home com CTA inteligente
- Questao do dia com foco em acao
- Resultado orientado a proxima acao
- Barra de acoes fixa no quiz mobile
- Grafico de evolucao com anotacoes
- Tabela acessivel alternativa para charts

### Should
- Acerto por sessao com alternancia visual
- Ranking e perfil com foco em habitos
- Wizard de criacao de questao
- Validacao de qualidade de questao

### Could
- Presets salvos de sessao
- Nudge inteligente pos-sessao

### Won't (agora)
- Personalizacao avancada de layout por usuario
- Gamificacao social sincrona em tempo real
- Recomendacoes com modelo preditivo complexo

---

## Sprint 1

### S1-01 Home com CTA inteligente (Must)
**Historia**
Como estudante, quero ver a melhor acao do momento para comecar rapido.

**Criterios de aceitacao**
1. Dado que tenho meta diaria pendente, quando abrir a Home, entao vejo CTA primario com mensagem de progresso.
2. Dado que nao tenho questoes, quando abrir a Home, entao vejo estado vazio com acao "Criar primeira questao".
3. Dado que completei a meta, quando abrir a Home, entao vejo sugestao secundaria de revisao de erros.
4. CTA primario fica visivel sem scroll no mobile.

**Metricas**
- tempo ate iniciar quiz
- taxa de clique no CTA primario

### S1-02 Questao do dia com foco em acao (Must)
**Historia**
Como estudante, quero resolver rapidamente a questao do dia com contexto minimo.

**Criterios de aceitacao**
1. Card exibe pergunta resumida, disciplina e dificuldade.
2. Botao "Resolver agora" inicia sessao de 1 questao.
3. Ao concluir, fluxo retorna para Home ou Resultados sem quebrar contexto.

**Metricas**
- taxa de inicio via questao do dia
- taxa de conclusao da sessao de 1 questao

### S1-03 Resultado orientado a proxima acao (Must)
**Historia**
Como estudante, quero saber exatamente o que fazer apos ver meu desempenho.

**Criterios de aceitacao**
1. Tela mostra 3 insights: ponto forte, principal erro e recomendacao.
2. Botao primario "Revisar apenas erros" inicia fluxo direto.
3. Exibe comparacao com historico recente (ultimas 5 sessoes).

**Metricas**
- taxa de clique em "Revisar apenas erros"
- taxa de nova sessao apos resultados

### S1-04 Barra de acoes fixa no quiz mobile (Must)
**Historia**
Como estudante mobile, quero responder/pular sem procurar botoes.

**Criterios de aceitacao**
1. Barra de acao fixa no rodape no mobile.
2. Acoes principais ficam alcancaveis com polegar.
3. Barra nao cobre conteudo essencial da pergunta/opcoes.

**Metricas**
- tempo medio por resposta no mobile
- taxa de erro de toque em acoes

---

## Sprint 2

### S2-01 Grafico de evolucao com anotacoes (Must)
**Historia**
Como estudante, quero entender evolucao de nivel e eventos marcantes.

**Criterios de aceitacao**
1. Grafico de linha com marcos de subida de nivel.
2. Tooltip com data, nivel e contexto.
3. Linha de meta visivel quando houver meta configurada.

**Metricas**
- interacao com grafico de evolucao
- entendimento auto-declarado (pesquisa curta)

### S2-02 Acerto por sessao com alternancia visual (Should)
**Historia**
Como estudante, quero alternar entre barras e linha conforme necessidade.

**Criterios de aceitacao**
1. Toggle barras/linha preserva preferencia.
2. Escala fixa de 0 a 100 em qualquer periodo.
3. Filtros de periodo atualizam sem quebrar layout.

**Metricas**
- uso do toggle
- uso dos filtros de periodo

### S2-03 Tabela acessivel alternativa para charts (Must)
**Historia**
Como usuario de leitor de tela, quero consumir os mesmos dados em tabela.

**Criterios de aceitacao**
1. Cada grafico tem acao "Ver dados em tabela".
2. Tabela com cabecalhos semanticos e ordem logica.
3. Dados da tabela equivalentes ao grafico.

**Metricas**
- uso da tabela alternativa
- violacoes de acessibilidade (axe)

### S2-04 Ranking e perfil com foco em habitos (Should)
**Historia**
Como estudante, quero visualizar consistencia semanal de forma intuitiva.

**Criterios de aceitacao**
1. Heatmap semanal por dia de estudo.
2. Indicador textual de tendencia (subindo/estavel/caindo).
3. Recomendacao automatica quando houver lacunas de estudo.

**Metricas**
- retorno semanal (D7)
- aumento de dias ativos por semana

---

## Sprint 3

### S3-01 Wizard de criacao de questao (Should)
**Historia**
Como autor de conteudo, quero criar questoes por etapas para reduzir erros.

**Criterios de aceitacao**
1. Fluxo em 3 passos: enunciado, alternativas e metadados.
2. Nao avanca sem validacoes minimas.
3. Mantem progresso ao voltar etapas.

**Metricas**
- taxa de conclusao de criacao
- tempo medio para criar questao

### S3-02 Validacao de qualidade de questao (Should)
**Historia**
Como autor, quero feedback de qualidade antes de salvar.

**Criterios de aceitacao**
1. Regras bloqueantes: enunciado vazio, opcoes insuficientes, gabarito invalido.
2. Regras nao bloqueantes: texto muito longo, tags ausentes.
3. Mensagens claras e acionaveis.

**Metricas**
- taxa de correcoes antes de salvar
- queda em erros de questao cadastrada

### S3-03 Presets salvos de sessao (Could)
**Historia**
Como estudante recorrente, quero salvar configuracoes favoritas.

**Criterios de aceitacao**
1. Salvar preset com nome.
2. Aplicar preset em 1 toque.
3. Editar/excluir preset.

**Metricas**
- uso de presets
- reducao de tempo na configuracao

### S3-04 Nudge inteligente pos-sessao (Could)
**Historia**
Como estudante, quero recomendacoes contextualizadas para melhorar.

**Criterios de aceitacao**
1. Sugestao varia por desempenho e disciplina.
2. Nudge nao intrusivo.
3. Usuario pode dispensar e sistema respeita preferencia.

**Metricas**
- taxa de clique no nudge
- impacto no inicio de nova sessao

---

## Definition of Ready
1. Historia com objetivo e hipotese.
2. Criterios de aceitacao testaveis.
3. Dependencias mapeadas.
4. Mock do fluxo principal disponivel.

## Definition of Done
1. Testes unitarios/integracao passando.
2. Sem violacoes criticas de acessibilidade (axe).
3. Responsividade validada em mobile e desktop.
4. Eventos de telemetria instrumentados.

## Dependencias tecnicas sugeridas
- Telemetria de eventos de UX (inicio quiz, clique CTA, revisao de erros).
- Padronizacao de componentes para foco/estados.
- Estrutura de dados para insights de resultado.

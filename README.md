# O que é?
Questionador é uma plataforma completa de estudos que aplica o método científico de Spaced Repetition (Repetição Espaçada) para maximizar sua retenção de conhecimento. Diferente de apps convencionais que apenas apresentam questões aleatórias, o Questionador utiliza o algoritmo SM-2 (SuperMemo 2) — o mesmo usado em aplicativos renomados como Anki — para calcular automaticamente o momento ideal de revisar cada conteúdo, baseado no seu desempenho individual.
# Como funciona?
Você cria seus próprios bancos de questões organizados por disciplinas e níveis de dificuldade, com suporte completo a fórmulas matemáticas via LaTeX (ideal para exatas!). Ao responder quizzes personalizados, o sistema analisa seu tempo de resposta e taxa de acerto, ajustando inteligentemente os intervalos de revisão de 1 a 16 dias. Cada questão tem sua "memória" própria, garantindo que você revise mais frequentemente aquilo que tem dificuldade e menos o que já domina.
# Por que usar?
Totalmente gratuito, open source e sem necessidade de cadastro em servidores externos — seus dados ficam 100% privados no seu navegador. Com sistema de gamificação (badges, streaks, rankings), você mantém a motivação enquanto acompanha seu progresso através de gráficos detalhados. Desenvolvido com tecnologias modernas (React 19, TypeScript, Vite) e 33 testes automatizados, é uma ferramenta profissional perfeita para concursos públicos, vestibulares, certificações ou qualquer aprendizado que exija memorização eficiente.
# React + TypeScript + Vite


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

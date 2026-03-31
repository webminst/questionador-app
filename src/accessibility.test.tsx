import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import AuthScreen from "./features/auth/AuthScreen";
import QuizScreen from "./features/quiz/QuizScreen";
import { BottomNav, NavBar } from "./features/layout/AppChrome";
import type { QuizSession } from "./types/app";

function buildSession(overrides: Partial<QuizSession> = {}): QuizSession {
  return {
    questions: [
      {
        id: "q1",
        pergunta: "2 + 2?",
        disciplina: "Matematica",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["1", "2", "3", "4"],
        respostaCorreta: "4",
        origem: "Livro",
        tags: ["soma"],
        dataCadastro: "2026-03-26",
      },
    ],
    current: 0,
    answers: [],
    startTime: Date.now() - 5000,
    questionStartTime: Date.now() - 3000,
    answered: false,
    selectedAnswer: null,
    questionTimes: [],
    mode: "study",
    timer: 0,
    disc: "Matematica",
    ...overrides,
  };
}

async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const result = await axe.run(container, {
    rules: {
      // jsdom does not compute layout/colors accurately for this rule.
      "color-contrast": { enabled: false },
    },
  });
  expect(result.violations).toHaveLength(0);
}

describe("Acessibilidade com axe", () => {
  it("AuthScreen sem violacoes basicas", async () => {
    const { container } = render(
      <AuthScreen
        mode="login"
        setMode={vi.fn()}
        form={{ name: "", email: "ana@demo.com", password: "123456" }}
        setForm={vi.fn()}
        onLogin={vi.fn()}
        onRegister={vi.fn()}
      />,
    );

    await expectNoA11yViolations(container);
  });

  it("QuizScreen sem violacoes basicas", async () => {
    const { container } = render(
      <QuizScreen
        session={buildSession()}
        onAnswer={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onUndoAnswer={vi.fn()}
        onExit={vi.fn()}
      />,
    );

    await expectNoA11yViolations(container);
  });

  it("Navegacao principal e inferior sem violacoes basicas", async () => {
    const { container } = render(
      <>
        <NavBar
          screen="home"
          setScreen={vi.fn()}
          theme="light"
          themePreference="system"
          onToggleTheme={vi.fn()}
          onLogout={vi.fn()}
        />
        <BottomNav screen="home" setScreen={vi.fn()} />
      </>,
    );

    await expectNoA11yViolations(container);
  });
});

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { simpleHash } from "./domain/utils";
import type { PersistedState, Screen, ToastType, User } from "./types/app";
import { useAuthFlow } from "./hooks/useAuthFlow";
import { useQuizFlow } from "./hooks/useQuizFlow";
import { reducer, EMPTY_PU } from "./domain/state";

describe("Fluxo de Integração: Autenticação → Quiz → Resultados", () => {
  it("fluxo completo: novo usuario, onboarding, iniciar quiz, responder, ver resultados", () => {
    // Simulação de novo usuário
    const newUser: User = {
      id: "u_test",
      nome: "Teste Integration",
      email: "test@integration.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const baseState: PersistedState = {
      allUsers: [],
      questions: [
        {
          id: "q1",
          pergunta: "2 + 2?",
          disciplina: "Matemática",
          nivelEnsino: "Fundamental",
          tipoResposta: "multipla-escolha",
          opcoes: ["3", "4", "5"],
          respostaCorreta: "4",
          origem: "Livro",
          tags: ["soma"],
          dataCadastro: "2026-03-25",
        },
        {
          id: "q2",
          pergunta: "Capital da França?",
          disciplina: "Geografia",
          nivelEnsino: "Fundamental",
          tipoResposta: "multipla-escolha",
          opcoes: ["Paris", "Londres", "Berlim"],
          respostaCorreta: "Paris",
          origem: "Livro",
          tags: ["capitais"],
          dataCadastro: "2026-03-25",
        },
      ],
      disciplines: [
        { id: "d1", name: "Matemática", icon: "📐", color: "#4dabf7", builtin: true },
        { id: "d2", name: "Geografia", icon: "🌍", color: "#20c997", builtin: true },
      ],
      perUser: {},
    };

    // Etapa 1: Fluxo de Autenticação
    let appState = baseState;
    let currentScreen: Screen = "auth";
    let currentUser: User | null = null;
    const dispatch = vi.fn((action) => {
      appState = reducer(appState, action);
      // Update currentUser when appState changes
      if (appState.allUsers.length > 0) {
        currentUser = appState.allUsers[0];
      }
    });
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>((s) => {
      currentScreen = s;
    });

    const { result: authResult } = renderHook(() =>
      useAuthFlow({ allUsers: appState.allUsers, dispatch, addToast, setScreen }),
    );

    // Usuário faz cadastro
    act(() => {
      authResult.current.setAuthForm({
        name: newUser.nome,
        email: newUser.email,
        password: "Senha123",
      });
    });

    act(() => {
      authResult.current.handleRegister();
    });

    // Validações pós-registro
    expect(setScreen).toHaveBeenCalledWith("home");
    expect(authResult.current.showOnboard).toBe(true);
    expect(appState.allUsers).toHaveLength(1);
    expect(currentScreen).toBe("home");

    // Usuário desativa onboarding simulado
    act(() => {
      authResult.current.setShowOnboard(false);
    });

    // Etapa 2: Fluxo de Quiz
    const setCurrentUser = vi.fn((u) => {
      currentUser = u;
    });

  type QuizProps = { state: PersistedState; currentUser: User | null };
  const { result: quizResult, rerender: rerenderQuiz } = renderHook<ReturnType<typeof useQuizFlow>, QuizProps>(
      ({ state: s, currentUser: cu }) =>
        useQuizFlow({
          state: s,
          dispatch,
          currentUser: cu,
          setCurrentUser,
          uid: cu?.id || "",
          addToast,
          setScreen,
        }),
      { initialProps: { state: appState, currentUser } },
    );

    // Usuário tira a config de modo "all" e começa quiz
    act(() => {
      quizResult.current.startQuiz({
        disc: "all",
        level: "all",
        count: 2,
        mode: "study",
        timer: 30,
      });
    });

    // Validações de inicio de quiz
    expect(currentScreen).toBe("quiz");
    expect(quizResult.current.quiz).not.toBeNull();
    expect(quizResult.current.quiz?.questions.length).toBe(2);
    expect(quizResult.current.quiz?.current).toBe(0);

    // Etapa 3: Responder questões
    const firstQ = quizResult.current.quiz?.questions[0];
    expect(firstQ).toBeDefined();
    const firstCorrectAnswer = firstQ?.respostaCorreta || "";

    act(() => {
      quizResult.current.handleAnswer(firstCorrectAnswer, 5);
    });
    rerenderQuiz({ state: appState, currentUser });

    expect(quizResult.current.quiz?.answered).toBe(true);
    expect(quizResult.current.quiz?.selectedAnswer).toBe(firstCorrectAnswer);
    expect(quizResult.current.quiz?.answers).toHaveLength(1);

    // Próxima questão
    act(() => {
      quizResult.current.nextQuestion();
    });
    rerenderQuiz({ state: appState, currentUser });

    expect(quizResult.current.quiz?.current).toBe(1);
    expect(quizResult.current.quiz?.answered).toBe(false);

    // Responder segunda questão errado
    const secondQ = quizResult.current.quiz?.questions[1];
    expect(secondQ).toBeDefined();
    const secondWrongAnswer = secondQ?.opcoes.find((o) => o !== secondQ.respostaCorreta) || "";

    act(() => {
      quizResult.current.handleAnswer(secondWrongAnswer, 3);
    });
    rerenderQuiz({ state: appState, currentUser });

    expect(quizResult.current.quiz?.selectedAnswer).toBe(secondWrongAnswer);
    expect(quizResult.current.quiz?.answers).toHaveLength(2);

    // Etapa 4: Terminar quiz e ver resultados
    act(() => {
      quizResult.current.nextQuestion();
    });
    rerenderQuiz({ state: appState, currentUser });

    expect(currentScreen).toBe("results");
    expect(quizResult.current.results).not.toBeNull();
    expect(quizResult.current.results?.total).toBe(2);
    expect(quizResult.current.results?.correct).toBe(1);
    expect(quizResult.current.results?.wrong).toBe(1);

    // Validar respostas foram registradas corretamente
    expect(quizResult.current.results?.answers).toHaveLength(2);
    expect(quizResult.current.results?.answers.filter((a) => a.isCorrect)).toHaveLength(1);
    expect(quizResult.current.results?.answers.filter((a) => !a.isCorrect)).toHaveLength(1);

    // Validar que sessão foi adicionada ao histórico
    const userId = (currentUser as User | null)?.id || "";
    const pu = appState.perUser[userId];
    expect(pu.sessions).toHaveLength(1);
    expect(pu.sessions[0].correct).toBe(1);
    expect(pu.sessions[0].total).toBe(2);
  });

  it("fluxo: login existente, quiz com skip, voltar home", () => {
    const existingUser: User = {
      id: "u_existing",
      nome: "Usuário Existente",
      email: "existing@demo.com",
      pwdHash: simpleHash("Senha456"),
      pontuacao: 100,
      respostasCertas: 10,
      respostasErradas: 2,
    };

    const baseState: PersistedState = {
      allUsers: [existingUser],
      questions: [
        {
          id: "q1",
          pergunta: "Pergunta 1?",
          disciplina: "Matemática",
          nivelEnsino: "Fundamental",
          tipoResposta: "multipla-escolha",
          opcoes: ["A", "B", "C"],
          respostaCorreta: "B",
          origem: "Livro",
          tags: ["teste"],
          dataCadastro: "2026-03-25",
        },
      ],
      disciplines: [{ id: "d1", name: "Matemática", icon: "📐", color: "#4dabf7", builtin: true }],
      perUser: {
        u_existing: EMPTY_PU(),
      },
    };

    let appState = baseState;
    const dispatch = vi.fn((action) => {
      appState = reducer(appState, action);
    });
    const addToast = vi.fn();
    const setScreen = vi.fn();

    // Login
    const { result: authResult } = renderHook(() =>
      useAuthFlow({ allUsers: appState.allUsers, dispatch, addToast, setScreen }),
    );

    act(() => {
      authResult.current.setAuthForm({ name: "", email: "existing@demo.com", password: "Senha456" });
    });

    act(() => {
      authResult.current.handleLogin();
    });

    expect(authResult.current.currentUser?.id).toBe("u_existing");
    expect(setScreen).toHaveBeenCalledWith("home");

    // Quiz com skip
    const { result: quizResult } = renderHook(() =>
      useQuizFlow({
        state: appState,
        dispatch,
        currentUser: authResult.current.currentUser!,
        setCurrentUser: vi.fn(),
        uid: "u_existing",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      quizResult.current.startQuiz({ disc: "all", level: "all", count: 1, mode: "study", timer: 30 });
    });

    // Skip a pergunta
    act(() => {
      quizResult.current.skipQuestion();
    });

    expect(quizResult.current.quiz?.answers).toHaveLength(1);
    expect(quizResult.current.quiz?.answers[0].skipped).toBe(true);

    // Avançar para resultados
    act(() => {
      quizResult.current.nextQuestion();
    });

    expect(quizResult.current.results?.correct).toBe(0);
    expect(quizResult.current.results?.wrong).toBe(1);
  });

  it("fluxo: logout retorna auth, estado é limpo", () => {
    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@demo.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 50,
      respostasCertas: 5,
      respostasErradas: 1,
    };

    const dispatch = vi.fn();
    const addToast = vi.fn();
    let currentScreen: Screen = "home";
    const setScreen = vi.fn((s: Screen) => {
      currentScreen = s;
    });

    const { result: authResult } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    // Simular que já está logado
    act(() => {
      (authResult.current as unknown as typeof authResult.current).setCurrentUser(user);
    });


  expect(((authResult.current as unknown as typeof authResult.current).currentUser as User | null)?.id).toBe("u1");
    // Fazer logout
    act(() => {
      authResult.current.handleLogout();
    });

    expect(currentScreen).toBe("auth");
    expect(authResult.current.currentUser).toBeNull();
    expect(authResult.current.authForm).toEqual({ name: "", email: "", password: "" });
  });

  it("fluxo: adicionar múltiplas questões e depois fazer quiz com elas", () => {
    const user: User = {
      id: "u1",
      nome: "Estudante",
      email: "student@demo.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    let appState: PersistedState = {
      allUsers: [user],
      questions: [],
      disciplines: [{ id: "d1", name: "Teste", icon: "📝", color: "#ff6b35", builtin: true }],
      perUser: {
        u1: EMPTY_PU(),
      },
    };

    const dispatch = vi.fn((action) => {
      appState = reducer(appState, action);
    });
    const addToast = vi.fn();
    const setScreen = vi.fn();

    const { result: quizResult, rerender: rerenderQuiz } = renderHook(
      ({ state: s }) =>
        useQuizFlow({
          state: s,
          dispatch,
          currentUser: user,
          setCurrentUser: vi.fn(),
          uid: "u1",
          addToast,
          setScreen,
        }),
      { initialProps: { state: appState } },
    );

    // Adicionar 3 questões
    act(() => {
      quizResult.current.addQuestion({
        pergunta: "Pergunta 1?",
        disciplina: "Teste",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["A", "B"],
        respostaCorreta: "A",
        origem: "Livro",
        tags: ["q1"],
      });
    });
    rerenderQuiz({ state: appState });

    act(() => {
      quizResult.current.addQuestion({
        pergunta: "Pergunta 2?",
        disciplina: "Teste",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["X", "Y"],
        respostaCorreta: "Y",
        origem: "Livro",
        tags: ["q2"],
      });
    });
    rerenderQuiz({ state: appState });

    act(() => {
      quizResult.current.addQuestion({
        pergunta: "Pergunta 3?",
        disciplina: "Teste",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["1", "2"],
        respostaCorreta: "1",
        origem: "Livro",
        tags: ["q3"],
      });
    });
    rerenderQuiz({ state: appState });

    expect(appState.questions).toHaveLength(3);

    // Agora fazer quiz com essas questões
    act(() => {
      quizResult.current.startQuiz({ disc: "Teste", level: "all", count: 3, mode: "study", timer: 30 });
    });
    rerenderQuiz({ state: appState });

    expect(quizResult.current.quiz?.questions).toHaveLength(3);
  });
});

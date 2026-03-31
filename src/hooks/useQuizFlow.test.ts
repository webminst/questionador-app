import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AppAction } from "../domain/state";
import type {
  PersistedState,
  Question,
  Screen,
  ToastType,
  User,
} from "../types/app";
import { useQuizFlow } from "./useQuizFlow";

function baseState(questions: Question[]): PersistedState {
  return {
    allUsers: [],
    questions,
    disciplines: [{ id: "d1", name: "Matematica", icon: "📘", color: "#2255aa" }],
    perUser: {
      u1: {
        sessions: [],
        bookmarks: [],
        achievements: {},
        streak: { count: 0, lastDate: null },
        srData: {},
        lastSessionWrongQuestionIds: [],
      },
    },
  };
}

function buildQuestion(): Question {
  return {
    id: "q1",
    pergunta: "2 + 2 = ?",
    disciplina: "Matematica",
    dificuldade: "Fácil",
    nivelEnsino: "Fundamental",
    tipoResposta: "multipla-escolha",
    opcoes: ["3", "4", "5", "6"],
    respostaCorreta: "4",
    origem: "Livro",
    tags: ["soma"],
    dataCadastro: "2026-03-25",
  };
}

function buildQuestion2(): Question {
  return {
    id: "q2",
    pergunta: "3 + 3 = ?",
    disciplina: "Matematica",
    dificuldade: "Difícil",
    nivelEnsino: "Fundamental",
    tipoResposta: "multipla-escolha",
    opcoes: ["5", "6", "7", "8"],
    respostaCorreta: "6",
    origem: "Livro",
    tags: ["soma"],
    dataCadastro: "2026-03-25",
  };
}

describe("useQuizFlow", () => {
  it("nao inicia quiz quando nao ha questoes", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const { result } = renderHook(() =>
      useQuizFlow({
        state: baseState([]),
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startQuiz({ disc: "all", level: "all", count: 10, mode: "study", timer: 30 });
    });

    expect(addToast).toHaveBeenCalledWith("Nenhuma questão disponível", "error");
    expect(setScreen).not.toHaveBeenCalled();
    expect(result.current.quiz).toBeNull();
  });

  it("inicia quiz e muda para a tela de quiz", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const { result } = renderHook(() =>
      useQuizFlow({
        state: baseState([buildQuestion()]),
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startQuiz({ disc: "all", level: "all", count: 10, mode: "study", timer: 30 });
    });

    expect(setScreen).toHaveBeenCalledWith("quiz");
    expect(result.current.quiz?.questions.length).toBe(1);
  });

  it("responde questao e despacha atualizacao de usuario e revisao espacada", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const { result } = renderHook(() =>
      useQuizFlow({
        state: baseState([buildQuestion()]),
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startQuiz({ disc: "all", level: "all", count: 10, mode: "study", timer: 30 });
    });

    act(() => {
      result.current.handleAnswer("4", 4);
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "UPDATE_USER", id: "u1" }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "UPDATE_SR", uid: "u1", qid: "q1" }),
    );
    expect(result.current.quiz?.answered).toBe(true);
    expect(result.current.quiz?.selectedAnswer).toBe("4");
  });

  it("adiciona questao via dispatch", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const { result } = renderHook(() =>
      useQuizFlow({
        state: baseState([buildQuestion()]),
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.addQuestion({
        pergunta: "Capital da França?",
        disciplina: "Matematica",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["Paris", "Roma", "Lisboa", "Madrid"],
        respostaCorreta: "Paris",
        comentario: "Capital correta",
        origem: "Livro",
        tags: ["geografia"],
      });
    });

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "ADD_QUESTION" }));
    expect(addToast).toHaveBeenCalledWith("Questão cadastrada! ✅");
  });

  it("nao inicia revisao de erros quando sessao anterior nao teve erros", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const { result } = renderHook(() =>
      useQuizFlow({
        state: baseState([buildQuestion(), buildQuestion2()]),
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startQuiz({ disc: "all", level: "all", count: 10, mode: "review_errors", timer: 0 });
    });

    expect(addToast).toHaveBeenCalledWith("Sem erros na sessão anterior para revisar", "error");
    expect(setScreen).not.toHaveBeenCalled();
    expect(result.current.quiz).toBeNull();
  });

  it("inicia revisao de erros com questoes da ultima sessao", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const state = baseState([buildQuestion(), buildQuestion2()]);
    state.perUser.u1.lastSessionWrongQuestionIds = ["q2"];

    const { result } = renderHook(() =>
      useQuizFlow({
        state,
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startQuiz({ disc: "all", level: "all", count: 10, mode: "review_errors", timer: 0 });
    });

    expect(setScreen).toHaveBeenCalledWith("quiz");
    expect(result.current.quiz?.mode).toBe("review_errors");
    expect(result.current.quiz?.questions).toHaveLength(1);
    expect(result.current.quiz?.questions[0].id).toBe("q2");
  });

  it("filtra inicio do quiz por dificuldade", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const { result } = renderHook(() =>
      useQuizFlow({
        state: baseState([buildQuestion(), buildQuestion2()]),
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startQuiz({ disc: "all", level: "all", difficulty: "Difícil", count: 10, mode: "study", timer: 30 });
    });

    expect(result.current.quiz?.questions).toHaveLength(1);
    expect(result.current.quiz?.questions[0].id).toBe("q2");
  });

  it("sinaliza e dessinaliza questao atual como incorreta", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const state = baseState([buildQuestion()]);

    const { result } = renderHook(() =>
      useQuizFlow({
        state,
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startQuiz({ disc: "all", level: "all", count: 10, mode: "study", timer: 30 });
    });

    act(() => {
      result.current.toggleReportCurrentQuestion();
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "UPDATE_PU",
      uid: "u1",
      data: { reportedQuestionIds: ["q1"] },
    });

    state.perUser.u1.reportedQuestionIds = ["q1"];

    act(() => {
      result.current.toggleReportCurrentQuestion();
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "UPDATE_PU",
      uid: "u1",
      data: { reportedQuestionIds: [] },
    });
  });

  it("inicia questao do dia com uma unica questao", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();
    const setCurrentUser = vi.fn();

    const user: User = {
      id: "u1",
      nome: "Ana",
      email: "ana@email.com",
      pwdHash: "hash",
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    const { result } = renderHook(() =>
      useQuizFlow({
        state: baseState([buildQuestion(), buildQuestion2()]),
        dispatch,
        currentUser: user,
        setCurrentUser,
        uid: "u1",
        addToast,
        setScreen,
      }),
    );

    act(() => {
      result.current.startDailyQuestionById("q2");
    });

    expect(setScreen).toHaveBeenCalledWith("quiz");
    expect(result.current.quiz?.questions).toHaveLength(1);
    expect(result.current.quiz?.questions[0].id).toBe("q2");
    expect(result.current.quiz?.timer).toBe(0);
  });
});

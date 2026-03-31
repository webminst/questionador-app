import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppCtx } from "../../app/context";
import type { Discipline, PersistedState, User } from "../../types/app";
import HomeScreen from "./HomeScreen";

function makeDisciplines(): Discipline[] {
  return [
    { id: "d1", name: "Matematica", icon: "📐", color: "#4dabf7", builtin: true },
  ];
}

function makeUser(): User {
  return {
    id: "u1",
    nome: "Ana",
    email: "ana@demo.com",
    pwdHash: "hash",
    pontuacao: 100,
    respostasCertas: 10,
    respostasErradas: 2,
  };
}

function renderHome(state: PersistedState, handlers?: {
  onSelectDisc?: (disc: string) => void;
  onStartQuestionOfDay?: (questionId: string) => void;
  onStartReviewErrors?: () => void;
  onAddQ?: () => void;
}) {
  const user = makeUser();
  return render(
    <AppCtx.Provider
      value={{
        state,
        dispatch: vi.fn(),
        currentUser: user,
        uid: "u1",
        addToast: vi.fn(),
        leaderboard: [user],
      }}
    >
      <HomeScreen
        onSelectDisc={handlers?.onSelectDisc ?? vi.fn()}
        onStartQuestionOfDay={handlers?.onStartQuestionOfDay ?? vi.fn()}
        onStartReviewErrors={handlers?.onStartReviewErrors ?? vi.fn()}
        onAddQ={handlers?.onAddQ ?? vi.fn()}
        setScreen={vi.fn()}
      />
    </AppCtx.Provider>,
  );
}

describe("HomeScreen next step", () => {
  it("prioriza criar primeira questao quando nao ha questoes", () => {
    const onAddQ = vi.fn();
    const state: PersistedState = {
      allUsers: [makeUser()],
      questions: [],
      disciplines: makeDisciplines(),
      perUser: {
        u1: {
          sessions: [],
          bookmarks: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 0, lastDate: null },
          srData: {},
          lastSessionWrongQuestionIds: [],
          reportedQuestionIds: [],
        },
      },
    };

    const { getByText } = renderHome(state, { onAddQ });

    fireEvent.click(getByText("Criar primeira questao →"));
    expect(onAddQ).toHaveBeenCalledTimes(1);
  });

  it("prioriza continuar estudo quando meta diaria ainda nao foi concluida", () => {
    const onSelectDisc = vi.fn();
    const state: PersistedState = {
      allUsers: [makeUser()],
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
          dataCadastro: "2026-03-27",
        },
      ],
      disciplines: makeDisciplines(),
      perUser: {
        u1: {
          sessions: [],
          bookmarks: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 0, lastDate: null },
          srData: {},
          lastSessionWrongQuestionIds: ["q1"],
          reportedQuestionIds: [],
        },
      },
    };

    const { getByText } = renderHome(state, { onSelectDisc });

    fireEvent.click(getByText("Continuar estudo →"));
    expect(onSelectDisc).toHaveBeenCalledWith("all");
  });

  it("prioriza revisar erros quando meta diaria ja foi concluida", () => {
    const onStartReviewErrors = vi.fn();
    const nowIso = new Date().toISOString();
    const state: PersistedState = {
      allUsers: [makeUser()],
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
          dataCadastro: "2026-03-27",
        },
      ],
      disciplines: makeDisciplines(),
      perUser: {
        u1: {
          sessions: [
            {
              id: "s1",
              date: nowIso,
              discipline: "Matematica",
              correct: 20,
              total: 20,
              totalTime: 300,
              points: 200,
              mode: "study",
            },
          ],
          bookmarks: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 1, lastDate: nowIso.slice(0, 10) },
          srData: {},
          lastSessionWrongQuestionIds: ["q1"],
          reportedQuestionIds: [],
        },
      },
    };

    const { getByText } = renderHome(state, { onStartReviewErrors });

    fireEvent.click(getByText("Revisar erros →"));
    expect(onStartReviewErrors).toHaveBeenCalledTimes(1);
  });

  it("exibe questao do dia com preview truncado para leitura rapida", () => {
    const longQuestion = "Esta e uma pergunta muito longa para testar o preview da questao do dia no card principal da home, garantindo leitura rapida sem ocupar muito espaco visual na tela.";
    const state: PersistedState = {
      allUsers: [makeUser()],
      questions: [
        {
          id: "q1",
          pergunta: longQuestion,
          disciplina: "Matematica",
          nivelEnsino: "Fundamental",
          tipoResposta: "multipla-escolha",
          opcoes: ["1", "2", "3", "4"],
          respostaCorreta: "4",
          origem: "Livro",
          tags: ["soma"],
          dataCadastro: "2026-03-27",
        },
      ],
      disciplines: makeDisciplines(),
      perUser: {
        u1: {
          sessions: [],
          bookmarks: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 0, lastDate: null },
          srData: {},
          lastSessionWrongQuestionIds: [],
          reportedQuestionIds: [],
        },
      },
    };

    const { getByText } = renderHome(state);

    expect(getByText(/\.{3}$/)).toBeTruthy();
  });

  it("aciona sessao direta ao clicar em resolver questao do dia", () => {
    const onStartQuestionOfDay = vi.fn();
    const state: PersistedState = {
      allUsers: [makeUser()],
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
          dataCadastro: "2026-03-27",
        },
      ],
      disciplines: makeDisciplines(),
      perUser: {
        u1: {
          sessions: [],
          bookmarks: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 0, lastDate: null },
          srData: {},
          lastSessionWrongQuestionIds: [],
          reportedQuestionIds: [],
        },
      },
    };

    const { getAllByText } = renderHome(state, { onStartQuestionOfDay });

    const startButtons = getAllByText("Resolver questao do dia →");
    fireEvent.click(startButtons[startButtons.length - 1]);
    expect(onStartQuestionOfDay).toHaveBeenCalledWith("q1");
  });
});

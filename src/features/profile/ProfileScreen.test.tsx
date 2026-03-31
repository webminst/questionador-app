import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppCtx } from "../../app/context";
import type { PersistedState, User } from "../../types/app";
import ProfileScreen from "./ProfileScreen";

function makeUser(points = 350): User {
  return {
    id: "u1",
    nome: "Ana",
    email: "ana@demo.com",
    pwdHash: "hash",
    pontuacao: points,
    respostasCertas: 30,
    respostasErradas: 10,
  };
}

function renderProfile(state: PersistedState, currentUser: User) {
  return render(
    <AppCtx.Provider
      value={{
        state,
        dispatch: vi.fn(),
        currentUser,
        uid: "u1",
        addToast: vi.fn(),
        leaderboard: [currentUser],
      }}
    >
      <ProfileScreen onUpdateProfile={vi.fn(() => true)} />
    </AppCtx.Provider>,
  );
}

function clickHistoryTab(getAllByRole: (role: string, options?: { name?: string }) => HTMLElement[]) {
  const historyTabs = getAllByRole("tab", { name: "📈 Historico" });
  historyTabs.forEach((tab) => fireEvent.click(tab));
}

afterEach(() => {
  cleanup();
});

describe("ProfileScreen history evolution", () => {
  it("mostra anotacoes e resumo de tendencia quando ha marcos de nivel", () => {
    const user = makeUser(350);
    const state: PersistedState = {
      allUsers: [user],
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
          dataCadastro: "2026-03-28",
        },
      ],
      disciplines: [{ id: "d1", name: "Matematica", icon: "📐", color: "#4dabf7", builtin: true }],
      perUser: {
        u1: {
          sessions: [
            {
              id: "s1",
              date: new Date(Date.now() - 2 * 86400000).toISOString(),
              discipline: "Matematica",
              correct: 8,
              total: 10,
              totalTime: 320,
              points: 150,
              mode: "study",
            },
            {
              id: "s2",
              date: new Date(Date.now() - 86400000).toISOString(),
              discipline: "Matematica",
              correct: 9,
              total: 10,
              totalTime: 300,
              points: 150,
              mode: "study",
            },
          ],
          bookmarks: [],
          reportedQuestionIds: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 2, lastDate: new Date().toISOString().slice(0, 10) },
          srData: {},
          lastSessionWrongQuestionIds: [],
        },
      },
    };

    const { getByText, getAllByRole } = renderProfile(state, user);

    clickHistoryTab(getAllByRole);

    expect(getByText("Resumo da tendencia")).toBeTruthy();
    expect(getByText(/Ultimo marco:/)).toBeTruthy();
    expect(getByText(/Meta atual: Nivel/)).toBeTruthy();

    const levelTableToggle = getByText("Ver dados em tabela (evolucao)");
    fireEvent.click(levelTableToggle);
    expect(getByText("Tabela de evolucao de nivel")).toBeTruthy();
    expect(getByText("Pontos acumulados")).toBeTruthy();
    expect(getByText("Exportar CSV (evolucao)")).toBeTruthy();

    const accuracyTableToggle = getByText("Ver dados em tabela (acerto)");
    fireEvent.click(accuracyTableToggle);
    expect(getByText("Tabela de acerto por sessao")).toBeTruthy();
    expect(getByText("Acerto (%)")).toBeTruthy();
    expect(getByText("Exportar CSV (acerto)")).toBeTruthy();

    const sessionsTableToggle = getByText("Ver dados em tabela (sessoes)");
    fireEvent.click(sessionsTableToggle);
    expect(getByText("Tabela de sessoes por periodo")).toBeTruthy();
    expect(getByText("Disciplina")).toBeTruthy();
    expect(getByText("Exportar CSV (sessoes)")).toBeTruthy();

    const orderButton = getByText("Mais antigas primeiro");
    fireEvent.click(orderButton);
    expect(getByText("Mais recentes primeiro")).toBeTruthy();
  });
  
  it("mantem fallback quando nao ha marcos de nivel", async () => {
    const user = makeUser(50);
    const state: PersistedState = {
      allUsers: [user],
      questions: [],
      disciplines: [],
      perUser: {
        u1: {
          sessions: [
            {
              id: "s-no-level-up",
              date: new Date(Date.now() - 3600000).toISOString(),
              discipline: "Matematica",
              correct: 3,
              total: 5,
              totalTime: 180,
              points: 10,
              mode: "study",
            },
          ],
          bookmarks: [],
          reportedQuestionIds: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 0, lastDate: null },
          srData: {},
          lastSessionWrongQuestionIds: [],
        },
      },
    };

    const { findByText, getByRole, queryByText } = renderProfile(state, user);

    const historyTab = getByRole("tab", { name: "📈 Historico" });
    fireEvent.click(historyTab);
    expect(historyTab.getAttribute("aria-selected")).toBe("true");

    expect(await findByText(/Complete mais sessoes para registrar conquistas/)).toBeTruthy();
    expect(queryByText("Resumo da tendencia")).toBeNull();
    expect(queryByText(/Sem sessoes no periodo selecionado/)).toBeNull();
  });

  it("mostra heatmap semanal com tendencia e recomendacao no streak", () => {
    const user = makeUser(220);
    const state: PersistedState = {
      allUsers: [user],
      questions: [],
      disciplines: [{ id: "d1", name: "Matematica", icon: "📐", color: "#4dabf7", builtin: true }],
      perUser: {
        u1: {
          sessions: [
            {
              id: "s1",
              date: new Date(Date.now() - 86400000).toISOString(),
              discipline: "Matematica",
              correct: 6,
              total: 10,
              totalTime: 240,
              points: 40,
              mode: "study",
            },
            {
              id: "s2",
              date: new Date(Date.now() - 2 * 86400000).toISOString(),
              discipline: "Matematica",
              correct: 7,
              total: 10,
              totalTime: 210,
              points: 40,
              mode: "study",
            },
          ],
          bookmarks: [],
          reportedQuestionIds: [],
          dailyGoalQuestions: 20,
          achievements: {},
          streak: { count: 2, lastDate: new Date().toDateString() },
          srData: {},
          lastSessionWrongQuestionIds: [],
        },
      },
    };

    const { getByRole, getByText } = renderProfile(state, user);

    fireEvent.click(getByRole("tab", { name: "🔥 Streak" }));

    expect(getByText("🗓️ Heatmap semanal (ultimos 28 dias)")).toBeTruthy();
    expect(getByText(/Tendencia semanal:/)).toBeTruthy();
    expect(getByText(/Recomendacao:/)).toBeTruthy();
  });

});

import { describe, expect, it, vi } from "vitest";
import type { PersistedState, Question, User } from "../types/app";
import { EMPTY_PU, getPU, reducer } from "./state";

function baseState(): PersistedState {
  return {
    allUsers: [
      {
        id: "u1",
        nome: "Ana Silva",
        email: "ana@demo.com",
        pwdHash: "hash1",
        pontuacao: 100,
        respostasCertas: 10,
        respostasErradas: 2,
      },
    ],
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
    ],
    disciplines: [
      { id: "d1", name: "Matemática", icon: "📐", color: "#4dabf7", builtin: true },
    ],
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

describe("reducer", () => {
  describe("ADD_USER", () => {
    it("adiciona novo usuário ao estado", () => {
      const state = baseState();
      const newUser: User = {
        id: "u2",
        nome: "Carlos",
        email: "carlos@demo.com",
        pwdHash: "hash2",
        pontuacao: 0,
        respostasCertas: 0,
        respostasErradas: 0,
      };

      const next = reducer(state, { type: "ADD_USER", user: newUser });

      expect(next.allUsers).toHaveLength(2);
      expect(next.allUsers[1]).toEqual(newUser);
    });
  });

  describe("UPDATE_USER", () => {
    it("atualiza dados de usuário existente", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "UPDATE_USER",
        id: "u1",
        data: { pontuacao: 150, respostasCertas: 15 },
      });

      expect(next.allUsers[0].pontuacao).toBe(150);
      expect(next.allUsers[0].respostasCertas).toBe(15);
      expect(next.allUsers[0].email).toBe("ana@demo.com");
    });

    it("não afeta usuários outros quando atualizando um", () => {
      const state = baseState();
      state.allUsers.push({
        id: "u2",
        nome: "Carlos",
        email: "carlos@demo.com",
        pwdHash: "hash2",
        pontuacao: 50,
        respostasCertas: 5,
        respostasErradas: 1,
      });

      const next = reducer(state, {
        type: "UPDATE_USER",
        id: "u1",
        data: { pontuacao: 200 },
      });

      expect(next.allUsers[0].pontuacao).toBe(200);
      expect(next.allUsers[1].pontuacao).toBe(50);
    });
  });

  describe("ADD_QUESTION", () => {
    it("adiciona nova questão", () => {
      const state = baseState();
      const newQ: Question = {
        id: "q2",
        pergunta: "Capital da França?",
        disciplina: "Geografia",
        nivelEnsino: "Fundamental",
        tipoResposta: "multipla-escolha",
        opcoes: ["Paris", "Roma", "Berlim"],
        respostaCorreta: "Paris",
        origem: "Livro",
        tags: ["capitais"],
        dataCadastro: "2026-03-25",
      };

      const next = reducer(state, { type: "ADD_QUESTION", q: newQ });

      expect(next.questions).toHaveLength(2);
      expect(next.questions[1].id).toBe("q2");
    });

    it("edita questão existente", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "EDIT_QUESTION",
        id: "q1",
        data: { pergunta: "2 + 3?", respostaCorreta: "5", opcoes: ["4", "5", "6"] },
      });

      expect(next.questions[0].pergunta).toBe("2 + 3?");
      expect(next.questions[0].respostaCorreta).toBe("5");
      expect(next.questions[0].opcoes).toEqual(["4", "5", "6"]);
    });

    it("remove questão e limpa referencias do perUser", () => {
      const state = baseState();
      state.perUser.u1.bookmarks = ["q1", "qX"];
      state.perUser.u1.srData = {
        q1: { easiness: 2.5, interval: 2, repetitions: 1, nextReview: Date.now() + 10000 },
        qX: { easiness: 2.3, interval: 1, repetitions: 0, nextReview: Date.now() + 5000 },
      };
      state.perUser.u1.lastSessionWrongQuestionIds = ["q1", "qX"];

      const next = reducer(state, { type: "DEL_QUESTION", id: "q1" });

      expect(next.questions.find((q) => q.id === "q1")).toBeUndefined();
      expect(next.perUser.u1.bookmarks).toEqual(["qX"]);
      expect(next.perUser.u1.srData.q1).toBeUndefined();
      expect(next.perUser.u1.srData.qX).toBeDefined();
      expect(next.perUser.u1.lastSessionWrongQuestionIds).toEqual(["qX"]);
    });
  });

  describe("Discipline actions", () => {
    it("ADD_DISC adiciona disciplina", () => {
      const state = baseState();
      const newDisc = { id: "d2", name: "Física", icon: "⚡", color: "#ffd60a" };

      const next = reducer(state, { type: "ADD_DISC", disc: newDisc });

      expect(next.disciplines).toHaveLength(2);
      expect(next.disciplines[1].name).toBe("Física");
    });

    it("EDIT_DISC edita disciplina existente", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "EDIT_DISC",
        id: "d1",
        data: { name: "Matemática Avançada", color: "#ff0000" },
      });

      expect(next.disciplines[0].name).toBe("Matemática Avançada");
      expect(next.disciplines[0].color).toBe("#ff0000");
      expect(next.disciplines[0].icon).toBe("📐");
    });

    it("DEL_DISC remove disciplina", () => {
      const state = baseState();
      state.disciplines.push({ id: "d2", name: "Física", icon: "⚡", color: "#ffd60a" });

      const next = reducer(state, { type: "DEL_DISC", id: "d1" });

      expect(next.disciplines).toHaveLength(1);
      expect(next.disciplines[0].name).toBe("Física");
    });
  });

  describe("PerUser actions", () => {
    it("UPDATE_PU cria e atualiza PerUser", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "UPDATE_PU",
        uid: "u1",
        data: { bookmarks: ["q1", "q2"] },
      });

      expect(next.perUser.u1.bookmarks).toEqual(["q1", "q2"]);
    });

    it("UPDATE_PU para novo usuário cria estrutura vazia", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "UPDATE_PU",
        uid: "u_new",
        data: { bookmarks: ["q1"] },
      });

      expect(next.perUser.u_new.bookmarks).toEqual(["q1"]);
      expect(next.perUser.u_new.sessions).toEqual([]);
    });
  });

  describe("ADD_SESSION", () => {
    it("adiciona sessão ao inicio e mantém limite de 30", () => {
      const state = baseState();
      let current = state;
      for (let i = 0; i < 35; i++) {
        current = reducer(current, {
          type: "ADD_SESSION",
          uid: "u1",
          session: {
            id: `s${i}`,
            date: new Date().toISOString(),
            discipline: "Matemática",
            correct: i % 2,
            total: 10,
            totalTime: 300,
            points: i * 10,
            mode: "study",
          },
        });
      }

      expect(current.perUser.u1.sessions).toHaveLength(30);
      expect(current.perUser.u1.sessions[0].id).toBe("s34");
    });
  });

  describe("TOGGLE_BOOKMARK", () => {
    it("adiciona bookmark quando não existe", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "TOGGLE_BOOKMARK",
        uid: "u1",
        qid: "q1",
      });

      expect(next.perUser.u1.bookmarks).toContain("q1");
    });

    it("remove bookmark quando já existe", () => {
      const state = baseState();
      state.perUser.u1.bookmarks = ["q1", "q2"];

      const next = reducer(state, {
        type: "TOGGLE_BOOKMARK",
        uid: "u1",
        qid: "q1",
      });

      expect(next.perUser.u1.bookmarks).toEqual(["q2"]);
      expect(next.perUser.u1.bookmarks).not.toContain("q1");
    });
  });

  describe("EARN_BADGE", () => {
    it("adiciona badge primeira vez", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "EARN_BADGE",
        uid: "u1",
        badge: "first_correct",
      });

      expect(next.perUser.u1.achievements.first_correct).toBeDefined();
    });

    it("não altera estado se badge ja foi ganho (idempotente)", () => {
      const state = baseState();
      state.perUser.u1.achievements = { first_correct: new Date().toISOString() };

      const next = reducer(state, {
        type: "EARN_BADGE",
        uid: "u1",
        badge: "first_correct",
      });

      expect(next).toBe(state);
    });

    it("pode ganhar múltiplos badges", () => {
      const state = baseState();

      let current = state;
      current = reducer(current, { type: "EARN_BADGE", uid: "u1", badge: "badge1" });
      current = reducer(current, { type: "EARN_BADGE", uid: "u1", badge: "badge2" });

      expect(Object.keys(current.perUser.u1.achievements)).toHaveLength(2);
    });
  });

  describe("UPDATE_SR", () => {
    it("cria e atualiza dados de spaced repetition", () => {
      const state = baseState();

      const next = reducer(state, {
        type: "UPDATE_SR",
        uid: "u1",
        qid: "q1",
        data: { easiness: 2.5, interval: 1, repetitions: 1, nextReview: Date.now() },
      });

      expect(next.perUser.u1.srData.q1).toBeDefined();
      expect(next.perUser.u1.srData.q1.easiness).toBe(2.5);
      expect(next.perUser.u1.srData.q1.repetitions).toBe(1);
    });

    it("sobrescreve SR anterior", () => {
      const state = baseState();
      state.perUser.u1.srData.q1 = { easiness: 2.0, interval: 1, repetitions: 0, nextReview: 0 };

      const next = reducer(state, {
        type: "UPDATE_SR",
        uid: "u1",
        qid: "q1",
        data: { easiness: 3.0, interval: 3, repetitions: 2, nextReview: Date.now() },
      });

      expect(next.perUser.u1.srData.q1.easiness).toBe(3.0);
      expect(next.perUser.u1.srData.q1.interval).toBe(3);
    });
  });

  describe("UPDATE_STREAK", () => {
    it("atualiza streak para usuario", () => {
      const state = baseState();

      vi.useFakeTimers();
      const now = new Date("2026-03-25");
      vi.setSystemTime(now);

      const next = reducer(state, {
        type: "UPDATE_STREAK",
        uid: "u1",
      });

      expect(next.perUser.u1.streak.count).toBeGreaterThan(0);
      expect(next.perUser.u1.streak.lastDate).toBeTruthy();

      vi.useRealTimers();
    });
  });

  describe("getPU", () => {
    it("retorna PerUser existente", () => {
      const state = baseState();
      const pu = getPU(state, "u1");

      expect(pu.bookmarks).toBeDefined();
      expect(pu.sessions).toBeDefined();
    });

    it("retorna EMPTY_PU para usuario inexistente", () => {
      const state = baseState();
      const pu = getPU(state, "u_inexistente");

      expect(pu).toEqual(EMPTY_PU());
    });
  });

  describe("reducer with unknown action", () => {
    it("retorna estado inalterado para ação desconhecida", () => {
      const state = baseState();

      const next = reducer(state, { type: "UNKNOWN_ACTION" } as never);

      expect(next).toEqual(state);
    });
  });

  describe("immutability", () => {
    it("não modifica estado original", () => {
      const state = baseState();
      const stateCopy = JSON.parse(JSON.stringify(state));

      reducer(state, {
        type: "ADD_USER",
        user: {
          id: "u99",
          nome: "Test",
          email: "test@demo.com",
          pwdHash: "hash",
          pontuacao: 0,
          respostasCertas: 0,
          respostasErradas: 0,
        },
      });

      expect(state).toEqual(stateCopy);
    });
  });
});

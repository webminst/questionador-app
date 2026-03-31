import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppCtx } from "../../app/context";
import type { PersistedState, User, Question } from "../../types/app";
import QuestionsScreen from "./QuestionsScreen";

const ADD_QUESTION_DRAFT_KEY = "qdr_add_question_draft_v1";
const EDIT_QUESTION_DRAFT_KEY_PREFIX = "qdr_edit_question_draft_v1";

function makeUser(): User {
  return {
    id: "u1",
    nome: "Ana",
    email: "ana@demo.com",
    pwdHash: "hash",
    pontuacao: 100,
    respostasCertas: 5,
    respostasErradas: 1,
  };
}

function makeState(user: User, questions: Question[] = []): PersistedState {
  return {
    allUsers: [user],
    questions,
    disciplines: [{ id: "d1", name: "Matematica", icon: "📐", color: "#4dabf7", builtin: true }],
    perUser: {
      u1: {
        sessions: [],
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
}

function renderQuestions(onAddQ = vi.fn(), questions: Question[] = [], dispatch = vi.fn(), addToast = vi.fn()) {
  const user = makeUser();
  const state = makeState(user, questions);
  return {
    ...render(
      <AppCtx.Provider
        value={{
          state,
          dispatch,
          currentUser: user,
          uid: "u1",
          addToast,
          leaderboard: [user],
        }}
      >
        <QuestionsScreen onAddQ={onAddQ} addToast={addToast} />
      </AppCtx.Provider>,
    ),
    dispatch,
    addToast,
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("QuestionsScreen wizard", () => {
  it("nao avanca do passo 1 sem pergunta", () => {
    const { getByText } = renderQuestions();

    fireEvent.click(getByText("+ Nova"));
    fireEvent.click(getByText("Proximo →"));

    expect(getByText("Preencha a pergunta para continuar.")).toBeTruthy();
    expect(getByText("Passo 1 de 4")).toBeTruthy();
  });

  it("mantem dados ao voltar etapa e alcanca o resumo final", () => {
    const onAddQ = vi.fn();
    const { getByText, getByPlaceholderText } = renderQuestions(onAddQ);

    fireEvent.click(getByText("+ Nova"));

    fireEvent.change(getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)"), { target: { value: "Quanto e 2 + 2?" } });
    fireEvent.click(getByText("Proximo →"));

    fireEvent.change(getByPlaceholderText("Opcao A"), { target: { value: "3" } });
    fireEvent.change(getByPlaceholderText("Opcao B"), { target: { value: "4" } });
    const answerSelect = getByText("Selecionar a correta").parentElement as HTMLSelectElement;
    fireEvent.change(answerSelect, { target: { value: "4" } });

    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("← Voltar"));

    expect((getByPlaceholderText("Opcao A") as HTMLInputElement).value).toBe("3");

    fireEvent.click(getByText("Proximo →"));
    fireEvent.change(getByPlaceholderText("ex: algebra, ENEM"), { target: { value: "soma" } });
    fireEvent.click(getByText("Proximo →"));

    expect(getByText("📋 Revisão da Questão")).toBeTruthy();
    expect(getByText("Passo 4 de 4")).toBeTruthy();

    fireEvent.click(getByText("💾 Salvar"));

    expect(onAddQ).toHaveBeenCalledTimes(1);
  });

  it("rejeita pergunta duplicada", () => {
    const existingQuestion: Question = {
      id: "q1",
      pergunta: "Quanto e 2 + 2?",
      disciplina: "Matematica",
      dificuldade: "Fácil",
      imagem: "",
      nivelEnsino: "Médio",
      tipoResposta: "multipla-escolha",
      opcoes: ["3", "4", "5"],
      respostaCorreta: "4",
      comentario: "",
      origem: "Livro",
      tags: [],
      dataCadastro: new Date().toISOString(),
    };

    const { getByText, getByPlaceholderText } = renderQuestions(vi.fn(), [existingQuestion]);

    fireEvent.click(getByText("+ Nova"));
    fireEvent.change(getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)"), { target: { value: "Quanto e 2 + 2?" } });
    fireEvent.click(getByText("Proximo →"));

    expect(getByText("Esta pergunta já existe na base de dados.")).toBeTruthy();
  });

  it("rejeita resposta correta fora das opcoes", () => {
    const { getByText, getByPlaceholderText } = renderQuestions();

    fireEvent.click(getByText("+ Nova"));
    fireEvent.change(getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)"), { target: { value: "Qual é a capital?" } });
    fireEvent.click(getByText("Proximo →"));

    fireEvent.change(getByPlaceholderText("Opcao A"), { target: { value: "Paris" } });
    fireEvent.change(getByPlaceholderText("Opcao B"), { target: { value: "Londres" } });

    const answerSelect = getByText("Selecionar a correta").parentElement as HTMLSelectElement;
    const firstOption = answerSelect.querySelector("option:not([value=''])") as HTMLOptionElement;
    fireEvent.change(answerSelect, { target: { value: firstOption.value } });

    fireEvent.click(getByText("Proximo →"));

    expect(getByText("Passo 3 de 4")).toBeTruthy();
  });

  it("permite editar pergunta existente sem bloquear como duplicata", () => {
    const existingQuestion: Question = {
      id: "q1",
      pergunta: "Quanto e 2 + 2?",
      disciplina: "Matematica",
      dificuldade: "Fácil",
      imagem: "",
      nivelEnsino: "Médio",
      tipoResposta: "multipla-escolha",
      opcoes: ["3", "4", "5"],
      respostaCorreta: "4",
      comentario: "",
      origem: "Livro",
      tags: [],
      dataCadastro: new Date().toISOString(),
    };

    const onEditQ = vi.fn();
    const { getByText, getByDisplayValue } = renderQuestions(onEditQ, [existingQuestion]);

    fireEvent.click(getByText("✏️ Editar"));

    fireEvent.change(getByDisplayValue("Quanto e 2 + 2?"), { target: { value: "Quanto e 3 + 3?" } });
    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("Proximo →"));

    expect(getByText("📋 Revisão da Questão")).toBeTruthy();

    fireEvent.click(getByText("💾 Atualizar"));
  });

  it("deleta questao com confirmacao", () => {
    const mockDispatch = vi.fn();
    const mockAddToast = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const existingQuestion: Question = {
      id: "q1",
      pergunta: "Quanto e 2 + 2?",
      disciplina: "Matematica",
      dificuldade: "Fácil",
      imagem: "",
      nivelEnsino: "Médio",
      tipoResposta: "multipla-escolha",
      opcoes: ["3", "4", "5"],
      respostaCorreta: "4",
      comentario: "",
      origem: "Livro",
      tags: [],
      dataCadastro: new Date().toISOString(),
    };

    const { getByText } = renderQuestions(vi.fn(), [existingQuestion], mockDispatch, mockAddToast);

    fireEvent.click(getByText("🗑 Excluir"));

    expect(confirmSpy).toHaveBeenCalledWith("Excluir esta questão? Esta ação não pode ser desfeita.");
    expect(mockDispatch).toHaveBeenCalledWith({ type: "DEL_QUESTION", id: "q1" });
    expect(mockAddToast).toHaveBeenCalledWith("Questão excluída 🗑️", "success");

    confirmSpy.mockRestore();
  });

  it("cancela delecao quando usuario nega confirmacao", () => {
    const mockDispatch = vi.fn();
    const mockAddToast = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    const existingQuestion: Question = {
      id: "q1",
      pergunta: "Quanto e 2 + 2?",
      disciplina: "Matematica",
      dificuldade: "Fácil",
      imagem: "",
      nivelEnsino: "Médio",
      tipoResposta: "multipla-escolha",
      opcoes: ["3", "4", "5"],
      respostaCorreta: "4",
      comentario: "",
      origem: "Livro",
      tags: [],
      dataCadastro: new Date().toISOString(),
    };

    const { getByText } = renderQuestions(vi.fn(), [existingQuestion], mockDispatch, mockAddToast);

    fireEvent.click(getByText("🗑 Excluir"));

    expect(confirmSpy).toHaveBeenCalledWith("Excluir esta questão? Esta ação não pode ser desfeita.");
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockAddToast).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("restaura rascunho ao reabrir modal de nova questao", () => {
    const { getByText, getByPlaceholderText } = renderQuestions();

    fireEvent.click(getByText("+ Nova"));
    fireEvent.change(getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)"), { target: { value: "Pergunta com rascunho" } });
    fireEvent.click(getByText("Cancelar"));

    fireEvent.click(getByText("+ Nova"));

    expect((getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)") as HTMLTextAreaElement).value).toBe("Pergunta com rascunho");
    expect(getByText("Rascunho de criação recuperado.")).toBeTruthy();
  });

  it("limpa rascunho apos salvar nova questao", () => {
    const onAddQ = vi.fn();
    const { getByText, getByPlaceholderText } = renderQuestions(onAddQ);

    fireEvent.click(getByText("+ Nova"));
    fireEvent.change(getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)"), { target: { value: "Quanto e 2 + 2?" } });
    fireEvent.click(getByText("Proximo →"));

    fireEvent.change(getByPlaceholderText("Opcao A"), { target: { value: "3" } });
    fireEvent.change(getByPlaceholderText("Opcao B"), { target: { value: "4" } });
    const answerSelect = getByText("Selecionar a correta").parentElement as HTMLSelectElement;
    fireEvent.change(answerSelect, { target: { value: "4" } });

    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("💾 Salvar"));

    expect(onAddQ).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(ADD_QUESTION_DRAFT_KEY)).toBeNull();
  });

  it("ignora rascunho expirado", () => {
    const expiredDraft = {
      step: 2,
      form: {
        pergunta: "Pergunta antiga",
        disciplina: "Matematica",
        dificuldade: "Médio",
        imagem: "",
        nivelEnsino: "Médio",
        tipoResposta: "multipla-escolha",
        opcaoA: "1",
        opcaoB: "2",
        opcaoC: "",
        opcaoD: "",
        opcaoE: "",
        respostaCorreta: "2",
        comentario: "",
        origem: "Livro",
        tags: "",
      },
      updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem(ADD_QUESTION_DRAFT_KEY, JSON.stringify(expiredDraft));

    const { getByText, getByPlaceholderText, queryByText } = renderQuestions();

    fireEvent.click(getByText("+ Nova"));

    expect((getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)") as HTMLTextAreaElement).value).toBe("");
    expect(queryByText("Rascunho restaurado ao abrir o modal.")).toBeNull();
  });

  it("pede confirmacao ao fechar modal com alteracoes nao salvas", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { getByText, getByPlaceholderText } = renderQuestions();

    fireEvent.click(getByText("+ Nova"));
    fireEvent.change(getByPlaceholderText("Digite a pergunta... (ex: Derive $x^2$)"), { target: { value: "Mudanca pendente" } });
    fireEvent.click(getByText("Cancelar"));

    expect(confirmSpy).toHaveBeenCalledWith("Fechar e manter o rascunho da nova questão?");
    expect(getByText("Passo 1 de 4")).toBeTruthy();

    confirmSpy.mockRestore();
  });

  it("fecha sem confirmacao quando nao ha alteracoes", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { getByText, queryByText } = renderQuestions();

    fireEvent.click(getByText("+ Nova"));
    fireEvent.click(getByText("Cancelar"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(queryByText("Passo 1 de 4")).toBeNull();

    confirmSpy.mockRestore();
  });

  it("restaura rascunho no fluxo de edicao da mesma questao", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const existingQuestion: Question = {
      id: "q1",
      pergunta: "Quanto e 2 + 2?",
      disciplina: "Matematica",
      dificuldade: "Fácil",
      imagem: "",
      nivelEnsino: "Médio",
      tipoResposta: "multipla-escolha",
      opcoes: ["3", "4", "5"],
      respostaCorreta: "4",
      comentario: "",
      origem: "Livro",
      tags: [],
      dataCadastro: new Date().toISOString(),
    };

    const { getByText, getByDisplayValue } = renderQuestions(vi.fn(), [existingQuestion]);

    fireEvent.click(getByText("✏️ Editar"));
    fireEvent.change(getByDisplayValue("Quanto e 2 + 2?"), { target: { value: "Quanto e 10 + 5?" } });
    fireEvent.click(getByText("Cancelar"));

    fireEvent.click(getByText("✏️ Editar"));

    expect((getByDisplayValue("Quanto e 10 + 5?") as HTMLTextAreaElement).value).toBe("Quanto e 10 + 5?");
    expect(getByText("Rascunho de edição recuperado.")).toBeTruthy();

    confirmSpy.mockRestore();
  });

  it("usa mensagem de confirmacao especifica no fechamento da edicao", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const existingQuestion: Question = {
      id: "q1",
      pergunta: "Quanto e 2 + 2?",
      disciplina: "Matematica",
      dificuldade: "Fácil",
      imagem: "",
      nivelEnsino: "Médio",
      tipoResposta: "multipla-escolha",
      opcoes: ["3", "4", "5"],
      respostaCorreta: "4",
      comentario: "",
      origem: "Livro",
      tags: [],
      dataCadastro: new Date().toISOString(),
    };

    const { getByText, getByDisplayValue } = renderQuestions(vi.fn(), [existingQuestion]);

    fireEvent.click(getByText("✏️ Editar"));
    fireEvent.change(getByDisplayValue("Quanto e 2 + 2?"), { target: { value: "Quanto e 8 + 8?" } });
    fireEvent.click(getByText("Cancelar"));

    expect(confirmSpy).toHaveBeenCalledWith("Fechar e manter o rascunho desta edição?");
    expect(getByText("Passo 1 de 4")).toBeTruthy();

    confirmSpy.mockRestore();
  });

  it("limpa rascunho de edicao apos atualizar", () => {
    const existingQuestion: Question = {
      id: "q1",
      pergunta: "Quanto e 2 + 2?",
      disciplina: "Matematica",
      dificuldade: "Fácil",
      imagem: "",
      nivelEnsino: "Médio",
      tipoResposta: "multipla-escolha",
      opcoes: ["3", "4", "5"],
      respostaCorreta: "4",
      comentario: "",
      origem: "Livro",
      tags: [],
      dataCadastro: new Date().toISOString(),
    };

    const { getByText, getByDisplayValue } = renderQuestions(vi.fn(), [existingQuestion]);

    fireEvent.click(getByText("✏️ Editar"));
    fireEvent.change(getByDisplayValue("Quanto e 2 + 2?"), { target: { value: "Quanto e 3 + 3?" } });
    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("Proximo →"));
    fireEvent.click(getByText("💾 Atualizar"));

    expect(localStorage.getItem(`${EDIT_QUESTION_DRAFT_KEY_PREFIX}:q1`)).toBeNull();
  });
});

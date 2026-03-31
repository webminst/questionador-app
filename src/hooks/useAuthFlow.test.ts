import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AppAction } from "../domain/state";
import { simpleHash } from "../domain/utils";
import type { Screen, ToastType, User } from "../types/app";
import { useAuthFlow } from "./useAuthFlow";

describe("useAuthFlow", () => {
  it("faz login com credenciais validas", () => {
    const user: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setAuthForm({ name: "", email: "maria@email.com", password: "Senha123" });
    });

    act(() => {
      result.current.handleLogin();
    });

    expect(setScreen).toHaveBeenCalledWith("home");
    expect(dispatch).toHaveBeenCalledWith({ type: "UPDATE_STREAK", uid: "u1" });
    expect(result.current.currentUser?.id).toBe("u1");
  });

  it("bloqueia cadastro com email duplicado", () => {
    const existingUser: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [existingUser], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setAuthForm({ name: "Outra Pessoa", email: "maria@email.com", password: "Senha123" });
    });

    act(() => {
      result.current.handleRegister();
    });

    expect(addToast).toHaveBeenCalledWith("E-mail já cadastrado", "error");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("cria usuario novo e ativa onboarding", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setAuthForm({ name: "Ana Souza", email: "ana@email.com", password: "Senha123" });
    });

    act(() => {
      result.current.handleRegister();
    });

    const firstAction = dispatch.mock.calls[0]?.[0];
    expect(firstAction?.type).toBe("ADD_USER");
    expect(setScreen).toHaveBeenCalledWith("home");
    expect(result.current.showOnboard).toBe(true);
    expect(result.current.currentUser?.email).toBe("ana@email.com");
  });

  it("normaliza email no login e cadastro", () => {
    const user: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 10,
      respostasCertas: 1,
      respostasErradas: 0,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setAuthForm({ name: "", email: "  MARIA@EMAIL.COM  ", password: "Senha123" });
    });
    act(() => {
      result.current.handleLogin();
    });

    expect(result.current.currentUser?.id).toBe("u1");
  });

  it("bloqueia cadastro com email invalido e senha fraca", () => {
    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setAuthForm({ name: "Ana", email: "email-invalido", password: "123" });
    });
    act(() => {
      result.current.handleRegister();
    });

    expect(addToast).toHaveBeenCalledWith("E-mail inválido", "error");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("bloqueia login por 30s apos multiplas tentativas invalidas", () => {
    const user: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setAuthForm({ name: "", email: "maria@email.com", password: "SenhaErrada" });
    });

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.handleLogin();
      });
    }

    expect(addToast).toHaveBeenCalledWith("Muitas tentativas inválidas. Login bloqueado por 30s.", "error");

    act(() => {
      result.current.setAuthForm({ name: "", email: "maria@email.com", password: "Senha123" });
    });
    act(() => {
      result.current.handleLogin();
    });

    expect(setScreen).not.toHaveBeenCalledWith("home");
    expect(addToast).toHaveBeenLastCalledWith(expect.stringContaining("Aguarde"), "error");
  });

  it("permite novo login apos lockout expirar", () => {
    const user: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue(1_000_000);

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setAuthForm({ name: "", email: "maria@email.com", password: "SenhaErrada" });
    });

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.handleLogin();
      });
    }

    nowSpy.mockReturnValue(1_031_000);

    act(() => {
      result.current.setAuthForm({ name: "", email: "maria@email.com", password: "Senha123" });
    });
    act(() => {
      result.current.handleLogin();
    });

    expect(setScreen).toHaveBeenCalledWith("home");
    nowSpy.mockRestore();
  });

  it("atualiza nome, email e senha no perfil", () => {
    const user: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setCurrentUser(user);
    });

    let ok = false;
    act(() => {
      ok = result.current.updateProfile({
        name: "Maria Souza",
        email: "maria.souza@email.com",
        avatarEmoji: "🦊",
        avatarColor: "#4dabf7",
        currentPassword: "Senha123",
        newPassword: "NovaSenha123",
      });
    });

    expect(ok).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_USER",
        id: "u1",
        data: expect.objectContaining({
          nome: "Maria Souza",
          email: "maria.souza@email.com",
        }),
      }),
    );
    expect(result.current.currentUser?.nome).toBe("Maria Souza");
    expect(result.current.currentUser?.email).toBe("maria.souza@email.com");
    expect(result.current.currentUser?.avatarEmoji).toBe("🦊");
    expect(result.current.currentUser?.avatarColor).toBe("#4dabf7");
    expect(result.current.currentUser?.pwdHash).toBe(simpleHash("NovaSenha123"));
  });

  it("bloqueia atualizacao para email ja existente em outro usuario", () => {
    const userA: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };
    const userB: User = {
      id: "u2",
      nome: "Joao Lima",
      email: "joao@email.com",
      pwdHash: simpleHash("Senha999"),
      pontuacao: 10,
      respostasCertas: 1,
      respostasErradas: 0,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [userA, userB], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setCurrentUser(userA);
    });

    let ok = true;
    act(() => {
      ok = result.current.updateProfile({
        name: "Maria Silva",
        email: "joao@email.com",
      });
    });

    expect(ok).toBe(false);
    expect(addToast).toHaveBeenCalledWith("E-mail já cadastrado", "error");
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "UPDATE_USER", id: "u1" }));
  });

  it("bloqueia troca de senha sem senha atual", () => {
    const user: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setCurrentUser(user);
    });

    let ok = true;
    act(() => {
      ok = result.current.updateProfile({
        name: "Maria Silva",
        email: "maria@email.com",
        newPassword: "NovaSenha123",
      });
    });

    expect(ok).toBe(false);
    expect(addToast).toHaveBeenCalledWith("Informe a senha atual para alterar a senha", "error");
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "UPDATE_USER", id: "u1" }));
  });

  it("bloqueia troca de senha com senha atual incorreta", () => {
    const user: User = {
      id: "u1",
      nome: "Maria Silva",
      email: "maria@email.com",
      pwdHash: simpleHash("Senha123"),
      pontuacao: 30,
      respostasCertas: 3,
      respostasErradas: 1,
    };

    const dispatch = vi.fn<(action: AppAction) => void>();
    const addToast = vi.fn<(msg: string, type?: ToastType) => void>();
    const setScreen = vi.fn<(s: Screen) => void>();

    const { result } = renderHook(() =>
      useAuthFlow({ allUsers: [user], dispatch, addToast, setScreen }),
    );

    act(() => {
      result.current.setCurrentUser(user);
    });

    let ok = true;
    act(() => {
      ok = result.current.updateProfile({
        name: "Maria Silva",
        email: "maria@email.com",
        currentPassword: "SenhaErrada",
        newPassword: "NovaSenha123",
      });
    });

    expect(ok).toBe(false);
    expect(addToast).toHaveBeenCalledWith("Senha atual incorreta", "error");
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: "UPDATE_USER", id: "u1" }));
  });
});

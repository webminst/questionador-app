import { useState, type Dispatch } from "react";
import { pwdStrength, simpleHash, validateEmail } from "../domain/utils";
import type { AppAction } from "../domain/state";
import type { AuthForm, AuthMode, Screen, ToastType, User } from "../types/app";

type UseAuthFlowParams = {
  allUsers: User[];
  dispatch: Dispatch<AppAction>;
  addToast: (msg: string, type?: ToastType) => void;
  setScreen: (s: Screen) => void;
};

type UpdateProfileInput = {
  name: string;
  email: string;
  avatarEmoji?: string;
  avatarColor?: string;
  currentPassword?: string;
  newPassword?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createUserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `u_${crypto.randomUUID()}`;
  }
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useAuthFlow({ allUsers, dispatch, addToast, setScreen }: UseAuthFlowParams) {
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_MS = 30_000;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authForm, setAuthForm] = useState<AuthForm>({ name: "", email: "", password: "" });
  const [showOnboard, setShowOnboard] = useState(false);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  function handleLogin(): void {
    const now = Date.now();
    if (lockUntil && now < lockUntil) {
      const remaining = Math.max(1, Math.ceil((lockUntil - now) / 1000));
      addToast(`Muitas tentativas. Aguarde ${remaining}s para tentar novamente.`, "error");
      return;
    }

    const email = normalizeEmail(authForm.email);
    if (!email || !authForm.password) {
      addToast("Preencha e-mail e senha", "error");
      return;
    }

    const hash = simpleHash(authForm.password || "");
    const u = allUsers.find((user) => normalizeEmail(user.email) === email && user.pwdHash === hash);
    if (!u) {
      const nextAttempts = failedLoginAttempts + 1;
      setFailedLoginAttempts(nextAttempts);
      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockUntil(now + LOCKOUT_MS);
        setFailedLoginAttempts(0);
        addToast("Muitas tentativas inválidas. Login bloqueado por 30s.", "error");
        return;
      }
      addToast("E-mail ou senha incorretos", "error");
      return;
    }

    setFailedLoginAttempts(0);
    setLockUntil(null);
    setCurrentUser(u);
    dispatch({ type: "UPDATE_STREAK", uid: u.id });
    setScreen("home");
    addToast(`Bem-vindo de volta, ${u.nome.split(" ")[0]}! 🎉`);
  }

  function handleRegister(): void {
    const email = normalizeEmail(authForm.email);
    const name = authForm.name.trim();
    const pwd = authForm.password || "";

    if (!name) {
      addToast("Informe seu nome", "error");
      return;
    }

    if (!validateEmail(email)) {
      addToast("E-mail inválido", "error");
      return;
    }

    if (!pwdStrength(pwd).valid) {
      addToast("Senha fraca: use 8+ caracteres com letra maiúscula ou número", "error");
      return;
    }

    if (allUsers.find((u) => normalizeEmail(u.email) === email)) {
      addToast("E-mail já cadastrado", "error");
      return;
    }

    const nu: User = {
      id: createUserId(),
      nome: name,
      email,
      pwdHash: simpleHash(pwd),
      pontuacao: 0,
      respostasCertas: 0,
      respostasErradas: 0,
    };

    dispatch({ type: "ADD_USER", user: nu });
    setCurrentUser(nu);
    setScreen("home");
    setShowOnboard(true);
    addToast(`Conta criada! Bem-vindo, ${nu.nome.split(" ")[0]}! 🎉`);
  }

  function handleLogout(): void {
    setCurrentUser(null);
    setScreen("auth");
    setAuthForm({ name: "", email: "", password: "" });
  }

  function updateProfile({ name, email, avatarEmoji, avatarColor, currentPassword, newPassword }: UpdateProfileInput): boolean {
    if (!currentUser) {
      addToast("Usuário não autenticado", "error");
      return false;
    }

    const normalizedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const pwd = newPassword ?? "";

    if (!normalizedName) {
      addToast("Informe seu nome", "error");
      return false;
    }

    if (!validateEmail(normalizedEmail)) {
      addToast("E-mail inválido", "error");
      return false;
    }

    const duplicate = allUsers.find((u) => normalizeEmail(u.email) === normalizedEmail && u.id !== currentUser.id);
    if (duplicate) {
      addToast("E-mail já cadastrado", "error");
      return false;
    }

    if (pwd && !pwdStrength(pwd).valid) {
      addToast("Senha fraca: use 8+ caracteres com letra maiúscula ou número", "error");
      return false;
    }

    if (pwd) {
      const currentPwdValue = currentPassword ?? "";
      if (!currentPwdValue) {
        addToast("Informe a senha atual para alterar a senha", "error");
        return false;
      }
      if (simpleHash(currentPwdValue) !== currentUser.pwdHash) {
        addToast("Senha atual incorreta", "error");
        return false;
      }
    }

    const data: Partial<User> = {
      nome: normalizedName,
      email: normalizedEmail,
      avatarEmoji,
      avatarColor,
      ...(pwd ? { pwdHash: simpleHash(pwd) } : {}),
    };

    dispatch({ type: "UPDATE_USER", id: currentUser.id, data });
    setCurrentUser((prev) => (prev ? { ...prev, ...data } : prev));
    addToast("Perfil atualizado com sucesso ✅", "success");
    return true;
  }

  return {
    currentUser,
    setCurrentUser,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    showOnboard,
    setShowOnboard,
    handleLogin,
    handleRegister,
    handleLogout,
    updateProfile,
  };
}

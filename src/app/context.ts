import { createContext, useContext, type Dispatch } from "react";
import type { PersistedState, ToastType, User } from "../types/app";
import type { AppAction } from "../domain/state";

export type AppCtxValue = {
  state: PersistedState;
  dispatch: Dispatch<AppAction>;
  currentUser: User | null;
  uid: string;
  addToast: (msg: string, type?: ToastType) => void;
  leaderboard: User[];
};

export const AppCtx = createContext<AppCtxValue | null>(null);

export function useApp(): AppCtxValue {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("AppCtx indisponivel");
  return ctx;
}

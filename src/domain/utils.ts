import { AV_GRADS } from "./constants";
import type { Discipline, LvlInfo, PwdChecks, PwdStrength, SRData, Streak, User } from "../types/app";

export function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & h;
  }
  return String(h);
}

export function getLvlInfo(pts: number): LvlInfo {
  let lv = 1;
  let rem = pts;
  while (lv < 50) {
    const n = lv <= 10 ? 100 : lv <= 20 ? 200 : 500;
    if (rem < n) break;
    rem -= n;
    lv++;
  }
  const need = lv <= 10 ? 100 : lv <= 20 ? 200 : 500;
  return { level: lv, progress: rem, needed: need };
}

export function lvlTitle(l: number): string {
  if (l <= 3) return "Iniciante";
  if (l <= 7) return "Aprendiz";
  if (l <= 12) return "Estudante";
  if (l <= 18) return "Conhecedor";
  if (l <= 25) return "Expert";
  if (l <= 35) return "Mestre";
  return "Lendário";
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtTime(s?: number | null): string {
  if (!s && s !== 0) return "0s";
  const m = Math.floor(s / 60);
  const sc = s % 60;
  return m > 0 ? `${m}m ${sc}s` : `${sc}s`;
}

export function avGrad(name: string): string {
  return AV_GRADS[name.charCodeAt(0) % AV_GRADS.length];
}

export function avInit(name: string): string {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function userAvatarBg(user: Pick<User, "nome" | "avatarColor">): string {
  return user.avatarColor || avGrad(user.nome);
}

export function userAvatarLabel(user: Pick<User, "nome" | "avatarEmoji">): string {
  return user.avatarEmoji || avInit(user.nome);
}

export function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function discLookup(discs: Discipline[], name: string): Discipline {
  return discs.find((d) => d.name === name) || { id: "__fallback__", icon: "📚", color: "#7a8ba8", name, builtin: false };
}

export function todayStr(): string {
  return new Date().toDateString();
}

export function yesterdayStr(): string {
  return new Date(Date.now() - 86400000).toDateString();
}

export function validateEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function validatePwd(p: string): PwdChecks {
  return { length: p.length >= 8, upper: /[A-Z]/.test(p), number: /[0-9]/.test(p) };
}

export function pwdStrength(p: string): PwdStrength {
  const v = validatePwd(p);
  const c = Object.values(v).filter(Boolean).length;
  return { score: c, valid: c >= 2, checks: v };
}

export function sm2Update(card: Partial<SRData> = {}, quality: number): SRData {
  let { easiness = 2.5, interval = 1, repetitions = 0 } = card;
  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easiness);
    repetitions++;
    easiness = Math.max(1.3, easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    repetitions = 0;
    interval = 1;
  }
  const nextReview = Date.now() + interval * 86400000;
  return { easiness, interval, repetitions, nextReview };
}

export function updateStreak(streak: Streak): Streak {
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (streak.lastDate === today) return streak;
  if (streak.lastDate === yesterday) return { count: streak.count + 1, lastDate: today };
  return { count: 1, lastDate: today };
}

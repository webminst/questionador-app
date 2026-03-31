import type { PersistedState } from "../types/app";

const STORAGE_KEY = "qdr_v3";
const STORAGE_VERSION = 1;

type PersistedEnvelope = {
  version: number;
  data: PersistedState;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!isObject(value)) return false;
  const allUsers = value.allUsers;
  const questions = value.questions;
  const disciplines = value.disciplines;
  const perUser = value.perUser;

  return (
    Array.isArray(allUsers) &&
    Array.isArray(questions) &&
    Array.isArray(disciplines) &&
    isObject(perUser)
  );
}

function mergeWithDefaults(defaults: PersistedState, incoming: PersistedState): PersistedState {
  return {
    allUsers: Array.isArray(incoming.allUsers) ? incoming.allUsers : defaults.allUsers,
    questions: Array.isArray(incoming.questions) ? incoming.questions : defaults.questions,
    disciplines: Array.isArray(incoming.disciplines) ? incoming.disciplines : defaults.disciplines,
    perUser: isObject(incoming.perUser) ? incoming.perUser : defaults.perUser,
  };
}

function migrateRawState(raw: unknown, defaults: PersistedState): PersistedState | null {
  if (!isObject(raw)) return null;

  const maybeEnvelope = raw as Partial<PersistedEnvelope>;
  if (typeof maybeEnvelope.version === "number" && isPersistedState(maybeEnvelope.data)) {
    if (maybeEnvelope.version === STORAGE_VERSION) {
      return mergeWithDefaults(defaults, maybeEnvelope.data);
    }
    return mergeWithDefaults(defaults, maybeEnvelope.data);
  }

  if (isPersistedState(raw)) {
    return mergeWithDefaults(defaults, raw);
  }

  return null;
}

export function loadPersistedState(defaults: PersistedState): PersistedState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return defaults;

    const parsed: unknown = JSON.parse(serialized);
    return migrateRawState(parsed, defaults) ?? defaults;
  } catch {
    return defaults;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    const payload: PersistedEnvelope = { version: STORAGE_VERSION, data: state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // noop: ignore storage quota and serialization errors
  }
}

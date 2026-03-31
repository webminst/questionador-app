import { DEFAULT_DISCS, INIT_QUESTIONS, INIT_USERS } from "./constants";
import { updateStreak } from "./utils";
import { loadPersistedState } from "../lib/persistence";
import type { Discipline, PerUser, PersistedState, Question, SRData, SessionRecord, User } from "../types/app";

export type AppAction =
  | { type: "ADD_USER"; user: User }
  | { type: "UPDATE_USER"; id: string; data: Partial<User> }
  | { type: "ADD_QUESTION"; q: Question }
  | { type: "EDIT_QUESTION"; id: string; data: Partial<Question> }
  | { type: "DEL_QUESTION"; id: string }
  | { type: "ADD_DISC"; disc: Discipline }
  | { type: "EDIT_DISC"; id: string; data: Partial<Discipline> }
  | { type: "DEL_DISC"; id: string }
  | { type: "UPDATE_PU"; uid: string; data: Partial<PerUser> }
  | { type: "ADD_SESSION"; uid: string; session: SessionRecord }
  | { type: "TOGGLE_BOOKMARK"; uid: string; qid: string }
  | { type: "EARN_BADGE"; uid: string; badge: string }
  | { type: "UPDATE_SR"; uid: string; qid: string; data: SRData }
  | { type: "UPDATE_STREAK"; uid: string };

export const EMPTY_PU = (): PerUser => ({
  sessions: [],
  bookmarks: [],
  reportedQuestionIds: [],
  dailyGoalQuestions: 20,
  achievements: {},
  streak: { count: 0, lastDate: null },
  srData: {},
  lastSessionWrongQuestionIds: [],
});

export function getPU(state: PersistedState, uid: string): PerUser {
  const stored = state.perUser[uid];
  if (!stored) return EMPTY_PU();
  return { ...EMPTY_PU(), ...stored };
}

export function initPersistedState(): PersistedState {
  return loadPersistedState({
    allUsers: INIT_USERS,
    questions: INIT_QUESTIONS,
    disciplines: DEFAULT_DISCS,
    perUser: {},
  });
}

export function reducer(state: PersistedState, action: AppAction): PersistedState {
  switch (action.type) {
    case "ADD_USER":
      return { ...state, allUsers: [...state.allUsers, action.user] };
    case "UPDATE_USER":
      return { ...state, allUsers: state.allUsers.map((u) => (u.id === action.id ? { ...u, ...action.data } : u)) };
    case "ADD_QUESTION":
      return { ...state, questions: [...state.questions, action.q] };
    case "EDIT_QUESTION":
      return {
        ...state,
        questions: state.questions.map((q) => (q.id === action.id ? { ...q, ...action.data } : q)),
      };
    case "DEL_QUESTION": {
      const questions = state.questions.filter((q) => q.id !== action.id);
      const perUser = Object.fromEntries(
        Object.entries(state.perUser).map(([userId, pu]) => {
          const srData = Object.fromEntries(Object.entries(pu.srData).filter(([qid]) => qid !== action.id)) as Record<string, SRData>;
          return [
            userId,
            {
              ...pu,
              bookmarks: pu.bookmarks.filter((qid) => qid !== action.id),
              reportedQuestionIds: (pu.reportedQuestionIds ?? []).filter((qid) => qid !== action.id),
              srData,
              lastSessionWrongQuestionIds: (pu.lastSessionWrongQuestionIds ?? []).filter((qid) => qid !== action.id),
            },
          ];
        }),
      ) as PersistedState["perUser"];
      return { ...state, questions, perUser };
    }
    case "ADD_DISC":
      return { ...state, disciplines: [...state.disciplines, action.disc] };
    case "EDIT_DISC":
      return { ...state, disciplines: state.disciplines.map((d) => (d.id === action.id ? { ...d, ...action.data } : d)) };
    case "DEL_DISC":
      return { ...state, disciplines: state.disciplines.filter((d) => d.id !== action.id) };
    case "UPDATE_PU": {
      const pu = getPU(state, action.uid);
      return { ...state, perUser: { ...state.perUser, [action.uid]: { ...pu, ...action.data } } };
    }
    case "ADD_SESSION": {
      const pu = getPU(state, action.uid);
      const sessions = [action.session, ...pu.sessions].slice(0, 30);
      return { ...state, perUser: { ...state.perUser, [action.uid]: { ...pu, sessions } } };
    }
    case "TOGGLE_BOOKMARK": {
      const pu = getPU(state, action.uid);
      const bookmarks = pu.bookmarks.includes(action.qid)
        ? pu.bookmarks.filter((b) => b !== action.qid)
        : [...pu.bookmarks, action.qid];
      return { ...state, perUser: { ...state.perUser, [action.uid]: { ...pu, bookmarks } } };
    }
    case "EARN_BADGE": {
      const pu = getPU(state, action.uid);
      if (pu.achievements[action.badge]) return state;
      const achievements = { ...pu.achievements, [action.badge]: new Date().toISOString() };
      return { ...state, perUser: { ...state.perUser, [action.uid]: { ...pu, achievements } } };
    }
    case "UPDATE_SR": {
      const pu = getPU(state, action.uid);
      const srData = { ...pu.srData, [action.qid]: action.data };
      return { ...state, perUser: { ...state.perUser, [action.uid]: { ...pu, srData } } };
    }
    case "UPDATE_STREAK": {
      const pu = getPU(state, action.uid);
      const streak = updateStreak(pu.streak);
      return { ...state, perUser: { ...state.perUser, [action.uid]: { ...pu, streak } } };
    }
    default:
      return state;
  }
}

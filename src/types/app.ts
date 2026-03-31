export type NivelEnsino = "Fundamental" | "Médio" | "Superior";
export type Dificuldade = "Fácil" | "Médio" | "Difícil";
export type Origem = "Livro" | "ENEM" | "Vestibular" | "Universidade" | "Concurso" | "Outro";
export type TipoResposta = "multipla-escolha" | "verdadeiro-falso";
export type QuizMode = "study" | "exam" | "spaced" | "review_errors";
export type Screen = "auth" | "home" | "disciplines" | "leaderboard" | "questions" | "profile" | "quiz" | "results";
export type AuthMode = "login" | "register";
export type ToastType = "success" | "error" | "badge";

export type LvlInfo = { level: number; progress: number; needed: number };
export type Streak = { count: number; lastDate: string | null };
export type PwdChecks = { length: boolean; upper: boolean; number: boolean };
export type PwdStrength = { score: number; valid: boolean; checks: PwdChecks };

export type Discipline = {
  id: string;
  name: string;
  icon: string;
  color: string;
  builtin?: boolean;
};

export type Question = {
  id: string;
  pergunta: string;
  disciplina: string;
  dificuldade?: Dificuldade;
  imagem?: string;
  nivelEnsino: NivelEnsino;
  tipoResposta: TipoResposta;
  opcoes: string[];
  respostaCorreta: string;
  comentario?: string;
  origem: Origem;
  tags: string[];
  dataCadastro: string;
};

export type User = {
  id: string;
  nome: string;
  email: string;
  avatarEmoji?: string;
  avatarColor?: string;
  pwdHash: string;
  pontuacao: number;
  respostasCertas: number;
  respostasErradas: number;
};

export type SRData = { easiness: number; interval: number; repetitions: number; nextReview: number };

export type SessionRecord = {
  id: string;
  date: string;
  discipline: string;
  correct: number;
  total: number;
  totalTime: number;
  points: number;
  mode: QuizMode;
};

export type PerUser = {
  sessions: SessionRecord[];
  bookmarks: string[];
  reportedQuestionIds?: string[];
  dailyGoalQuestions?: number;
  achievements: Record<string, string>;
  streak: Streak;
  srData: Record<string, SRData>;
  lastSessionWrongQuestionIds: string[];
};

export type PersistedState = {
  allUsers: User[];
  questions: Question[];
  disciplines: Discipline[];
  perUser: Record<string, PerUser>;
};

export type QuizAnswer = {
  question: Question;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  skipped?: boolean;
};

export type QuizSession = {
  questions: Question[];
  current: number;
  answers: QuizAnswer[];
  startTime: number;
  questionStartTime: number;
  answered: boolean;
  selectedAnswer: string | null;
  questionTimes: number[];
  mode: QuizMode;
  timer: number;
  disc: string;
};

export type ResultsData = {
  answers: QuizAnswer[];
  totalTime: number;
  correct: number;
  wrong: number;
  total: number;
  points: number;
  avgTime: number;
  mode: QuizMode;
};

export type ToastItem = { id: number; msg: string; type: ToastType };
export type AuthForm = { name: string; email: string; password: string };

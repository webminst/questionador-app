import { useState, type Dispatch, type SetStateAction } from "react";
import { getLvlInfo, shuffle, sm2Update } from "../domain/utils";
import { getPU } from "../domain/state";
import type { AppAction } from "../domain/state";
import type {
  Dificuldade,
  NivelEnsino,
  PersistedState,
  Question,
  QuizMode,
  QuizSession,
  ResultsData,
  Screen,
  SessionRecord,
  ToastType,
  User,
} from "../types/app";

type UseQuizFlowParams = {
  state: PersistedState;
  dispatch: Dispatch<AppAction>;
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  uid: string;
  addToast: (msg: string, type?: ToastType) => void;
  setScreen: (s: Screen) => void;
};

type StartQuizConfig = { disc: string; level: "all" | NivelEnsino; difficulty?: "all" | Dificuldade; count: number; mode: QuizMode; timer: number };

export function useQuizFlow({ state, dispatch, currentUser, setCurrentUser, uid, addToast, setScreen }: UseQuizFlowParams) {
  const [quiz, setQuiz] = useState<QuizSession | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [quizCfg, setQuizCfg] = useState<string | null>(null);

  function checkBadges(user: User, isSpeedCorrect: boolean): void {
    if (!uid) return;
    const pu = getPU(state, uid);
    const earn = (bid: string) => dispatch({ type: "EARN_BADGE", uid, badge: bid });
    const earned = pu.achievements || {};
    const li = getLvlInfo(user.pontuacao);

    if (user.respostasCertas >= 1 && !earned.first_correct) { earn("first_correct"); addToast("🏅 Conquista: Primeiro Passo!", "badge"); }
    if (user.respostasCertas >= 100 && !earned.century) { earn("century"); addToast("🏅 Conquista: Centurião!", "badge"); }
    if (li.level >= 5 && !earned.level_5) { earn("level_5"); addToast("🏅 Conquista: Veterano!", "badge"); }
    if (li.level >= 10 && !earned.level_10) { earn("level_10"); addToast("🏅 Conquista: Mestre!", "badge"); }
    if (isSpeedCorrect && !earned.speed_demon) { earn("speed_demon"); addToast("🏅 Conquista: Relâmpago!", "badge"); }
    if ((pu.bookmarks?.length ?? 0) >= 10 && !earned.bookworm) { earn("bookworm"); addToast("🏅 Conquista: Estudioso!", "badge"); }

    const streakCount = pu.streak?.count ?? 0;
    if (streakCount >= 3 && !earned.streak_3) { earn("streak_3"); addToast("🏅 Conquista: Em Chamas!", "badge"); }
    if (streakCount >= 7 && !earned.streak_7) { earn("streak_7"); addToast("🏅 Conquista: Imparável!", "badge"); }
  }

  function startQuiz({ disc, level, difficulty = "all", count, mode, timer }: StartQuizConfig): void {
    let pool: Question[];
    if (mode === "review_errors") {
      const pu = getPU(state, uid);
      const wrongIds = pu.lastSessionWrongQuestionIds ?? [];
      pool = state.questions.filter((q) =>
        wrongIds.includes(q.id) &&
        (disc === "all" || q.disciplina === disc) &&
        (level === "all" || q.nivelEnsino === level) &&
        (difficulty === "all" || (q.dificuldade ?? "Médio") === difficulty),
      );
    } else if (mode === "spaced") {
      const pu = getPU(state, uid);
      pool = state.questions.filter(
        (q) =>
          (disc === "all" || q.disciplina === disc) &&
          (level === "all" || q.nivelEnsino === level) &&
          (difficulty === "all" || (q.dificuldade ?? "Médio") === difficulty),
      );
      pool = pool.sort((a, b) => {
        const sa = pu.srData[a.id]?.nextReview || 0;
        const sb = pu.srData[b.id]?.nextReview || 0;
        return sa - sb;
      });
    } else {
      pool = shuffle(
        state.questions.filter(
          (q) =>
            (disc === "all" || q.disciplina === disc) &&
            (level === "all" || q.nivelEnsino === level) &&
            (difficulty === "all" || (q.dificuldade ?? "Médio") === difficulty),
        ),
      );
    }

    if (!pool.length) {
      if (mode === "review_errors") {
        addToast("Sem erros na sessão anterior para revisar", "error");
      } else {
        addToast("Nenhuma questão disponível", "error");
      }
      return;
    }

    const finalCount = mode === "review_errors" ? pool.length : Math.min(count, pool.length);

    setQuiz({
      questions: pool.slice(0, finalCount),
      current: 0,
      answers: [],
      startTime: Date.now(),
      questionStartTime: Date.now(),
      answered: false,
      selectedAnswer: null,
      questionTimes: [],
      mode,
      timer,
      disc,
    });
    setQuizCfg(null);
    setScreen("quiz");
  }

  function startDailyQuestionById(questionId: string): void {
    const q = state.questions.find((item) => item.id === questionId);
    if (!q) {
      addToast("Questão do dia indisponível", "error");
      return;
    }

    setQuiz({
      questions: [q],
      current: 0,
      answers: [],
      startTime: Date.now(),
      questionStartTime: Date.now(),
      answered: false,
      selectedAnswer: null,
      questionTimes: [],
      mode: "study",
      timer: 0,
      disc: q.disciplina,
    });
    setQuizCfg(null);
    setScreen("quiz");
  }

  function startReviewErrorsQuick(): void {
    startQuiz({
      disc: "all",
      level: "all",
      difficulty: "all",
      count: 20,
      mode: "review_errors",
      timer: 0,
    });
  }

  function handleAnswer(ans: string, qTime: number): void {
    if (!quiz || quiz.answered || !currentUser) return;
    const q = quiz.questions[quiz.current];
    const ok = ans === q.respostaCorreta;
    const t = qTime || Math.round((Date.now() - quiz.questionStartTime) / 1000);
    const isSpeedCorrect = ok && t <= 5;

    const upd = ok
      ? { ...currentUser, pontuacao: currentUser.pontuacao + 10, respostasCertas: currentUser.respostasCertas + 1 }
      : { ...currentUser, respostasErradas: currentUser.respostasErradas + 1 };

    setCurrentUser(upd);
    dispatch({
      type: "UPDATE_USER",
      id: uid,
      data: { pontuacao: upd.pontuacao, respostasCertas: upd.respostasCertas, respostasErradas: upd.respostasErradas },
    });

    const quality = ok ? Math.max(3, 5 - Math.floor(t / 10)) : 1;
    const prevSR = getPU(state, uid).srData[q.id];
    const newSR = sm2Update(prevSR, quality);
    dispatch({ type: "UPDATE_SR", uid, qid: q.id, data: newSR });

    checkBadges(upd, isSpeedCorrect);

    setQuiz((s) => s
      ? {
        ...s,
        answered: true,
        selectedAnswer: ans,
        answers: [...s.answers, { question: q, answer: ans, isCorrect: ok, timeSpent: t }],
        questionTimes: [...s.questionTimes, t],
      }
      : s,
    );
  }

  function skipQuestion(): void {
    if (!quiz || !currentUser) return;
    const q = quiz.questions[quiz.current];
    const t = Math.round((Date.now() - quiz.questionStartTime) / 1000);

    setCurrentUser((u) => (u ? { ...u, respostasErradas: u.respostasErradas + 1 } : u));
    dispatch({ type: "UPDATE_USER", id: uid, data: { respostasErradas: currentUser.respostasErradas + 1 } });

    setQuiz((s) => s
      ? {
        ...s,
        answered: true,
        selectedAnswer: "__skipped__",
        answers: [...s.answers, { question: q, answer: "__skipped__", isCorrect: false, timeSpent: t, skipped: true }],
        questionTimes: [...s.questionTimes, t],
      }
      : s,
    );
  }

  function nextQuestion(): void {
    if (!quiz) return;

    const nx = quiz.current + 1;
    if (nx >= quiz.questions.length) {
      const totalT = Math.round((Date.now() - quiz.startTime) / 1000);
      const cor = quiz.answers.filter((a) => a.isCorrect).length;
      const wrg = quiz.answers.filter((a) => !a.isCorrect).length;
      const avg = quiz.questionTimes.length ? Math.round(quiz.questionTimes.reduce((a, b) => a + b, 0) / quiz.questionTimes.length) : 0;
      const pts = cor * 10;
      const wrongQuestionIds = quiz.answers.filter((a) => !a.isCorrect).map((a) => a.question.id);
      const session: SessionRecord = {
        id: `s${Date.now()}`,
        date: new Date().toISOString(),
        discipline: quiz.disc,
        correct: cor,
        total: quiz.questions.length,
        totalTime: totalT,
        points: pts,
        mode: quiz.mode,
      };

      dispatch({ type: "ADD_SESSION", uid, session });
      dispatch({ type: "UPDATE_STREAK", uid });
      dispatch({ type: "UPDATE_PU", uid, data: { lastSessionWrongQuestionIds: wrongQuestionIds } });

      if (cor === quiz.questions.length && !getPU(state, uid).achievements?.perfect_session) {
        dispatch({ type: "EARN_BADGE", uid, badge: "perfect_session" });
        addToast("🏅 Conquista: Sessão Perfeita!", "badge");
      }

      const studiedDiscs = new Set([...getPU(state, uid).sessions.map((s) => s.discipline), quiz.disc]);
      const availDiscs = new Set(state.disciplines.filter((d) => state.questions.some((q) => q.disciplina === d.name)).map((d) => d.name));
      const allStudied = [...availDiscs].every((d) => studiedDiscs.has(d) || d === quiz.disc);
      if (allStudied && !getPU(state, uid).achievements?.all_disciplines) {
        dispatch({ type: "EARN_BADGE", uid, badge: "all_disciplines" });
        addToast("🏅 Conquista: Enciclopédia!", "badge");
      }

      setResults({ answers: quiz.answers, totalTime: totalT, correct: cor, wrong: wrg, total: quiz.questions.length, points: pts, avgTime: avg, mode: quiz.mode });
      setScreen("results");
    } else {
      setQuiz((s) => (s ? { ...s, current: nx, answered: false, selectedAnswer: null, questionStartTime: Date.now() } : s));
    }
  }

  function addQuestion(q: Omit<Question, "id" | "dataCadastro">): void {
    dispatch({ type: "ADD_QUESTION", q: { ...q, id: `q${Date.now()}`, dataCadastro: new Date().toISOString().split("T")[0] } });
    addToast("Questão cadastrada! ✅");
  }

  function toggleReportCurrentQuestion(): void {
    if (!quiz || !uid) return;
    const qid = quiz.questions[quiz.current]?.id;
    if (!qid) return;

    const pu = getPU(state, uid);
    const currentReports = pu.reportedQuestionIds ?? [];
    const alreadyReported = currentReports.includes(qid);
    const nextReports = alreadyReported
      ? currentReports.filter((id) => id !== qid)
      : [...currentReports, qid];

    dispatch({ type: "UPDATE_PU", uid, data: { reportedQuestionIds: nextReports } });
    addToast(alreadyReported ? "Sinalização removida" : "Questão sinalizada para revisão de gabarito ⚠️", "success");
  }

  function undoAnswer(): void {
    if (!quiz || !quiz.answered || quiz.answers.length === 0) return;

    const lastAnswer = quiz.answers[quiz.answers.length - 1];
    const wasCorrect = lastAnswer.isCorrect;

    if (currentUser) {
      const upd = { ...currentUser };
      if (wasCorrect) {
        upd.pontuacao = Math.max(0, upd.pontuacao - 10);
        upd.respostasCertas = Math.max(0, upd.respostasCertas - 1);
      } else {
        upd.respostasErradas = Math.max(0, upd.respostasErradas - 1);
      }
      setCurrentUser(upd);
      dispatch({
        type: "UPDATE_USER",
        id: uid,
        data: { pontuacao: upd.pontuacao, respostasCertas: upd.respostasCertas, respostasErradas: upd.respostasErradas },
      });
    }

    setQuiz((s) =>
      s
        ? {
            ...s,
            answered: false,
            selectedAnswer: null,
            answers: s.answers.slice(0, -1),
            questionTimes: s.questionTimes.slice(0, -1),
          }
        : s,
    );

    addToast("Resposta desfeita! ↶", "success");
  }

  return {
    quiz,
    setQuiz,
    results,
    setResults,
    quizCfg,
    setQuizCfg,
    startQuiz,
    startDailyQuestionById,
    startReviewErrorsQuick,
    handleAnswer,
    skipQuestion,
    nextQuestion,
    addQuestion,
    toggleReportCurrentQuestion,
    undoAnswer,
  };
}

// -- Questionador v3 -- Senior Dev Edition ----------------------------------
import { Suspense, lazy, useState, useEffect, useCallback, useReducer, useMemo } from "react";
import type { Screen, ToastItem, ToastType } from "./types/app";
import { savePersistedState } from "./lib/persistence";
import { getLvlInfo } from "./domain/utils";
import { EMPTY_PU, getPU, initPersistedState, reducer } from "./domain/state";
import { AppCtx, type AppCtxValue } from "./app/context";
import Toast from "./features/common/Toast";
import { BottomNav, NavBar, StatsBar } from "./features/layout/AppChrome";
const AuthScreen = lazy(() => import("./features/auth/AuthScreen"));
const DisciplinesScreen = lazy(() => import("./features/disciplines/DisciplinesScreen"));
const Onboarding = lazy(() => import("./features/onboarding/Onboarding"));
const ProfileScreen = lazy(() => import("./features/profile/ProfileScreen"));
const QuestionsScreen = lazy(() => import("./features/questions/QuestionsScreen"));
const HomeScreen = lazy(() => import("./features/home/HomeScreen"));
const LeaderboardScreen = lazy(() => import("./features/leaderboard/LeaderboardScreen"));
const QuizConfigModal = lazy(() => import("./features/quiz/QuizConfigModal"));
const QuizScreen = lazy(() => import("./features/quiz/QuizScreen"));
const ResultsScreen = lazy(() => import("./features/quiz/ResultsScreen"));
import { useAuthFlow } from "./hooks/useAuthFlow";
import { useQuizFlow } from "./hooks/useQuizFlow";
import { APP_CSS } from "./styles/appStyles";

type ThemeMode = "light" | "dark";
type ThemePreference = "system" | ThemeMode;
const THEME_STORAGE_KEY = "questionadorTheme";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export default function App() {
  const screenFallback = <div style={{ padding: 16 }}>Carregando...</div>;

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = APP_CSS;
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, []);

  const [pState, dispatch] = useReducer(reducer, initPersistedState());
  useEffect(() => { savePersistedState(pState); }, [pState]);

  const [screen, setScreen] = useState<Screen>("auth");
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getInitialThemePreference());
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(() => getSystemTheme());
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const theme: ThemeMode = themePreference === "system" ? systemTheme : themePreference;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  }, [themePreference]);

  function toggleThemePreference(): void {
    setThemePreference((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  }

  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const {
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
  } = useAuthFlow({ allUsers: pState.allUsers, dispatch, addToast, setScreen });

  const uid = currentUser?.id || "";

  const {
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
  } = useQuizFlow({
    state: pState,
    dispatch,
    currentUser,
    setCurrentUser,
    uid,
    addToast,
    setScreen,
  });

  function handleLogoutAndReset(): void {
    handleLogout();
    setQuiz(null);
    setResults(null);
  }

  const li = currentUser ? getLvlInfo(currentUser.pontuacao) : { level: 1, progress: 0, needed: 100 };
  const leaderboard = useMemo(
    () => [...pState.allUsers].sort((a, b) => b.pontuacao !== a.pontuacao ? b.pontuacao - a.pontuacao : a.respostasErradas - b.respostasErradas),
    [pState.allUsers],
  );
  const puCurrent = useMemo(() => uid ? getPU(pState, uid) : EMPTY_PU(), [pState, uid]);

  const showChrome = screen !== "auth" && screen !== "quiz" && currentUser;
  const ctxValue: AppCtxValue = { state: pState, dispatch, currentUser, uid, addToast, leaderboard };

  return (
    <AppCtx.Provider value={ctxValue}>
      <Toast toasts={toasts} />
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: 8,
          top: -40,
          zIndex: 1000,
          padding: "8px 10px",
          borderRadius: 8,
          background: "var(--pri)",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
        onFocus={(e) => {
          e.currentTarget.style.top = "8px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = "-40px";
        }}
      >
        Pular para conteudo principal
      </a>
      {showOnboard && (
        <Suspense fallback={screenFallback}>
          <Onboarding onDone={() => setShowOnboard(false)} />
        </Suspense>
      )}

      {screen === "auth" && (
        <Suspense fallback={screenFallback}>
          <AuthScreen mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} onLogin={handleLogin} onRegister={handleRegister} />
        </Suspense>
      )}

      {showChrome && <NavBar screen={screen} setScreen={setScreen} theme={theme} themePreference={themePreference} onToggleTheme={toggleThemePreference} onLogout={handleLogoutAndReset} />}
      {showChrome && <StatsBar user={currentUser} li={li} streak={puCurrent.streak} />}

      <main id="main-content" role="main">
        <Suspense fallback={screenFallback}>
          {screen === "home" && <HomeScreen onSelectDisc={(d) => { setQuizCfg(d); }} onStartQuestionOfDay={startDailyQuestionById} onStartReviewErrors={startReviewErrorsQuick} onAddQ={() => setScreen("questions")} setScreen={setScreen} />}
          {screen === "disciplines" && <DisciplinesScreen />}
            {screen === "quiz" && quiz && <QuizScreen session={quiz} onAnswer={handleAnswer} onNext={nextQuestion} onSkip={skipQuestion} onUndoAnswer={undoAnswer} onToggleQuestionReport={toggleReportCurrentQuestion} isQuestionReported={(puCurrent.reportedQuestionIds ?? []).includes(quiz.questions[quiz.current].id)} onExit={() => setScreen("home")} />}
          {screen === "results" && results && <ResultsScreen results={results} onHome={() => { setScreen("home"); setResults(null); }} onRetry={() => { setScreen("home"); setResults(null); }} onReviewErrors={() => { setResults(null); startReviewErrorsQuick(); }} />}
          {screen === "leaderboard" && <LeaderboardScreen />}
          {screen === "profile" && <ProfileScreen onUpdateProfile={updateProfile} />}
          {screen === "questions" && <QuestionsScreen onAddQ={addQuestion} addToast={addToast} />}
        </Suspense>
      </main>

      {quizCfg && (
        <Suspense fallback={screenFallback}>
          <QuizConfigModal disc={quizCfg} onStart={startQuiz} onClose={() => setQuizCfg(null)} />
        </Suspense>
      )}
      {showChrome && <BottomNav screen={screen} setScreen={setScreen} />}
    </AppCtx.Provider>
  );
}

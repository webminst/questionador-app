import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useApp } from "../../app/context";
import { DIFFICULTIES, LEVELS_ED, ORIGINS } from "../../domain/constants";
import { getPU } from "../../domain/state";
import { discLookup, hexAlpha } from "../../domain/utils";
import { buildQuestionsCsv, getQuestionsCsvFilename, parseQuestionsCsv } from "./csv";
import MathText from "../common/MathText";
import type { Dificuldade, Discipline, NivelEnsino, Origem, Question, TipoResposta, ToastType } from "../../types/app";

type QuestionsScreenProps = {
  onAddQ: (q: Omit<Question, "id" | "dataCadastro">) => void;
  addToast: (msg: string, type?: ToastType) => void;
};

type SRInfo = { due: boolean; days: number };

type AddQuestionForm = {
  pergunta: string;
  disciplina: string;
  dificuldade: Dificuldade;
  imagem: string;
  nivelEnsino: NivelEnsino;
  tipoResposta: TipoResposta;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  opcaoE: string;
  respostaCorreta: string;
  comentario: string;
  origem: Origem;
  tags: string;
};

type AddQModalProps = {
  disciplines: Discipline[];
  onSave: (q: Omit<Question, "id" | "dataCadastro">) => void;
  onClose: () => void;
  initialQuestion?: Question;
  title?: string;
  submitLabel?: string;
  existingQuestions?: Question[];
};

type AddQStep = 1 | 2 | 3 | 4;
type AddQErrors = {
  pergunta?: string;
  opcoes?: string;
  respostaCorreta?: string;
  disciplina?: string;
};

type AddQDraft = {
  step: AddQStep;
  form: AddQuestionForm;
  updatedAt: string;
};

const ADD_QUESTION_DRAFT_KEY = "qdr_add_question_draft_v1";
const EDIT_QUESTION_DRAFT_KEY_PREFIX = "qdr_edit_question_draft_v1";
const ADD_QUESTION_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function getEditQuestionDraftKey(questionId: string): string {
  return `${EDIT_QUESTION_DRAFT_KEY_PREFIX}:${questionId}`;
}

function loadQuestionDraft(storageKey: string): AddQDraft | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AddQDraft>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.step !== 1 && parsed.step !== 2 && parsed.step !== 3 && parsed.step !== 4) return null;
    if (!parsed.form || typeof parsed.form !== "object") return null;
    if (typeof parsed.updatedAt !== "string") return null;

    const updatedAtMs = Date.parse(parsed.updatedAt);
    if (!Number.isFinite(updatedAtMs) || Date.now() - updatedAtMs > ADD_QUESTION_DRAFT_TTL_MS) {
      localStorage.removeItem(storageKey);
      return null;
    }

    return parsed as AddQDraft;
  } catch {
    return null;
  }
}

function saveQuestionDraft(storageKey: string, draft: AddQDraft): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // noop
  }
}

function clearQuestionDraft(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // noop
  }
}

const QPAGE = 10;
type QuestionsTab = "list" | "sr" | "csv" | "stats";

export default function QuestionsScreen({ onAddQ, addToast }: QuestionsScreenProps) {
  const { state, uid, dispatch } = useApp();
  const { questions, disciplines } = state;
  const pu = getPU(state, uid);
  const [tab, setTab] = useState<QuestionsTab>("list");
  const [search, setSearch] = useState("");
  const [fDisc, setFDisc] = useState("all");
  const [fDiff, setFDiff] = useState<"all" | Dificuldade>("all");
  const [fLvl, setFLvl] = useState("all");
  const [fBm, setFBm] = useState(false);
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [csvImportErrors, setCsvImportErrors] = useState<string[]>([]);
  const [csvImportSuccess, setCsvImportSuccess] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(tick);
  }, []);

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (fDisc === "all" || q.disciplina === fDisc) &&
          (fDiff === "all" || (q.dificuldade ?? "Médio") === fDiff) &&
          (fLvl === "all" || q.nivelEnsino === fLvl) &&
          (!fBm || pu.bookmarks.includes(q.id)) &&
          (!search || q.pergunta.toLowerCase().includes(search.toLowerCase())),
      ),
    [questions, fDisc, fDiff, fLvl, fBm, search, pu.bookmarks],
  );

  const difficultyStats = useMemo(
    () =>
      DIFFICULTIES.map((d) => ({
        label: d,
        count: questions.filter((q) => (q.dificuldade ?? "Médio") === d).length,
      })),
    [questions],
  );

  const totalPages = Math.ceil(filtered.length / QPAGE);
  const paged = filtered.slice((page - 1) * QPAGE, page * QPAGE);

  function getSRInfo(qid: string): SRInfo | null {
    const sr = pu.srData[qid];
    if (!sr) return null;
    if (!nowMs) return { due: false, days: 0 };
    if (sr.nextReview <= nowMs) return { due: true, days: 0 };
    const days = Math.ceil((sr.nextReview - nowMs) / 86400000);
    return { due: false, days };
  }

  function handleDeleteQuestion(question: Question): void {
    const confirmed = window.confirm("Excluir esta questão? Esta ação não pode ser desfeita.");
    if (!confirmed) return;
    dispatch({ type: "DEL_QUESTION", id: question.id });
    addToast("Questão excluída 🗑️", "success");
  }

  function handleEditQuestion(payload: Omit<Question, "id" | "dataCadastro">): void {
    if (!editingQuestion) return;
    dispatch({ type: "EDIT_QUESTION", id: editingQuestion.id, data: payload });
    setEditingQuestion(null);
    addToast("Questão atualizada ✏️", "success");
  }

  function handleExportCsv(): void {
    if (questions.length === 0) {
      addToast("Não há questões para exportar", "error");
      return;
    }

    const csv = buildQuestionsCsv(questions);
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getQuestionsCsvFilename();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`CSV exportado com ${questions.length} questões`, "success");
  }

  function handleImportCsv(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const { questions: parsed, errors } = parseQuestionsCsv(content);

      setCsvImportErrors(errors);
      setCsvImportSuccess(0);

      if (errors.length > 0 && parsed.length === 0) {
        addToast(`Erro ao importar CSV: ${errors[0]}`, "error");
        return;
      }

      let importedCount = 0;
      for (const q of parsed) {
        const fullQuestion: Question = {
          ...q,
          id: crypto.randomUUID(),
          dataCadastro: new Date().toISOString(),
        };
        dispatch({ type: "ADD_QUESTION", q: fullQuestion });
        importedCount++;
      }

      setCsvImportSuccess(importedCount);
      addToast(`${importedCount} questões importadas com sucesso!`, "success");

      if (errors.length > 0) {
        addToast(`⚠️ ${errors.length} linhas com erros foram ignoradas.`, "badge");
      }
    };
    reader.readAsText(file);

    e.target.value = "";
  }

  function handleTabKeyNavigation(e: KeyboardEvent<HTMLButtonElement>, current: QuestionsTab): void {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const order: QuestionsTab[] = ["list", "sr", "csv", "stats"];
    const idx = order.indexOf(current);
    const next = e.key === "ArrowRight" ? order[(idx + 1) % order.length] : order[(idx - 1 + order.length) % order.length];
    setTab(next);
  }

  return (
    <div className="pg fade">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 className="SY" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            📚 Questoes
          </h1>
          <p className="ptx" style={{ marginTop: 2 }}>
            {questions.length} questoes - {pu.bookmarks.length} favoritadas
          </p>
        </div>
        <button className="btn btn-p btn-sm" onClick={() => setAddModal(true)}>
          + Nova
        </button>
      </div>
      <div className="tabs" role="tablist" aria-label="Abas de questoes">
        <button id="questions-tab-list" role="tab" aria-selected={tab === "list"} aria-controls="questions-panel-list" tabIndex={tab === "list" ? 0 : -1} className={`tab ${tab === "list" ? "on" : ""}`} onClick={() => setTab("list")} onKeyDown={(e) => handleTabKeyNavigation(e, "list")}>
          📋 Lista
        </button>
        <button id="questions-tab-sr" role="tab" aria-selected={tab === "sr"} aria-controls="questions-panel-sr" tabIndex={tab === "sr" ? 0 : -1} className={`tab ${tab === "sr" ? "on" : ""}`} onClick={() => setTab("sr")} onKeyDown={(e) => handleTabKeyNavigation(e, "sr")}>
          🧠 Revisao
        </button>
        <button id="questions-tab-csv" role="tab" aria-selected={tab === "csv"} aria-controls="questions-panel-csv" tabIndex={tab === "csv" ? 0 : -1} className={`tab ${tab === "csv" ? "on" : ""}`} onClick={() => setTab("csv")} onKeyDown={(e) => handleTabKeyNavigation(e, "csv")}>
          📤 CSV
        </button>
        <button id="questions-tab-stats" role="tab" aria-selected={tab === "stats"} aria-controls="questions-panel-stats" tabIndex={tab === "stats" ? 0 : -1} className={`tab ${tab === "stats" ? "on" : ""}`} onClick={() => setTab("stats")} onKeyDown={(e) => handleTabKeyNavigation(e, "stats")}>
          📊 Stats
        </button>
      </div>

      {tab === "list" && (
        <div id="questions-panel-list" role="tabpanel" aria-labelledby="questions-tab-list">
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <input className="inp" style={{ flex: 1, minWidth: 150 }} placeholder="🔍 Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Buscar questao" />
            <select className="inp" style={{ width: "auto" }} value={fDisc} onChange={(e) => { setFDisc(e.target.value); setPage(1); }}>
              <option value="all">Todas disciplinas</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
            <select className="inp" style={{ width: "auto" }} value={fDiff} onChange={(e) => { setFDiff(e.target.value as "all" | Dificuldade); setPage(1); }}>
              <option value="all">Todas dificuldades</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select className="inp" style={{ width: "auto" }} value={fLvl} onChange={(e) => { setFLvl(e.target.value); setPage(1); }}>
              <option value="all">Todos niveis</option>
              {LEVELS_ED.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <button className={`btn btn-sm ${fBm ? "btn-p" : "btn-s"}`} onClick={() => { setFBm((v) => !v); setPage(1); }} title="So favoritas">
              ⭐ {fBm ? "Favoritas" : "Todas"}
            </button>
          </div>
          <p className="ptx" style={{ marginBottom: 12 }}>
            {filtered.length} resultado(s) - Pagina {page} de {Math.max(1, totalPages)}
          </p>
          {paged.map((q) => {
            const d = discLookup(disciplines, q.disciplina);
            const isBookmarked = pu.bookmarks.includes(q.id);
            const sr = getSRInfo(q.id);
            return (
              <div key={q.id} className="card" style={{ marginBottom: 9, padding: "16px 18px" }}>
                <div className="row" style={{ marginBottom: 7, flexWrap: "wrap", gap: 5 }}>
                  <span className="badge-pill" style={{ background: hexAlpha(d.color, 0.18), color: d.color }}>
                    {d.icon} {q.disciplina}
                  </span>
                  <span className="badge-pill by">{q.dificuldade ?? "Médio"}</span>
                  <span className="badge-pill bm">{q.nivelEnsino}</span>
                  <span className="badge-pill bm">{q.tipoResposta === "multipla-escolha" ? "Multipla" : "V/F"}</span>
                  {sr && (
                    <span className="badge-pill" style={{ background: sr.due ? "var(--err-d)" : "var(--ok-d)", color: sr.due ? "var(--err)" : "var(--ok)", fontSize: 10 }}>
                      {sr.due ? "🔴 Para revisar" : `🟢 Em ${sr.days}d`}
                    </span>
                  )}
                  <button
                    style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: isBookmarked ? "var(--sec)" : "var(--txm)" }}
                    onClick={() => dispatch({ type: "TOGGLE_BOOKMARK", uid, qid: q.id })}
                    title={isBookmarked ? "Remover favorito" : "Adicionar favorito"}
                    aria-label={isBookmarked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    {isBookmarked ? "⭐" : "☆"}
                  </button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 7 }}><MathText text={q.pergunta} /></div>
                {q.imagem && (
                  <img
                    src={q.imagem}
                    alt="Imagem da questão"
                    style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 10, marginBottom: 8, border: "1px solid var(--bdr)" }}
                  />
                )}
                <p style={{ fontSize: 12, color: "var(--ok)" }}>✅ <MathText text={q.respostaCorreta} /></p>
                {q.tags?.length > 0 && (
                  <div className="row" style={{ marginTop: 7, flexWrap: "wrap", gap: 3 }}>
                    {q.tags.map((t) => (
                      <span key={t} className="badge-pill bm" style={{ fontSize: 10 }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="row" style={{ gap: 8, marginTop: 10 }}>
                  <button className="btn btn-s btn-sm" onClick={() => setEditingQuestion(q)}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-g btn-sm" onClick={() => handleDeleteQuestion(q)}>
                    🗑 Excluir
                  </button>
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="row" style={{ gap: 6, marginTop: 18, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>
                «
              </button>
              <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button key={p} className={`page-btn ${p === page ? "on" : ""}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
              <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                ›
              </button>
              <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                »
              </button>
            </div>
          )}
          {paged.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: 36 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>🔍</div>
              <p style={{ color: "var(--txd)" }}>Nenhuma questao encontrada.</p>
            </div>
          )}
        </div>
      )}

      {tab === "sr" && (
        <div id="questions-panel-sr" role="tabpanel" aria-labelledby="questions-tab-sr">
          <div className="card" style={{ marginBottom: 16, background: "var(--surf)" }}>
            <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 8 }}>
              🧠 Como funciona a Revisao Espacada?
            </h3>
            <p style={{ fontSize: 12, color: "var(--txd)", lineHeight: 1.6 }}>
              O algoritmo SM-2 ajusta automaticamente quando cada questao deve ser revisada com base no seu desempenho.
            </p>
          </div>
          {questions.map((q) => {
            const sr = getSRInfo(q.id);
            if (!sr) return null;
            return (
              <div key={q.id} className="card" style={{ marginBottom: 8, padding: "13px 16px" }}>
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className={`badge-pill ${sr.due ? "bp" : "bs"}`} style={{ fontSize: 10 }}>
                    {sr.due ? "🔴 Revisar agora" : `🟢 Em ${sr.days}d`}
                  </span>
                  <span style={{ fontSize: 13, flex: 1, color: "var(--tx)" }}>{q.pergunta}</span>
                  {pu.srData[q.id] && <span style={{ fontSize: 11, color: "var(--txd)" }}>Intervalo: {pu.srData[q.id].interval}d</span>}
                </div>
              </div>
            );
          })}
          {!Object.keys(pu.srData).length && (
            <div className="card" style={{ textAlign: "center", padding: 36 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>🧠</div>
              <p style={{ color: "var(--txd)" }}>Complete sessoes de Revisao Espacada para ver seu progresso aqui.</p>
            </div>
          )}
        </div>
      )}

      {tab === "csv" && (
        <div id="questions-panel-csv" role="tabpanel" aria-labelledby="questions-tab-csv">
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="SY" style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>
              📄 Formato CSV
            </h3>
            <div style={{ background: "var(--surf)", borderRadius: 10, padding: 13, fontSize: 11, fontFamily: "monospace", color: "var(--blu)", overflowX: "auto" }}>
              Pergunta, Disciplina, Dificuldade, NivelEnsino, TipoResposta, OpcaoA, OpcaoB, OpcaoC, OpcaoD, OpcaoE, RespostaCorreta, Comentario, Origem, Tags
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 className="SY" style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>
              💾 Exportar Banco Atual
            </h3>
            <p className="ptx" style={{ marginBottom: 10 }}>
              Baixe todas as questões cadastradas em CSV para backup ou compartilhamento.
            </p>
            <button className="btn btn-p" onClick={handleExportCsv}>⬇️ Exportar CSV</button>
          </div>
          <div className="upload-z" style={{ position: "relative", overflow: "hidden" }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCsv}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
            />
            <div style={{ fontSize: 38, marginBottom: 10 }}>📤</div>
            <p style={{ fontWeight: 600, marginBottom: 5 }}>Clique para upload do CSV</p>
            <p style={{ fontSize: 12, color: "var(--txd)" }}>Formatos: .csv</p>
          </div>
          {csvImportSuccess > 0 && (
            <div className="card" style={{ marginTop: 16, background: "var(--ok)", padding: 12 }}>
              <p style={{ fontSize: 13, color: "white", fontWeight: 600 }}>✅ {csvImportSuccess} questões importadas com sucesso!</p>
            </div>
          )}
          {csvImportErrors.length > 0 && (
            <div className="card" style={{ marginTop: 16, background: "var(--surf)", padding: 12 }}>
              <p className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 8, color: "var(--err)" }}>
                ⚠️ {csvImportErrors.length} erro(s) encontrado(s):
              </p>
              <div style={{ fontSize: 12, color: "var(--txd)", maxHeight: 200, overflowY: "auto" }}>
                {csvImportErrors.slice(0, 5).map((err, i) => (
                  <p key={i} style={{ marginBottom: 4 }}>
                    • {err}
                  </p>
                ))}
                {csvImportErrors.length > 5 && <p style={{ marginTop: 8, fontWeight: 600 }}>... e mais {csvImportErrors.length - 5} erros</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div id="questions-panel-stats" role="tabpanel" aria-labelledby="questions-tab-stats">
          <div className="sgrid" style={{ marginBottom: 20 }}>
            <div className="scard">
              <div style={{ fontSize: 20, marginBottom: 5 }}>📝</div>
              <div className="SY" style={{ fontSize: "1.4rem", fontWeight: 800 }}>
                {questions.length}
              </div>
              <div className="ptx">Total</div>
            </div>
            <div className="scard">
              <div style={{ fontSize: 20, marginBottom: 5 }}>⭐</div>
              <div className="SY" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--sec)" }}>
                {pu.bookmarks.length}
              </div>
              <div className="ptx">Favoritas</div>
            </div>
            <div className="scard">
              <div style={{ fontSize: 20, marginBottom: 5 }}>🧠</div>
              <div className="SY" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--blu)" }}>
                {Object.keys(pu.srData).length}
              </div>
              <div className="ptx">Em SR</div>
            </div>
          </div>
          {[...new Set(questions.map((q) => q.disciplina))].map((name) => {
            const d = discLookup(disciplines, name);
            const cnt = questions.filter((q) => q.disciplina === name).length;
            const pct = Math.round((cnt / questions.length) * 100);
            return (
              <div key={name} style={{ marginBottom: 10 }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>
                    {d.icon} {name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--txd)" }}>{cnt}</span>
                </div>
                <div style={{ background: "var(--bdr)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: d.color, width: `${pct}%`, borderRadius: 99, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 10 }}>
              🎚 Distribuicao por Dificuldade
            </h3>
            {difficultyStats.map((item) => {
              const pct = questions.length ? Math.round((item.count / questions.length) * 100) : 0;
              return (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: "var(--txd)" }}>{item.count}</span>
                  </div>
                  <div style={{ background: "var(--bdr)", borderRadius: 99, height: 7, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--sec)", width: `${pct}%`, borderRadius: 99, transition: "width .5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {addModal && (
        <AddQModal
          disciplines={disciplines}
          existingQuestions={questions}
          onSave={(q) => {
            onAddQ(q);
            setAddModal(false);
          }}
          onClose={() => setAddModal(false)}
        />
      )}
      {editingQuestion && (
        <AddQModal
          disciplines={disciplines}
          existingQuestions={questions}
          initialQuestion={editingQuestion}
          title="✏️ Editar Questao"
          submitLabel="💾 Atualizar"
          onSave={handleEditQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
}

function AddQModal({ disciplines, onSave, onClose, initialQuestion, title = "➕ Nova Questao", submitLabel = "💾 Salvar", existingQuestions = [] }: AddQModalProps) {
  const baseForm = useMemo<AddQuestionForm>(
    () => ({
      pergunta: initialQuestion?.pergunta ?? "",
      disciplina: initialQuestion?.disciplina ?? disciplines[0]?.name ?? "",
      dificuldade: initialQuestion?.dificuldade ?? "Médio",
      imagem: initialQuestion?.imagem ?? "",
      nivelEnsino: initialQuestion?.nivelEnsino ?? "Médio",
      tipoResposta: initialQuestion?.tipoResposta ?? "multipla-escolha",
      opcaoA: initialQuestion?.tipoResposta === "multipla-escolha" ? initialQuestion.opcoes[0] ?? "" : "",
      opcaoB: initialQuestion?.tipoResposta === "multipla-escolha" ? initialQuestion.opcoes[1] ?? "" : "",
      opcaoC: initialQuestion?.tipoResposta === "multipla-escolha" ? initialQuestion.opcoes[2] ?? "" : "",
      opcaoD: initialQuestion?.tipoResposta === "multipla-escolha" ? initialQuestion.opcoes[3] ?? "" : "",
      opcaoE: initialQuestion?.tipoResposta === "multipla-escolha" ? initialQuestion.opcoes[4] ?? "" : "",
      respostaCorreta: initialQuestion?.respostaCorreta ?? "",
      comentario: initialQuestion?.comentario ?? "",
      origem: initialQuestion?.origem ?? "Livro",
      tags: initialQuestion?.tags.join(", ") ?? "",
    }),
    [initialQuestion, disciplines],
  );

  const draftStorageKey = initialQuestion ? getEditQuestionDraftKey(initialQuestion.id) : ADD_QUESTION_DRAFT_KEY;
  const recoveredDraft = loadQuestionDraft(draftStorageKey);
  const initialStep = recoveredDraft?.step ?? 1;
  const initialForm = recoveredDraft?.form ? { ...baseForm, ...recoveredDraft.form } : baseForm;
  const [initialSnapshot, setInitialSnapshot] = useState<{ step: AddQStep; form: AddQuestionForm }>({ step: initialStep, form: initialForm });

  const [step, setStep] = useState<AddQStep>(recoveredDraft?.step ?? 1);
  const [errors, setErrors] = useState<AddQErrors>({});
  const [f, setF] = useState<AddQuestionForm>(initialForm);
  const hasUnsavedChanges = step !== initialSnapshot.step || JSON.stringify(f) !== JSON.stringify(initialSnapshot.form);
  const isEditMode = Boolean(initialQuestion);
  const draftBannerStyle = isEditMode
    ? { background: "rgba(77, 171, 247, 0.12)", border: "1px solid rgba(77, 171, 247, 0.35)" }
    : { background: "rgba(46, 213, 115, 0.12)", border: "1px solid rgba(46, 213, 115, 0.35)" };

  useEffect(() => {
    const updatedAt = new Date().toISOString();
    saveQuestionDraft(draftStorageKey, { step, form: f, updatedAt });
  }, [step, f, draftStorageKey]);

  const s =
    (k: keyof AddQuestionForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((p) => ({ ...p, [k]: e.target.value as AddQuestionForm[keyof AddQuestionForm] }));

  function validateStepOne(): boolean {
    const nextErrors: AddQErrors = {};
    if (!f.pergunta.trim()) {
      nextErrors.pergunta = "Preencha a pergunta para continuar.";
    }
    const perguntaNormalizada = f.pergunta.trim().toLowerCase();
    const isDuplicate = existingQuestions.some((q) => q.id !== initialQuestion?.id && q.pergunta.toLowerCase() === perguntaNormalizada);
    if (isDuplicate) {
      nextErrors.pergunta = "Esta pergunta já existe na base de dados.";
    }
    setErrors((prev) => ({ ...prev, ...nextErrors, pergunta: nextErrors.pergunta }));
    return !nextErrors.pergunta;
  }

  function validateStepTwo(): boolean {
    const nextErrors: AddQErrors = {};
    if (f.tipoResposta === "multipla-escolha") {
      const opcoes = [f.opcaoA, f.opcaoB, f.opcaoC, f.opcaoD, f.opcaoE].filter((o) => o.trim());
      if (opcoes.length < 2) {
        nextErrors.opcoes = "Informe ao menos 2 opcoes para continuar.";
      }
      if (!f.respostaCorreta.trim()) {
        nextErrors.respostaCorreta = "Selecione a resposta correta para continuar.";
      } else if (!opcoes.includes(f.respostaCorreta)) {
        nextErrors.respostaCorreta = "A resposta correta deve estar na lista de opções.";
      }
    } else if (!f.respostaCorreta.trim()) {
      nextErrors.respostaCorreta = "Selecione a resposta correta para continuar.";
    }
    setErrors((prev) => ({ ...prev, ...nextErrors, opcoes: nextErrors.opcoes, respostaCorreta: nextErrors.respostaCorreta }));
    return !nextErrors.opcoes && !nextErrors.respostaCorreta;
  }

  function validateStepThree(): boolean {
    const nextErrors: AddQErrors = {};
    if (!f.disciplina.trim()) {
      nextErrors.disciplina = "Selecione a disciplina.";
    }
    setErrors((prev) => ({ ...prev, ...nextErrors, disciplina: nextErrors.disciplina }));
    return !nextErrors.disciplina;
  }

  function handleNextStep(): void {
    if (step === 1 && !validateStepOne()) return;
    if (step === 2 && !validateStepTwo()) return;
    if (step === 3 && !validateStepThree()) return;
    setStep((p) => (p < 4 ? ((p + 1) as AddQStep) : p));
  }

  function handlePreviousStep(): void {
    setStep((p) => (p > 1 ? ((p - 1) as AddQStep) : p));
  }

  function save(): void {
    if (!validateStepOne() || !validateStepTwo() || !validateStepThree()) return;
    const opcoes =
      f.tipoResposta === "multipla-escolha"
        ? [f.opcaoA, f.opcaoB, f.opcaoC, f.opcaoD, f.opcaoE].filter((o) => o.trim())
        : ["Verdadeiro", "Falso"];

    clearQuestionDraft(draftStorageKey);

    onSave({
      pergunta: f.pergunta,
      disciplina: f.disciplina,
      dificuldade: f.dificuldade,
      imagem: f.imagem || undefined,
      nivelEnsino: f.nivelEnsino,
      tipoResposta: f.tipoResposta,
      opcoes,
      respostaCorreta: f.respostaCorreta,
      comentario: f.comentario,
      origem: f.origem,
      tags: f.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  function discardDraft(): void {
    clearQuestionDraft(draftStorageKey);
    setErrors({});
    setStep(1);
    setF(baseForm);
    setInitialSnapshot({ step: 1, form: baseForm });
  }

  function requestClose(): void {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }

    const shouldClose = window.confirm(
      initialQuestion
        ? "Fechar e manter o rascunho desta edição?"
        : "Fechar e manter o rascunho da nova questão?",
    );
    if (shouldClose) onClose();
  }

  return (
    <div className="mover" onClick={(e) => e.target === e.currentTarget && requestClose()}>
      <div className="modal">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 className="SY" style={{ fontSize: "1.05rem", fontWeight: 800 }}>
            {title}
          </h2>
          <button className="btn btn-g btn-sm" onClick={requestClose}>
            ✕
          </button>
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <span className={`badge-pill ${step === 1 ? "bp" : "bm"}`}>1. Enunciado</span>
          <span className={`badge-pill ${step === 2 ? "bp" : "bm"}`}>2. Alternativas</span>
          <span className={`badge-pill ${step === 3 ? "bp" : "bm"}`}>3. Metadados</span>
          <span className={`badge-pill ${step === 4 ? "bp" : "bm"}`}>4. Resumo</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ background: "var(--surf)", height: 8, borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(step / 4) * 100}%`,
                background: "var(--blu)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--txd)", textAlign: "right" }}>
            Passo {step} de 4
          </p>
        </div>

        <div className="card" style={{ marginBottom: 12, padding: "8px 10px", ...draftBannerStyle }}>
          <p style={{ fontSize: 11, color: "var(--tx)", marginBottom: 4, fontWeight: 600 }}>
            {isEditMode ? "✏️ Rascunho de edição salvo." : "✨ Rascunho de criação salvo."}
          </p>
          {recoveredDraft && (
            <p style={{ fontSize: 11, color: isEditMode ? "var(--blu)" : "var(--ok)" }}>
              {isEditMode ? "Rascunho de edição recuperado." : "Rascunho de criação recuperado."}
            </p>
          )}
        </div>

        {step === 1 && (
          <>
            <div style={{ marginBottom: 11 }}>
              <label className="lbl">Pergunta *</label>
              <textarea
                className="inp"
                rows={3}
                placeholder="Digite a pergunta... (ex: Derive $x^2$)"
                value={f.pergunta}
                onChange={s("pergunta")}
                aria-invalid={errors.pergunta ? "true" : "false"}
                style={{ resize: "vertical", borderColor: errors.pergunta ? "var(--err)" : undefined }}
              />
              {errors.pergunta && <p style={{ marginTop: 4, fontSize: 11, color: "var(--err)" }}>{errors.pergunta}</p>}
            </div>
            <div className="card" style={{ background: "var(--surf)", padding: 12, marginBottom: 11, borderRadius: 12 }}>
              <p className="SY" style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 6 }}>
                🧮 Guia rápido de fórmulas (LaTeX)
              </p>
              <p style={{ fontSize: 12, color: "var(--txd)", marginBottom: 4 }}>
                Inline: <strong>$...$</strong> | Bloco: <strong>$$...$$</strong>
              </p>
              <p style={{ fontSize: 11, color: "var(--txd)", marginBottom: 6 }}>
                Exemplos: <code>{"$\\frac{d}{dx}$"}</code>, <code>{"$x^2 + y^2 = z^2$"}</code>, <code>{"$$\\int_a^b f(x)\\,dx$$"}</code>
              </p>
              <div style={{ fontSize: 12, color: "var(--tx)" }}>
                Preview: <MathText text={f.pergunta || "Digite uma fórmula na pergunta para visualizar."} />
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className="lbl">Imagem de apoio</label>
              <input
                className="inp"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    alert("Selecione um arquivo de imagem válido.");
                    return;
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    alert("Imagem muito grande. Limite de 2MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const imageData = reader.result;
                    if (typeof imageData === "string") {
                      setF((p) => ({ ...p, imagem: imageData }));
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {f.imagem && (
                <div style={{ marginTop: 8 }}>
                  <img src={f.imagem} alt="Pré-visualização da imagem" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 10, border: "1px solid var(--bdr)" }} />
                  <button className="btn btn-g btn-sm" style={{ marginTop: 8 }} onClick={() => setF((p) => ({ ...p, imagem: "" }))}>
                    Remover imagem
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: 11 }}>
              <label className="lbl">Tipo</label>
              <select className="inp" value={f.tipoResposta} onChange={s("tipoResposta")}>
                <option value="multipla-escolha">Multipla Escolha</option>
                <option value="verdadeiro-falso">Verdadeiro / Falso</option>
              </select>
            </div>
            {f.tipoResposta === "multipla-escolha" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 11 }}>
                {(["A", "B", "C", "D", "E"] as const).map((l) => {
                  const key = `opcao${l}` as "opcaoA" | "opcaoB" | "opcaoC" | "opcaoD" | "opcaoE";
                  return (
                    <div key={l}>
                      <label className="lbl">Opcao {l}</label>
                      <input className="inp" placeholder={`Opcao ${l}`} value={f[key]} onChange={s(key)} />
                    </div>
                  );
                })}
              </div>
            )}
            {errors.opcoes && <p style={{ marginTop: -4, marginBottom: 8, fontSize: 11, color: "var(--err)" }}>{errors.opcoes}</p>}
            <div style={{ marginBottom: 11 }}>
              <label className="lbl">Resposta Correta *</label>
              {f.tipoResposta === "verdadeiro-falso" ? (
                <select className="inp" value={f.respostaCorreta} onChange={s("respostaCorreta")} aria-invalid={errors.respostaCorreta ? "true" : "false"} style={{ borderColor: errors.respostaCorreta ? "var(--err)" : undefined }}>
                  <option value="">Selecionar...</option>
                  <option value="Verdadeiro">Verdadeiro</option>
                  <option value="Falso">Falso</option>
                </select>
              ) : (
                <select className="inp" value={f.respostaCorreta} onChange={s("respostaCorreta")} aria-invalid={errors.respostaCorreta ? "true" : "false"} style={{ borderColor: errors.respostaCorreta ? "var(--err)" : undefined }}>
                  <option value="">Selecionar a correta</option>
                  {[f.opcaoA, f.opcaoB, f.opcaoC, f.opcaoD, f.opcaoE]
                    .filter((o) => o.trim())
                    .map((o, i) => (
                      <option key={i} value={o}>
                        {o}
                      </option>
                    ))}
                </select>
              )}
              {errors.respostaCorreta && <p style={{ marginTop: 4, fontSize: 11, color: "var(--err)" }}>{errors.respostaCorreta}</p>}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 11 }}>
              <div>
                <label className="lbl">Disciplina</label>
                <select className="inp" value={f.disciplina} onChange={s("disciplina")} aria-invalid={errors.disciplina ? "true" : "false"} style={{ borderColor: errors.disciplina ? "var(--err)" : undefined }}>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.icon} {d.name}
                    </option>
                  ))}
                </select>
                {errors.disciplina && <p style={{ marginTop: 4, fontSize: 11, color: "var(--err)" }}>{errors.disciplina}</p>}
              </div>
              <div>
                <label className="lbl">Dificuldade</label>
                <select className="inp" value={f.dificuldade} onChange={s("dificuldade")}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className="lbl">Nivel</label>
              <select className="inp" value={f.nivelEnsino} onChange={s("nivelEnsino")}>
                {LEVELS_ED.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 11 }}>
              <label className="lbl">Comentario</label>
              <textarea className="inp" rows={2} placeholder="Explique a resposta... (aceita LaTeX também)" value={f.comentario} onChange={s("comentario")} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label className="lbl">Origem</label>
                <select className="inp" value={f.origem} onChange={s("origem")}>
                  {ORIGINS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="lbl">Tags (virgula)</label>
                <input className="inp" placeholder="ex: algebra, ENEM" value={f.tags} onChange={s("tags")} />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <div style={{ overflowY: "auto", maxHeight: "45vh", paddingRight: 8 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 className="SY" style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 8 }}>
                📋 Revisão da Questão
              </h3>
              <p style={{ fontSize: 12, color: "var(--txd)" }}>Verifique se todos os dados estão corretos antes de salvar.</p>
            </div>

            <div className="card" style={{ marginBottom: 12, padding: 12 }}>
              <p className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 6, color: "var(--blu)" }}>
                Pergunta
              </p>
              <div style={{ fontSize: 13, color: "var(--tx)", lineHeight: 1.5, marginBottom: 8 }}>
                <MathText text={f.pergunta} />
              </div>
              {f.imagem && (
                <img src={f.imagem} alt="Imagem da questão" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, border: "1px solid var(--bdr)" }} />
              )}
            </div>

            <div className="card" style={{ marginBottom: 12, padding: 12 }}>
              <p className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 8, color: "var(--blu)" }}>
                {f.tipoResposta === "multipla-escolha" ? "Alternativas" : "Verdadeiro ou Falso?"}
              </p>
              <div style={{ display: "grid", gap: 6 }}>
                {f.tipoResposta === "multipla-escolha" ? (
                  ["A", "B", "C", "D", "E"].map((letter) => {
                    const value = f[`opcao${letter}` as keyof typeof f];
                    if (!value) return null;
                    const isCorrect = value === f.respostaCorreta;
                    return (
                      <div
                        key={letter}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: isCorrect ? "var(--ok)" : "var(--surf)",
                          border: isCorrect ? "2px solid var(--ok)" : "1px solid var(--bdr)",
                          fontSize: 13,
                        }}
                      >
                        <strong style={{ fontWeight: 700 }}>{letter}.</strong> {value}
                        {isCorrect && <span style={{ marginLeft: 8, color: "var(--tx)" }}>✅</span>}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div style={{ padding: 10, borderRadius: 8, background: f.respostaCorreta === "Verdadeiro" ? "var(--ok)" : "var(--surf)", border: f.respostaCorreta === "Verdadeiro" ? "2px solid var(--ok)" : "1px solid var(--bdr)", fontSize: 13 }}>
                      Verdadeiro {f.respostaCorreta === "Verdadeiro" && <span style={{ marginLeft: 8 }}>✅</span>}
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: f.respostaCorreta === "Falso" ? "var(--ok)" : "var(--surf)", border: f.respostaCorreta === "Falso" ? "2px solid var(--ok)" : "1px solid var(--bdr)", fontSize: 13 }}>
                      Falso {f.respostaCorreta === "Falso" && <span style={{ marginLeft: 8 }}>✅</span>}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div className="card" style={{ padding: 12 }}>
                <p className="SY" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--txd)", marginBottom: 4 }}>
                  Disciplina
                </p>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{f.disciplina}</p>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <p className="SY" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--txd)", marginBottom: 4 }}>
                  Dificuldade
                </p>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{f.dificuldade}</p>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <p className="SY" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--txd)", marginBottom: 4 }}>
                  Nível
                </p>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{f.nivelEnsino}</p>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <p className="SY" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--txd)", marginBottom: 4 }}>
                  Origem
                </p>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{f.origem}</p>
              </div>
            </div>

            {f.comentario && (
              <div className="card" style={{ marginBottom: 12, padding: 12, background: "var(--surf)" }}>
                <p className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 6, color: "var(--blu)" }}>
                  💬 Comentário
                </p>
                <div style={{ fontSize: 12, color: "var(--txd)", lineHeight: 1.5 }}>
                  <MathText text={f.comentario} />
                </div>
              </div>
            )}

            {f.tags &&
              f.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean).length > 0 && (
                <div className="card" style={{ marginBottom: 12, padding: 12 }}>
                  <p className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 8, color: "var(--blu)" }}>
                    🏷️ Tags
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {f.tags
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span key={tag} style={{ background: "var(--blu)", color: "white", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}

        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {step > 1 && (
            <button className="btn btn-s btn-sm" onClick={handlePreviousStep}>
              ← Voltar
            </button>
          )}
          {step < 4 ? (
            <button className="btn btn-p btn-sm" onClick={handleNextStep}>
              Proximo →
            </button>
          ) : (
            <button className="btn btn-p btn-w" onClick={save}>
              {submitLabel}
            </button>
          )}
          <button className="btn btn-g btn-sm" onClick={requestClose}>
            Cancelar
          </button>
          <button className="btn btn-s btn-sm" onClick={discardDraft}>
            {isEditMode ? "🗑 Limpar rascunho (edição)" : "🗑 Limpar rascunho (criação)"}
          </button>
        </div>
      </div>
    </div>
  );
}

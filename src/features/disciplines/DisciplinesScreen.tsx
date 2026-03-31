import { useState } from "react";
import { useApp } from "../../app/context";
import { COLOR_LIST, EMOJI_LIST } from "../../domain/constants";
import { hexAlpha } from "../../domain/utils";
import type { Discipline } from "../../types/app";

type DiscModalData = { editing: Discipline | null };

type DiscModalProps = {
  disc: Discipline | null;
  onSave: (data: Pick<Discipline, "name" | "icon" | "color">) => void;
  onClose: () => void;
};

function DiscModal({ disc, onSave, onClose }: DiscModalProps) {
  const [name, setName] = useState(disc?.name || "");
  const [icon, setIcon] = useState(disc?.icon || "📚");
  const [color, setColor] = useState(disc?.color || "#4dabf7");
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <div className="mover" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 20 }}>
          <h2 className="SY" style={{ fontSize: "1.05rem", fontWeight: 800 }}>{disc ? "✏️ Editar" : "➕ Nova Disciplina"}</h2>
          <button className="btn btn-g btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ textAlign: "center", background: "var(--surf)", borderRadius: 14, padding: "18px 14px", marginBottom: 18, border: "1px solid var(--bdr)" }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: hexAlpha(color, .18), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 8px" }}>{icon}</div>
          <div className="SY" style={{ fontWeight: 700, fontSize: "0.95rem", color }}>{name || "Nome da Disciplina"}</div>
        </div>
        <div style={{ marginBottom: 12 }}><label className="lbl">Nome *</label><input className="inp" placeholder="Ex: Filosofia, Ingles..." value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></div>
        <div style={{ marginBottom: 12 }}>
          <label className="lbl">Icone</label>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: hexAlpha(color, .18), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: `2px solid ${hexAlpha(color, .4)}` }}>{icon}</div>
            <button className="btn btn-s btn-sm" onClick={() => setShowEmoji((v) => !v)}>{showEmoji ? "▲ Fechar" : "▼ Emoji"}</button>
          </div>
          {showEmoji && <div className="emoji-grid">{EMOJI_LIST.map((e) => <button key={e} className={`emoji-btn ${icon === e ? "sel" : ""}`} onClick={() => { setIcon(e); setShowEmoji(false); }}>{e}</button>)}</div>}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="lbl">Cor</label>
          <div className="color-grid">{COLOR_LIST.map((c) => <div key={c} className={`cswatch ${color === c ? "sel" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />)}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-p btn-w" onClick={() => { if (!name.trim()) { alert("Informe o nome."); return; } onSave({ name: name.trim(), icon, color }); }}>💾 Salvar</button>
          <button className="btn btn-s btn-sm" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function DisciplinesScreen() {
  const { state, dispatch, addToast } = useApp();
  const { disciplines, questions } = state;
  const [modal, setModal] = useState<DiscModalData | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const custom = disciplines.filter((d) => !d.builtin);
  const builtin = disciplines.filter((d) => d.builtin);

  function handleSave(data: Pick<Discipline, "name" | "icon" | "color">) {
    if (modal?.editing) {
      dispatch({ type: "EDIT_DISC", id: modal.editing.id, data });
      addToast(`"${data.name}" atualizada!`);
    } else {
      dispatch({ type: "ADD_DISC", disc: { ...data, id: `disc_${Date.now()}`, builtin: false } });
      addToast(`"${data.name}" criada! 🎉`);
    }
    setModal(null);
  }

  function tryDel(d: Discipline) {
    const cnt = questions.filter((q) => q.disciplina === d.name).length;
    if (cnt > 0) {
      addToast(`Remova as ${cnt} questão(ões) antes.`, "error");
      setConfirmDel(null);
      return;
    }
    dispatch({ type: "DEL_DISC", id: d.id });
    addToast(`"${d.name}" excluída.`);
    setConfirmDel(null);
  }

  const DiscRow = ({ d, canDel }: { d: Discipline; canDel: boolean }) => {
    const qCnt = questions.filter((q) => q.disciplina === d.name).length;
    return (
      <div className="disc-row">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: hexAlpha(d.color, .18), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: `1.5px solid ${hexAlpha(d.color, .35)}` }}>{d.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: d.color }}>{d.name}</div>
          <div style={{ fontSize: 11, color: "var(--txd)", marginTop: 2 }}>{qCnt} questão(ões) · <span className={`badge-pill ${d.builtin ? "bm" : "bp"}`}>{d.builtin ? "Padrão" : "Personalizada"}</span></div>
        </div>
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: d.color, flexShrink: 0, marginRight: 6 }} />
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-s btn-sm" onClick={() => setModal({ editing: d })}>✏️</button>
          {canDel && (confirmDel === d.id
            ? <><button className="btn btn-sm btn-danger" onClick={() => tryDel(d)}>Confirmar</button><button className="btn btn-g btn-sm" onClick={() => setConfirmDel(null)}>✕</button></>
            : <button className="btn btn-sm btn-danger" onClick={() => setConfirmDel(d.id)}>🗑️</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="pg fade">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
        <div><h1 className="SY" style={{ fontSize: "1.5rem", fontWeight: 800 }}>🎓 Disciplinas</h1><p className="ptx" style={{ marginTop: 2 }}>{disciplines.length} total · {custom.length} personalizadas</p></div>
        <button className="btn btn-p btn-sm" onClick={() => setModal({ editing: null })}>+ Nova Disciplina</button>
      </div>
      <div className="card" style={{ marginBottom: 20, background: "var(--surf)", padding: 13, borderRadius: 12 }}>
        <p style={{ fontSize: 13, color: "var(--txd)" }}>💡 Crie disciplinas com nome, emoji e cor personalizados. Elas aparecem no formulário de questões e na tela inicial quando tiverem questões cadastradas.</p>
      </div>
      <div style={{ marginBottom: 8 }}>
        <h2 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>✨ Personalizadas ({custom.length})</h2>
        {custom.length === 0
          ? <div style={{ border: "2px dashed var(--bdr2)", borderRadius: 14, padding: 28, textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🗂️</div>
            <p style={{ color: "var(--txd)", fontSize: 13, marginBottom: 12 }}>Nenhuma disciplina personalizada.</p>
            <button className="btn btn-p btn-sm" onClick={() => setModal({ editing: null })}>+ Criar</button>
          </div>
          : custom.map((d) => <DiscRow key={d.id} d={d} canDel={true} />)
        }
      </div>
      <div style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <h2 className="SY" style={{ fontSize: "0.9rem", fontWeight: 700 }}>📦 Padrão ({builtin.length})</h2>
          <span className="badge-pill bm" style={{ fontSize: 10 }}>Editáveis</span>
        </div>
        {builtin.map((d) => <DiscRow key={d.id} d={d} canDel={false} />)}
      </div>
      {modal && <DiscModal disc={modal.editing} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
}

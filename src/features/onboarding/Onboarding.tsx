import { useState } from "react";

type OnboardingProps = { onDone: () => void };

const STEPS = [
  { icon: "🎯", title: "Bem-vindo ao Questionador!", text: "Seu aplicativo de estudos com gamificação. Ganhe pontos, suba de nível e compita no ranking!" },
  { icon: "📚", title: "Banco de Questões", text: "Cadastre suas próprias questões individualmente ou em lote via CSV. Organize por disciplinas personalizadas." },
  { icon: "🎮", title: "Modos de Estudo", text: "Escolha entre Estudo (gabarito imediato), Simulado (gabarito no final) ou Revisão Espaçada (algoritmo SM-2)." },
  { icon: "🏆", title: "Gamificação Completa", text: "Conquiste badges, mantenha seu streak diário e dispute o ranking global. Bons estudos!" },
];

export default function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <div className="onboard-overlay">
      <div className="onboard-card">
        <div style={{ fontSize: 56, marginBottom: 16 }}>{s.icon}</div>
        <h2 className="SY" style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 10 }}>{s.title}</h2>
        <p style={{ color: "var(--txd)", fontSize: 14, lineHeight: 1.6 }}>{s.text}</p>
        <div className="onboard-dots">
          {STEPS.map((_, i) => <div key={i} className={`odot ${i === step ? "on" : ""}`} />)}
        </div>
        <div style={{ marginTop: 22, display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && <button className="btn btn-s btn-sm" onClick={() => setStep((v) => v - 1)}>← Anterior</button>}
          {step < STEPS.length - 1
            ? <button className="btn btn-p btn-sm" onClick={() => setStep((v) => v + 1)}>Próximo →</button>
            : <button className="btn btn-ok btn-sm" onClick={onDone}>Começar! 🚀</button>}
        </div>
      </div>
    </div>
  );
}

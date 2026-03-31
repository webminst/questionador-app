import { memo } from "react";
import type { ToastItem } from "../../types/app";

type ToastProps = { toasts: ToastItem[] };

export default memo(function Toast({ toasts }: ToastProps) {
  return (
    <div className="tbox" aria-live="polite" aria-atomic="true" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === "error" ? "e" : t.type === "badge" ? "b" : "s"}`}>
          {t.type === "error" ? "❌ " : t.type === "badge" ? "🏅 " : "✅ "}{t.msg}
        </div>
      ))}
    </div>
  );
});

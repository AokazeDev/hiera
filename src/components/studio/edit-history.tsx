import { History, Redo2, Undo2 } from "lucide-react";
import type { BackupHistory } from "@/lib/luckperms";

type EditHistoryProps = {
  history: BackupHistory;
  onUndo: () => void;
  onRedo: () => void;
};

export function EditHistory({ history, onUndo, onRedo }: EditHistoryProps) {
  const latestUndo = history.past.at(-1);
  const latestRedo = history.future[0];
  const operations = [
    ...history.past
      .slice()
      .reverse()
      .map((entry) => ({ label: entry.label, state: "aplicado" })),
    ...history.future.map((entry) => ({
      label: entry.label,
      state: "por rehacer",
    })),
  ];

  return (
    <section className="edit-history" aria-labelledby="edit-history-title">
      <div className="edit-history-heading">
        <History size={14} aria-hidden="true" />
        <p id="edit-history-title">CAMBIOS DE LA SESIÓN</p>
      </div>
      <div className="edit-history-actions">
        <button
          type="button"
          disabled={!latestUndo}
          onClick={onUndo}
          aria-label={
            latestUndo
              ? `Deshacer: ${latestUndo.label}`
              : "No hay cambios para deshacer"
          }
        >
          <Undo2 size={14} aria-hidden="true" /> Deshacer
        </button>
        <button
          type="button"
          disabled={!latestRedo}
          onClick={onRedo}
          aria-label={
            latestRedo
              ? `Rehacer: ${latestRedo.label}`
              : "No hay cambios para rehacer"
          }
        >
          <Redo2 size={14} aria-hidden="true" /> Rehacer
        </button>
      </div>
      {operations.length ? (
        <ol className="edit-history-list" aria-live="polite">
          {operations.map((operation, index) => (
            <li key={`${operation.state}-${operation.label}-${index}`}>
              <span>{operation.label}</span>
              <small>{operation.state}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="edit-history-empty">
          Las ediciones aparecerán aquí para poder revertirlas.
        </p>
      )}
    </section>
  );
}

import { Info, ShieldAlert, Undo2 } from "lucide-react";
import { getEffectiveNodes, getParents } from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type ResolutionPanelProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  canUndo: boolean;
  onUndo: () => void;
  onSelectGroup: (group: string) => void;
};

export function ResolutionPanel({
  backup,
  groupName,
  canUndo,
  onUndo,
  onSelectGroup,
}: ResolutionPanelProps) {
  const group = backup && groupName ? backup.groups[groupName] : null;
  const parents = group ? getParents(group) : [];
  const effective =
    backup && groupName ? getEffectiveNodes(backup, groupName) : [];
  return (
    <aside className="resolution-panel">
      <div className="rail-heading">
        <span>RESOLUCIÓN</span>
        {backup && (
          <button
            type="button"
            className="icon-button"
            aria-label="Deshacer último cambio"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <Undo2 size={14} />
          </button>
        )}
      </div>
      {group && groupName ? (
        <>
          <div className="selected-group">
            <span className="group-mark" />
            {groupName}
          </div>
          <p className="inheritance-label">Hereda de</p>
          <div className="parent-list">
            {parents.length ? (
              parents.map((parent) => (
                <button
                  type="button"
                  key={parent}
                  onClick={() => onSelectGroup(parent)}
                >
                  {parent}
                </button>
              ))
            ) : (
              <span>Sin padres</span>
            )}
          </div>
          <div className="effective-count">
            <strong>{effective.length}</strong>
            <span>permisos efectivos</span>
          </div>
          <div className="effective-list">
            {effective.slice(0, 10).map((node) => (
              <div key={`${node.origin}-${node.key}`}>
                <span className={node.value ? "value-true" : "value-false"}>
                  {node.value ? "+" : "-"}
                </span>
                <code>{node.key}</code>
                {node.inherited && <small>{node.origin}</small>}
              </div>
            ))}
            {effective.length > 10 && <p>+ {effective.length - 10} más</p>}
          </div>
        </>
      ) : (
        <div className="resolution-empty">
          <Info size={21} />
          <p>
            La resolución mostrará el origen de cada permiso cuando importes un
            backup.
          </p>
        </div>
      )}
      <div className="safety-note">
        <ShieldAlert size={15} />
        <p>
          Los comodines y bypasses requieren una revisión manual antes de
          aplicarlos a producción.
        </p>
      </div>
    </aside>
  );
}

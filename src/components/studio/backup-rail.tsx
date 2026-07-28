import { FileUp, Users } from "lucide-react";
import type { LuckPermsBackup } from "@/lib/permissions";

type BackupRailProps = {
  backup: LuckPermsBackup | null;
  selectedGroup: string | null;
  onSelectGroup: (group: string) => void;
  onImport: () => void;
};

export function BackupRail({
  backup,
  selectedGroup,
  onSelectGroup,
  onImport,
}: BackupRailProps) {
  return (
    <aside className="group-rail" aria-label="Grupos y usuarios">
      <div className="rail-heading">
        <span>BACKUP</span>
        <strong>
          {backup
            ? `${Object.keys(backup.groups).length} grupos`
            : "sin archivo"}
        </strong>
      </div>
      {backup ? (
        <>
          <div className="group-list">
            {Object.entries(backup.groups).map(([name, group]) => (
              <button
                type="button"
                key={name}
                className={`group-row ${name === selectedGroup ? "is-active" : ""}`}
                onClick={() => onSelectGroup(name)}
              >
                <span className="group-mark" />
                <span>{name}</span>
                <small>
                  {
                    group.nodes.filter((node) => node.type === "permission")
                      .length
                  }
                </small>
              </button>
            ))}
          </div>
          <div className="user-count">
            <Users size={15} /> {Object.keys(backup.users ?? {}).length}{" "}
            usuarios en el backup
          </div>
        </>
      ) : (
        <div className="import-empty">
          <FileUp size={22} />
          <p>
            Arrastra un JSON o selecciona un backup exportado desde LuckPerms.
          </p>
          <button type="button" className="line-button" onClick={onImport}>
            Elegir archivo
          </button>
        </div>
      )}
    </aside>
  );
}

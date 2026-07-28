import { FileUp, UserRound, Users } from "lucide-react";
import { BackupDiagnostics } from "@/components/studio/backup-diagnostics";
import { GroupManager } from "@/components/studio/group-manager";
import type { LuckPermsBackup } from "@/lib/permissions";

type BackupRailProps = {
  backup: LuckPermsBackup | null;
  selectedGroup: string | null;
  selectedUser: string | null;
  onSelectGroup: (group: string) => void;
  onSelectUser: (userId: string) => void;
  onImport: () => void;
  onCreateGroup: (groupName: string) => void;
  onRenameGroup: (groupName: string) => void;
  onDeleteGroup: () => void;
};

export function BackupRail({
  backup,
  selectedGroup,
  selectedUser,
  onSelectGroup,
  onSelectUser,
  onImport,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
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
          <BackupDiagnostics backup={backup} />
          <GroupManager
            backup={backup}
            groupName={selectedGroup}
            onCreate={onCreateGroup}
            onRename={onRenameGroup}
            onDelete={onDeleteGroup}
          />
          <div className="user-list-heading">
            <span>USUARIOS</span>
            <small>{Object.keys(backup.users ?? {}).length}</small>
          </div>
          {Object.entries(backup.users ?? {}).length ? (
            <div className="group-list user-list">
              {Object.entries(backup.users ?? {}).map(([userId, user]) => (
                <button
                  type="button"
                  key={userId}
                  className={`group-row ${userId === selectedUser ? "is-active" : ""}`}
                  onClick={() => onSelectUser(userId)}
                >
                  <UserRound size={13} aria-hidden="true" />
                  <span>{user.username ?? userId}</span>
                  <small>{user.primaryGroup ?? "sin primario"}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="user-empty">No hay usuarios en este backup.</p>
          )}
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

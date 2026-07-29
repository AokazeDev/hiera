"use client";

import { FileUp, Search, UserRound, Users, X } from "lucide-react";
import { useState } from "react";
import { BackupDiagnostics } from "@/components/studio/backup-diagnostics";
import { GroupManager } from "@/components/studio/group-manager";
import { PermissionSearchResults } from "@/components/studio/permission-search-results";
import { searchPermissions } from "@/lib/luckperms";
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
  draggingPermissionFrom: string | null;
  draggingCatalogPermission: boolean;
  onDropPermission: (groupName: string) => void;
  onDropCatalogPermission: (groupName: string) => void;
  onPrepareGroupTransfer: (groupName: string, nodeIndex: number) => void;
  onStartGroupDrag: (groupName: string, nodeIndex: number) => void;
  onEndGroupDrag: () => void;
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
  draggingPermissionFrom,
  draggingCatalogPermission,
  onDropPermission,
  onDropCatalogPermission,
  onPrepareGroupTransfer,
  onStartGroupDrag,
  onEndGroupDrag,
}: BackupRailProps) {
  const [permissionSearch, setPermissionSearch] = useState("");
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const searchResults = backup
    ? searchPermissions(backup, permissionSearch)
    : [];
  const matchingGroupIds = new Set(
    searchResults
      .filter((result) => result.subject === "group")
      .map((result) => result.id),
  );
  const matchingUserIds = new Set(
    searchResults
      .filter((result) => result.subject === "user")
      .map((result) => result.id),
  );
  const filteredGroups = backup
    ? Object.entries(backup.groups).filter(
        ([name]) => !permissionSearch.trim() || matchingGroupIds.has(name),
      )
    : [];
  const filteredUsers = backup
    ? Object.entries(backup.users ?? {}).filter(
        ([userId]) => !permissionSearch.trim() || matchingUserIds.has(userId),
      )
    : [];
  const matchCount = searchResults.reduce(
    (count, result) => count + result.matches.length,
    0,
  );

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
          <div className="permission-search">
            <label htmlFor="backup-permission-search">
              <Search size={13} aria-hidden="true" /> Buscar permiso
            </label>
            <div>
              <input
                id="backup-permission-search"
                type="search"
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                placeholder="ej. essentials.fly"
                aria-describedby={
                  permissionSearch.trim()
                    ? "permission-search-summary"
                    : undefined
                }
              />
              {permissionSearch && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda de permisos"
                  onClick={() => setPermissionSearch("")}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>
            {permissionSearch.trim() && (
              <output id="permission-search-summary">
                {matchCount
                  ? `${matchCount} coincidencias en ${matchingGroupIds.size} grupos y ${matchingUserIds.size} usuarios.`
                  : "No hay permisos directos que coincidan."}
              </output>
            )}
            {permissionSearch.trim() && searchResults.length > 0 && (
              <PermissionSearchResults
                results={searchResults}
                onSelectGroup={onSelectGroup}
                onSelectUser={onSelectUser}
                onPrepareGroupTransfer={onPrepareGroupTransfer}
                onStartGroupDrag={onStartGroupDrag}
                onEndGroupDrag={onEndGroupDrag}
              />
            )}
          </div>
          <div className="group-list">
            {filteredGroups.map(([name, group]) => (
              <button
                type="button"
                key={name}
                className={`group-row ${name === selectedGroup ? "is-active" : ""} ${name === dropTarget ? "is-drop-target" : ""}`}
                onClick={() => onSelectGroup(name)}
                onDragOver={(event) => {
                  if (
                    !draggingCatalogPermission &&
                    (!draggingPermissionFrom || draggingPermissionFrom === name)
                  )
                    return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                  setDropTarget(name);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropTarget(null);
                  if (draggingCatalogPermission) {
                    onDropCatalogPermission(name);
                  } else if (
                    draggingPermissionFrom &&
                    draggingPermissionFrom !== name
                  ) {
                    onDropPermission(name);
                  }
                }}
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
          {permissionSearch.trim() && !filteredGroups.length && (
            <p className="permission-search-empty">Ningún grupo coincide.</p>
          )}
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
          {filteredUsers.length ? (
            <div className="group-list user-list">
              {filteredUsers.map(([userId, user]) => (
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
            <p className="user-empty">
              {permissionSearch.trim()
                ? "Ningún usuario coincide."
                : "No hay usuarios en este backup."}
            </p>
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

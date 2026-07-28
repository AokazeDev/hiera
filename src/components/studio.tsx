"use client";

import gsap from "gsap";
import { BookOpen, FilePenLine, FileUp, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BackupRail } from "@/components/studio/backup-rail";
import { CatalogPanel } from "@/components/studio/catalog-panel";
import { ExportPreview } from "@/components/studio/export-preview";
import { GroupComparison } from "@/components/studio/group-comparison";
import { GroupPermissionEditor } from "@/components/studio/group-permission-editor";
import { ResolutionPanel } from "@/components/studio/resolution-panel";
import { UserMembershipEditor } from "@/components/studio/user-membership-editor";
import type { PermissionTransferMode } from "@/lib/luckperms";
import {
  addGroupInheritance,
  addUserMembership,
  applyPermissionBatch,
  createGroup,
  deleteGroup,
  emptyBackupHistory,
  previewPermissionBatch,
  recordBackupChange,
  redoBackupChange,
  removeDirectPermission,
  removeGroupInheritance,
  removeUserDirectPermission,
  removeUserMembership,
  renameGroup,
  setDirectPermissionValue,
  setUserDirectPermissionValue,
  setUserPrimaryGroup,
  transferGroupPermission,
  undoBackupChange,
  upsertGlobalPermission,
  upsertUserGlobalPermission,
} from "@/lib/luckperms";
import { authMeReloaded, type LuckPermsBackup } from "@/lib/permissions";

export function Studio() {
  const root = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<LuckPermsBackup | null>(null);
  const [originalBackup, setOriginalBackup] = useState<LuckPermsBackup | null>(
    null,
  );
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [history, setHistory] = useState(emptyBackupHistory);
  const [workspace, setWorkspace] = useState<
    "editor" | "catalog" | "comparison"
  >("editor");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!root.current || !media.matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-studio-intro]", {
        opacity: 0,
        y: 18,
        duration: 0.55,
        ease: "power3.out",
      });
      gsap.from("[data-studio-pane]", {
        opacity: 0,
        y: 22,
        duration: 0.65,
        delay: 0.12,
        ease: "power3.out",
      });
    }, root);
    return () => context.revert();
  }, []);

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as LuckPermsBackup;
        if (!parsed.groups || typeof parsed.groups !== "object")
          throw new Error("No contiene grupos de LuckPerms.");
        setBackup(parsed);
        setOriginalBackup(parsed);
        setSelectedGroup(Object.keys(parsed.groups)[0] ?? null);
        setSelectedUser(null);
        setHistory(emptyBackupHistory);
      } catch (error) {
        window.alert(
          `No se pudo leer el backup: ${error instanceof Error ? error.message : "JSON invalido"}`,
        );
      }
    };
    reader.readAsText(file);
  }

  function updateBackup(next: LuckPermsBackup, label: string) {
    if (!backup || next === backup) return;
    setHistory((current) => recordBackupChange(current, backup, label));
    setBackup(next);
  }

  function applyPermissions(nodes: string[], groupNames: string[]) {
    if (!backup) return;
    const preview = previewPermissionBatch(backup, groupNames, nodes);
    if (preview.additionCount === 0) return;
    updateBackup(
      applyPermissionBatch(backup, groupNames, nodes),
      `Aplicar ${preview.additionCount} permisos de AuthMe Reloaded a ${preview.targets.length} grupos`,
    );
  }

  function addPermission(key: string, value: boolean) {
    if (!backup || !selectedGroup) return;
    updateBackup(
      upsertGlobalPermission(backup, selectedGroup, key, value),
      `${value ? "Conceder" : "Denegar"} ${key} en ${selectedGroup}`,
    );
  }

  function setPermissionValue(nodeIndex: number, value: boolean) {
    if (!backup || !selectedGroup) return;
    updateBackup(
      setDirectPermissionValue(backup, selectedGroup, nodeIndex, value),
      `${value ? "Conceder" : "Denegar"} permiso en ${selectedGroup}`,
    );
  }

  function removePermission(nodeIndex: number) {
    if (!backup || !selectedGroup) return;
    updateBackup(
      removeDirectPermission(backup, selectedGroup, nodeIndex),
      `Eliminar permiso de ${selectedGroup}`,
    );
  }

  function transferPermission(
    nodeIndex: number,
    targetGroup: string,
    mode: PermissionTransferMode,
  ) {
    if (!backup || !selectedGroup) return;
    const node = backup.groups[selectedGroup]?.nodes[nodeIndex];
    if (!node || node.type !== "permission") return;
    updateBackup(
      transferGroupPermission(
        backup,
        selectedGroup,
        nodeIndex,
        targetGroup,
        mode,
      ),
      `${mode === "copy" ? "Copiar" : "Mover"} ${node.key} de ${selectedGroup} a ${targetGroup}`,
    );
  }

  function addInheritance(parentName: string) {
    if (!backup || !selectedGroup) return;
    updateBackup(
      addGroupInheritance(backup, selectedGroup, parentName),
      `Heredar ${parentName} en ${selectedGroup}`,
    );
  }

  function removeInheritance(nodeIndex: number) {
    if (!backup || !selectedGroup) return;
    updateBackup(
      removeGroupInheritance(backup, selectedGroup, nodeIndex),
      `Quitar herencia de ${selectedGroup}`,
    );
  }

  function addMembership(groupName: string) {
    if (!backup || !selectedUser) return;
    updateBackup(
      addUserMembership(backup, selectedUser, groupName),
      `Añadir usuario a ${groupName}`,
    );
  }

  function removeMembership(nodeIndex: number) {
    if (!backup || !selectedUser) return;
    updateBackup(
      removeUserMembership(backup, selectedUser, nodeIndex),
      "Quitar membresía de usuario",
    );
  }

  function changePrimaryGroup(groupName: string | null) {
    if (!backup || !selectedUser) return;
    updateBackup(
      setUserPrimaryGroup(backup, selectedUser, groupName),
      groupName
        ? `Cambiar grupo primario a ${groupName}`
        : "Limpiar grupo primario de usuario",
    );
  }

  function addUserPermission(key: string, value: boolean) {
    if (!backup || !selectedUser) return;
    updateBackup(
      upsertUserGlobalPermission(backup, selectedUser, key, value),
      `${value ? "Conceder" : "Denegar"} ${key} a usuario`,
    );
  }

  function setUserPermissionValue(nodeIndex: number, value: boolean) {
    if (!backup || !selectedUser) return;
    updateBackup(
      setUserDirectPermissionValue(backup, selectedUser, nodeIndex, value),
      `${value ? "Conceder" : "Denegar"} permiso de usuario`,
    );
  }

  function removeUserPermission(nodeIndex: number) {
    if (!backup || !selectedUser) return;
    updateBackup(
      removeUserDirectPermission(backup, selectedUser, nodeIndex),
      "Eliminar permiso de usuario",
    );
  }

  function createNewGroup(groupName: string) {
    if (!backup) return;
    updateBackup(createGroup(backup, groupName), `Crear grupo ${groupName}`);
    setSelectedGroup(groupName);
    setSelectedUser(null);
  }

  function renameSelectedGroup(groupName: string) {
    if (!backup || !selectedGroup) return;
    updateBackup(
      renameGroup(backup, selectedGroup, groupName),
      `Renombrar ${selectedGroup} a ${groupName}`,
    );
    setSelectedGroup(groupName);
    setSelectedUser(null);
  }

  function deleteSelectedGroup() {
    if (!backup || !selectedGroup) return;
    const remainingGroups = Object.keys(backup.groups).filter(
      (name) => name !== selectedGroup,
    );
    updateBackup(
      deleteGroup(backup, selectedGroup),
      `Eliminar grupo ${selectedGroup}`,
    );
    setSelectedGroup(remainingGroups[0] ?? null);
    setSelectedUser(null);
  }

  function exportBackup() {
    if (!backup) return;
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hiera-luckperms-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function undo() {
    if (!backup) return;
    const result = undoBackupChange(history, backup);
    if (!result) return;
    setBackup(result.backup);
    setHistory(result.history);
  }

  function redo() {
    if (!backup) return;
    const result = redoBackupChange(history, backup);
    if (!result) return;
    setBackup(result.backup);
    setHistory(result.history);
  }

  return (
    <main ref={root} className="studio-shell">
      <header className="studio-header">
        <Link href="/" className="wordmark">
          HIERA<span>.</span>
        </Link>
        <p>Estudio local de permisos</p>
        <div>
          <button
            type="button"
            className="text-button"
            onClick={() => input.current?.click()}
          >
            <FileUp size={15} /> Importar backup
          </button>
          <nav className="workspace-switch" aria-label="Vista principal">
            <button
              type="button"
              className={workspace === "editor" ? "is-active" : ""}
              aria-pressed={workspace === "editor"}
              onClick={() => setWorkspace("editor")}
            >
              <FilePenLine size={15} /> Editor
            </button>
            <button
              type="button"
              className={workspace === "catalog" ? "is-active" : ""}
              aria-pressed={workspace === "catalog"}
              onClick={() => setWorkspace("catalog")}
            >
              <BookOpen size={15} /> Catálogo
            </button>
            <button
              type="button"
              className={workspace === "comparison" ? "is-active" : ""}
              aria-pressed={workspace === "comparison"}
              onClick={() => setWorkspace("comparison")}
            >
              <GitCompareArrows size={15} /> Comparar
            </button>
          </nav>
          {backup && originalBackup && (
            <ExportPreview
              original={originalBackup}
              backup={backup}
              onExport={exportBackup}
            />
          )}
        </div>
        <input
          ref={input}
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={(event) =>
            event.target.files?.[0] && importBackup(event.target.files[0])
          }
        />
      </header>
      <section className="studio-intro" data-studio-intro>
        <p className="eyebrow">ESTUDIO</p>
        <h1>El permiso correcto, en el lugar correcto.</h1>
        <p>
          Importa un export de LuckPerms o explora un catálogo verificado. Las
          modificaciones quedan en esta sesión hasta que exportes el JSON.
        </p>
      </section>
      <section className="studio-grid" data-studio-pane>
        <BackupRail
          backup={backup}
          selectedGroup={selectedGroup}
          selectedUser={selectedUser}
          onSelectGroup={(groupName) => {
            setSelectedGroup(groupName);
            setSelectedUser(null);
          }}
          onSelectUser={(userId) => {
            setSelectedUser(userId);
            setSelectedGroup(null);
          }}
          onImport={() => input.current?.click()}
          onCreateGroup={createNewGroup}
          onRenameGroup={renameSelectedGroup}
          onDeleteGroup={deleteSelectedGroup}
        />
        {workspace === "comparison" ? (
          <GroupComparison backup={backup} initialGroup={selectedGroup} />
        ) : workspace === "editor" && selectedUser ? (
          <UserMembershipEditor
            backup={backup}
            userId={selectedUser}
            onAddMembership={addMembership}
            onRemoveMembership={removeMembership}
            onSetPrimaryGroup={changePrimaryGroup}
            onAddPermission={addUserPermission}
            onSetPermissionValue={setUserPermissionValue}
            onRemovePermission={removeUserPermission}
          />
        ) : workspace === "editor" ? (
          <GroupPermissionEditor
            backup={backup}
            groupName={selectedGroup}
            onAdd={addPermission}
            onSetValue={setPermissionValue}
            onRemove={removePermission}
            onTransfer={transferPermission}
          />
        ) : (
          <CatalogPanel
            backup={backup}
            catalog={authMeReloaded}
            groupName={selectedGroup}
            onApply={applyPermissions}
          />
        )}
        <ResolutionPanel
          backup={backup}
          groupName={selectedGroup}
          userId={selectedUser}
          history={history}
          onUndo={undo}
          onRedo={redo}
          onSelectGroup={setSelectedGroup}
          onAddInheritance={addInheritance}
          onRemoveInheritance={removeInheritance}
        />
      </section>
    </main>
  );
}

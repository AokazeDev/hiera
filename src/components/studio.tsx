"use client";

import gsap from "gsap";
import { BookOpen, FileUp } from "lucide-react";
import Link from "next/link";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { CatalogPanel } from "@/components/studio/catalog-panel";
import { ExportPreview } from "@/components/studio/export-preview";
import { PermissionCanvas } from "@/components/studio/permission-canvas";
import { PermissionTransferPanel } from "@/components/studio/permission-transfer-panel";
import { ResolutionPanel } from "@/components/studio/resolution-panel";
import { StudioFeedback } from "@/components/studio/studio-feedback";
import type {
  PermissionBatchDecision,
  PermissionContext,
  PermissionTransferMode,
} from "@/lib/luckperms";
import {
  addGroupInheritance,
  addUserMembership,
  applyPermissionBatch,
  createGroup,
  deleteGroup,
  emptyBackupHistory,
  parseLuckPermsBackup,
  recordBackupChange,
  redoBackupChange,
  removeDirectPermission,
  removeGroupInheritance,
  removeUserDirectPermission,
  removeUserMembership,
  renameGroup,
  serializeLuckPermsBackup,
  setDirectPermissionContext,
  setDirectPermissionValue,
  setUserDirectPermissionContext,
  setUserDirectPermissionValue,
  setUserPrimaryGroup,
  transferGroupPermission,
  undoBackupChange,
  upsertGlobalPermission,
  upsertUserGlobalPermission,
  validateGroupInheritance,
  validateUserMembership,
} from "@/lib/luckperms";
import { catalogs, type LuckPermsBackup } from "@/lib/permissions";

type PendingPermissionTransfer = {
  sourceGroup: string;
  nodeIndex: number;
  targetGroup: string | null;
};

type StudioFeedbackMessage = { id: number; message: string };

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
  const [pendingTransfer, setPendingTransfer] =
    useState<PendingPermissionTransfer | null>(null);
  const [activeContext, setActiveContext] = useState<PermissionContext>({});
  const [workspace, setWorkspace] = useState<"editor" | "catalog">("editor");
  const [feedback, setFeedback] = useState<StudioFeedbackMessage | null>(null);
  const [importIssues, setImportIssues] = useState<string[]>([]);

  useEffect(() => {
    if (
      !root.current ||
      !window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    )
      return;
    const context = gsap.context(() => {
      gsap.from("[data-studio-pane]", {
        opacity: 0,
        y: 16,
        duration: 0.45,
        ease: "power3.out",
      });
    }, root);
    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function announce(message: string) {
    setFeedback((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseLuckPermsBackup(String(reader.result));
      if (!result.backup) {
        setImportIssues(
          result.issues.map(
            (issue) =>
              `${issue.path}: ${issue.message}${issue.line ? ` Línea ${issue.line}, columna ${issue.column}.` : ""}`,
          ),
        );
        return;
      }
      const parsed = result.backup;
      setImportIssues([]);
      setBackup(parsed);
      setOriginalBackup(parsed);
      setSelectedGroup(Object.keys(parsed.groups)[0] ?? null);
      setSelectedUser(null);
      setHistory(emptyBackupHistory);
      setPendingTransfer(null);
      setActiveContext({});
      setWorkspace("editor");
      announce(`Backup ${file.name} importado solo en esta sesión.`);
    };
    reader.onerror = () =>
      setImportIssues(["No se pudo leer el archivo seleccionado."]);
    reader.readAsText(file);
  }

  function updateBackup(next: LuckPermsBackup, label: string) {
    if (!backup || next === backup) return;
    setHistory((current) => recordBackupChange(current, backup, label));
    setBackup(next);
    announce(`${label}. Cambio aplicado.`);
  }

  function selectGroup(groupName: string) {
    setSelectedGroup(groupName);
    setSelectedUser(null);
  }

  function selectUser(userId: string) {
    setSelectedUser(userId);
    setSelectedGroup(null);
  }

  function addPermission(groupName: string, key: string) {
    if (!backup) return;
    updateBackup(
      upsertGlobalPermission(backup, groupName, key, true),
      `Conceder ${key} en ${groupName}`,
    );
  }

  function setPermissionValue(
    groupName: string,
    nodeIndex: number,
    value: boolean,
  ) {
    if (!backup) return;
    updateBackup(
      setDirectPermissionValue(backup, groupName, nodeIndex, value),
      `${value ? "Conceder" : "Denegar"} permiso en ${groupName}`,
    );
  }

  function removePermission(groupName: string, nodeIndex: number) {
    if (!backup) return;
    updateBackup(
      removeDirectPermission(backup, groupName, nodeIndex),
      `Eliminar permiso de ${groupName}`,
    );
  }

  function setPermissionContext(
    groupName: string,
    nodeIndex: number,
    context: PermissionContext,
  ) {
    if (!backup) return;
    updateBackup(
      setDirectPermissionContext(backup, groupName, nodeIndex, context),
      `Actualizar contexto de permiso en ${groupName}`,
    );
  }

  function addInheritance(groupName: string, parentName: string) {
    if (!backup) return;
    const error = validateGroupInheritance(backup, groupName, parentName);
    if (error) {
      announce(error);
      return;
    }
    updateBackup(
      addGroupInheritance(backup, groupName, parentName),
      `${groupName} hereda de ${parentName}`,
    );
  }

  function removeInheritance(groupName: string, parentName: string) {
    if (!backup) return;
    const nodeIndex = backup.groups[groupName]?.nodes.findIndex(
      (node) =>
        node.type === "inheritance" &&
        node.value &&
        node.key === `group.${parentName}`,
    );
    if (nodeIndex === undefined || nodeIndex < 0) return;
    updateBackup(
      removeGroupInheritance(backup, groupName, nodeIndex),
      `Quitar herencia de ${parentName} en ${groupName}`,
    );
  }

  function addMembership(userId: string, groupName: string) {
    if (!backup) return;
    const error = validateUserMembership(backup, userId, groupName);
    if (error) {
      announce(error);
      return;
    }
    updateBackup(
      addUserMembership(backup, userId, groupName),
      `Añadir usuario a ${groupName}`,
    );
  }

  function removeMembership(userId: string, groupName: string) {
    if (!backup) return;
    const nodeIndex = backup.users?.[userId]?.nodes.findIndex(
      (node) =>
        node.type === "inheritance" &&
        node.value &&
        node.key === `group.${groupName}`,
    );
    if (nodeIndex === undefined || nodeIndex < 0) return;
    updateBackup(
      removeUserMembership(backup, userId, nodeIndex),
      `Quitar usuario de ${groupName}`,
    );
  }

  function changeUserPrimaryGroup(userId: string, groupName: string | null) {
    if (!backup) return;
    updateBackup(
      setUserPrimaryGroup(backup, userId, groupName),
      groupName
        ? `Cambiar grupo primario a ${groupName}`
        : "Limpiar grupo primario",
    );
  }

  function addUserPermission(userId: string, key: string) {
    if (!backup) return;
    updateBackup(
      upsertUserGlobalPermission(backup, userId, key, true),
      `Conceder ${key} al usuario`,
    );
  }

  function setUserPermissionValue(
    userId: string,
    nodeIndex: number,
    value: boolean,
  ) {
    if (!backup) return;
    updateBackup(
      setUserDirectPermissionValue(backup, userId, nodeIndex, value),
      `${value ? "Conceder" : "Denegar"} permiso de usuario`,
    );
  }

  function removeUserPermission(userId: string, nodeIndex: number) {
    if (!backup) return;
    updateBackup(
      removeUserDirectPermission(backup, userId, nodeIndex),
      "Eliminar permiso de usuario",
    );
  }

  function setUserPermissionContext(
    userId: string,
    nodeIndex: number,
    context: PermissionContext,
  ) {
    if (!backup) return;
    updateBackup(
      setUserDirectPermissionContext(backup, userId, nodeIndex, context),
      "Actualizar contexto de permiso de usuario",
    );
  }

  function createNewGroup(groupName: string) {
    if (!backup) return;
    const next = createGroup(backup, groupName);
    if (next === backup) {
      announce(
        "No se pudo crear el grupo. Revisa que el nombre sea único y válido.",
      );
      return;
    }
    updateBackup(next, `Crear grupo ${groupName}`);
    setSelectedGroup(groupName);
  }

  function renameCanvasGroup(groupName: string, nextName: string) {
    if (!backup) return;
    const next = renameGroup(backup, groupName, nextName);
    if (next === backup) {
      announce("No se pudo renombrar el grupo. Revisa el nombre elegido.");
      return;
    }
    updateBackup(next, `Renombrar ${groupName} a ${nextName}`);
    if (selectedGroup === groupName) setSelectedGroup(nextName);
  }

  function deleteCanvasGroup(groupName: string) {
    if (!backup) return;
    const next = deleteGroup(backup, groupName);
    if (next === backup) {
      announce("No se puede eliminar un grupo que todavía tiene referencias.");
      return;
    }
    updateBackup(next, `Eliminar grupo ${groupName}`);
    if (selectedGroup === groupName)
      setSelectedGroup(Object.keys(next.groups)[0] ?? null);
  }

  function preparePermissionTransfer(sourceGroup: string, nodeIndex: number) {
    setSelectedGroup(sourceGroup);
    setPendingTransfer({ sourceGroup, nodeIndex, targetGroup: null });
  }

  function transferPermission(
    targetGroup: string,
    mode: PermissionTransferMode,
  ) {
    if (!backup || !pendingTransfer) return;
    const node =
      backup.groups[pendingTransfer.sourceGroup]?.nodes[
        pendingTransfer.nodeIndex
      ];
    if (!node || node.type !== "permission") return;
    updateBackup(
      transferGroupPermission(
        backup,
        pendingTransfer.sourceGroup,
        pendingTransfer.nodeIndex,
        targetGroup,
        mode,
      ),
      `${mode === "copy" ? "Copiar" : mode === "move" ? "Mover" : mode === "grant" ? "Conceder" : mode === "deny" ? "Denegar" : "Eliminar"} ${node.key}`,
    );
    setPendingTransfer(null);
  }

  function applyCatalogPermissions(
    nodes: string[],
    groupNames: string[],
    decision: PermissionBatchDecision,
  ) {
    if (!backup) return;
    const next = applyPermissionBatch(backup, groupNames, nodes, decision);
    if (next === backup) return;
    updateBackup(
      next,
      `Conceder ${nodes.length} permisos documentados en ${groupNames.join(", ")}`,
    );
  }

  function exportBackup(stableFormat: boolean) {
    if (!backup) return;
    const blob = new Blob([serializeLuckPermsBackup(backup, stableFormat)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "hiera-luckperms-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
    announce(
      `Descarga de hiera-luckperms-backup.json${stableFormat ? " con orden estable" : ""} iniciada.`,
    );
  }

  function undo() {
    if (!backup) return;
    const result = undoBackupChange(history, backup);
    if (!result) return;
    setBackup(result.backup);
    setHistory(result.history);
    announce(`Deshecho: ${history.past.at(-1)?.label ?? "último cambio"}.`);
  }

  function redo() {
    if (!backup) return;
    const result = redoBackupChange(history, backup);
    if (!result) return;
    setBackup(result.backup);
    setHistory(result.history);
    announce(`Rehecho: ${history.future[0]?.label ?? "último cambio"}.`);
  }

  return (
    <main ref={root} className="studio-shell">
      <header className="studio-header">
        <Link href="/" className="wordmark" transitionTypes={["hiera-back"]}>
          HIERA<span>.</span>
        </Link>
        <p>Editor local de LuckPerms</p>
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
              className={workspace === "catalog" ? "is-active" : ""}
              aria-pressed={workspace === "catalog"}
              onClick={() =>
                startTransition(() =>
                  setWorkspace((current) =>
                    current === "catalog" ? "editor" : "catalog",
                  ),
                )
              }
            >
              <BookOpen size={15} /> Catálogo
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
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) importBackup(file);
          }}
          aria-label="Seleccionar un backup JSON de LuckPerms"
        />
      </header>
      {feedback && (
        <StudioFeedback id={feedback.id} message={feedback.message} />
      )}
      {importIssues.length > 0 && (
        <div
          className="import-validation-error studio-import-error"
          role="alert"
        >
          <strong>No se pudo importar el backup.</strong>
          <ul>
            {importIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      <section className="studio-grid" data-studio-pane>
        <ViewTransition update="workspace-swap" default="none">
          {workspace === "catalog" ? (
            <CatalogPanel
              backup={backup}
              catalogs={catalogs}
              selectedGroup={selectedGroup}
              onApply={applyCatalogPermissions}
            />
          ) : (
            <div className="studio-canvas-column">
              <PermissionCanvas
                backup={backup}
                selectedGroup={selectedGroup}
                selectedUser={selectedUser}
                onSelectGroup={selectGroup}
                onSelectUser={selectUser}
                onCreateGroup={createNewGroup}
                onRenameGroup={renameCanvasGroup}
                onDeleteGroup={deleteCanvasGroup}
                onAddPermission={addPermission}
                onSetPermissionValue={setPermissionValue}
                onRemovePermission={removePermission}
                onSetPermissionContext={setPermissionContext}
                onAddInheritance={addInheritance}
                onRemoveInheritance={removeInheritance}
                onAddUserMembership={addMembership}
                onRemoveUserMembership={removeMembership}
                onSetUserPrimaryGroup={changeUserPrimaryGroup}
                onAddUserPermission={addUserPermission}
                onSetUserPermissionValue={setUserPermissionValue}
                onRemoveUserPermission={removeUserPermission}
                onSetUserPermissionContext={setUserPermissionContext}
                onPrepareTransfer={preparePermissionTransfer}
                onRequestImport={() => input.current?.click()}
              />
              {backup && pendingTransfer && (
                <PermissionTransferPanel
                  backup={backup}
                  sourceGroup={pendingTransfer.sourceGroup}
                  sourceNodeIndex={pendingTransfer.nodeIndex}
                  initialTargetGroup={pendingTransfer.targetGroup}
                  onTransfer={transferPermission}
                  onClose={() => setPendingTransfer(null)}
                />
              )}
            </div>
          )}
        </ViewTransition>
        <ResolutionPanel
          backup={backup}
          groupName={selectedGroup}
          userId={selectedUser}
          history={history}
          onUndo={undo}
          onRedo={redo}
          onPreparePermissionTransfer={preparePermissionTransfer}
          activeContext={activeContext}
          onActiveContextChange={setActiveContext}
          onInspectPermissionOrigin={(permission) => {
            setSelectedGroup(permission.origin);
            setSelectedUser(null);
            announce(`Origen de ${permission.key}: ${permission.origin}.`);
          }}
          onStartPermissionDrag={() => undefined}
          onEndPermissionDrag={() => undefined}
        />
      </section>
    </main>
  );
}

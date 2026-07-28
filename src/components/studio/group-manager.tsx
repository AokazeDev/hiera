"use client";

import { FolderPlus, Pencil, Trash2, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getGroupReferences,
  validateGroupDeletion,
  validateNewGroupName,
} from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type GroupManagerProps = {
  backup: LuckPermsBackup;
  groupName: string | null;
  onCreate: (groupName: string) => void;
  onRename: (groupName: string) => void;
  onDelete: () => void;
};

type Action = "create" | "rename" | "delete" | null;

export function GroupManager({
  backup,
  groupName,
  onCreate,
  onRename,
  onDelete,
}: GroupManagerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [action, setAction] = useState<Action>(null);
  const [name, setName] = useState("");
  const references = groupName ? getGroupReferences(backup, groupName) : [];
  const deletionError = groupName
    ? validateGroupDeletion(backup, groupName)
    : "Selecciona un grupo para eliminarlo.";
  const nameError =
    action === "create" || action === "rename"
      ? validateNewGroupName(backup, name)
      : null;
  const renameError =
    action === "rename" && name.trim() === groupName
      ? "Escribe un nombre diferente."
      : nameError;

  useEffect(() => {
    if (action) dialog.current?.showModal();
  }, [action]);

  function closeDialog() {
    setAction(null);
    setName("");
  }

  function openDialog(nextAction: Exclude<Action, null>) {
    setName(nextAction === "rename" ? (groupName ?? "") : "");
    setAction(nextAction);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action === "create" && !nameError) onCreate(name.trim());
    if (action === "rename" && !renameError) onRename(name.trim());
    if (action === "delete" && !deletionError) onDelete();
    closeDialog();
  }

  return (
    <section className="group-manager" aria-label="Gestionar grupos">
      <button type="button" onClick={() => openDialog("create")}>
        <FolderPlus size={14} aria-hidden="true" /> Nuevo grupo
      </button>
      <button
        type="button"
        disabled={!groupName}
        onClick={() => openDialog("rename")}
      >
        <Pencil size={13} aria-hidden="true" /> Renombrar
      </button>
      <button
        type="button"
        className="group-delete-trigger"
        disabled={!groupName}
        onClick={() => openDialog("delete")}
      >
        <Trash2 size={13} aria-hidden="true" /> Eliminar
      </button>
      <dialog ref={dialog} className="group-dialog" onClose={closeDialog}>
        <form method="dialog" onSubmit={submit}>
          <header>
            <div>
              <p className="eyebrow">GRUPOS</p>
              <h2>
                {action === "create"
                  ? "Crear grupo"
                  : action === "rename"
                    ? "Renombrar grupo"
                    : "Eliminar grupo"}
              </h2>
            </div>
            <button type="button" aria-label="Cerrar" onClick={closeDialog}>
              <X size={17} aria-hidden="true" />
            </button>
          </header>
          {action === "delete" ? (
            <div className="group-delete-confirmation">
              <p>
                El grupo <code>{groupName}</code> y todos sus nodos se
                eliminarán de esta copia local.
              </p>
              {references.length > 0 && (
                <div className="group-reference-warning" role="alert">
                  <TriangleAlert size={16} aria-hidden="true" />
                  <p>{deletionError}</p>
                  <ul>
                    {references.map((reference) => (
                      <li key={`${reference.kind}-${reference.source}`}>
                        {reference.kind === "inheritance"
                          ? `${reference.source} hereda de este grupo.`
                          : `${reference.source} lo usa como grupo primario.`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="confirmation-label">
                <strong>Confirmación</strong>
                <span>
                  Esta acción no se puede deshacer desde este diálogo.
                </span>
              </div>
            </div>
          ) : (
            <label className="group-name-field" htmlFor="group-name">
              Nombre del grupo
              <input
                id="group-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-describedby={renameError ? "group-name-error" : undefined}
                aria-invalid={Boolean(renameError)}
                autoFocus
              />
              {renameError && (
                <span id="group-name-error" className="form-error" role="alert">
                  {renameError}
                </span>
              )}
            </label>
          )}
          <footer>
            <button type="button" className="line-button" onClick={closeDialog}>
              Cancelar
            </button>
            <button
              type="submit"
              className={
                action === "delete" ? "danger-action" : "primary-action"
              }
              disabled={Boolean(
                action === "create"
                  ? nameError
                  : action === "rename"
                    ? renameError
                    : deletionError,
              )}
            >
              {action === "create"
                ? "Crear grupo"
                : action === "rename"
                  ? "Guardar nombre"
                  : "Eliminar grupo"}
            </button>
          </footer>
        </form>
      </dialog>
    </section>
  );
}

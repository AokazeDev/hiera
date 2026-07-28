"use client";

import { Plus, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { getUserMemberships, validateUserMembership } from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type UserMembershipEditorProps = {
  backup: LuckPermsBackup | null;
  userId: string | null;
  onAddMembership: (groupName: string) => void;
  onRemoveMembership: (nodeIndex: number) => void;
  onSetPrimaryGroup: (groupName: string | null) => void;
};

export function UserMembershipEditor({
  backup,
  userId,
  onAddMembership,
  onRemoveMembership,
  onSetPrimaryGroup,
}: UserMembershipEditorProps) {
  const [groupName, setGroupName] = useState("");
  const user = backup && userId ? backup.users?.[userId] : null;
  const memberships = user
    ? user.nodes.flatMap((node, index) =>
        node.type === "inheritance" && node.value ? [{ node, index }] : [],
      )
    : [];
  const membershipError =
    backup && userId && groupName
      ? validateUserMembership(backup, userId, groupName)
      : null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (membershipError || !groupName) return;
    onAddMembership(groupName);
    setGroupName("");
  }

  if (!backup || !user || !userId) {
    return (
      <section className="workspace" aria-labelledby="user-editor-title">
        <div className="resolution-empty">
          <p id="user-editor-title">
            Selecciona un usuario del backup para editar sus grupos.
          </p>
        </div>
      </section>
    );
  }

  const displayName = user.username ?? userId;
  const knownMemberships = getUserMemberships(user);

  return (
    <section className="workspace" aria-labelledby="user-editor-title">
      <div className="workspace-title">
        <div>
          <p className="eyebrow">EDITOR / USUARIO</p>
          <h2 id="user-editor-title">{displayName}</h2>
        </div>
        <p className="editor-summary">{userId}</p>
      </div>
      <p className="editor-intro">
        Las membresías son nodos de herencia del usuario. El grupo primario se
        guarda por separado y ambos cambios permanecen solo en esta sesión.
      </p>
      <section
        className="user-primary-group"
        aria-labelledby="primary-group-title"
      >
        <div>
          <p className="inheritance-label" id="primary-group-title">
            GRUPO PRIMARIO
          </p>
          <p>Se usa como referencia principal del usuario en LuckPerms.</p>
        </div>
        <label>
          <span className="sr-only">Grupo primario de {displayName}</span>
          <select
            value={user.primaryGroup ?? ""}
            onChange={(event) => onSetPrimaryGroup(event.target.value || null)}
          >
            <option value="">Sin grupo primario</option>
            {Object.keys(backup.groups).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="user-memberships" aria-labelledby="memberships-title">
        <div className="membership-heading">
          <div>
            <p className="inheritance-label" id="memberships-title">
              MEMBRESÍAS
            </p>
            <p>{memberships.length} grupos asignados mediante nodos.</p>
          </div>
        </div>
        {memberships.length ? (
          <ul className="membership-list">
            {memberships.map(({ node, index }) => {
              const name = node.key.replace(/^group\./, "");
              const exists = Boolean(backup.groups[name]);
              return (
                <li key={`${index}-${node.key}`}>
                  <span className="group-mark" aria-hidden="true" />
                  <div>
                    <strong>{name}</strong>
                    {!exists && (
                      <small>El grupo ya no existe en el backup.</small>
                    )}
                  </div>
                  <button
                    type="button"
                    className="remove-membership"
                    aria-label={`Quitar a ${displayName} del grupo ${name}`}
                    onClick={() => onRemoveMembership(index)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="inheritance-empty">
            Este usuario no tiene membresías directas.
          </p>
        )}
        <form className="membership-form" onSubmit={submit}>
          <label htmlFor="user-membership-group">Añadir a un grupo</label>
          <div>
            <select
              id="user-membership-group"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              aria-describedby={
                membershipError ? "membership-error" : undefined
              }
              aria-invalid={Boolean(membershipError)}
            >
              <option value="">Selecciona un grupo</option>
              {Object.keys(backup.groups)
                .filter((name) => !knownMemberships.includes(name))
                .map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="primary-action"
              disabled={!groupName || Boolean(membershipError)}
            >
              <Plus size={14} aria-hidden="true" /> Añadir
            </button>
          </div>
          {membershipError && (
            <p id="membership-error" className="form-error" role="alert">
              {membershipError}
            </p>
          )}
        </form>
      </section>
      <p className="user-direct-node-note">
        <UserRound size={14} aria-hidden="true" /> La edición de permisos
        directos de usuario llegará en el siguiente bloque del editor.
      </p>
    </section>
  );
}

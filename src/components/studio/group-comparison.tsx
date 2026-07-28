"use client";

import { ArrowLeftRight, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import {
  compareGroups,
  type PermissionDifference,
  type ResolvedPermission,
} from "@/lib/luckperms";
import type { LuckPermsBackup, LuckPermsNode } from "@/lib/permissions";

type GroupComparisonProps = {
  backup: LuckPermsBackup | null;
  initialGroup: string | null;
};

function getPermissionOrigin(node: LuckPermsNode) {
  const resolved = node as ResolvedPermission;
  return resolved.inherited ? resolved.origin : "directo";
}

function DifferenceList<T extends LuckPermsNode>({
  differences,
  leftGroup,
  rightGroup,
  effective,
}: {
  differences: PermissionDifference<T>[];
  leftGroup: string;
  rightGroup: string;
  effective: boolean;
}) {
  if (differences.length === 0) {
    return <p className="comparison-empty">No hay diferencias en esta capa.</p>;
  }

  return (
    <ul className="comparison-list">
      {differences.map((difference) => (
        <li key={`${difference.key}-${JSON.stringify(difference.context)}`}>
          <div>
            <code>{difference.key}</code>
            {difference.context.length > 0 && (
              <small>
                {difference.context
                  .map(([key, value]) => `${key}=${value}`)
                  .join(", ")}
              </small>
            )}
          </div>
          <div className="comparison-values">
            <span>
              <strong>{leftGroup}</strong>
              <b
                className={
                  difference.left?.value ? "value-true" : "value-false"
                }
              >
                {difference.left
                  ? difference.left.value
                    ? "Concede"
                    : "Deniega"
                  : "No definido"}
              </b>
              {effective && difference.left && (
                <small>{getPermissionOrigin(difference.left)}</small>
              )}
            </span>
            <ArrowLeftRight size={13} aria-hidden="true" />
            <span>
              <strong>{rightGroup}</strong>
              <b
                className={
                  difference.right?.value ? "value-true" : "value-false"
                }
              >
                {difference.right
                  ? difference.right.value
                    ? "Concede"
                    : "Deniega"
                  : "No definido"}
              </b>
              {effective && difference.right && (
                <small>{getPermissionOrigin(difference.right)}</small>
              )}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GroupComparison({
  backup,
  initialGroup,
}: GroupComparisonProps) {
  const groupNames = backup ? Object.keys(backup.groups) : [];
  const [leftGroup, setLeftGroup] = useState(initialGroup ?? "");
  const [rightGroup, setRightGroup] = useState("");
  const resolvedLeft = groupNames.includes(leftGroup)
    ? leftGroup
    : (initialGroup ?? groupNames[0] ?? "");
  const resolvedRight =
    groupNames.includes(rightGroup) && rightGroup !== resolvedLeft
      ? rightGroup
      : (groupNames.find((name) => name !== resolvedLeft) ?? "");
  const comparison =
    backup && resolvedLeft && resolvedRight
      ? compareGroups(backup, resolvedLeft, resolvedRight)
      : null;

  return (
    <section
      className="workspace group-comparison"
      aria-labelledby="comparison-title"
    >
      <div className="workspace-title">
        <div>
          <p className="eyebrow">COMPARACIÓN</p>
          <h2 id="comparison-title">Diferencias entre grupos</h2>
        </div>
      </div>
      {!backup ? (
        <div className="comparison-empty-state">
          <GitCompareArrows size={22} aria-hidden="true" />
          <p>
            Importa un backup para comparar grupos sin sacar sus permisos de
            esta sesión.
          </p>
        </div>
      ) : groupNames.length < 2 ? (
        <div className="comparison-empty-state">
          <GitCompareArrows size={22} aria-hidden="true" />
          <p>
            El backup necesita al menos dos grupos para iniciar una comparación.
          </p>
        </div>
      ) : (
        <>
          <p className="editor-intro">
            Los permisos directos muestran lo definido en cada grupo. Los
            efectivos incluyen herencias y conservan el grupo de procedencia.
          </p>
          <div className="comparison-selectors">
            <label>
              Grupo A
              <select
                value={resolvedLeft}
                onChange={(event) => setLeftGroup(event.target.value)}
              >
                {groupNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <ArrowLeftRight size={17} aria-hidden="true" />
            <label>
              Grupo B
              <select
                value={resolvedRight}
                onChange={(event) => setRightGroup(event.target.value)}
              >
                {groupNames
                  .filter((name) => name !== resolvedLeft)
                  .map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {comparison && (
            <div className="comparison-sections">
              <section aria-labelledby="direct-differences">
                <div className="comparison-heading">
                  <h3 id="direct-differences">Directos</h3>
                  <span>{comparison.direct.length} diferencias</span>
                </div>
                <DifferenceList
                  differences={comparison.direct}
                  leftGroup={resolvedLeft}
                  rightGroup={resolvedRight}
                  effective={false}
                />
              </section>
              <section aria-labelledby="effective-differences">
                <div className="comparison-heading">
                  <h3 id="effective-differences">Efectivos</h3>
                  <span>{comparison.effective.length} diferencias</span>
                </div>
                <DifferenceList
                  differences={comparison.effective}
                  leftGroup={resolvedLeft}
                  rightGroup={resolvedRight}
                  effective
                />
              </section>
            </div>
          )}
        </>
      )}
    </section>
  );
}

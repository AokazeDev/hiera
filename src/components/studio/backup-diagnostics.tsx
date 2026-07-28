import { CircleCheck, TriangleAlert } from "lucide-react";
import { diagnoseBackup } from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

export function BackupDiagnostics({ backup }: { backup: LuckPermsBackup }) {
  const diagnostics = diagnoseBackup(backup);
  const issueCount =
    diagnostics.duplicatePermissions.length +
    diagnostics.missingGroupReferences.length +
    diagnostics.inheritanceCycles.length;

  if (!issueCount) {
    return (
      <p className="backup-diagnostics is-clear">
        <CircleCheck size={14} aria-hidden="true" /> Sin problemas estructurales
      </p>
    );
  }

  return (
    <details className="backup-diagnostics" open>
      <summary>
        <TriangleAlert size={14} aria-hidden="true" /> {issueCount} problema
        {issueCount === 1 ? "" : "s"} detectado
        {issueCount === 1 ? "" : "s"}
      </summary>
      <ul>
        {diagnostics.duplicatePermissions.map((issue) => (
          <li
            key={`duplicate-${issue.owner}-${issue.ownerId}-${issue.nodeIndexes.join("-")}`}
          >
            <code>{issue.key}</code> está repetido en{" "}
            {issue.owner === "group" ? "el grupo" : "el usuario"}{" "}
            <strong>{issue.ownerId}</strong>.
          </li>
        ))}
        {diagnostics.missingGroupReferences.map((issue) => (
          <li
            key={`missing-${issue.owner}-${issue.ownerId}-${issue.kind}-${issue.nodeIndex ?? "primary"}`}
          >
            {issue.kind === "primary-group"
              ? "El grupo primario"
              : "La herencia"}{" "}
            de {issue.owner === "group" ? "el grupo" : "el usuario"}{" "}
            <strong>{issue.ownerId}</strong> apunta a{" "}
            <code>{issue.groupName}</code>, que no existe.
          </li>
        ))}
        {diagnostics.inheritanceCycles.map((issue) => (
          <li key={`cycle-${issue.groups.join("-")}`}>
            Ciclo de herencia: <code>{issue.groups.join(" -> ")}</code>.
          </li>
        ))}
      </ul>
    </details>
  );
}

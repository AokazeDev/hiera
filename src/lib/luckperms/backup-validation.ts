import type { LuckPermsBackup } from "../permissions";

export type BackupValidationIssue = {
  path: string;
  message: string;
  line?: number;
  column?: number;
};

export type BackupParseResult =
  | { backup: LuckPermsBackup; issues: [] }
  | { backup: null; issues: BackupValidationIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function jsonErrorLocation(text: string, error: unknown) {
  const match =
    error instanceof Error && error.message.match(/position (\d+)/i);
  if (!match) return {};
  const position = Number(match[1]);
  const preceding = text.slice(0, position);
  return {
    line: preceding.split("\n").length,
    column: position - preceding.lastIndexOf("\n"),
  };
}

function validateNodes(value: unknown, path: string): BackupValidationIssue[] {
  if (!Array.isArray(value)) {
    return [{ path, message: "Debe ser una lista de nodos." }];
  }

  return value.flatMap((node, index) => {
    const nodePath = `${path}[${index}]`;
    if (!isRecord(node))
      return [{ path: nodePath, message: "Debe ser un objeto." }];
    const issues: BackupValidationIssue[] = [];
    if (typeof node.type !== "string" || !node.type.trim()) {
      issues.push({
        path: `${nodePath}.type`,
        message: "Debe ser un texto no vacío.",
      });
    }
    if (typeof node.key !== "string" || !node.key.trim()) {
      issues.push({
        path: `${nodePath}.key`,
        message: "Debe ser un texto no vacío.",
      });
    }
    if (typeof node.value !== "boolean") {
      issues.push({
        path: `${nodePath}.value`,
        message: "Debe ser true o false.",
      });
    }
    if (node.context !== undefined && !isRecord(node.context)) {
      issues.push({
        path: `${nodePath}.context`,
        message: "Debe ser un objeto de contexto.",
      });
    }
    return issues;
  });
}

/** Validates only the structural invariants Hiera needs while preserving unknown LuckPerms fields. */
export function validateLuckPermsBackup(
  value: unknown,
): BackupValidationIssue[] {
  if (!isRecord(value))
    return [{ path: "$", message: "El backup debe ser un objeto JSON." }];
  if (!isRecord(value.groups)) {
    return [{ path: "$.groups", message: "Debe ser un mapa de grupos." }];
  }

  const issues: BackupValidationIssue[] = [];
  for (const [groupName, group] of Object.entries(value.groups)) {
    const path = `$.groups.${JSON.stringify(groupName)}`;
    if (!isRecord(group)) {
      issues.push({ path, message: "El grupo debe ser un objeto." });
      continue;
    }
    issues.push(...validateNodes(group.nodes, `${path}.nodes`));
  }

  if (value.users !== undefined) {
    if (!isRecord(value.users)) {
      issues.push({
        path: "$.users",
        message: "Debe ser un mapa de usuarios.",
      });
    } else {
      for (const [userId, user] of Object.entries(value.users)) {
        const path = `$.users.${JSON.stringify(userId)}`;
        if (!isRecord(user)) {
          issues.push({ path, message: "El usuario debe ser un objeto." });
          continue;
        }
        issues.push(...validateNodes(user.nodes, `${path}.nodes`));
        if (user.username !== undefined && typeof user.username !== "string") {
          issues.push({ path: `${path}.username`, message: "Debe ser texto." });
        }
        if (
          user.primaryGroup !== undefined &&
          typeof user.primaryGroup !== "string"
        ) {
          issues.push({
            path: `${path}.primaryGroup`,
            message: "Debe ser texto.",
          });
        }
      }
    }
  }
  return issues;
}

export function parseLuckPermsBackup(text: string): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      backup: null,
      issues: [
        {
          path: "$",
          message: error instanceof Error ? error.message : "JSON inválido.",
          ...jsonErrorLocation(text, error),
        },
      ],
    };
  }
  const issues = validateLuckPermsBackup(parsed);
  return issues.length
    ? { backup: null, issues }
    : { backup: parsed as LuckPermsBackup, issues: [] };
}

function sortForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForStableJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortForStableJson(value[key])]),
  );
}

/** Keeps node arrays in their original order, while sorting object keys for Git-readable output. */
export function serializeLuckPermsBackup(
  backup: LuckPermsBackup,
  stable = false,
): string {
  return `${JSON.stringify(stable ? sortForStableJson(backup) : backup, null, 2)}\n`;
}

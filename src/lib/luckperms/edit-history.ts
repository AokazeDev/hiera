import type { LuckPermsBackup } from "../permissions";

type BackupHistoryEntry = {
  backup: LuckPermsBackup;
  label: string;
};

export type BackupHistory = {
  past: BackupHistoryEntry[];
  future: BackupHistoryEntry[];
};

export const emptyBackupHistory: BackupHistory = { past: [], future: [] };

const historyLimit = 20;

export function recordBackupChange(
  history: BackupHistory,
  backup: LuckPermsBackup,
  label: string,
): BackupHistory {
  return {
    past: [...history.past.slice(-(historyLimit - 1)), { backup, label }],
    future: [],
  };
}

export function undoBackupChange(
  history: BackupHistory,
  backup: LuckPermsBackup,
): { backup: LuckPermsBackup; history: BackupHistory } | null {
  const entry = history.past.at(-1);
  if (!entry) return null;

  return {
    backup: entry.backup,
    history: {
      past: history.past.slice(0, -1),
      future: [{ backup, label: entry.label }, ...history.future],
    },
  };
}

export function redoBackupChange(
  history: BackupHistory,
  backup: LuckPermsBackup,
): { backup: LuckPermsBackup; history: BackupHistory } | null {
  const entry = history.future[0];
  if (!entry) return null;

  return {
    backup: entry.backup,
    history: {
      past: [...history.past, { backup, label: entry.label }],
      future: history.future.slice(1),
    },
  };
}

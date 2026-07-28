"use client";

import gsap from "gsap";
import { Download, FileUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BackupRail } from "@/components/studio/backup-rail";
import { CatalogPanel } from "@/components/studio/catalog-panel";
import { ResolutionPanel } from "@/components/studio/resolution-panel";
import { authMeReloaded, type LuckPermsBackup } from "@/lib/permissions";

export function Studio() {
  const root = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<LuckPermsBackup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [history, setHistory] = useState<LuckPermsBackup[]>([]);

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
        setSelectedGroup(Object.keys(parsed.groups)[0] ?? null);
        setHistory([]);
      } catch (error) {
        window.alert(
          `No se pudo leer el backup: ${error instanceof Error ? error.message : "JSON invalido"}`,
        );
      }
    };
    reader.readAsText(file);
  }

  function updateBackup(next: LuckPermsBackup) {
    if (backup) setHistory((items) => [...items.slice(-19), backup]);
    setBackup(next);
  }

  function applyPermissions(nodes: string[]) {
    if (!backup || !selectedGroup) return;
    const group = backup.groups[selectedGroup];
    const existing = new Set(
      group.nodes
        .filter((node) => node.type === "permission")
        .map((node) => node.key),
    );
    const additions = authMeReloaded.permissions
      .filter(
        (permission) =>
          nodes.includes(permission.node) && !existing.has(permission.node),
      )
      .map((permission) => ({
        type: "permission",
        key: permission.node,
        value: true,
      }));
    updateBackup({
      ...backup,
      groups: {
        ...backup.groups,
        [selectedGroup]: { ...group, nodes: [...group.nodes, ...additions] },
      },
    });
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
    const previous = history.at(-1);
    if (!previous) return;
    setBackup(previous);
    setHistory((items) => items.slice(0, -1));
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
          {backup && (
            <button
              type="button"
              className="text-button"
              onClick={exportBackup}
            >
              <Download size={15} /> Exportar JSON
            </button>
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
          onSelectGroup={setSelectedGroup}
          onImport={() => input.current?.click()}
        />
        <CatalogPanel
          catalog={authMeReloaded}
          canApply={Boolean(backup && selectedGroup)}
          groupName={selectedGroup}
          onApply={applyPermissions}
        />
        <ResolutionPanel
          backup={backup}
          groupName={selectedGroup}
          canUndo={history.length > 0}
          onUndo={undo}
          onSelectGroup={setSelectedGroup}
        />
      </section>
    </main>
  );
}

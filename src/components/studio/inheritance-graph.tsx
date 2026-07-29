"use client";

import {
  Background,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import gsap from "gsap";
import { Info, MapPin, TriangleAlert, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  buildInheritanceGraph,
  buildPermissionProvenanceGraph,
  buildUserPermissionProvenanceGraph,
  type PermissionContext,
} from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type InheritanceGraphProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  userId: string | null;
  activeContext: PermissionContext;
  onSelectGroup: (groupName: string) => void;
  draggingPermissionFrom: string | null;
  draggingCatalogPermission: boolean;
  onDropPermission: (groupName: string) => void;
  onDropCatalogPermission: (groupName: string) => void;
  permissionProvenance: {
    key: string;
    origin: string;
    inherited: boolean;
  } | null;
};

type GraphNodeData = {
  label: string;
  groupName: string;
  missing: boolean;
  selected: boolean;
  traversing: boolean;
  onSelectGroup: (groupName: string) => void;
  draggingPermissionFrom: string | null;
  draggingCatalogPermission: boolean;
  onDropPermission: (groupName: string) => void;
  onDropCatalogPermission: (groupName: string) => void;
};

function GroupGraphNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const acceptsDrop =
    !data.missing &&
    (data.draggingCatalogPermission ||
      (data.draggingPermissionFrom !== null &&
        data.draggingPermissionFrom !== data.groupName));

  return (
    <button
      type="button"
      className={`inheritance-graph-node${data.selected ? " is-selected" : ""}${data.traversing ? " is-traversal-target" : ""}${data.missing ? " is-missing" : ""}${isDropTarget ? " is-drop-target" : ""}`}
      disabled={data.missing}
      onClick={() => data.onSelectGroup(data.groupName)}
      onDragOver={(event) => {
        if (!acceptsDrop) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDropTarget(false);
        if (!acceptsDrop) return;
        if (data.draggingCatalogPermission) {
          data.onDropCatalogPermission(data.groupName);
        } else {
          data.onDropPermission(data.groupName);
        }
      }}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      {data.missing && <TriangleAlert size={13} aria-hidden="true" />}
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </button>
  );
}

const nodeTypes = { group: GroupGraphNode };

type ResolutionGraphNodeData = {
  label: string;
  kind: "context" | "user";
};

function ResolutionGraphNode({
  data,
}: NodeProps<Node<ResolutionGraphNodeData>>) {
  const Icon = data.kind === "user" ? UserRound : MapPin;
  return (
    <div className={`resolution-graph-node is-${data.kind}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Icon size={13} aria-hidden="true" />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}

const resolutionNodeTypes = {
  group: GroupGraphNode,
  resolution: ResolutionGraphNode,
};

export function InheritanceGraph({
  backup,
  groupName,
  userId,
  activeContext,
  onSelectGroup,
  draggingPermissionFrom,
  draggingCatalogPermission,
  onDropPermission,
  onDropCatalogPermission,
  permissionProvenance,
}: InheritanceGraphProps) {
  const root = useRef<HTMLElement>(null);
  const traversalTimeout = useRef<number | null>(null);
  const [traversedEdge, setTraversedEdge] = useState<string | null>(null);
  const isUserProvenance = Boolean(backup && userId && permissionProvenance);
  const graph =
    backup && userId && permissionProvenance
      ? buildUserPermissionProvenanceGraph(
          backup,
          userId,
          permissionProvenance.origin,
          activeContext,
        )
      : backup && groupName
        ? permissionProvenance
          ? buildPermissionProvenanceGraph(
              backup,
              groupName,
              permissionProvenance.origin,
            )
          : buildInheritanceGraph(backup, groupName)
        : null;

  useEffect(
    () => () => {
      if (traversalTimeout.current !== null) {
        window.clearTimeout(traversalTimeout.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!traversedEdge || !root.current) return;
    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!media.matches) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        ".inheritance-graph-node.is-traversal-target",
        { opacity: 0.6, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.22, ease: "power2.out" },
      );
      gsap.fromTo(
        ".react-flow__edge.is-traversed",
        { opacity: 0.35 },
        { opacity: 1, duration: 0.22, ease: "power2.out" },
      );
    }, root);
    return () => context.revert();
  }, [traversedEdge]);

  function traverseToGroup(targetGroup: string) {
    const edge = graph?.edges.find(
      (candidate) =>
        candidate.source === groupName && candidate.target === targetGroup,
    );
    if (!edge) {
      onSelectGroup(targetGroup);
      return;
    }
    if (traversalTimeout.current !== null) return;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      onSelectGroup(targetGroup);
      return;
    }

    setTraversedEdge(edge.id);
    traversalTimeout.current = window.setTimeout(() => {
      traversalTimeout.current = null;
      setTraversedEdge(null);
      onSelectGroup(targetGroup);
    }, 220);
  }

  if (!backup || (!groupName && !userId) || !graph) {
    return (
      <section className="workspace inheritance-graph-empty">
        <Info size={21} aria-hidden="true" />
        <p>Selecciona un grupo para recorrer sus herencias y grupos padre.</p>
      </section>
    );
  }

  const rows = new Map<number, number>();
  const nodes: Node<GraphNodeData | ResolutionGraphNodeData>[] =
    graph.nodes.map((node) => {
      const row = rows.get(node.depth) ?? 0;
      rows.set(node.depth, row + 1);
      if ("kind" in node && node.kind !== "group") {
        return {
          id: node.id,
          type: "resolution",
          position: { x: node.depth * 250, y: row * 100 },
          data: { label: node.label, kind: node.kind },
          draggable: false,
          selectable: false,
          focusable: false,
        };
      }
      return {
        id: node.id,
        type: "group",
        position: { x: node.depth * 250, y: row * 100 },
        data: {
          label: node.label,
          groupName: "kind" in node ? node.label : node.id,
          missing: "missing" in node ? node.missing : false,
          selected: node.label === groupName,
          traversing: graph.edges.some(
            (edge) => edge.id === traversedEdge && edge.target === node.id,
          ),
          onSelectGroup: traverseToGroup,
          draggingPermissionFrom,
          draggingCatalogPermission,
          onDropPermission,
          onDropCatalogPermission,
        },
        selectable: !("missing" in node && node.missing),
      };
    });
  const edges: Edge[] = graph.edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    className: edge.id === traversedEdge ? "is-traversed" : undefined,
    interactionWidth: 0,
  }));

  return (
    <section
      ref={root}
      className="workspace inheritance-graph-workspace"
      aria-labelledby="inheritance-graph-title"
    >
      <header className="workspace-title">
        <div>
          <h2 id="inheritance-graph-title">
            {permissionProvenance
              ? `Procedencia de ${permissionProvenance.key}`
              : `Herencias de ${groupName}`}
          </h2>
          <p className="editor-intro">
            {permissionProvenance
              ? isUserProvenance
                ? permissionProvenance.inherited
                  ? "El contexto activo se aplica al usuario y esta es una ruta de membresía hasta el grupo que define el permiso."
                  : "El contexto activo se aplica al usuario, que define este permiso directamente."
                : permissionProvenance.inherited
                  ? `Esta es la ruta activa desde ${groupName} hasta el grupo que define directamente el permiso.`
                  : `${groupName} define este permiso directamente; no interviene una herencia.`
              : "Las conexiones salen del grupo que hereda hacia su grupo padre. Usa los controles para acercar, alejar o reencuadrar el mapa. Mientras arrastras un permiso desde el editor o catálogo, suéltalo sobre un grupo visible para revisar la operación."}
          </p>
        </div>
        <p className="editor-summary">
          {graph.nodes.length}{" "}
          {permissionProvenance ? "nodos en la ruta" : "grupos visibles"}
        </p>
      </header>
      <div className="inheritance-graph-canvas">
        <ReactFlow
          aria-label={
            isUserProvenance
              ? "Grafo de procedencia de permiso de usuario"
              : `Grafo de herencias de ${groupName}`
          }
          nodes={nodes}
          edges={edges}
          nodeTypes={isUserProvenance ? resolutionNodeTypes : nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          nodesFocusable
          edgesFocusable={false}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.35}
          maxZoom={1.5}
          onNodeClick={(_, node) => {
            const graphNode = graph.nodes.find(
              (candidate) => candidate.id === node.id,
            );
            if (
              graphNode &&
              (!("kind" in graphNode) || graphNode.kind === "group")
            ) {
              traverseToGroup(graphNode.label);
            }
          }}
        >
          <Background gap={20} size={1} color="#c6c7bb" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {graph.summary.truncated && (
        <output className="inheritance-graph-limit" aria-live="polite">
          El mapa muestra hasta {graph.summary.nodeLimit} grupos. Se omitieron{" "}
          {graph.summary.omittedNodes} grupos para mantener el estudio
          navegable; usa la lista de grupos para continuar la inspección.
        </output>
      )}
      {permissionProvenance && graph.nodes.length > 0 && (
        <ol
          className="permission-provenance-list"
          aria-label="Ruta textual de procedencia"
        >
          {graph.nodes.map((node, index) => (
            <li key={node.id}>
              {"kind" in node && node.kind !== "group" ? (
                <span>{node.label}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => traverseToGroup(node.label)}
                >
                  {node.label}
                </button>
              )}
              {index < graph.nodes.length - 1 && (
                <span aria-hidden="true">
                  {isUserProvenance && index === 0
                    ? " resuelve para "
                    : isUserProvenance && index === 1
                      ? " pertenece a "
                      : " hereda de "}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      <p className="inheritance-graph-note">
        {permissionProvenance
          ? graph.summary.truncated
            ? "La ruta se resume en el canvas y la lista para conservar el sujeto y el origen. Selecciona los grupos desde el rail para inspeccionar los tramos omitidos."
            : "La ruta textual permite revisar y navegar la misma procedencia sin depender del canvas."
          : "El mapa muestra solo la línea de herencia activa para evitar duplicar el estudio. El editor, el catálogo y la lista de herencias directas permanecen disponibles como alternativa completa de teclado."}
      </p>
    </section>
  );
}

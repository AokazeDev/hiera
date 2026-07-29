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
import { Info, TriangleAlert } from "lucide-react";
import { buildInheritanceGraph } from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type InheritanceGraphProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  onSelectGroup: (groupName: string) => void;
};

type GraphNodeData = {
  label: string;
  missing: boolean;
  selected: boolean;
};

function GroupGraphNode({ data }: NodeProps<Node<GraphNodeData>>) {
  return (
    <div
      className={`inheritance-graph-node${data.selected ? " is-selected" : ""}${data.missing ? " is-missing" : ""}`}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      {data.missing && <TriangleAlert size={13} aria-hidden="true" />}
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { group: GroupGraphNode };

export function InheritanceGraph({
  backup,
  groupName,
  onSelectGroup,
}: InheritanceGraphProps) {
  const graph =
    backup && groupName ? buildInheritanceGraph(backup, groupName) : null;

  if (!backup || !groupName || !graph) {
    return (
      <section className="workspace inheritance-graph-empty">
        <Info size={21} aria-hidden="true" />
        <p>Selecciona un grupo para recorrer sus herencias y grupos padre.</p>
      </section>
    );
  }

  const rows = new Map<number, number>();
  const nodes: Node<GraphNodeData>[] = graph.nodes.map((node) => {
    const row = rows.get(node.depth) ?? 0;
    rows.set(node.depth, row + 1);
    return {
      id: node.id,
      type: "group",
      position: { x: node.depth * 250, y: row * 100 },
      data: {
        label: node.label,
        missing: node.missing,
        selected: node.id === groupName,
      },
      selectable: !node.missing,
    };
  });
  const edges: Edge[] = graph.edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    interactionWidth: 0,
  }));

  return (
    <section
      className="workspace inheritance-graph-workspace"
      aria-labelledby="inheritance-graph-title"
    >
      <header className="workspace-title">
        <div>
          <h2 id="inheritance-graph-title">Herencias de {groupName}</h2>
          <p className="editor-intro">
            Las conexiones salen del grupo que hereda hacia su grupo padre. Usa
            los controles para acercar, alejar o reencuadrar el mapa.
          </p>
        </div>
        <p className="editor-summary">{graph.nodes.length} grupos visibles</p>
      </header>
      <div className="inheritance-graph-canvas">
        <ReactFlow
          aria-label={`Grafo de herencias de ${groupName}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          nodesFocusable
          edgesFocusable={false}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.35}
          maxZoom={1.5}
          onNodeClick={(_, node) => onSelectGroup(node.id)}
        >
          <Background gap={20} size={1} color="#c6c7bb" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="inheritance-graph-note">
        El editor y la lista de herencias directas permanecen disponibles en la
        vista Editor como alternativa completa de teclado.
      </p>
    </section>
  );
}

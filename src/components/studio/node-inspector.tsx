"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { inspectNodes } from "@/lib/luckperms";
import type { LuckPermsNode } from "@/lib/permissions";

type NodeInspectorProps = {
  nodes: LuckPermsNode[];
  subjectLabel: string;
};

export function NodeInspector({ nodes, subjectLabel }: NodeInspectorProps) {
  const inspectedNodes = inspectNodes(nodes);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="node-inspector" aria-labelledby="all-nodes-title">
      <button
        type="button"
        className="node-inspector-heading"
        aria-controls="all-nodes-list"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <div>
          <p className="inheritance-label" id="all-nodes-title">
            TODOS LOS NODOS
          </p>
          <p>
            {inspectedNodes.length} nodos almacenados directamente en{" "}
            {subjectLabel}.
          </p>
        </div>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
      {isOpen &&
        (inspectedNodes.length ? (
          <ul className="node-inspector-list" id="all-nodes-list">
            {inspectedNodes.map((node) => (
              <li key={`${node.index}-${node.type}-${node.key}`}>
                <details>
                  <summary>
                    <span>{node.typeLabel}</span>
                    <code>{node.key}</code>
                    <small>{node.value ? "activo" : "inactivo"}</small>
                  </summary>
                  <dl>
                    <div>
                      <dt>Tipo</dt>
                      <dd>{node.type}</dd>
                    </div>
                    <div>
                      <dt>Clave</dt>
                      <dd>{node.key}</dd>
                    </div>
                    <div>
                      <dt>Valor</dt>
                      <dd>{String(node.value)}</dd>
                    </div>
                    {node.context.map(([key, value]) => (
                      <div key={`context-${key}`}>
                        <dt>Contexto: {key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                    {node.attributes.map(([key, value]) => (
                      <div key={`attribute-${key}`}>
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="editor-empty">
            {subjectLabel} no contiene nodos directos.
          </p>
        ))}
    </section>
  );
}

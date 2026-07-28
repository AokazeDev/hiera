import type { LuckPermsNode } from "../permissions";

const nodeTypeLabels: Record<string, string> = {
  inheritance: "Herencia",
  meta: "Metadato",
  permission: "Permiso",
  prefix: "Prefijo",
  suffix: "Sufijo",
  weight: "Peso",
};

export type InspectedNode = {
  index: number;
  type: string;
  typeLabel: string;
  key: string;
  value: boolean;
  context: Array<[string, string]>;
  attributes: Array<[string, string]>;
};

function formatNodeValue(value: unknown): string {
  if (typeof value === "string") return value;
  const serialized = JSON.stringify(value);
  return serialized === undefined ? String(value) : serialized;
}

export function inspectNodes(nodes: LuckPermsNode[]): InspectedNode[] {
  return nodes.map((node, index) => ({
    index,
    type: node.type,
    typeLabel: nodeTypeLabels[node.type] ?? `Tipo no reconocido: ${node.type}`,
    key: node.key,
    value: node.value,
    context: Object.entries(node.context ?? {}).map(([key, value]) => [
      key,
      formatNodeValue(value),
    ]),
    attributes: Object.entries(node)
      .filter(([key]) => !["type", "key", "value", "context"].includes(key))
      .map(([key, value]) => [key, formatNodeValue(value)]),
  }));
}

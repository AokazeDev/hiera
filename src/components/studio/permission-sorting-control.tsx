"use client";

import type { PermissionSort } from "@/lib/luckperms";

type PermissionSortingControlProps = {
  value: PermissionSort;
  onChange: (value: PermissionSort) => void;
  showOrigin?: boolean;
};

const options: Array<[PermissionSort, string]> = [
  ["name", "Nombre"],
  ["status", "Estado"],
  ["category", "Categoría"],
  ["recommendation", "Recomendación"],
];

export function PermissionSortingControl({
  value,
  onChange,
  showOrigin = false,
}: PermissionSortingControlProps) {
  const availableOptions = showOrigin
    ? [...options.slice(0, 3), ["origin", "Origen"] as const, options[3]]
    : options;

  return (
    <label className="permission-sorting-control">
      <span>Ordenar</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PermissionSort)}
      >
        {availableOptions.map(([option, label]) => (
          <option key={option} value={option}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

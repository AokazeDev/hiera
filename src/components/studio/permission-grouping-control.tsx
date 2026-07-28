"use client";

import type { PermissionGrouping } from "@/lib/luckperms";

type PermissionGroupingControlProps = {
  value: PermissionGrouping;
  onChange: (value: PermissionGrouping) => void;
};

const options: Array<[PermissionGrouping, string]> = [
  ["flat", "Lista"],
  ["plugin", "Plugin"],
  ["segment", "Rama"],
];

export function PermissionGroupingControl({
  value,
  onChange,
}: PermissionGroupingControlProps) {
  return (
    <fieldset className="permission-grouping-control">
      <legend>Agrupar</legend>
      <div>
        {options.map(([option, label]) => (
          <button
            type="button"
            key={option}
            className={value === option ? "is-active" : ""}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

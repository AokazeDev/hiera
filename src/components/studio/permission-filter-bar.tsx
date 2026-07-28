"use client";

import { Filter, X } from "lucide-react";
import {
  collectPluginPrefixes,
  defaultPermissionFilter,
  type PermissionContextFilter,
  type PermissionFilterState,
  type PermissionOriginFilter,
  type PermissionRiskFilter,
  type PermissionStatusFilter,
} from "@/lib/luckperms";
import type { LuckPermsNode } from "@/lib/permissions";

type PermissionFilterBarProps = {
  nodes: LuckPermsNode[];
  filters: PermissionFilterState;
  onChange: (filters: PermissionFilterState) => void;
  showOrigin?: boolean;
};

const statusOptions: Array<[PermissionStatusFilter, string]> = [
  ["all", "Todos"],
  ["granted", "Concedido"],
  ["denied", "Denegado"],
];

const contextOptions: Array<[PermissionContextFilter, string]> = [
  ["all", "Todos"],
  ["global", "Global"],
  ["contextual", "Contextual"],
];

const originOptions: Array<[PermissionOriginFilter, string]> = [
  ["all", "Todos"],
  ["direct", "Directo"],
  ["inherited", "Heredado"],
];

const riskOptions: Array<[PermissionRiskFilter, string]> = [
  ["all", "Todos"],
  ["safe", "Seguro"],
  ["caution", "Precaución"],
  ["dangerous", "Peligroso"],
];

export function PermissionFilterBar({
  nodes,
  filters,
  onChange,
  showOrigin = false,
}: PermissionFilterBarProps) {
  const prefixes = collectPluginPrefixes(nodes);
  const hasActiveFilters =
    filters.status !== "all" ||
    filters.context !== "all" ||
    filters.origin !== "all" ||
    filters.risk !== "all" ||
    filters.plugin !== "all";

  function update<K extends keyof PermissionFilterState>(
    key: K,
    value: PermissionFilterState[K],
  ) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="permission-filter-bar">
      <div className="permission-filter-heading">
        <span>
          <Filter size={12} aria-hidden="true" /> Filtrar
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            className="filter-reset"
            onClick={() => onChange(defaultPermissionFilter)}
          >
            <X size={11} aria-hidden="true" /> Limpiar
          </button>
        )}
      </div>
      <div className="permission-filter-groups">
        <div className="filter-group">
          <span>Estado</span>
          <div className="filter-options">
            {statusOptions.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={filters.status === value ? "is-active" : ""}
                onClick={() => update("status", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span>Contexto</span>
          <div className="filter-options">
            {contextOptions.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={filters.context === value ? "is-active" : ""}
                onClick={() => update("context", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {showOrigin && (
          <div className="filter-group">
            <span>Origen</span>
            <div className="filter-options">
              {originOptions.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filters.origin === value ? "is-active" : ""}
                  onClick={() => update("origin", value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="filter-group">
          <span>Riesgo</span>
          <div className="filter-options">
            {riskOptions.map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={
                  filters.risk === value
                    ? `is-active risk-${value}`
                    : `risk-${value}`
                }
                onClick={() => update("risk", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {prefixes.length > 0 && (
          <div className="filter-group">
            <span>Plugin</span>
            <div className="filter-options">
              <button
                type="button"
                className={filters.plugin === "all" ? "is-active" : ""}
                onClick={() => update("plugin", "all")}
              >
                Todos
              </button>
              {prefixes.map((prefix) => (
                <button
                  type="button"
                  key={prefix}
                  className={filters.plugin === prefix ? "is-active" : ""}
                  onClick={() => update("plugin", prefix)}
                >
                  {prefix}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

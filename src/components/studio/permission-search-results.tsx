"use client";

import { GripVertical, UserRound } from "lucide-react";
import type { PermissionSearchResult } from "@/lib/luckperms";

type PermissionSearchResultsProps = {
  results: PermissionSearchResult[];
  onSelectGroup: (groupName: string) => void;
  onSelectUser: (userId: string) => void;
  onPrepareGroupTransfer: (groupName: string, nodeIndex: number) => void;
  onStartGroupDrag: (groupName: string, nodeIndex: number) => void;
  onEndGroupDrag: () => void;
};

const visibleMatches = 20;

export function PermissionSearchResults({
  results,
  onSelectGroup,
  onSelectUser,
  onPrepareGroupTransfer,
  onStartGroupDrag,
  onEndGroupDrag,
}: PermissionSearchResultsProps) {
  const matches = results.flatMap((result) =>
    result.matches.map((match) => ({ result, match })),
  );
  const visible = matches.slice(0, visibleMatches);

  return (
    <section
      className="permission-search-results"
      aria-labelledby="search-results-title"
    >
      <div className="permission-search-results-heading">
        <p id="search-results-title">Coincidencias directas</p>
        <span>{matches.length}</span>
      </div>
      <ul>
        {visible.map(({ result, match }) => (
          <li key={`${result.subject}-${result.id}-${match.nodeIndex}`}>
            <button
              type="button"
              className="permission-search-result-subject"
              onClick={() =>
                result.subject === "group"
                  ? onSelectGroup(result.id)
                  : onSelectUser(result.id)
              }
            >
              {result.subject === "user" && (
                <UserRound size={12} aria-hidden="true" />
              )}
              {result.label}
            </button>
            <code>{match.key}</code>
            <span className={match.value ? "value-true" : "value-false"}>
              {match.value ? "+" : "-"}
            </span>
            {result.subject === "group" && (
              <>
                <span
                  className="permission-drag-handle"
                  draggable
                  aria-hidden="true"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "copyMove";
                    event.dataTransfer.setData("text/plain", match.key);
                    onStartGroupDrag(result.id, match.nodeIndex);
                  }}
                  onDragEnd={onEndGroupDrag}
                >
                  <GripVertical size={14} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  className="search-result-transfer"
                  onClick={() =>
                    onPrepareGroupTransfer(result.id, match.nodeIndex)
                  }
                >
                  Cambiar en otro grupo
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {matches.length > visibleMatches && (
        <p>
          Se muestran las primeras {visibleMatches} coincidencias para mantener
          el rail ágil.
        </p>
      )}
    </section>
  );
}

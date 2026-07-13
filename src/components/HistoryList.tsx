import React from "react";
import type { ScanHistoryEntry } from "../types";
import { StatusBadge } from "./StatusBadge";

interface HistoryListProps {
  history: ScanHistoryEntry[];
}

/** Scrollable list of the last N scanned emails (local history only). */
export const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return <p className="text-xs text-gray-500 dark:text-gray-400">No emails scanned yet.</p>;
  }

  return (
    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between text-xs border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1.5"
        >
          <div className="min-w-0 flex-1 mr-2">
            <div className="truncate font-medium">{entry.subject}</div>
            <div className="truncate text-gray-500 dark:text-gray-400">{entry.senderEmail}</div>
          </div>
          <StatusBadge status={entry.status} />
        </div>
      ))}
    </div>
  );
};

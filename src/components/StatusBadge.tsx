import React from "react";
import type { RiskStatus } from "../types";

interface StatusBadgeProps {
  status: RiskStatus;
}

const STYLES: Record<RiskStatus, string> = {
  Safe: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Suspicious: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Phishing: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const ICONS: Record<RiskStatus, string> = {
  Safe: "✅",
  Suspicious: "⚠️",
  Phishing: "❌",
};

/** Small pill badge showing the current risk status with icon + color. */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${STYLES[status]}`}>
    <span>{ICONS[status]}</span>
    <span>{status}</span>
  </span>
);

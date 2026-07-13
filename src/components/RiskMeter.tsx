import React from "react";
import type { RiskStatus } from "../types";

interface RiskMeterProps {
  score: number;
  status: RiskStatus;
}

const BAR_COLORS: Record<RiskStatus, string> = {
  Safe: "bg-green-500",
  Suspicious: "bg-amber-500",
  Phishing: "bg-red-500",
};

/** Horizontal bar visualizing the 0-100 risk score. */
export const RiskMeter: React.FC<RiskMeterProps> = ({ score, status }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs font-medium mb-1">
      <span>Risk Score</span>
      <span>{score}%</span>
    </div>
    <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        className={`h-full rounded-full ${BAR_COLORS[status]} transition-all`}
        style={{ width: `${score}%` }}
      />
    </div>
  </div>
);

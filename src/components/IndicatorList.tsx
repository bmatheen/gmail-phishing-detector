import React from "react";
import type { Indicator } from "../types";

interface IndicatorListProps {
  indicators: Indicator[];
}

/** Bulleted list of triggered phishing indicators, sorted by severity. */
export const IndicatorList: React.FC<IndicatorListProps> = ({ indicators }) => {
  if (indicators.length === 0) {
    return <p className="text-xs text-gray-500 dark:text-gray-400">No red flags detected.</p>;
  }

  const sorted = [...indicators].sort((a, b) => b.weight - a.weight);

  return (
    <ul className="text-xs space-y-1 list-disc pl-4 text-gray-700 dark:text-gray-300">
      {sorted.map((indicator, idx) => (
        <li key={idx}>{indicator.label}</li>
      ))}
    </ul>
  );
};

import React, { useEffect, useState, useCallback } from "react";
import type { AnalysisResult, ScanHistoryEntry, ExtensionMessage } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { RiskMeter } from "../components/RiskMeter";
import { IndicatorList } from "../components/IndicatorList";
import { HistoryList } from "../components/HistoryList";
import { getDarkModePreference, setDarkModePreference } from "../services/storageService";

/** Format a millisecond timestamp as a short relative/local time string. */
function formatScanTime(ms: number): string {
  const date = new Date(ms);
  const now = Date.now();
  const diffSec = Math.round((now - ms) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return date.toLocaleString();
}

function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>;
}

export const App: React.FC = () => {
  const [latest, setLatest] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [latestScan, historyData, dark] = await Promise.all([
      sendMessage<AnalysisResult | null>({ type: "GET_LATEST_SCAN" }),
      sendMessage<ScanHistoryEntry[]>({ type: "GET_HISTORY" }),
      getDarkModePreference(),
    ]);
    setLatest(latestScan);
    setHistory(historyData || []);
    setDarkMode(dark);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await setDarkModePreference(next);
  };

  const handleClearHistory = async () => {
    await sendMessage({ type: "CLEAR_HISTORY" });
    await loadData();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold">🛡️ Phishing Guard</h1>
        <button
          onClick={toggleDarkMode}
          className="text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600"
          aria-label="Toggle dark mode"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
      ) : latest ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <StatusBadge status={latest.status} />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {formatScanTime(latest.email.scannedAt)}
            </span>
          </div>

          <RiskMeter score={latest.riskScore} status={latest.status} />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-2">
              <div className="text-gray-500 dark:text-gray-400">Suspicious links</div>
              <div className="font-bold text-sm">{latest.suspiciousLinkCount}</div>
            </div>
            <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-2">
              <div className="text-gray-500 dark:text-gray-400">Indicators found</div>
              <div className="font-bold text-sm">{latest.indicators.length}</div>
            </div>
          </div>

          <div className="text-xs">
            <div className="truncate font-medium">{latest.email.subject}</div>
            <div className="truncate text-gray-500 dark:text-gray-400">
              {latest.email.senderName} &lt;{latest.email.senderEmail}&gt;
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold mb-1">Reasons</div>
            <IndicatorList indicators={latest.indicators} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Open an email in Gmail to see its risk analysis here.
        </p>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-semibold">Recent scans</div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-red-600 dark:text-red-400 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        <HistoryList history={history} />
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-700">
        100% local analysis. No data leaves your browser.
      </p>
    </div>
  );
};

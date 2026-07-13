/**
 * Thin wrapper around chrome.storage.local.
 * All extension state (last scan + history) lives here, entirely
 * on-device. Nothing is ever sent to a remote server.
 */
import type { AnalysisResult, ScanHistoryEntry } from "../types";
import { MAX_HISTORY_ENTRIES, STORAGE_KEYS } from "../utils/constants";

function toHistoryEntry(result: AnalysisResult): ScanHistoryEntry {
  return {
    id: `${result.email.scannedAt}-${result.email.senderEmail}`,
    subject: result.email.subject,
    senderEmail: result.email.senderEmail,
    riskScore: result.riskScore,
    status: result.status,
    scannedAt: result.email.scannedAt,
    indicatorCount: result.indicators.length,
    suspiciousLinkCount: result.suspiciousLinkCount,
  };
}

/** Persist the latest scan result and append it to the rolling history (max 20 entries). */
export async function saveScanResult(result: AnalysisResult): Promise<void> {
  const entry = toHistoryEntry(result);

  const existing = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
  const history: ScanHistoryEntry[] = existing[STORAGE_KEYS.HISTORY] || [];

  // Avoid duplicate consecutive entries for the same email re-render.
  const alreadyLatest = history[0]?.id === entry.id;
  const updatedHistory = alreadyLatest ? history : [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);

  await chrome.storage.local.set({
    [STORAGE_KEYS.LATEST_SCAN]: result,
    [STORAGE_KEYS.HISTORY]: updatedHistory,
  });
}

/** Fetch the most recent scan result, if any. */
export async function getLatestScan(): Promise<AnalysisResult | null> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.LATEST_SCAN);
  return data[STORAGE_KEYS.LATEST_SCAN] ?? null;
}

/** Fetch the full scan history (most recent first). */
export async function getScanHistory(): Promise<ScanHistoryEntry[]> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
  return data[STORAGE_KEYS.HISTORY] ?? [];
}

/** Clear all stored scan history + latest scan. */
export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove([STORAGE_KEYS.LATEST_SCAN, STORAGE_KEYS.HISTORY]);
}

/** Get/set the persisted dark mode preference. */
export async function getDarkModePreference(): Promise<boolean> {
  const data = await chrome.storage.local.get(STORAGE_KEYS.DARK_MODE);
  return Boolean(data[STORAGE_KEYS.DARK_MODE]);
}

export async function setDarkModePreference(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.DARK_MODE]: enabled });
}

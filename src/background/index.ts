/**
 * Background service worker (Manifest V3).
 * Receives analysis results from the content script, persists them to
 * chrome.storage.local, fires a browser notification for high-risk
 * emails, and answers data requests from the popup.
 */
import type { AnalysisResult, ExtensionMessage, ScanHistoryEntry } from "../types";
import { saveScanResult, getLatestScan, getScanHistory, clearHistory } from "../services/storageService";

const NOTIFICATION_ICON = "icons/icon128.png";

/** Fire a Chrome notification when an email scores in the "Phishing" range. */
function maybeNotify(result: AnalysisResult): void {
  if (result.status !== "Phishing") return;

  chrome.notifications.create(`phishing-${result.email.scannedAt}`, {
    type: "basic",
    iconUrl: NOTIFICATION_ICON,
    title: "⚠️ Phishing email detected",
    message: `"${result.email.subject}" from ${result.email.senderEmail || result.email.senderName} scored ${result.riskScore}% risk.`,
    priority: 2,
  });
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "EMAIL_ANALYZED") {
    (async () => {
      await saveScanResult(message.payload);
      maybeNotify(message.payload);
      sendResponse({ ok: true });
    })();
    return true; // keep the message channel open for the async response
  }

  if (message.type === "GET_LATEST_SCAN") {
    (async () => {
      const latest = await getLatestScan();
      sendResponse(latest);
    })();
    return true;
  }

  if (message.type === "GET_HISTORY") {
    (async () => {
      const history: ScanHistoryEntry[] = await getScanHistory();
      sendResponse(history);
    })();
    return true;
  }

  if (message.type === "CLEAR_HISTORY") {
    (async () => {
      await clearHistory();
      sendResponse({ ok: true });
    })();
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  // eslint-disable-next-line no-console
  console.log("Phishing Guard for Gmail installed.");
});

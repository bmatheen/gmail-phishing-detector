/**
 * Shared TypeScript interfaces used across the content script,
 * background service worker, and popup UI.
 */

/** Verdict bucket derived from the numeric risk score. */
export type RiskStatus = "Safe" | "Suspicious" | "Phishing";

/** Raw data extracted from a single opened Gmail message. */
export interface EmailData {
  /** Display name of the sender, e.g. "PayPal Support" */
  senderName: string;
  /** Raw email address of the sender, e.g. "support@paypa1-verify.com" */
  senderEmail: string;
  /** Domain portion of the sender email, e.g. "paypa1-verify.com" */
  senderDomain: string;
  /** Email subject line */
  subject: string;
  /** Plain-text rendering of the email body (HTML tags stripped) */
  bodyText: string;
  /** All hyperlink URLs found inside the email body */
  links: string[];
  /** Timestamp (ms) when this email was scanned */
  scannedAt: number;
}

/** Result of analyzing a single URL found in an email. */
export interface LinkAnalysis {
  url: string;
  isHttp: boolean;
  isIpAddress: boolean;
  isShortener: boolean;
  isUnusuallyLong: boolean;
  hasSuspiciousWords: boolean;
  /** true if any red flag above is true */
  isSuspicious: boolean;
  /** Human readable reasons for this specific link */
  reasons: string[];
}

/** A single triggered phishing indicator with a human-readable label and weight. */
export interface Indicator {
  label: string;
  weight: number;
}

/** Full result of running the detection engine against one EmailData object. */
export interface AnalysisResult {
  riskScore: number; // 0 - 100
  status: RiskStatus;
  indicators: Indicator[];
  linkAnalyses: LinkAnalysis[];
  suspiciousLinkCount: number;
  email: EmailData;
}

/** A trimmed-down record persisted to chrome.storage.local for scan history. */
export interface ScanHistoryEntry {
  id: string;
  subject: string;
  senderEmail: string;
  riskScore: number;
  status: RiskStatus;
  scannedAt: number;
  indicatorCount: number;
  suspiciousLinkCount: number;
}

/** Message envelope used for chrome.runtime messaging between content <-> background <-> popup. */
export type ExtensionMessage =
  | { type: "EMAIL_ANALYZED"; payload: AnalysisResult }
  | { type: "GET_LATEST_SCAN" }
  | { type: "GET_HISTORY" }
  | { type: "CLEAR_HISTORY" };

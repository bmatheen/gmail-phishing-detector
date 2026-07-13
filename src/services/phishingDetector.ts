/**
 * Core detection engine.
 *
 * This module is intentionally framework-free (no DOM, no chrome.* APIs)
 * so it can be unit tested in isolation and reused from the content
 * script, background worker, or a future test suite.
 */
import type { AnalysisResult, EmailData, Indicator, RiskStatus } from "../types";
import {
  SUSPICIOUS_KEYWORDS,
  CREDENTIAL_REQUEST_PHRASES,
  THREATENING_PHRASES,
  COMMONLY_IMPERSONATED_BRANDS,
  FREE_EMAIL_PROVIDERS,
  RISK_THRESHOLDS,
} from "../utils/constants";
import { analyzeUrls } from "../utils/urlAnalyzer";

/** Count non-overlapping occurrences of `phrase` inside `text` (case-insensitive). */
function countOccurrences(text: string, phrase: string): number {
  if (!phrase) return 0;
  const lower = text.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = lower.indexOf(phrase, idx)) !== -1) {
    count++;
    idx += phrase.length;
  }
  return count;
}

/** Scan text against a phrase/weight table and push matching indicators. */
function scanPhraseTable(
  text: string,
  table: { phrase: string; weight: number }[],
  label: (phrase: string) => string,
  indicators: Indicator[]
): void {
  for (const { phrase, weight } of table) {
    if (countOccurrences(text, phrase) > 0) {
      indicators.push({ label: label(phrase), weight });
    }
  }
}

/** Checks the sender's display name against known brand names vs. the actual sending domain. */
function checkBrandImpersonation(senderName: string, senderDomain: string): Indicator | null {
  const lowerName = senderName.toLowerCase();
  for (const { brand, officialDomains } of COMMONLY_IMPERSONATED_BRANDS) {
    if (lowerName.includes(brand)) {
      const domainMatches = officialDomains.some(
        (d) => senderDomain === d || senderDomain.endsWith(`.${d}`)
      );
      if (!domainMatches) {
        return {
          label: `Sender name mentions "${brand}" but the domain (${senderDomain || "unknown"}) does not match ${brand}'s official domain`,
          weight: 22,
        };
      }
    }
  }
  return null;
}

/** Flags free webmail domains pretending to be a company/organization via display name. */
function checkFreeEmailMismatch(senderName: string, senderDomain: string): Indicator | null {
  const looksLikeOrg = /(support|team|service|security|billing|admin|noreply|no-reply|helpdesk|department)/i.test(
    senderName
  );
  if (looksLikeOrg && FREE_EMAIL_PROVIDERS.includes(senderDomain)) {
    return {
      label: `Sender claims to be an official department/team but uses a free email provider (${senderDomain})`,
      weight: 15,
    };
  }
  return null;
}

/** Counts urgency-style punctuation/casing as a mild signal (e.g. "ACT NOW!!!"). */
function checkExcessiveUrgency(subject: string, body: string): Indicator | null {
  const combined = `${subject} ${body}`;
  const exclamations = (combined.match(/!/g) || []).length;
  const allCapsWords = (combined.match(/\b[A-Z]{4,}\b/g) || []).length;
  if (exclamations >= 3 || allCapsWords >= 3) {
    return {
      label: "Excessive urgency signals (repeated exclamation marks / all-caps words)",
      weight: 8,
    };
  }
  return null;
}

/** Maps a numeric score to a RiskStatus bucket. */
export function scoreToStatus(score: number): RiskStatus {
  if (score <= RISK_THRESHOLDS.SAFE_MAX) return "Safe";
  if (score <= RISK_THRESHOLDS.SUSPICIOUS_MAX) return "Suspicious";
  return "Phishing";
}

/**
 * Run the full detection pipeline against a parsed EmailData object.
 * Returns a risk score (0-100), status bucket, triggered indicators,
 * and per-link URL analysis.
 */
export function analyzeEmail(email: EmailData): AnalysisResult {
  const indicators: Indicator[] = [];
  const combinedText = `${email.subject}\n${email.bodyText}`;

  scanPhraseTable(combinedText, SUSPICIOUS_KEYWORDS, (p) => `Suspicious phrase detected: "${p}"`, indicators);
  scanPhraseTable(
    combinedText,
    CREDENTIAL_REQUEST_PHRASES,
    (p) => `Requests sensitive information: "${p}"`,
    indicators
  );
  scanPhraseTable(combinedText, THREATENING_PHRASES, (p) => `Threatening language: "${p}"`, indicators);

  const brandIndicator = checkBrandImpersonation(email.senderName, email.senderDomain);
  if (brandIndicator) indicators.push(brandIndicator);

  const freeEmailIndicator = checkFreeEmailMismatch(email.senderName, email.senderDomain);
  if (freeEmailIndicator) indicators.push(freeEmailIndicator);

  const urgencyIndicator = checkExcessiveUrgency(email.subject, email.bodyText);
  if (urgencyIndicator) indicators.push(urgencyIndicator);

  const linkAnalyses = analyzeUrls(email.links);
  const suspiciousLinkCount = linkAnalyses.filter((l) => l.isSuspicious).length;
  if (suspiciousLinkCount > 0) {
    indicators.push({
      label: `${suspiciousLinkCount} suspicious link(s) found in the email body`,
      weight: Math.min(30, suspiciousLinkCount * 10),
    });
  }

  // Sum weights, cap at 100.
  const rawScore = indicators.reduce((sum, i) => sum + i.weight, 0);
  const riskScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  const status = scoreToStatus(riskScore);

  return {
    riskScore,
    status,
    indicators,
    linkAnalyses,
    suspiciousLinkCount,
    email,
  };
}

import type { LinkAnalysis } from "../types";
import { URL_SHORTENERS, SUSPICIOUS_URL_WORDS } from "./constants";

const IP_ADDRESS_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const UNUSUALLY_LONG_THRESHOLD = 75; // characters

/**
 * Analyze a single URL for common phishing red flags:
 * - HTTP instead of HTTPS
 * - raw IP address host
 * - known URL shortener
 * - unusually long URL (often used to hide the real destination)
 * - suspicious words in the path/query (login/verify/secure/etc.)
 */
export function analyzeUrl(rawUrl: string): LinkAnalysis {
  const reasons: string[] = [];
  let parsed: URL | null = null;

  try {
    parsed = new URL(rawUrl);
  } catch {
    // Malformed URL - treat conservatively as suspicious but don't crash.
    return {
      url: rawUrl,
      isHttp: false,
      isIpAddress: false,
      isShortener: false,
      isUnusuallyLong: rawUrl.length > UNUSUALLY_LONG_THRESHOLD,
      hasSuspiciousWords: false,
      isSuspicious: true,
      reasons: ["Malformed or unparsable URL"],
    };
  }

  const isHttp = parsed.protocol === "http:";
  if (isHttp) reasons.push("Uses insecure HTTP instead of HTTPS");

  const hostname = parsed.hostname;
  const isIpAddress = IP_ADDRESS_REGEX.test(hostname);
  if (isIpAddress) reasons.push("Links directly to a raw IP address");

  const isShortener = URL_SHORTENERS.some((s) => hostname === s || hostname.endsWith(`.${s}`));
  if (isShortener) reasons.push("Uses a URL shortening service that hides the real destination");

  const isUnusuallyLong = rawUrl.length > UNUSUALLY_LONG_THRESHOLD;
  if (isUnusuallyLong) reasons.push("Unusually long URL");

  const lowerUrl = rawUrl.toLowerCase();
  const hasSuspiciousWords = SUSPICIOUS_URL_WORDS.some((w) => lowerUrl.includes(w));
  if (hasSuspiciousWords) reasons.push("Contains words typical of credential-harvesting pages");

  const isSuspicious = isHttp || isIpAddress || isShortener || isUnusuallyLong || hasSuspiciousWords;

  return {
    url: rawUrl,
    isHttp,
    isIpAddress,
    isShortener,
    isUnusuallyLong,
    hasSuspiciousWords,
    isSuspicious,
    reasons,
  };
}

/** Analyze a list of raw URLs, deduplicating identical links. */
export function analyzeUrls(urls: string[]): LinkAnalysis[] {
  const unique = Array.from(new Set(urls));
  return unique.map(analyzeUrl);
}

/**
 * Static configuration for the detection engine.
 * Keeping this in one file makes it easy to tune weights without
 * touching detection logic.
 */

/** Keywords/phrases commonly found in phishing & scam emails, with a risk weight each. */
export const SUSPICIOUS_KEYWORDS: { phrase: string; weight: number }[] = [
  { phrase: "verify your account", weight: 12 },
  { phrase: "verify account", weight: 12 },
  { phrase: "click here", weight: 6 },
  { phrase: "update payment", weight: 10 },
  { phrase: "update your payment", weight: 10 },
  { phrase: "password expired", weight: 14 },
  { phrase: "password will expire", weight: 12 },
  { phrase: "login immediately", weight: 14 },
  { phrase: "log in immediately", weight: 14 },
  { phrase: "bank verification", weight: 14 },
  { phrase: "confirm your identity", weight: 10 },
  { phrase: "suspend", weight: 8 },
  { phrase: "suspended", weight: 8 },
  { phrase: "account locked", weight: 12 },
  { phrase: "unusual activity", weight: 8 },
  { phrase: "act now", weight: 8 },
  { phrase: "urgent", weight: 8 },
  { phrase: "immediately", weight: 5 },
  { phrase: "final notice", weight: 10 },
  { phrase: "limited time", weight: 6 },
  { phrase: "winner", weight: 8 },
  { phrase: "congratulations you", weight: 8 },
  { phrase: "claim your prize", weight: 12 },
  { phrase: "wire transfer", weight: 10 },
  { phrase: "gift card", weight: 8 },
];

/** Phrases indicating a request for a secret/credential — heavily weighted. */
export const CREDENTIAL_REQUEST_PHRASES: { phrase: string; weight: number }[] = [
  { phrase: "enter your password", weight: 20 },
  { phrase: "provide your password", weight: 20 },
  { phrase: "your otp", weight: 18 },
  { phrase: "one time password", weight: 18 },
  { phrase: "one-time password", weight: 18 },
  { phrase: "otp code", weight: 18 },
  { phrase: "cvv", weight: 20 },
  { phrase: "card number", weight: 18 },
  { phrase: "credit card details", weight: 20 },
  { phrase: "debit card", weight: 18 },
  { phrase: "bank account number", weight: 18 },
  { phrase: "routing number", weight: 18 },
  { phrase: "social security", weight: 20 },
  { phrase: "ssn", weight: 18 },
  { phrase: "pin number", weight: 18 },
];

/** Threatening / fear-inducing language patterns. */
export const THREATENING_PHRASES: { phrase: string; weight: number }[] = [
  { phrase: "legal action", weight: 12 },
  { phrase: "account will be closed", weight: 12 },
  { phrase: "account will be terminated", weight: 12 },
  { phrase: "failure to comply", weight: 12 },
  { phrase: "you will be charged", weight: 8 },
  { phrase: "permanently deleted", weight: 10 },
  { phrase: "police", weight: 10 },
  { phrase: "arrest", weight: 14 },
  { phrase: "lawsuit", weight: 10 },
];

/** Free webmail providers — not inherently malicious, but relevant when comparing display name vs domain. */
export const FREE_EMAIL_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
  "protonmail.com",
  "icloud.com",
  "mail.com",
  "zoho.com",
  "gmx.com",
];

/** Well known URL shortener domains. */
export const URL_SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "t.co",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "adf.ly",
  "shorte.st",
  "cutt.ly",
  "rebrand.ly",
  "tiny.cc",
  "lnkd.in",
  "rb.gy",
];

/** Well known brands frequently impersonated — used for a lightweight brand/domain mismatch check. */
export const COMMONLY_IMPERSONATED_BRANDS: { brand: string; officialDomains: string[] }[] = [
  { brand: "paypal", officialDomains: ["paypal.com"] },
  { brand: "amazon", officialDomains: ["amazon.com"] },
  { brand: "apple", officialDomains: ["apple.com", "icloud.com"] },
  { brand: "microsoft", officialDomains: ["microsoft.com", "outlook.com", "live.com"] },
  { brand: "google", officialDomains: ["google.com", "gmail.com"] },
  { brand: "netflix", officialDomains: ["netflix.com"] },
  { brand: "bank of america", officialDomains: ["bankofamerica.com"] },
  { brand: "chase", officialDomains: ["chase.com"] },
  { brand: "wells fargo", officialDomains: ["wellsfargo.com"] },
  { brand: "irs", officialDomains: ["irs.gov"] },
  { brand: "dhl", officialDomains: ["dhl.com"] },
  { brand: "fedex", officialDomains: ["fedex.com"] },
  { brand: "linkedin", officialDomains: ["linkedin.com"] },
];

/** Words inside a URL path/query that suggest a credential-harvesting landing page. */
export const SUSPICIOUS_URL_WORDS = [
  "login",
  "verify",
  "secure",
  "account",
  "update",
  "confirm",
  "signin",
  "password",
  "banking",
  "webscr",
  "authenticate",
  "unlock",
];

/** Risk score thresholds. */
export const RISK_THRESHOLDS = {
  SAFE_MAX: 30,
  SUSPICIOUS_MAX: 60,
};

/** Max entries kept in scan history. */
export const MAX_HISTORY_ENTRIES = 20;

/** Chrome storage keys. */
export const STORAGE_KEYS = {
  LATEST_SCAN: "latestScan",
  HISTORY: "scanHistory",
  DARK_MODE: "darkMode",
} as const;

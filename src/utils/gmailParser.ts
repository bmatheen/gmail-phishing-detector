/**
 * DOM scraping helpers for Gmail's web UI.
 *
 * Gmail does not expose a public DOM API, so this relies on the class
 * names/attributes Gmail currently renders. These selectors are the
 * same ones long-used by open-source Gmail extensions. If Gmail
 * changes its markup, only this file needs updating.
 */
import type { EmailData } from "../types";

/** Selector for the subject line of the currently open email/thread. */
const SUBJECT_SELECTOR = "h2.hP";
/** Selector for sender <span> elements which carry `email` and `name` attributes. */
const SENDER_SELECTOR = "span.gD";
/** Selector for expanded message body containers. */
const BODY_SELECTOR = "div.a3s";

/** Returns true if a Gmail message is currently open (subject line present). */
export function isEmailOpen(): boolean {
  return document.querySelector(SUBJECT_SELECTOR) !== null;
}

/** Strip HTML tags and collapse whitespace, returning plain readable text. */
function htmlToPlainText(el: Element): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script,style").forEach((n) => n.remove());
  const text = clone.textContent || "";
  return text.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
}

/** Extract every unique http(s) hyperlink inside a message body element. */
function extractLinks(bodyEl: Element): string[] {
  const anchors = Array.from(bodyEl.querySelectorAll("a[href]"));
  const urls = anchors
    .map((a) => a.getAttribute("href") || "")
    .filter((href) => /^https?:\/\//i.test(href));
  return Array.from(new Set(urls));
}

/**
 * Read the currently open Gmail email from the DOM.
 * Returns null if no email is currently open (e.g. inbox list view).
 */
export function extractOpenEmail(): EmailData | null {
  const subjectEl = document.querySelector(SUBJECT_SELECTOR);
  if (!subjectEl) return null;

  // When a thread has multiple messages expanded, the most recently
  // opened / most relevant one is the last one rendered in the DOM.
  const senderEls = document.querySelectorAll(SENDER_SELECTOR);
  const bodyEls = document.querySelectorAll(BODY_SELECTOR);

  const senderEl = senderEls[senderEls.length - 1] as HTMLElement | undefined;
  const bodyEl = bodyEls[bodyEls.length - 1] as HTMLElement | undefined;

  const senderName = senderEl?.getAttribute("name") || senderEl?.textContent?.trim() || "Unknown sender";
  const senderEmail = senderEl?.getAttribute("email") || "";
  const senderDomain = senderEmail.includes("@") ? senderEmail.split("@")[1].toLowerCase() : "";

  const subject = subjectEl.textContent?.trim() || "(no subject)";
  const bodyText = bodyEl ? htmlToPlainText(bodyEl) : "";
  const links = bodyEl ? extractLinks(bodyEl) : [];

  return {
    senderName,
    senderEmail,
    senderDomain,
    subject,
    bodyText,
    links,
    scannedAt: Date.now(),
  };
}

/**
 * Build a stable identity string for the open email so callers can
 * detect "the user opened a different email" vs. an unrelated DOM mutation.
 */
export function getOpenEmailIdentity(email: EmailData | null): string {
  if (!email) return "";
  return `${email.subject}::${email.senderEmail}::${email.bodyText.length}`;
}

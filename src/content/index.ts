/**
 * Content script entry point.
 * Injected into mail.google.com (see manifest.json). Responsible for:
 *  1. Watching Gmail's SPA for when an email is opened / changed.
 *  2. Extracting sender/subject/body/links from the DOM.
 *  3. Running the local detection engine.
 *  4. Rendering the in-page warning banner.
 *  5. Forwarding the result to the background worker for storage/notifications.
 */
import { extractOpenEmail, getOpenEmailIdentity, isEmailOpen } from "../utils/gmailParser";
import { analyzeEmail } from "../services/phishingDetector";
import { renderBanner, removeBanner } from "./banner";
import type { ExtensionMessage } from "../types";

let lastEmailIdentity = "";
let debounceTimer: number | undefined;

/** Re-check the DOM, and if a *new* email is open, analyze + render + notify. */
function checkForEmailChange(): void {
  if (!isEmailOpen()) {
    if (lastEmailIdentity !== "") {
      lastEmailIdentity = "";
      removeBanner();
    }
    return;
  }

  const email = extractOpenEmail();
  const identity = getOpenEmailIdentity(email);

  // Nothing changed (mutation was unrelated, e.g. a hover tooltip) - skip re-analysis.
  if (!email || identity === lastEmailIdentity) return;

  lastEmailIdentity = identity;

  const result = analyzeEmail(email);
  renderBanner(result);

  const message: ExtensionMessage = { type: "EMAIL_ANALYZED", payload: result };
  chrome.runtime.sendMessage(message).catch(() => {
    // Background worker may not be ready yet; safe to ignore.
  });
}

/** Debounce rapid-fire mutations (Gmail re-renders a lot) into a single check. */
function scheduleCheck(): void {
  if (debounceTimer) window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(checkForEmailChange, 400);
}

function init(): void {
  const observer = new MutationObserver(() => scheduleCheck());
  observer.observe(document.body, { childList: true, subtree: true });

  // Gmail routes between views by changing the URL hash without a full
  // page reload, so we also listen for that directly.
  window.addEventListener("hashchange", scheduleCheck);

  // Initial check in case an email is already open on load.
  scheduleCheck();
}

// Gmail can take a moment to bootstrap its own UI; wait for DOM ready.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

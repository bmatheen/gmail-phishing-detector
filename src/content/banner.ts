/**
 * Renders the in-Gmail warning banner.
 *
 * We deliberately build this with plain DOM APIs (not React) because it
 * is injected directly into Gmail's own page. Keeping it framework-free
 * avoids bundling a second React runtime into the content script and
 * sidesteps CSS/style conflicts with Gmail's own stylesheet.
 */
import type { AnalysisResult } from "../types";

const BANNER_ID = "phishing-guard-banner";

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  Safe: { bg: "#ecfdf5", border: "#16a34a", text: "#065f46", icon: "✅" },
  Suspicious: { bg: "#fffbeb", border: "#d97706", text: "#92400e", icon: "⚠️" },
  Phishing: { bg: "#fef2f2", border: "#dc2626", text: "#991b1b", icon: "❌" },
};

/** Remove any previously injected banner (used before rendering a new one). */
export function removeBanner(): void {
  document.getElementById(BANNER_ID)?.remove();
}

/** Find the container Gmail uses for the open message view, to insert the banner above it. */
function findInsertionPoint(): Element | null {
  const primary = document.querySelector("div.adn.ads");
  if (primary) return primary;
  return document.querySelector("h2.hP")?.closest("div.if, div.gs") ?? null;
}

/** Render (or re-render) the warning banner for the given analysis result. */
export function renderBanner(result: AnalysisResult): void {
  removeBanner();

  const target = findInsertionPoint();
  if (!target || !target.parentElement) return;

  const style = STATUS_STYLES[result.status];
  const topIndicators = [...result.indicators]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((i) => i.label);

  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.setAttribute(
    "style",
    `
    margin: 12px 0;
    padding: 14px 18px;
    border-radius: 8px;
    border: 1px solid ${style.border};
    background: ${style.bg};
    color: ${style.text};
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
  `.trim()
  );

  const reasonsHtml =
    topIndicators.length > 0
      ? `<ul style="margin:6px 0 0 0; padding-left:18px;">${topIndicators
          .map((r) => `<li>${escapeHtml(r)}</li>`)
          .join("")}</ul>`
      : `<div style="margin-top:6px;">No specific red flags detected.</div>`;

  banner.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
      <div style="font-weight:600; font-size:14px;">
        ${style.icon} Phishing Guard &mdash; ${escapeHtml(result.status)}
      </div>
      <div style="font-weight:700;">Risk Score: ${result.riskScore}%</div>
    </div>
    <div style="margin-top:8px; font-weight:600;">Reasons:</div>
    ${reasonsHtml}
  `;

  target.parentElement.insertBefore(banner, target);
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Matches feedback content to a workspace theme using keyword rules.
 * Shared by both the seed script and live ingestion (manual/CSV/channel)
 * so the matching logic only exists in one place — previously this was
 * duplicated between seed.js and the controller, risking drift if one
 * copy got updated and the other didn't.
 *
 * Returns null if no keyword rule matches — callers decide what to do
 * with unmatched feedback (see assignThemesToFeedbacks below), rather
 * than this function silently picking something for them.
 */
export function matchThemeByKeywords(content, themes) {
  const lower = content.toLowerCase();

  if (/\b(onboarding|signup|ux|tour|navigation|dashboard)\b/.test(lower)) {
    return themes.find((t) => t.name === 'Onboarding & UX') || null;
  }
  if (/\b(billing|invoice|payment|checkout|sso|saml)\b/.test(lower)) {
    return themes.find((t) => t.name === 'Billing & Subscriptions') || null;
  }
  if (/\b(speed|slow|performance|timeout|crash|load)\b/.test(lower)) {
    return themes.find((t) => t.name === 'App Performance') || null;
  }
  if (/\b(integration|api|webhook|slack)\b/.test(lower)) {
    return themes.find((t) => t.name === 'Integrations & API') || null;
  }
  if (/\b(request|export|chart|dark mode)\b/.test(lower)) {
    return themes.find((t) => t.name === 'Feature Requests') || null;
  }

  return null;
}

/**
 * Picks a fallback theme for content that matched no keyword rule.
 * Randomly distributes across all themes instead of always picking
 * the same one — avoids artificially inflating a single theme's count
 * (which would happen if every unmatched item defaulted to themes[0]).
 */
export function pickRandomFallbackTheme(themes) {
  if (!themes || themes.length === 0) return null;
  return themes[Math.floor(Math.random() * themes.length)];
}
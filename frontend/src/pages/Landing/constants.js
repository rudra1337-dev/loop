export const PRESETS = [
  {
    text: "The payment page kept spinning and finally threw a timeout error when I tried to upgrade our team account.",
    sentiment: "NEG",
    score: -0.85,
    theme: "💳 Billing & Subscriptions",
    confidence: "98%",
    keywords: ["payment", "spinning", "timeout", "upgrade", "billing"]
  },
  {
    text: "I really love how clean the dashboard is, but our security team needs SSO and SAML logs before we buy.",
    sentiment: "NEU",
    score: 0.15,
    theme: "🔑 Integrations & API",
    confidence: "94%",
    keywords: ["dashboard", "SSO", "SAML", "integrations", "buy"]
  },
  {
    text: "The new bulk import feature saved our customer support team hours of manual CSV formatting today!",
    sentiment: "POS",
    score: 0.95,
    theme: "🚀 Onboarding & UX",
    confidence: "97%",
    keywords: ["saved", "hours", "import", "CSV", "onboarding"]
  }
];

export const INTEGRATIONS = [
  { name: 'Slack', icon: '💬', color: '#4A154B', shadow: 'rgba(74, 21, 75, 0.4)' },
  { name: 'Discord', icon: '🎮', color: '#5865F2', shadow: 'rgba(88, 101, 242, 0.4)' },
  { name: 'App Store', icon: '🍎', color: '#0071E3', shadow: 'rgba(0, 113, 227, 0.4)' },
  { name: 'Zendesk', icon: '🎫', color: '#03363D', shadow: 'rgba(3, 54, 61, 0.4)' },
  { name: 'CSV Loader', icon: '📊', color: '#10B981', shadow: 'rgba(16, 185, 129, 0.4)' }
];

export const CHART_DATA_7D = [
  { day: 'Mon', volume: 24, positive: 18, negative: 6 },
  { day: 'Tue', volume: 38, positive: 25, negative: 13 },
  { day: 'Wed', volume: 30, positive: 22, negative: 8 },
  { day: 'Thu', volume: 55, positive: 41, negative: 14 },
  { day: 'Fri', volume: 48, positive: 35, negative: 13 },
  { day: 'Sat', volume: 62, positive: 50, negative: 12 },
  { day: 'Sun', volume: 75, positive: 61, negative: 14 },
];

export const CHART_DATA_30D = [
  { day: 'Wk 1', volume: 110, positive: 80, negative: 30 },
  { day: 'Wk 2', volume: 145, positive: 105, negative: 40 },
  { day: 'Wk 3', volume: 185, positive: 140, negative: 45 },
  { day: 'Wk 4', volume: 240, positive: 195, negative: 45 },
];

export const MOCK_INBOX_ITEMS = [
  { id: 1, text: "SSO login keeps rejecting active tokens after workspace migrations.", theme: "🔑 Integrations & API", sentiment: "NEG", time: "2 mins ago" },
  { id: 2, text: "Love the new Recharts dashboard, loads instantly on mobile!", theme: "🚀 Onboarding & UX", sentiment: "POS", time: "15 mins ago" },
  { id: 3, text: "Need invoice invoices converted to custom business structures.", theme: "💳 Billing & Subscriptions", sentiment: "NEU", time: "1 hour ago" },
];

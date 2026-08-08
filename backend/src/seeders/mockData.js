export const initialThemes = [
  { name: 'Onboarding & UX', description: 'User signup, initial tour, and navigation ease.', color: '#3B82F6' },
  { name: 'Billing & Subscriptions', description: 'Invoices, payments, upgrades, and checkout bugs.', color: '#EF4444' },
  { name: 'App Performance', description: 'Loading speeds, page timeouts, and crashes.', color: '#10B981' },
  { name: 'Integrations & API', description: 'Webhooks, API limits, and third-party tools.', color: '#8B5CF6' },
  { name: 'Feature Requests', description: 'Desired tools, export formats, and UI controls.', color: '#F59E0B' },
];

const feedbackTemplates = [
  // Support Tickets
  { content: "Onboarding took forever - I couldn't figure out how to invite my team.", channel: 'Support Ticket', sentiment: 'NEG', sentimentScore: -0.85, status: 'NEW' },
  { content: "Billing page keeps timing out when I try to download an invoice PDF.", channel: 'Support Ticket', sentiment: 'NEG', sentimentScore: -0.75, status: 'NEW' },
  { content: "Need SSO support urgently. Our security team won't approve without SAML.", channel: 'Support Ticket', sentiment: 'NEG', sentimentScore: -0.60, status: 'REVIEWED' },
  { content: "How do I export raw analytics data to CSV? Can't find the export button.", channel: 'Support Ticket', sentiment: 'NEU', sentimentScore: 0.00, status: 'REVIEWED' },
  { content: "Password reset link is broken. The token expires immediately upon arrival.", channel: 'Support Ticket', sentiment: 'NEG', sentimentScore: -0.90, status: 'NEW' },

  // App Store Reviews
  { content: "The new dashboard update is gorgeous and finally fast! Huge improvement.", channel: 'App Store Review', sentiment: 'POS', sentimentScore: 0.95, status: 'ACTIONED' },
  { content: "Great tool overall, but the mobile web view feels very cramped.", channel: 'App Store Review', sentiment: 'NEU', sentimentScore: 0.30, status: 'REVIEWED' },
  { content: "App keeps logging me out every 10 minutes. Extremely frustrating UX.", channel: 'App Store Review', sentiment: 'NEG', sentimentScore: -0.80, status: 'NEW' },
  { content: "Best customer intelligence tool our team has used this year!", channel: 'App Store Review', sentiment: 'POS', sentimentScore: 0.90, status: 'ACTIONED' },

  // NPS Surveys
  { content: "It does the job well for basic search, but reporting needs work.", channel: 'NPS Survey', sentiment: 'NEU', sentimentScore: 0.10, status: 'REVIEWED' },
  { content: "Would recommend 10/10. Replaced three spreadsheets for our product leads.", channel: 'NPS Survey', sentiment: 'POS', sentimentScore: 0.88, status: 'ACTIONED' },
  { content: "Charts load slow when filtering by date ranges longer than 30 days.", channel: 'NPS Survey', sentiment: 'NEG', sentimentScore: -0.50, status: 'NEW' },

  // Sales Call Notes
  { content: "Prospect loved the AI clustering demo, but requested custom role permissions.", channel: 'Sales Call Note', sentiment: 'POS', sentimentScore: 0.60, status: 'REVIEWED' },
  { content: "Client blocked deal until dark mode and audit logs are shipped.", channel: 'Sales Call Note', sentiment: 'NEG', sentimentScore: -0.40, status: 'NEW' },

  // Community Posts
  { content: "Love the new export feature! Saved our team an hour of manual work today.", channel: 'Community Post', sentiment: 'POS', sentimentScore: 0.85, status: 'ACTIONED' },
  { content: "Is there a webhook available when new high-priority feedback arrives?", channel: 'Community Post', sentiment: 'NEU', sentimentScore: 0.05, status: 'NEW' },
];

// Helper to generate 120+ items by distributing templates across time
export function generate120FeedbackItems(workspaceId) {
  const items = [];
  const channels = ['Support Ticket', 'App Store Review', 'NPS Survey', 'Sales Call Note', 'Community Post'];
  const customerLabels = ['Enterprise', 'Pro Plan', 'Free Tier', 'Trial User', 'VIP Client'];

  for (let i = 0; i < 125; i++) {
    const template = feedbackTemplates[i % feedbackTemplates.length];
    
    // Create subtle variations and realistic random timestamps within past 30 days
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randomDaysAgo);

    items.push({
      content: `${template.content} (Ref #${1000 + i})`,
      channel: channels[i % channels.length],
      customerLabel: customerLabels[i % customerLabels.length],
      sentiment: template.sentiment,
      sentimentScore: template.sentimentScore,
      status: template.status,
      workspaceId: workspaceId,
      createdAt: createdAt,
    });
  }

  return items;
}
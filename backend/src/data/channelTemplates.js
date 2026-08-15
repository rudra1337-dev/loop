// Realistic feedback templates per simulated channel.
// Sentiment is pre-assigned here (not sent through Gemini) — this keeps
// simulate-clicks instant and avoids burning AI rate limits on fake data
// the content itself is already authored to match the labeled sentiment.

export const channelTemplates = {
  'Slack Chat': [
    { content: "Hey team, just got a message from a customer saying our new export feature is 🔥 — saved them hours.", sentiment: 'POS', sentimentScore: 0.85 },
    { content: "Client in the #support channel is asking why bulk actions aren't working on Safari. Third time this week.", sentiment: 'NEG', sentimentScore: -0.7 },
    { content: "FYI — customer success flagged that onboarding drop-off is still high around step 3.", sentiment: 'NEG', sentimentScore: -0.5 },
    { content: "Someone in the community Slack just said our pricing page is confusing compared to competitors.", sentiment: 'NEG', sentimentScore: -0.4 },
    { content: "Got a nice shoutout from a customer today — said the new dashboard redesign is way faster.", sentiment: 'POS', sentimentScore: 0.8 },
    { content: "Support ping: user can't figure out how to invite teammates, UI isn't obvious.", sentiment: 'NEG', sentimentScore: -0.55 },
    { content: "Customer mentioned they'd pay more for an audit log feature — worth flagging to product.", sentiment: 'NEU', sentimentScore: 0.1 },
    { content: "Quick win — a user said the mobile experience finally feels usable after the last update.", sentiment: 'POS', sentimentScore: 0.75 },
    { content: "Heads up, a client asked about SSO support again. This is becoming a recurring blocker for enterprise deals.", sentiment: 'NEG', sentimentScore: -0.6 },
    { content: "Someone just posted that our API docs are genuinely well written, nice to hear.", sentiment: 'POS', sentimentScore: 0.7 },
  ],

  'Support Email': [
    { content: "Subject: Invoice download broken — I've tried three times and the PDF never generates. Please fix ASAP.", sentiment: 'NEG', sentimentScore: -0.8 },
    { content: "Subject: Thank you! Just wanted to say the new analytics view is exactly what our team needed.", sentiment: 'POS', sentimentScore: 0.85 },
    { content: "Subject: Feature request — could you add CSV export to the reports page? Would save us a lot of manual work.", sentiment: 'NEU', sentimentScore: 0.15 },
    { content: "Subject: Login issues — I keep getting logged out every few minutes, very disruptive during work.", sentiment: 'NEG', sentimentScore: -0.75 },
    { content: "Subject: Question about roles — can Viewers ever be given limited edit access? Just curious about roadmap.", sentiment: 'NEU', sentimentScore: 0.05 },
    { content: "Subject: Great support experience — your team resolved my ticket in under an hour, really appreciated.", sentiment: 'POS', sentimentScore: 0.9 },
    { content: "Subject: Slow load times — the dashboard takes 8-10 seconds to load with our data volume, feels sluggish.", sentiment: 'NEG', sentimentScore: -0.6 },
    { content: "Subject: Loving the product so far, just switched from a spreadsheet workflow and it's night and day.", sentiment: 'POS', sentimentScore: 0.8 },
  ],

  API: [
    { content: "The application interface is smooth and intuitive, our team picked it up in a day.", sentiment: 'POS', sentimentScore: 0.75 },
    { content: "We've noticed occasional timeout errors on the analytics endpoint during peak hours.", sentiment: 'NEG', sentimentScore: -0.5 },
    { content: "Integration was straightforward, docs were clear and examples worked out of the box.", sentiment: 'POS', sentimentScore: 0.7 },
    { content: "Would be great to have webhook support for real-time feedback status changes.", sentiment: 'NEU', sentimentScore: 0.1 },
    { content: "Rate limits feel a bit tight for our usage pattern, we're hitting them during bulk syncs.", sentiment: 'NEG', sentimentScore: -0.45 },
  ],
};

// Shuffles and returns up to `count` items from a channel's template list,
// with slight content variation (a reference tag) so repeated clicks
// don't create byte-identical rows.
export function getSimulatedItems(channel, count = 10) {
  const pool = channelTemplates[channel];
  if (!pool) return [];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, pool.length));

  return selected.map((item, idx) => ({
    ...item,
    content: `${item.content} (Ref #${Date.now().toString().slice(-4)}${idx})`,
  }));
}
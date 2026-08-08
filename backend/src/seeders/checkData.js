import { sequelize, Workspace, User, Theme, Feedback } from '../models/index.js';

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('\n====================================');
    console.log('      DATABASE DATA VERIFICATION     ');
    console.log('====================================\n');

    // 1. Workspaces
    const workspaces = await Workspace.findAll();
    console.log(`WORKSPACES (${workspaces.length}):`);
    console.table(workspaces.map((w) => ({ ID: w.id, Name: w.name })));

    // 2. Users
    const users = await User.findAll();
    console.log(`\nUSERS (${users.length}):`);
    console.table(users.map((u) => ({ Name: u.name, Email: u.email, Role: u.role, WorkspaceID: u.workspaceId })));

    // 3. Themes
    const themes = await Theme.findAll();
    console.log(`\nTHEMES (${themes.length}):`);
    console.table(themes.map((t) => ({ Name: t.name, Color: t.color, WorkspaceID: t.workspaceId })));

    // 4. Feedback Totals by Channel
    const feedbackCounts = await Feedback.findAll({
      attributes: ['channel', [sequelize.fn('COUNT', sequelize.col('id')), 'totalItems']],
      group: ['channel'],
    });
    console.log('\nFEEDBACK COUNT BY CHANNEL:');
    console.table(feedbackCounts.map((f) => f.toJSON()));

    // 5. Sample Feedback Rows
    const samples = await Feedback.findAll({ limit: 5 });
    console.log('\nSAMPLE FEEDBACK ITEMS (FIRST 5):');
    console.table(samples.map((f) => ({
      Channel: f.channel,
      Sentiment: f.sentiment,
      Score: f.sentimentScore,
      Status: f.status,
      Content: f.content.substring(0, 45) + '...',
    })));

    process.exit(0);
  } catch (error) {
    console.error('Data check failed:', error);
    process.exit(1);
  }
}

checkData();
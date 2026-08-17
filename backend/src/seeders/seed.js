import bcrypt from 'bcryptjs';
import { sequelize, Workspace, User, Feedback, Theme, FeedbackTheme } from '../models/index.js';
import { initialThemes, generate120FeedbackItems } from './mockData.js';
import { matchThemeByKeywords, pickRandomFallbackTheme } from '../utils/themeMatcher.js';

async function seedDatabase() {
  try {
    console.log('Connecting to database and dropping old tables...');
    await sequelize.sync({ force: true }); // Recreates all tables cleanly
    console.log('Database synced.');

    // 1. Create Primary Workspace
    const workspace = await Workspace.create({
      name: 'Acme Corp Demo Workspace',
    });
    console.log(`Workspace created with ID: ${workspace.id}`);

    // 2. Hash Password & Create 3 Required Users
    const passwordHash = await bcrypt.hash('Password123!', 10);
    
    const users = await User.bulkCreate([
      {
        name: 'Admin User',
        email: 'admin@acme.com',
        passwordHash,
        role: 'ADMIN',
        workspaceId: workspace.id,
      },
      {
        name: 'Analyst User',
        email: 'analyst@acme.com',
        passwordHash,
        role: 'ANALYST',
        workspaceId: workspace.id,
      },
      {
        name: 'Viewer User',
        email: 'viewer@acme.com',
        passwordHash,
        role: 'VIEWER',
        workspaceId: workspace.id,
      },
    ]);
    console.log(`Created ${users.length} users across ADMIN, ANALYST, VIEWER roles.`);

    // 3. Create Default Themes
    const themesToCreate = initialThemes.map((t) => ({
      ...t,
      workspaceId: workspace.id,
    }));
    const themes = await Theme.bulkCreate(themesToCreate);
    console.log(`Created ${themes.length} initial themes.`);

    // 4. Generate & Insert 125 Feedback Records
    const feedbackItems = generate120FeedbackItems(workspace.id);
    const feedback = await Feedback.bulkCreate(feedbackItems);
    console.log(`Successfully seeded ${feedback.length} multi-channel feedback records!`);

    // 5. Associate Feedbacks with Themes using keyword mapping
    console.log('Associating feedbacks with themes...');
    const feedbackThemesToCreate = [];

    for (const item of feedback) {
      const keywordMatch = matchThemeByKeywords(item.content, themes);
      const matchedTheme = keywordMatch || pickRandomFallbackTheme(themes);
      if (!matchedTheme) continue;

      feedbackThemesToCreate.push({
        feedbackId: item.id,
        themeId: matchedTheme.id,
        confidence: keywordMatch ? 1.0 : 0.3,
      });
    }

    if (feedbackThemesToCreate.length > 0) {
      await FeedbackTheme.bulkCreate(feedbackThemesToCreate);
      console.log(`Associated ${feedbackThemesToCreate.length} feedback-theme relations.`);
    }

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('Demo Credentials for README:');
    console.log('Admin:   admin@acme.com / Password123!');
    console.log('Analyst: analyst@acme.com / Password123!');
    console.log('Viewer:  viewer@acme.com / Password123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
import bcrypt from 'bcryptjs';
import { sequelize, Workspace, User, Feedback, Theme, FeedbackTheme } from '../models/index.js';
import { initialThemes, generate120FeedbackItems } from './mockData.js';

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
      let matchedTheme = null;
      const lowerContent = item.content.toLowerCase();
      if (lowerContent.includes('onboarding') || lowerContent.includes('signup') || lowerContent.includes('ux') || lowerContent.includes('tour') || lowerContent.includes('navigation') || lowerContent.includes('dashboard')) {
        matchedTheme = themes.find(t => t.name === 'Onboarding & UX');
      } else if (lowerContent.includes('billing') || lowerContent.includes('invoice') || lowerContent.includes('payment') || lowerContent.includes('checkout') || lowerContent.includes('sso') || lowerContent.includes('saml')) {
        matchedTheme = themes.find(t => t.name === 'Billing & Subscriptions');
      } else if (lowerContent.includes('speed') || lowerContent.includes('slow') || lowerContent.includes('performance') || lowerContent.includes('timeout') || lowerContent.includes('crash') || lowerContent.includes('load')) {
        matchedTheme = themes.find(t => t.name === 'App Performance');
      } else if (lowerContent.includes('integration') || lowerContent.includes('api') || lowerContent.includes('webhook') || lowerContent.includes('slack')) {
        matchedTheme = themes.find(t => t.name === 'Integrations & API');
      } else if (lowerContent.includes('request') || lowerContent.includes('export') || lowerContent.includes('chart') || lowerContent.includes('dark mode')) {
        matchedTheme = themes.find(t => t.name === 'Feature Requests');
      }
      
      // If no keyword match, randomly assign a theme
      if (!matchedTheme) {
        matchedTheme = themes[Math.floor(Math.random() * themes.length)];
      }

      feedbackThemesToCreate.push({
        feedbackId: item.id,
        themeId: matchedTheme.id,
        confidence: 1.0
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
import bcrypt from 'bcryptjs';
import { sequelize, Workspace, User, Feedback, Theme } from '../models/index.js';
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
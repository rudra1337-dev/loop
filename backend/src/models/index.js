import sequelize from '../config/database.js';
import Workspace from './Workspace.js';
import User from './User.js';
import Feedback from './Feedback.js';
import Theme from './Theme.js';
import FeedbackTheme from './FeedbackTheme.js';
import Embedding from './Embedding.js';
import Report from './Report.js';
import WorkspaceInvite from './WorkspaceInvite.js';

// ==========================================
// 1. MULTI-TENANT WORKSPACE ISOLATION
// Every tenant entity belongs to a Workspace
// ==========================================

// Workspace <-> Users (One Workspace has many Users)
Workspace.hasMany(User, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
User.belongsTo(Workspace, { foreignKey: 'workspaceId' });

// Workspace <-> Feedback (One Workspace has many Feedback items)
Workspace.hasMany(Feedback, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Feedback.belongsTo(Workspace, { foreignKey: 'workspaceId' });

// Workspace <-> Themes (One Workspace has many Themes)
Workspace.hasMany(Theme, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Theme.belongsTo(Workspace, { foreignKey: 'workspaceId' });

// Workspace <-> Reports (One Workspace has many Reports)
Workspace.hasMany(Report, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
Report.belongsTo(Workspace, { foreignKey: 'workspaceId' });

// Workspace <-> WorkspaceInvite (One Workspace has many Invites)
Workspace.hasMany(WorkspaceInvite, { foreignKey: 'workspaceId', onDelete: 'CASCADE' });
WorkspaceInvite.belongsTo(Workspace, { foreignKey: 'workspaceId' });

// ==========================================
// 2. ENTITY RELATIONSHIPS
// ==========================================

// Feedback <-> Theme (Many-to-Many via FeedbackTheme join table)
Feedback.belongsToMany(Theme, {
  through: FeedbackTheme,
  foreignKey: 'feedbackId',
  otherKey: 'themeId'
});

Theme.belongsToMany(Feedback, {
  through: FeedbackTheme,
  foreignKey: 'themeId',
  otherKey: 'feedbackId'
});

// Feedback <-> Embedding (One-to-One: Each Feedback item has one Embedding vector)
Feedback.hasOne(Embedding, { foreignKey: 'feedbackId', onDelete: 'CASCADE' });
Embedding.belongsTo(Feedback, { foreignKey: 'feedbackId' });

// User <-> Report (One User generates many Reports)
User.hasMany(Report, { foreignKey: 'generatedBy' });
Report.belongsTo(User, { foreignKey: 'generatedBy' });

// User <-> WorkspaceInvite (track who generated each invite)
User.hasMany(WorkspaceInvite, { foreignKey: 'createdBy' });
WorkspaceInvite.belongsTo(User, { foreignKey: 'createdBy' });

// Export everything together
export {
  sequelize,
  Workspace,
  User,
  Feedback,
  Theme,
  FeedbackTheme,
  Embedding,
  Report,
  WorkspaceInvite, // add to exports
};
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WorkspaceInvite = sequelize.define('WorkspaceInvite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // The opaque token used in the shareable link — NOT the same as the DB id,
  // so we can rotate/regenerate without breaking foreign keys elsewhere.
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'ANALYST', 'VIEWER'),
    allowNull: false,
  },
  // Lets an admin revoke a link without deleting the audit trail.
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  workspaceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
});

export default WorkspaceInvite;
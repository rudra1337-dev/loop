import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Theme = sequelize.define('Theme', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  color: { type: DataTypes.STRING },
  workspaceId: { type: DataTypes.UUID, allowNull: false }, // Company Tag
});

export default Theme;

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Report = sequelize.define('Report', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  periodStart: { type: DataTypes.DATE, allowNull: false },
  periodEnd: { type: DataTypes.DATE, allowNull: false },
  contentJson: { type: DataTypes.JSON, allowNull: false },
  generatedBy: { type: DataTypes.UUID, allowNull: false },
  workspaceId: { type: DataTypes.UUID, allowNull: false }, // Company Tag
});

export default Report;
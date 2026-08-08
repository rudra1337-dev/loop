import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Feedback = sequelize.define('Feedback', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  channel: { type: DataTypes.STRING, allowNull: false },
  customerLabel: { type: DataTypes.STRING },
  sentiment: { type: DataTypes.ENUM('POS', 'NEU', 'NEG') },
  sentimentScore: { type: DataTypes.FLOAT },
  status: { type: DataTypes.ENUM('NEW', 'REVIEWED', 'ACTIONED'), defaultValue: 'NEW' },
  workspaceId: { type: DataTypes.UUID, allowNull: false }, // Company Tag
});

export default Feedback;
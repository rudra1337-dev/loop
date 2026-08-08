import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Embedding = sequelize.define('Embedding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vector: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  feedbackId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
});

export default Embedding;
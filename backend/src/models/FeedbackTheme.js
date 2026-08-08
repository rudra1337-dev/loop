import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const FeedbackTheme = sequelize.define('FeedbackTheme', {
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
  },
});

export default FeedbackTheme;
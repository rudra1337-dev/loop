import app from "./app.js";
import dotenv from "dotenv";
import testConnection from "./config/testConnection.js";
import sequelize from "./config/database.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testConnection();

    await sequelize.sync();
    // await sequelize.sync({ alter: true });

    console.log("✅ Database models synchronized");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
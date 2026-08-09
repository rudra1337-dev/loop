import sequelize from "./database.js";

const testConnection = async () => {
  try {
    await sequelize.authenticate();

    console.log("✅ MySQL database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error.message);
  }
};

export default testConnection;
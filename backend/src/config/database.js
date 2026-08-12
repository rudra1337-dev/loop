import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const ca = process.env.DB_CA
  ? `-----BEGIN CERTIFICATE-----\n${process.env.DB_CA.match(/.{1,64}/g).join("\n")}\n-----END CERTIFICATE-----`
  : undefined;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",

    dialectOptions: {
      ssl: {
        require: process.env.DB_SSL === "true",
        ca,
        rejectUnauthorized: false,
      },
    },

    logging: false,
  },
);

export default sequelize;
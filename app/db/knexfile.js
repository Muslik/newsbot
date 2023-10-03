import path from 'path';
import { fileURLToPath } from "url";
import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  client: config.databaseClient,
  connection: {
    filename: path.join(__dirname, 'db.sqlite3'),
    /* database: config.databaseName, */
    /* user: config.databaseUser, */
    /* password: config.databasePassword, */
    /* host: config.databaseHost, */
    /* port: config.databasePort, */
  },
  migrations: {
    tableName: "knex_migrations",
  },
  useNullAsDefault: true,
  pool: {
    min: 2,
    max: 10,
  },
};

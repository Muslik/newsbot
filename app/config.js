import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  telegramSession: process.env.TELEGRAM_SESSION ?? "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramApiId: process.env.TELEGRAM_API_ID,
  telegramApiHash: process.env.TELEGRAM_API_HASH,
  databaseHost: process.env.DATABASE_HOST,
  databasePort: process.env.DATABASE_PORT,
  databaseUser: process.env.DATABASE_USER,
  databasePassword: process.env.DATABASE_PASSWORD,
  databaseName: process.env.DATABASE_NAME,
  databaseClient: process.env.DATABASE_CLIENT,
  primaryChannel: process.env.PRIMARY_CHANNEL,
};

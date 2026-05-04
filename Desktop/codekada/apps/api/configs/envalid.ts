import dotenv from "dotenv";
import { cleanEnv, num, str } from "envalid";

import path from "path";
dotenv.config({ path: path.join(process.cwd(), "../../.env") });

export const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  DATABASE_URL: str(),
  ACCESS_TOKEN_SECRET: str(),
  REFRESH_TOKEN_SECRET: str(),
  GROQ_API_KEY: str(),
});

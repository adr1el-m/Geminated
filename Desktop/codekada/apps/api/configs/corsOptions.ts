import { type CorsOptions } from "cors";

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

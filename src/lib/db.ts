import { neon } from '@neondatabase/serverless';

let client: any = null;

// Lazy-initialized database client to prevent build-time crashes
export const db = (async (strings: TemplateStringsArray, ...values: any[]) => {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured. Please add it to your environment variables.');
    }
    client = neon(connectionString);
  }
  return client(strings, ...values);
}) as any;
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso',  // Changed from 'sqlite' to 'turso'
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  },
});
import { defineConfig } from "@prisma/config";

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed-all.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.DIRECT_URL,
  },
});

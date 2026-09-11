import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'src/app/prisma/schema.prisma',
  migrations: {
    path: 'src/app/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
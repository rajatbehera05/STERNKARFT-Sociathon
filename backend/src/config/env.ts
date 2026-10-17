import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(5001),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres@127.0.0.1:5434/sternkraft_db?schema=public'),
  API_VERSION: z.string().default('1.0.0'),
  SERVICE_NAME: z.string().default('sternx-unified-backend'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config] Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const rawOrigins = parsed.data.CORS_ALLOWED_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const env = {
  ...parsed.data,
  corsAllowedOrigins: rawOrigins,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  isDevelopment: parsed.data.NODE_ENV === 'development',
};

export type EnvConfig = typeof env;

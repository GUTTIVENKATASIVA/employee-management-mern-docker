import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Build the MongoDB connection string.
 * MONGO_URI wins if set (handy for local development). Otherwise the URI is
 * assembled from the individual MONGO_* variables that docker-compose passes in,
 * with the credentials URL-encoded so special characters in passwords are safe.
 */
export function buildMongoUri(env = process.env) {
  if (env.MONGO_URI) return env.MONGO_URI;

  const host = env.MONGO_HOST || 'localhost';
  const port = env.MONGO_PORT || '27017';
  const dbName = env.MONGO_DB_NAME || 'employee_db';
  const user = env.MONGO_USERNAME;

  if (!user) return `mongodb://${host}:${port}/${dbName}`;

  const password = encodeURIComponent(env.MONGO_PASSWORD || '');
  return `mongodb://${encodeURIComponent(user)}:${password}@${host}:${port}/${dbName}?authSource=admin`;
}

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 5000,
    mongoUri: buildMongoUri(env),
    corsOrigin: env.CORS_ORIGIN || '*',
    seedOnStart: String(env.SEED_ON_START || 'false').toLowerCase() === 'true',
    seedFile:
      env.SEED_FILE || path.resolve(here, '../../database/sample-employees.json'),
    mongoMaxRetries: Number(env.MONGO_MAX_RETRIES) || 30,
    mongoRetryDelayMs: Number(env.MONGO_RETRY_DELAY_MS) || 3000
  };
}

export const config = loadConfig();

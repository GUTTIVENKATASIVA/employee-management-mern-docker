import mongoose from 'mongoose';
import { createApp } from './app.js';
import { config } from './config.js';
import { createMongoRepository } from './repositories/mongoEmployeeRepository.js';
import { seedIfEmpty } from './seed.js';

const repository = createMongoRepository();
const app = createApp({
  repository,
  isDatabaseReady: () => mongoose.connection.readyState === 1,
  corsOrigin: config.corsOrigin
});

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`Employee API listening on port ${config.port}`);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectWithRetry() {
  for (let attempt = 1; attempt <= config.mongoMaxRetries; attempt += 1) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB.');
      return true;
    } catch (err) {
      console.error(
        `MongoDB connection attempt ${attempt}/${config.mongoMaxRetries} failed: ${err.message}`
      );
      await sleep(config.mongoRetryDelayMs);
    }
  }
  return false;
}

const connected = await connectWithRetry();
if (!connected) {
  console.error('Could not connect to MongoDB. Exiting.');
  process.exit(1);
}

if (config.seedOnStart) {
  try {
    await seedIfEmpty({ repository, seedFile: config.seedFile });
  } catch (err) {
    console.error('Seeding failed (the API will keep running):', err.message);
  }
}

async function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

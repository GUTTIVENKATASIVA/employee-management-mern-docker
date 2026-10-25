// Usage: npm run seed            -> seed only when the collection is empty
//        npm run seed -- --reset -> delete every employee, then re-seed
import mongoose from 'mongoose';
import { config } from './config.js';
import { createMongoRepository } from './repositories/mongoEmployeeRepository.js';
import { seedIfEmpty } from './seed.js';

const repository = createMongoRepository();

try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 8000 });
  if (process.argv.includes('--reset')) {
    await repository.deleteAll();
    console.log('Removed all existing employees.');
  }
  await seedIfEmpty({ repository, seedFile: config.seedFile });
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

import fs from 'node:fs/promises';
import { validateEmployee } from './validation.js';

/** Read and validate the sample data file. Throws if any record is invalid. */
export async function loadSeedFile(seedFile) {
  const raw = await fs.readFile(seedFile, 'utf8');
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) throw new Error('Seed file must contain a JSON array.');

  return records.map((record, index) => {
    const { valid, errors, value } = validateEmployee(record);
    if (!valid) {
      throw new Error(`Seed record #${index + 1} is invalid: ${JSON.stringify(errors)}`);
    }
    return value;
  });
}

/** Insert sample employees only when the collection is empty. */
export async function seedIfEmpty({ repository, seedFile, log = console.log }) {
  let items;
  try {
    items = await loadSeedFile(seedFile);
  } catch (err) {
    if (err.code === 'ENOENT') {
      log(`Seed file not found at ${seedFile}; skipping seeding.`);
      return 0;
    }
    throw err;
  }

  if ((await repository.count()) > 0) {
    log('Employees already exist; skipping seeding.');
    return 0;
  }

  const inserted = await repository.insertMany(items);
  log(`Seeded ${inserted} sample employees.`);
  return inserted;
}

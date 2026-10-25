import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSeedFile, seedIfEmpty } from '../src/seed.js';
import { createMemoryRepository } from './helpers/memoryRepository.js';

const seedFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../database/sample-employees.json'
);
const silent = () => {};

test('sample-employees.json contains valid, unique-email records', async () => {
  const items = await loadSeedFile(seedFile);
  assert.ok(items.length >= 10);
  assert.equal(new Set(items.map((e) => e.email)).size, items.length);
});

test('seedIfEmpty inserts once and never duplicates', async () => {
  const repository = createMemoryRepository();
  const first = await seedIfEmpty({ repository, seedFile, log: silent });
  const second = await seedIfEmpty({ repository, seedFile, log: silent });
  assert.ok(first > 0);
  assert.equal(second, 0);
  assert.equal(await repository.count(), first);
});

test('seedIfEmpty skips quietly when the file is missing', async () => {
  const repository = createMemoryRepository();
  const inserted = await seedIfEmpty({
    repository,
    seedFile: path.join(path.dirname(seedFile), 'does-not-exist.json'),
    log: silent
  });
  assert.equal(inserted, 0);
});

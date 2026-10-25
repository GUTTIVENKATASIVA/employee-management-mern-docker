import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createMemoryRepository } from './helpers/memoryRepository.js';

const sample = (overrides = {}) => ({
  name: 'Test Person',
  email: 'test.person@example.com',
  phone: '+91 90000 00000',
  department: 'Engineering',
  position: 'Developer',
  salary: 900000,
  joiningDate: '2024-01-15',
  status: 'Active',
  ...overrides
});

let server;
let base;
let dbReady;

before(async () => {
  dbReady = true;
  const app = createApp({
    repository: createMemoryRepository(),
    isDatabaseReady: () => dbReady
  });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  dbReady = true;
  const list = await (await fetch(`${base}/api/employees`)).json();
  for (const e of list.data) await fetch(`${base}/api/employees/${e.id}`, { method: 'DELETE' });
});

const send = (method, path, body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

test('GET /api/health reports ok, and 503 when the database is down', async () => {
  const ok = await fetch(`${base}/api/health`);
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).database, 'connected');

  dbReady = false;
  const down = await fetch(`${base}/api/health`);
  assert.equal(down.status, 503);
  assert.equal((await down.json()).status, 'degraded');

  const blocked = await fetch(`${base}/api/employees`);
  assert.equal(blocked.status, 503);
});

test('POST creates an employee (201) and GET by id returns it', async () => {
  const created = await send('POST', '/api/employees', sample());
  assert.equal(created.status, 201);
  const { data } = await created.json();
  assert.ok(data.id);

  const fetched = await fetch(`${base}/api/employees/${data.id}`);
  assert.equal(fetched.status, 200);
  assert.equal((await fetched.json()).data.email, 'test.person@example.com');
});

test('POST with invalid data returns 422 with field details', async () => {
  const res = await send('POST', '/api/employees', sample({ email: 'bad', salary: -5 }));
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.ok(body.details.email);
  assert.ok(body.details.salary);
});

test('POST with a duplicate email returns 409', async () => {
  await send('POST', '/api/employees', sample());
  const dup = await send('POST', '/api/employees', sample({ name: 'Someone Else' }));
  assert.equal(dup.status, 409);
});

test('malformed JSON returns 400', async () => {
  const res = await fetch(`${base}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ not json'
  });
  assert.equal(res.status, 400);
});

test('PUT updates an employee; unknown id returns 404; bad id returns 400', async () => {
  const { data } = await (await send('POST', '/api/employees', sample())).json();

  const updated = await send('PUT', `/api/employees/${data.id}`, sample({ position: 'Lead' }));
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).data.position, 'Lead');

  const missing = await send('PUT', '/api/employees/aaaaaaaaaaaaaaaaaaaaaaaa', sample());
  assert.equal(missing.status, 404);

  const invalid = await send('PUT', '/api/employees/not-an-id', sample());
  assert.equal(invalid.status, 400);
});

test('DELETE removes an employee, then returns 404', async () => {
  const { data } = await (await send('POST', '/api/employees', sample())).json();
  assert.equal((await send('DELETE', `/api/employees/${data.id}`)).status, 200);
  assert.equal((await send('DELETE', `/api/employees/${data.id}`)).status, 404);
  assert.equal((await fetch(`${base}/api/employees/${data.id}`)).status, 404);
});

test('search and department filters narrow the list', async () => {
  await send('POST', '/api/employees', sample());
  await send(
    'POST',
    '/api/employees',
    sample({ name: 'Mala Rao', email: 'mala@example.com', department: 'Finance', position: 'Accountant' })
  );

  const bySearch = await (await fetch(`${base}/api/employees?search=accountant`)).json();
  assert.equal(bySearch.count, 1);
  assert.equal(bySearch.data[0].name, 'Mala Rao');

  const byDept = await (await fetch(`${base}/api/employees?department=Engineering`)).json();
  assert.equal(byDept.count, 1);

  const bad = await fetch(`${base}/api/employees?department=Nope`);
  assert.equal(bad.status, 400);
});

test('GET /api/stats returns aggregates', async () => {
  await send('POST', '/api/employees', sample({ salary: 100 }));
  await send('POST', '/api/employees', sample({ email: 'b@example.com', salary: 300 }));
  const { data } = await (await fetch(`${base}/api/stats`)).json();
  assert.equal(data.totalEmployees, 2);
  assert.equal(data.averageSalary, 200);
  assert.equal(data.byDepartment[0].department, 'Engineering');
});

test('unknown routes return a JSON 404', async () => {
  const res = await fetch(`${base}/api/nothing-here`);
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error);
});

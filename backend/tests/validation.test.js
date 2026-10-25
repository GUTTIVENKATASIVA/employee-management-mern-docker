import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEmployee } from '../src/validation.js';

const good = {
  name: '  Asha Patel ',
  email: 'ASHA@Example.com',
  phone: '+91 90000 11111',
  department: 'Finance',
  position: 'Analyst',
  salary: '750000',
  joiningDate: '2024-02-29',
  status: 'Active'
};

test('accepts a valid payload and normalises values', () => {
  const { valid, value } = validateEmployee(good);
  assert.equal(valid, true);
  assert.equal(value.name, 'Asha Patel');
  assert.equal(value.email, 'asha@example.com');
  assert.equal(value.salary, 750000);
});

test('defaults status to Active and phone to empty', () => {
  const { valid, value } = validateEmployee({ ...good, status: undefined, phone: undefined });
  assert.equal(valid, true);
  assert.equal(value.status, 'Active');
  assert.equal(value.phone, '');
});

test('rejects an empty body with an error for every required field', () => {
  const { valid, errors } = validateEmployee({});
  assert.equal(valid, false);
  for (const field of ['name', 'email', 'department', 'position', 'salary', 'joiningDate']) {
    assert.ok(errors[field], `expected an error for ${field}`);
  }
});

test('rejects non-object bodies', () => {
  assert.equal(validateEmployee(null).valid, false);
  assert.equal(validateEmployee('text').valid, false);
  assert.equal(validateEmployee([good]).valid, false);
});

test('rejects bad email, department and status', () => {
  const { errors } = validateEmployee({
    ...good,
    email: 'not-an-email',
    department: 'Astrology',
    status: 'Retired'
  });
  assert.ok(errors.email);
  assert.ok(errors.department);
  assert.ok(errors.status);
});

test('rejects negative, huge and non-numeric salary', () => {
  assert.ok(validateEmployee({ ...good, salary: -1 }).errors.salary);
  assert.ok(validateEmployee({ ...good, salary: 1e12 }).errors.salary);
  assert.ok(validateEmployee({ ...good, salary: 'abc' }).errors.salary);
  assert.ok(validateEmployee({ ...good, salary: '' }).errors.salary);
});

test('rejects impossible and badly formatted dates', () => {
  assert.ok(validateEmployee({ ...good, joiningDate: '2023-02-29' }).errors.joiningDate);
  assert.ok(validateEmployee({ ...good, joiningDate: '2024-13-01' }).errors.joiningDate);
  assert.ok(validateEmployee({ ...good, joiningDate: '01/02/2024' }).errors.joiningDate);
  assert.ok(validateEmployee({ ...good, joiningDate: '1900-01-01' }).errors.joiningDate);
});

test('rejects an invalid phone number', () => {
  assert.ok(validateEmployee({ ...good, phone: 'call me maybe' }).errors.phone);
});

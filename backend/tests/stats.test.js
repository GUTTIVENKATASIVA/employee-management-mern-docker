import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats } from '../src/stats.js';

test('returns zeros for an empty list', () => {
  const stats = computeStats([]);
  assert.equal(stats.totalEmployees, 0);
  assert.equal(stats.averageSalary, 0);
  assert.deepEqual(stats.byDepartment, []);
  assert.deepEqual(stats.byStatus, { Active: 0, 'On Leave': 0, Inactive: 0 });
});

test('aggregates totals, averages, departments and statuses', () => {
  const stats = computeStats([
    { department: 'Finance', salary: 100, status: 'Active' },
    { department: 'Finance', salary: 300, status: 'On Leave' },
    { department: 'Sales', salary: 200, status: 'Active' }
  ]);
  assert.equal(stats.totalEmployees, 3);
  assert.equal(stats.activeEmployees, 2);
  assert.equal(stats.totalPayroll, 600);
  assert.equal(stats.averageSalary, 200);
  assert.equal(stats.departmentCount, 2);
  assert.deepEqual(stats.byDepartment[0], {
    department: 'Finance',
    count: 2,
    averageSalary: 200
  });
  assert.equal(stats.byStatus['On Leave'], 1);
});

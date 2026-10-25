import { STATUSES } from './constants.js';

const round2 = (n) => Math.round(n * 100) / 100;

/** Build dashboard statistics from a list of employee objects. */
export function computeStats(employees) {
  const totalEmployees = employees.length;
  const totalPayroll = round2(employees.reduce((sum, e) => sum + e.salary, 0));
  const averageSalary = totalEmployees ? round2(totalPayroll / totalEmployees) : 0;

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const departments = new Map();

  for (const e of employees) {
    if (e.status in byStatus) byStatus[e.status] += 1;
    const entry = departments.get(e.department) || { count: 0, salaryTotal: 0 };
    entry.count += 1;
    entry.salaryTotal += e.salary;
    departments.set(e.department, entry);
  }

  const byDepartment = [...departments.entries()]
    .map(([department, { count, salaryTotal }]) => ({
      department,
      count,
      averageSalary: round2(salaryTotal / count)
    }))
    .sort((a, b) => b.count - a.count || a.department.localeCompare(b.department));

  return {
    totalEmployees,
    activeEmployees: byStatus.Active,
    totalPayroll,
    averageSalary,
    departmentCount: byDepartment.length,
    byStatus,
    byDepartment
  };
}

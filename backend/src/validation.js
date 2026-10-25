import { DEPARTMENTS, STATUSES, MAX_SALARY } from './constants.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

function isRealDate(value) {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  // Rejects impossible dates such as 2024-02-31
  if (parsed.toISOString().slice(0, 10) !== value) return false;
  return value >= '1950-01-01' && value <= '2100-12-31';
}

/**
 * Validate and normalise an employee payload (used for both create and update).
 * Returns { valid, errors, value } where errors maps field name -> message.
 */
export function validateEmployee(body) {
  const input =
    body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errors = {};

  const name = text(input.name);
  if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }

  const email = text(input.email).toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    errors.email = 'Enter a valid email address.';
  }

  const phone = text(input.phone);
  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = 'Phone must be 7-20 characters: digits, spaces, + ( ) - . only.';
  }

  const department = text(input.department);
  if (!DEPARTMENTS.includes(department)) {
    errors.department = `Department must be one of: ${DEPARTMENTS.join(', ')}.`;
  }

  const position = text(input.position);
  if (position.length < 2 || position.length > 100) {
    errors.position = 'Position must be between 2 and 100 characters.';
  }

  let salary = input.salary;
  if (typeof salary === 'string' && salary.trim() !== '') salary = Number(salary);
  if (
    typeof salary !== 'number' ||
    !Number.isFinite(salary) ||
    salary < 0 ||
    salary > MAX_SALARY
  ) {
    errors.salary = `Salary must be a number between 0 and ${MAX_SALARY}.`;
  } else {
    salary = Math.round(salary * 100) / 100;
  }

  const joiningDate = text(input.joiningDate);
  if (!isRealDate(joiningDate)) {
    errors.joiningDate = 'Joining date must be a valid date in YYYY-MM-DD format.';
  }

  const status =
    input.status === undefined || input.status === null || input.status === ''
      ? 'Active'
      : text(input.status);
  if (!STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${STATUSES.join(', ')}.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { name, email, phone, department, position, salary, joiningDate, status }
  };
}

// Keep DEPARTMENTS and STATUSES identical to backend/src/constants.js
export const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Marketing',
  'Sales',
  'Operations',
  'Design',
  'IT Support'
];

export const STATUSES = ['Active', 'On Leave', 'Inactive'];

// Change these two lines to display another currency, e.g. 'USD' and 'en-US'
export const CURRENCY = 'INR';
export const LOCALE = 'en-IN';

export function formatCurrency(value) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function initials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// A stable hue per department, used for avatars and chart bars
export function departmentHue(department) {
  const index = DEPARTMENTS.indexOf(department);
  return ((index < 0 ? 0 : index) * 47 + 205) % 360;
}

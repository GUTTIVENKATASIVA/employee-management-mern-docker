import { useEffect, useState } from 'react';
import { DEPARTMENTS, STATUSES } from '../constants.js';

const today = () => new Date().toISOString().slice(0, 10);

const blank = () => ({
  name: '',
  email: '',
  phone: '',
  department: DEPARTMENTS[0],
  position: '',
  salary: '',
  joiningDate: today(),
  status: 'Active'
});

function fromEmployee(employee) {
  return {
    name: employee.name,
    email: employee.email,
    phone: employee.phone || '',
    department: employee.department,
    position: employee.position,
    salary: String(employee.salary),
    joiningDate: employee.joiningDate,
    status: employee.status
  };
}

function checkRequired(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Enter the full name (at least 2 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.';
  if (values.position.trim().length < 2) errors.position = 'Enter the job title.';
  if (values.salary === '' || Number.isNaN(Number(values.salary)) || Number(values.salary) < 0)
    errors.salary = 'Enter a salary of 0 or more.';
  if (!values.joiningDate) errors.joiningDate = 'Choose the joining date.';
  return errors;
}

export default function EmployeeForm({ employee, onSubmit, onCancel }) {
  const isEdit = Boolean(employee);
  const [values, setValues] = useState(() => (employee ? fromEmployee(employee) : blank()));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !saving) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, saving]);

  const set = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    const found = checkRequired(values);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({ ...values, salary: Number(values.salary) });
    } catch (err) {
      if (err.details) setErrors(err.details);
      setFormError(err.message);
      setSaving(false);
    }
  }

  const field = (name, label, input) => (
    <div className="form-field">
      <label htmlFor={`f-${name}`}>{label}</label>
      {input}
      {errors[name] && (
        <p className="field-error" id={`e-${name}`} role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );

  const common = (name) => ({
    id: `f-${name}`,
    value: values[name],
    onChange: set(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `e-${name}` : undefined
  });

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <h2 id="form-title">{isEdit ? 'Edit employee' : 'Add employee'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {field('name', 'Full name', <input {...common('name')} autoFocus maxLength={100} />)}
            {field('email', 'Email', <input {...common('email')} type="email" maxLength={254} />)}
            {field('phone', 'Phone (optional)', <input {...common('phone')} type="tel" maxLength={20} />)}
            {field(
              'department',
              'Department',
              <select {...common('department')}>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            )}
            {field('position', 'Position', <input {...common('position')} maxLength={100} />)}
            {field(
              'salary',
              'Annual salary',
              <input {...common('salary')} type="number" min="0" step="1000" inputMode="numeric" />
            )}
            {field('joiningDate', 'Joining date', <input {...common('joiningDate')} type="date" />)}
            {field(
              'status',
              'Status',
              <select {...common('status')}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

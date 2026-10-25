import { DEPARTMENTS, STATUSES } from '../constants.js';

export default function Toolbar({ filters, onChange, onReset, onAdd }) {
  const hasFilters = filters.search || filters.department || filters.status;

  return (
    <div className="toolbar" role="search">
      <label className="field grow">
        <span className="sr-only">Search employees</span>
        <input
          type="search"
          placeholder="Search by name, email or position"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          maxLength={100}
        />
      </label>

      <label className="field">
        <span className="sr-only">Filter by department</span>
        <select
          value={filters.department}
          onChange={(e) => onChange({ department: e.target.value })}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="sr-only">Filter by status</span>
        <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {hasFilters && (
        <button type="button" className="btn ghost" onClick={onReset}>
          Clear filters
        </button>
      )}
      <button type="button" className="btn primary" onClick={onAdd}>
        Add employee
      </button>
    </div>
  );
}

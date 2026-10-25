import { formatCurrency, formatDate, initials, departmentHue } from '../constants.js';

export default function EmployeeTable({ employees, onEdit, onDelete }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Employee</th>
          <th scope="col">Department</th>
          <th scope="col">Position</th>
          <th scope="col">Status</th>
          <th scope="col" className="num">
            Salary
          </th>
          <th scope="col">Joined</th>
          <th scope="col">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {employees.map((e) => (
          <tr key={e.id}>
            <td data-label="Employee">
              <div className="person">
                <span
                  className="avatar"
                  style={{ background: `hsl(${departmentHue(e.department)} 55% 40%)` }}
                  aria-hidden="true"
                >
                  {initials(e.name)}
                </span>
                <span className="person-text">
                  <strong>{e.name}</strong>
                  <span className="muted">{e.email}</span>
                </span>
              </div>
            </td>
            <td data-label="Department">{e.department}</td>
            <td data-label="Position">{e.position}</td>
            <td data-label="Status">
              <span className={`badge status-${e.status.replace(/\s+/g, '-').toLowerCase()}`}>
                {e.status}
              </span>
            </td>
            <td data-label="Salary" className="num">
              {formatCurrency(e.salary)}
            </td>
            <td data-label="Joined">{formatDate(e.joiningDate)}</td>
            <td className="actions">
              <button type="button" className="btn small" onClick={() => onEdit(e)}>
                Edit
              </button>
              <button type="button" className="btn small danger" onClick={() => onDelete(e)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

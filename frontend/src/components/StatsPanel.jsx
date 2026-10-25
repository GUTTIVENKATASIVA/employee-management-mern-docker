import { formatCurrency, departmentHue } from '../constants.js';

export default function StatsPanel({ stats, activeDepartment, onSelectDepartment }) {
  if (!stats) {
    return (
      <section className="overview" aria-busy="true" aria-label="Workforce overview">
        <div className="panel skeleton" style={{ minHeight: 168 }} />
        <div className="panel skeleton" style={{ minHeight: 168 }} />
      </section>
    );
  }

  const maxCount = Math.max(1, ...stats.byDepartment.map((d) => d.count));
  const figures = [
    { label: 'Employees', value: stats.totalEmployees },
    { label: 'Active now', value: stats.activeEmployees },
    { label: 'Departments', value: stats.departmentCount },
    { label: 'Average salary', value: formatCurrency(stats.averageSalary) }
  ];

  return (
    <section className="overview" aria-label="Workforce overview">
      <div className="panel figures">
        {figures.map((f) => (
          <div className="figure" key={f.label}>
            <span className="figure-value">{f.value}</span>
            <span className="figure-label">{f.label}</span>
          </div>
        ))}
        <div className="figure wide">
          <span className="figure-value small">{formatCurrency(stats.totalPayroll)}</span>
          <span className="figure-label">Total annual payroll</span>
        </div>
      </div>

      <div className="panel departments">
        <h2 className="panel-title">Headcount by department</h2>
        {stats.byDepartment.length === 0 ? (
          <p className="muted">No employees yet.</p>
        ) : (
          <ul className="bars">
            {stats.byDepartment.map((d) => (
              <li key={d.department}>
                <button
                  type="button"
                  className={`bar-row${activeDepartment === d.department ? ' selected' : ''}`}
                  onClick={() =>
                    onSelectDepartment(activeDepartment === d.department ? '' : d.department)
                  }
                  title={`Average salary ${formatCurrency(d.averageSalary)}`}
                  aria-pressed={activeDepartment === d.department}
                >
                  <span className="bar-name">{d.department}</span>
                  <span className="bar-track">
                    <span
                      className="bar-fill"
                      style={{
                        width: `${(d.count / maxCount) * 100}%`,
                        background: `hsl(${departmentHue(d.department)} 58% 46%)`
                      }}
                    />
                  </span>
                  <span className="bar-count">{d.count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import StatsPanel from './components/StatsPanel.jsx';
import Toolbar from './components/Toolbar.jsx';
import EmployeeTable from './components/EmployeeTable.jsx';
import EmployeeForm from './components/EmployeeForm.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';

const NO_FILTERS = { search: '', department: '', status: '' };

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formState, setFormState] = useState(null); // { employee: object | null }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);
  const closeForm = useCallback(() => setFormState(null), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  // Wait 300 ms after the last keystroke before searching
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(filters.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Load the employee list whenever a filter changes or data was modified
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .listEmployees(
        { search: searchTerm, department: filters.department, status: filters.status },
        controller.signal
      )
      .then((result) => {
        setEmployees(result.data);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [searchTerm, filters.department, filters.status, refreshKey]);

  // Load statistics on start and after every change
  useEffect(() => {
    const controller = new AbortController();
    api
      .getStats(controller.signal)
      .then((result) => setStats(result.data))
      .catch(() => {
        /* the list request already shows connection errors */
      });
    return () => controller.abort();
  }, [refreshKey]);

  const refresh = () => setRefreshKey((key) => key + 1);
  const updateFilters = (patch) => setFilters((current) => ({ ...current, ...patch }));

  async function saveEmployee(values) {
    const editing = formState.employee;
    if (editing) {
      await api.updateEmployee(editing.id, values);
    } else {
      await api.createEmployee(values);
    }
    setFormState(null);
    setToast({ type: 'success', message: editing ? 'Changes saved.' : 'Employee added.' });
    refresh();
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteEmployee(deleteTarget.id);
      setToast({ type: 'success', message: `${deleteTarget.name} was deleted.` });
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setToast({ type: 'error', message: err.message });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = Boolean(searchTerm || filters.department || filters.status);

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>Employee directory</h1>
          <p className="muted">MERN stack on Docker Compose: React, Express, MongoDB</p>
        </div>
      </header>

      <main>
        <StatsPanel
          stats={stats}
          activeDepartment={filters.department}
          onSelectDepartment={(department) => updateFilters({ department })}
        />

        <section className="panel directory" aria-label="Employees">
          <Toolbar
            filters={filters}
            onChange={updateFilters}
            onReset={() => setFilters(NO_FILTERS)}
            onAdd={() => setFormState({ employee: null })}
          />

          {error && (
            <div className="notice error" role="alert">
              <span>{error}</span>
              <button type="button" className="btn small" onClick={refresh}>
                Try again
              </button>
            </div>
          )}

          {loading && employees.length === 0 && !error ? (
            <p className="empty muted">Loading employees...</p>
          ) : employees.length === 0 && !error ? (
            <div className="empty">
              <p>
                <strong>{filtered ? 'No employees match these filters.' : 'No employees yet.'}</strong>
              </p>
              <p className="muted">
                {filtered
                  ? 'Try a different search or clear the filters.'
                  : 'Add your first employee to get started.'}
              </p>
              {!filtered && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setFormState({ employee: null })}
                >
                  Add employee
                </button>
              )}
            </div>
          ) : (
            <div className={`table-wrap${loading ? ' is-loading' : ''}`}>
              <EmployeeTable
                employees={employees}
                onEdit={(employee) => setFormState({ employee })}
                onDelete={setDeleteTarget}
              />
            </div>
          )}

          {employees.length > 0 && (
            <p className="muted result-count" aria-live="polite">
              Showing {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
            </p>
          )}
        </section>
      </main>

      {formState && (
        <EmployeeForm employee={formState.employee} onSubmit={saveEmployee} onCancel={closeForm} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          employee={deleteTarget}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={closeDelete}
        />
      )}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

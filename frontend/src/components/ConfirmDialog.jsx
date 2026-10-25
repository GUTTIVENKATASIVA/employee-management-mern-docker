import { useEffect } from 'react';

export default function ConfirmDialog({ employee, busy, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, busy]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="modal narrow" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">Delete {employee.name}?</h2>
        <p className="muted">
          This permanently removes the employee record from the database. You cannot undo it.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel} disabled={busy} autoFocus>
            Keep employee
          </button>
          <button type="button" className="btn danger solid" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting...' : 'Delete employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

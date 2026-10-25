import express from 'express';
import cors from 'cors';
import { DEPARTMENTS, STATUSES } from './constants.js';
import { validateEmployee } from './validation.js';
import { computeStats } from './stats.js';
import { HttpError } from './errors.js';

/**
 * Build the Express app. The data layer is injected as `repository`, which lets
 * the automated tests run against an in-memory repository (no MongoDB needed)
 * while production uses the MongoDB repository.
 */
export function createApp({
  repository,
  isDatabaseReady = () => true,
  corsOrigin = '*'
}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors(corsOrigin === '*' ? {} : { origin: corsOrigin.split(',') }));
  app.use(express.json({ limit: '100kb' }));

  const wrap = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  // ---- Health check (used by Docker healthchecks and for demos) ----
  app.get('/api/health', (req, res) => {
    const up = isDatabaseReady();
    res.status(up ? 200 : 503).json({
      status: up ? 'ok' : 'degraded',
      service: 'employee-management-backend',
      database: up ? 'connected' : 'disconnected',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Fail fast with 503 when the database is not connected yet
  const requireDatabase = (req, res, next) => {
    if (!isDatabaseReady()) {
      return next(new HttpError(503, 'Database is not connected yet. Try again shortly.'));
    }
    next();
  };

  const requireValidId = (req, res, next) => {
    if (!repository.isValidId(req.params.id)) {
      return next(new HttpError(400, 'Invalid employee id.'));
    }
    next();
  };

  // ---- Statistics ----
  app.get(
    '/api/stats',
    requireDatabase,
    wrap(async (req, res) => {
      const employees = await repository.list({});
      res.json({ data: computeStats(employees) });
    })
  );

  // ---- Employee CRUD ----
  app.get(
    '/api/employees',
    requireDatabase,
    wrap(async (req, res) => {
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const department =
        typeof req.query.department === 'string' ? req.query.department.trim() : '';
      const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

      if (search.length > 100) throw new HttpError(400, 'Search text is too long (max 100).');
      if (department && !DEPARTMENTS.includes(department)) {
        throw new HttpError(400, `Unknown department "${department}".`);
      }
      if (status && !STATUSES.includes(status)) {
        throw new HttpError(400, `Unknown status "${status}".`);
      }

      const data = await repository.list({ search, department, status });
      res.json({ data, count: data.length });
    })
  );

  app.get(
    '/api/employees/:id',
    requireDatabase,
    requireValidId,
    wrap(async (req, res) => {
      const employee = await repository.get(req.params.id);
      if (!employee) throw new HttpError(404, 'Employee not found.');
      res.json({ data: employee });
    })
  );

  app.post(
    '/api/employees',
    requireDatabase,
    wrap(async (req, res) => {
      const { valid, errors, value } = validateEmployee(req.body);
      if (!valid) throw new HttpError(422, 'Validation failed.', errors);
      const created = await repository.create(value);
      res.status(201).json({ message: 'Employee created.', data: created });
    })
  );

  app.put(
    '/api/employees/:id',
    requireDatabase,
    requireValidId,
    wrap(async (req, res) => {
      const { valid, errors, value } = validateEmployee(req.body);
      if (!valid) throw new HttpError(422, 'Validation failed.', errors);
      const updated = await repository.update(req.params.id, value);
      if (!updated) throw new HttpError(404, 'Employee not found.');
      res.json({ message: 'Employee updated.', data: updated });
    })
  );

  app.delete(
    '/api/employees/:id',
    requireDatabase,
    requireValidId,
    wrap(async (req, res) => {
      const removed = await repository.remove(req.params.id);
      if (!removed) throw new HttpError(404, 'Employee not found.');
      res.json({ message: 'Employee deleted.', data: removed });
    })
  );

  // ---- 404 and error handling ----
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body is not valid JSON.' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large.' });
    }
    if (err instanceof HttpError) {
      const body = { error: err.message };
      if (err.details) body.details = err.details;
      return res.status(err.status).json(body);
    }
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}

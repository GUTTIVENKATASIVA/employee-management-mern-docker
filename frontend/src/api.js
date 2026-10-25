const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details || null;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Response had no JSON body
  }

  if (!response.ok) {
    throw new ApiError(
      (payload && payload.error) || `Request failed (HTTP ${response.status}).`,
      response.status,
      payload && payload.details
    );
  }
  return payload;
}

export const api = {
  listEmployees: ({ search, department, status }, signal) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (department) params.set('department', department);
    if (status) params.set('status', status);
    const query = params.toString();
    return request(`/employees${query ? `?${query}` : ''}`, { signal });
  },
  getStats: (signal) => request('/stats', { signal }),
  createEmployee: (employee) => request('/employees', { method: 'POST', body: employee }),
  updateEmployee: (id, employee) =>
    request(`/employees/${id}`, { method: 'PUT', body: employee }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' })
};

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export function duplicateEmailError() {
  return new HttpError(409, 'An employee with this email already exists.', {
    email: 'This email is already in use.'
  });
}

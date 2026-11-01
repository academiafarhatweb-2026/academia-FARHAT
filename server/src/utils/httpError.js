// An error that carries the HTTP status and a message that is safe to show the
// user. The app's error handler answers with them instead of a generic 500.
export default class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function errorHandler(error, _req, res, _next) {
  console.error(error);

  const statusCode = Number.isInteger(error?.status)
    && error.status >= 400
    && error.status <= 599
    ? error.status
    : 500;

  const message = statusCode >= 500
    ? 'Internal server error.'
    : 'The request could not be completed.';

  return res.status(statusCode).json({ message });
}

import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

// Runs when no route matched the request
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express knows this is an error handler because it has 4 parameters. Keep all 4.
export function errorHandler(err, req, res, next) {
  // Data that failed validation
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Errors we throw on purpose, like new ApiError(409, '...')
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  // MongoDB "duplicate value" error (the email is already taken)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That email is already registered' });
  }

  // The client sent broken JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }

  // Anything else is a bug on our side
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}
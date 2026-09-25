import type { ErrorRequestHandler } from 'express';
import { AuthenticationError,
		 RefreshTokenError,
} from '../modules/auth/auth.error.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AuthenticationError) {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err instanceof RefreshTokenError) {
	res.status(401).json({ error: err.message });
	return;
  }

  if (err?.sqlState === '23505' && err?.constraint === 'user_email_key') {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

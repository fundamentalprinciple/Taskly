import { Router } from 'express';
import { registerUser } from '../modules/auth/user.services.js';
import { login,
		 refreshAccessToken,
} from '../modules/auth/auth.service.js';
import { revokeRefreshToken } from '../modules/auth/refresh-token.service.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const user = await registerUser(email, password);

  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: result.accessToken,
    user: result.user,
  });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401).json({ error: 'Refresh token required' });
    return;
  }

  const result = await refreshAccessToken(token);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken: result.accessToken,
    user: result.user,
  });
});

router.post('/logout', async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    await revokeRefreshToken(token);
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
  });

  res.status(204).send();
});

export default router;

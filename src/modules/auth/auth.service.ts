import { authenticateUser } from './user.services.js';
import { createAccessToken } from './token.js';
import { createRefreshToken } from './refresh-token.service.js';
import {
	findRefreshToken,
	rotateRefreshToken,
} from './refresh-token.service.js';
import { db } from '../../prisma/db.js';

export async function login(
  email: string,
  password: string,
) {
  const user = await authenticateUser(email, password);

  const accessToken = createAccessToken({
    sub: user.id,
    role: user.role,
  });

  const refreshToken = await createRefreshToken(user.id);

  return {
    accessToken,
	refreshToken: refreshToken.token,
    user: {
		id: user.id,
		email: user.email,
		role: user.role,
	},
  };
}

export async function refreshAccessToken(token: string) {
  const refreshToken = await findRefreshToken(token);

  if (!refreshToken) {
    throw new Error('Invalid or expired refresh token');
  }

  const rotated = await rotateRefreshToken(token);

  const user = await db.orm.public.User.first({
    id: refreshToken.userId,
  });

  if (!user) {
    throw new Error('Invalid or expired refresh token');
  }

  const accessToken = createAccessToken({
    sub: user.id,
    role: user.role,
  });

  return {
    accessToken,
    refreshToken: rotated.token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}



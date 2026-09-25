import { db } from '../../prisma/db.js';
import {
  generateRefreshToken,
  hashRefreshToken,
} from './token.js';
import { Temporal } from 'temporal-polyfill';
import { RefreshTokenError } from './auth.error.js';

const REFRESH_TOKEN_DAYS = 7;

export async function createRefreshToken(userId: string) {
  const token = generateRefreshToken();
  const tokenHash = hashRefreshToken(token);

  const expiresAt = Temporal.Instant.fromEpochMilliseconds(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.orm.public.RefreshToken.create({
    tokenHash,
    userId,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function findRefreshToken(token: string) {
	const tokenHash = hashRefreshToken(token);

	return db.orm.public.RefreshToken.first({
		tokenHash,
	});
}

export function isRefreshTokenValid(
	refreshToken: Awaited<ReturnType<typeof findRefreshToken>>,
) {
	if (!refreshToken) return false;
  	if (refreshToken.revokedAt) return false;
  	if (refreshToken.expiresAt.epochMilliseconds <= Date.now()) return false;
	
	return true;
}

export async function rotateRefreshToken(token: string) {
  const existing = await findRefreshToken(token);

  if (!existing) {
    throw new RefreshTokenError('Invalid or expired refresh token');
  }

  if (existing.revokedAt) {
	await revokeAllRefreshTokens(existing.userId);
    throw new RefreshTokenError('Refresh token reuse detected');
  }

  if (existing.expiresAt.epochMilliseconds <= Date.now()) {
    throw new RefreshTokenError('Invalid or expired refresh token');
  }

  await db.orm.public.RefreshToken.where({ id: existing.id }).update({
	revokedAt: Temporal.Now.instant(),
  });

  return createRefreshToken(existing.userId);
}

export async function revokeAllRefreshTokens(userId: string) {
	await db.orm.public.RefreshToken
		.where({ userId })
		.updateAll({
			revokedAt: Temporal.Now.instant(),
		});
}

export async function revokeRefreshToken(token: string) {
  const tokenHash = hashRefreshToken(token);

  await db.orm.public.RefreshToken
    .where({ tokenHash })
    .update({
      revokedAt: Temporal.Now.instant(),
    });
}

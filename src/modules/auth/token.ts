import jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth.js';
import { randomBytes, createHash } from 'node:crypto';

export interface AccessTokenPayload {
	sub: string;
	role: 'ADMIN' | 'MEMBER';
}

export function createAccessToken(payload: AccessTokenPayload): string {
	return jwt.sign(payload, authConfig.accessTokenSecret, {
		expiresIn: authConfig.accessTokenExpiresIn,
	});
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	return jwt.verify(token, authConfig.accessTokenSecret) as AccessTokenPayload;
}

export function generateRefreshToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}


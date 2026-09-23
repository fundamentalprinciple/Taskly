import jwt from 'jsonwebtoken';
import { authConfig } from '../../config/auth.js';

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


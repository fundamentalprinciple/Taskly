import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

const expiresIn = process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m';

if (!expiresIn) {
  throw new Error('JWT_ACCESS_EXPIRES_IN is required');
}

export const authConfig: {
  accessTokenSecret: string;
  accessTokenExpiresIn: SignOptions['expiresIn'];
} = {
  accessTokenSecret: process.env['JWT_ACCESS_SECRET']!,
  accessTokenExpiresIn: expiresIn as SignOptions['expiresIn'],
};

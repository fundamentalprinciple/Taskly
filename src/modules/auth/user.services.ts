import { db } from '../../prisma/db.js';
import { hashPassword, verifyPassword } from './password.js';
import { AuthenticationError } from './auth.error.js';

export async function registerUser(
  email: string,
  password: string,
) {
  const passwordHash = await hashPassword(password);

  return db.orm.public.User.create({
    email,
    passwordHash,
  });
}

export async function authenticateUser(
  email: string,
  password: string,
) {
  const user = await db.orm.public.User.first({email});

  if (!user) {
    throw new AuthenticationError();
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    throw new AuthenticationError();
  }

  return user;
}

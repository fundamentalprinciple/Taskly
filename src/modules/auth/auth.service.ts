import { authenticateUser } from './user.services.js';
import { createAccessToken } from './token.js';

export async function login(
  email: string,
  password: string,
) {
  const user = await authenticateUser(email, password);

  const accessToken = createAccessToken({
    sub: user.id,
    role: user.role,
  });

  return {
    accessToken,
    user: {
		id: user.id,
		email: user.email,
		role: user.role,
	},
  };
}

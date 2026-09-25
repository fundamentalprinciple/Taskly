export class AuthenticationError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'AuthenticationError';
  }
}

export class RefreshTokenError extends Error {
	constructor(message = 'Invalid or expired refresh token') {
		super(message);
		this.name = 'RefreshTokenError';
	}
}

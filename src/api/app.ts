import express from "express";
import authRoutes from './auth.routes.js';
import { errorHandler } from './error.middleware.js';
import cookieParser from 'cookie-parser'

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use(errorHandler);
app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

export default app;

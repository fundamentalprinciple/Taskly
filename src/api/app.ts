import express from "express";
import authRoutes from './auth.routes.js';
import { errorHandler } from './error.middleware.js';


const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);
app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

export default app;

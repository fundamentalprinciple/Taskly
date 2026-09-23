import { Router } from 'express';
import { registerUser } from '../modules/auth/user.services.js';
import { login } from '../modules/auth/auth.service.js';


const router = Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const user = await registerUser(email, password);

  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);

  res.json(result);
});


export default router;

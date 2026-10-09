import { Router } from 'express';
import { loginOrRegister } from '../controllers/auth.controller';

const router = Router();

router.post('/login', loginOrRegister);

export default router;
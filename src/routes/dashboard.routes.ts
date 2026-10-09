import { Router } from 'express';
import { getDashboardResumen } from '../controllers/dashboard.controller';

const router = Router();

router.get('/resumen', getDashboardResumen);

export default router;

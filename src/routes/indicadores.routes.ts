import { Router } from 'express';
import { getCargaSemanal } from '../controllers/indicadores.controller';

const router = Router();

router.get('/carga-semanal', getCargaSemanal);

export default router;

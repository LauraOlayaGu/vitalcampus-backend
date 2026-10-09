import { Router } from 'express';
import { getAlertas, marcarAlertaLeida } from '../controllers/alert.controller';

const router = Router();

router.get('/', getAlertas);
router.patch('/:id/leida', marcarAlertaLeida);

export default router;

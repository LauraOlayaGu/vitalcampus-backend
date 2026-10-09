import { Router } from 'express';
import {
  getSuenos,
  getSuenosSemanal,
  createSueno,
  updateSueno,
  deleteSueno
} from '../controllers/sleep.controller';

const router = Router();

router.get('/', getSuenos);
router.get('/semanal', getSuenosSemanal);
router.post('/', createSueno);
router.put('/:id', updateSueno);
router.delete('/:id', deleteSueno);

export default router;

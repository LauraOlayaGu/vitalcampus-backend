import { Router } from 'express';
import {
  getAsignaturas,
  createAsignatura,
  updateAsignatura,
  deleteAsignatura
} from '../controllers/asignatura.controller';

const router = Router();

router.get('/', getAsignaturas);
router.post('/', createAsignatura);
router.put('/:id', updateAsignatura);
router.delete('/:id', deleteAsignatura);

export default router;

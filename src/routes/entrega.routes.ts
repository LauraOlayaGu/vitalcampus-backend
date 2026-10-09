import { Router } from 'express';
import {
  getEntregas,
  createEntrega,
  updateEntrega,
  deleteEntrega
} from '../controllers/entrega.controller';

const router = Router();

router.get('/', getEntregas);
router.post('/', createEntrega);
router.put('/:id', updateEntrega);
router.delete('/:id', deleteEntrega);

export default router;

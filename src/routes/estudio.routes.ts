import { Router } from 'express';
import { getEstudio, createEstudio } from '../controllers/estudio.controller';

const router = Router();

router.get('/', getEstudio);
router.post('/', createEstudio);

export default router;

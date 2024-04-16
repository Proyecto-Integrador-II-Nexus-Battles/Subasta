import { Router } from 'express'
import { SubastarController } from '../controllers/SubastarController.js';

const router = Router()

router.post('/add-subastar', SubastarController.add_subasta);
router.get('/get-cartas-subasta', SubastarController.get_cartasSubasta);

export default router;
import { Router } from 'express';
import { PriceIndexController } from '../controllers/PriceIndexController';

const router = Router();

router.get('/:pair', PriceIndexController.getPriceIndex);

export { router as priceIndexRoutes };

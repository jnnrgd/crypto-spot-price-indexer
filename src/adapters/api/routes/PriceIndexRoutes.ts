import { Router } from 'express';
import { PriceIndexController } from '../controllers/PriceIndexController';

const router = Router();
/**
 * @swagger
 * /price-index/{pair}:
 *   get:
 *     summary: Get price index for a currency pair
 *     description: Retrieve the price index for a specific currency pair.
 *     parameters:
 *       - in: path
 *         name: pair
 *         required: true
 *         description: The currency pair to retrieve the price index for.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved price index
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pair:
 *                   type: object
 *                   properties:
 *                    asset:
 *                     type: string
 *                    quote:
 *                     type: string
 *                 price:
 *                   type: number
 *                 timestamp:
 *                   type: number
 *       400:
 *         description: Invalid currency pair
 *       500:
 *         description: Internal server error
 */
router.get('/:pair', PriceIndexController.getPriceIndex);

export { router as priceIndexRoutes };

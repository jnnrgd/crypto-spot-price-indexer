import { Request, Response, NextFunction } from 'express';
import { validatePair } from '../../../core/validators/PairValidator';
import { CalculatePriceIndex } from '../../../core/usecases/CalculatePriceIndex';
import { ConnectorRegistry } from '../../connectors/ConnectorRegistry';
import { InvalidPairError } from '../../../core/domain/errors/InvalidPairError';

const connectorRegistry = new ConnectorRegistry();
const calculatePriceIndex = new CalculatePriceIndex(connectorRegistry);

export class PriceIndexController {
  static async getPriceIndex(req: Request, res: Response, next: NextFunction) {
    try {
      const { pair } = req.params;

      const validPair = validatePair(pair);

      const priceIndex = await calculatePriceIndex.mean(validPair);

      res.status(200).json(priceIndex);
    } catch (error) {
      if (error instanceof InvalidPairError) {
        res.status(400).json({
          error: error.message,
        });
      }
      next(error);
    }
  }
}
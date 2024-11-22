import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { priceIndexRoutes } from '../../adapters/api/routes/PriceIndexRoutes';
import { errorHandler } from '../../adapters/api/middleware/ErrorHandler';
import logHandler from '../../adapters/api/middleware/LogHandler';
import swaggerDocs from '../../swagger/swagger';

const app = express();

app.use(cors());
app.use(helmet({ hsts: false }));
app.use(logHandler);
app.use(express.json());

app.use('/price-index', priceIndexRoutes);
swaggerDocs(app);
app.use((req, res, next) => {
  const error = new Error('Route not found');
  res.status(404);
  next(error);
});

app.use(errorHandler);

export { app };

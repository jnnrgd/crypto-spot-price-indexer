import morgan, { StreamOptions } from 'morgan';
import { logger } from '../../../infrastructure/logging/logger';

const stream: StreamOptions = {
  write: (message) => logger.http(message),
};

const logHandler = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export default logHandler;
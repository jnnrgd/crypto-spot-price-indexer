import morgan, { StreamOptions } from 'morgan';
import { logger } from '../../../infrastructure/configs/logger';

const stream: StreamOptions = {
  write: (message) => logger.http(message),
};

const logHandler = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export default logHandler;
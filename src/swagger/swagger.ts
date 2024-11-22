import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Price Index API',
      version: '1.0.0',
      description: 'A simple API to get the price index of a given pair',
    },
  },
  apis: ['src/adapters/api/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

function swaggerDocs(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}

export default swaggerDocs;
import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Creates and configures the Express application.
 */
export function createApp(): Express {
  const app = express();

  // 1. CORS Configuration with origin validation (restricting indiscriminate access)
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g., CLI tools, curl, mobile apps, local tests)
      if (!origin) {
        return callback(null, true);
      }

      if (env.corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS Error: Origin '${origin}' is not authorized.`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  };

  app.use(cors(corsOptions));

  // 2. Request body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 3. API Routes mounting
  app.use('/api', apiRouter);

  // 4. Fallback 404 handler for unmatched routes
  app.use(notFoundHandler);

  // 5. Centralized error handling middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();

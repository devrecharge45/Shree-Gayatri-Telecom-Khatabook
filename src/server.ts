/// <reference path="./@types/express.d.ts" />

import express, { Application } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import flash from 'connect-flash';
import helmet from 'helmet';
import { env } from './config/environment';
import { sequelize } from './models';
import { LocalsMiddleware } from './middlewares/locals.middleware';
import { ErrorMiddleware } from './middlewares/error.middleware';
import routes from './routes';
import { Logger } from './utils/logger';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.setupViewEngine();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupViewEngine(): void {
    this.app.set('views', path.join(__dirname, '../views'));
    this.app.set('view engine', 'ejs');
  }

  private setupMiddlewares(): void {
    // 1. Helmet security headers with relaxed CSP for local assets
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        }
      })
    );

    // 2. Request body & cookie parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser(env.security.cookieSecret));

    // 3. Session & Flash messages
    this.app.use(
      session({
        secret: env.security.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: env.server.nodeEnv === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 1 day
        }
      })
    );
    this.app.use(flash());

    // 4. Static assets serving (Zero CDN)
    const publicPath = path.join(__dirname, '../public');
    this.app.use(express.static(publicPath));
    this.app.use('/icons', express.static(path.join(publicPath, 'icons')));
    this.app.use('/images', express.static(path.join(publicPath, 'images')));
    this.app.use('/css', express.static(path.join(publicPath, 'css')));
    this.app.use('/js', express.static(path.join(publicPath, 'js')));

    // 5. Global template variables (App & Company branding from .env)
    this.app.use(LocalsMiddleware.handle);
  }

  private setupRoutes(): void {
    this.app.use('/', routes);
  }

  private setupErrorHandling(): void {
    // 404 Route Not Found
    this.app.use(ErrorMiddleware.notFound);

    // Centralized Error Interceptor
    this.app.use(ErrorMiddleware.handle);
  }

  public async start(): Promise<void> {
    try {
      // Connect to PostgreSQL database
      Logger.info(`Connecting to PostgreSQL database: ${env.database.name}...`);
      await sequelize.authenticate();
      Logger.info('PostgreSQL connection established successfully.');

      // Sync database models (alter: true in dev/initial setup)
      await sequelize.sync({ alter: false });
      Logger.info('Database models synchronized successfully.');

      // Start HTTP server
      const port = env.server.port;
      const host = '0.0.0.0';

      this.app.listen(port, host, () => {
        Logger.info(`=======================================================`);
        Logger.info(`  ${env.server.appName} is running!`);
        Logger.info(`  Environment : ${env.server.nodeEnv}`);
        Logger.info(`  Local URL   : http://localhost:${port}`);
        Logger.info(`  External URL: http://[IP_ADDRESS]:${port}`);
        Logger.info(`  Company     : ${env.company.name}`);
        Logger.info(`=======================================================`);
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.error(`Failed to start application: ${error.message}`, { stack: error.stack });
      process.exit(1);
    }
  }
}

// Global process exception safety nets
process.on('uncaughtException', (err: Error) => {
  console.error('[UNCAUGHT EXCEPTION]:', err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

// Launch server
const server = new App();
server.start();

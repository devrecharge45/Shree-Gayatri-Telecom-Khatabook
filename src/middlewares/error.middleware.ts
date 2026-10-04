import { Request, Response, NextFunction } from 'express';
import {
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
  DatabaseError,
  ForeignKeyConstraintError
} from 'sequelize';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Logger } from '../utils/logger';
import { env } from '../config/environment';

interface CustomHttpError extends Error {
  statusCode?: number;
  fields?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

export class ErrorMiddleware {
  // 404 Route Not Found
  public static notFound(req: Request, res: Response, _next: NextFunction): void {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl} - Route not found`
      });
      return;
    }

    res.status(404).render('pages/errors/404', {
      title: '404 - Page Not Found',
      requestedUrl: req.originalUrl
    });
  }

  // Global Centralized Error Handler
  public static handle(
    err: CustomHttpError,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'An unexpected server error occurred';

    // A. Handle Sequelize Unique Constraint (e.g. Duplicate Email)
    if (err instanceof UniqueConstraintError) {
      statusCode = 409;
      const field = Object.keys(err.fields || {})[0] || 'Field';
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered. Please use another value.`;
    }

    // B. Handle Sequelize Field Validation Errors
    else if (err instanceof SequelizeValidationError) {
      statusCode = 422;
      message = err.errors.map((e) => e.message).join(', ');
    }

    // C. Handle Foreign Key Constraint Violations
    else if (err instanceof ForeignKeyConstraintError) {
      statusCode = 400;
      message = 'Operation cannot be completed because related data is missing or in use.';
    }

    // D. Handle Database Connection / Low-level SQL Errors
    else if (err instanceof DatabaseError) {
      statusCode = 500;
      message = 'Database operation failed. Please try again.';
      Logger.error(`Database Error: ${err.message}`, { stack: err.stack });
    }

    // E. Handle JWT Authentication Errors
    else if (err instanceof TokenExpiredError) {
      statusCode = 401;
      message = 'Your session has expired. Please login again to continue.';
      res.clearCookie('auth_token');
      if (!req.xhr && !req.headers.accept?.includes('application/json')) {
        if (req.flash) req.flash('errors', [message]);
        return res.redirect('/login');
      }
    } else if (err instanceof JsonWebTokenError) {
      statusCode = 401;
      message = 'Invalid authentication session. Please login again.';
      res.clearCookie('auth_token');
      if (!req.xhr && !req.headers.accept?.includes('application/json')) {
        if (req.flash) req.flash('errors', [message]);
        return res.redirect('/login');
      }
    }

    // Log critical or 500 errors
    if (statusCode >= 500) {
      Logger.error(`[CRITICAL] ${req.method} ${req.originalUrl}: ${err.message}`, {
        stack: err.stack,
        body: req.body,
        user: req.user?.id
      });
    } else {
      Logger.warn(`[CLIENT ERROR ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
    }

    // Return JSON for AJAX or API requests
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(env.server.nodeEnv === 'development' ? { stack: err.stack } : {})
      });
      return;
    }

    // For SSR form requests: Redirect with flash on client errors (400-422)
    if (statusCode < 500 && req.flash) {
      req.flash('errors', [message]);
      return res.redirect('back');
    }

    // Render 500 Error Page for server-side crashes
    res.status(statusCode).render('pages/errors/500', {
      title: '500 - Server Error',
      statusCode,
      message:
        env.server.nodeEnv === 'production'
          ? 'Something went wrong on our end. Please try again later.'
          : message,
      errorStack: env.server.nodeEnv === 'development' ? err.stack : null
    });
  }
}

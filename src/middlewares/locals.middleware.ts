import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment';
import { Formatters } from '../utils/formatters';

export class LocalsMiddleware {
  public static handle(req: Request, res: Response, next: NextFunction): void {
    res.locals.app = env.server;
    res.locals.company = env.company;
    res.locals.currentYear = new Date().getFullYear();
    res.locals.currentPath = req.path;
    res.locals.formatters = Formatters;

    // Flash messages support with safe fallbacks
    try {
      res.locals.errors = req.flash ? req.flash('errors') : [];
      res.locals.success = req.flash ? req.flash('success') : [];
      res.locals.oldInput = req.flash ? req.flash('oldInput')[0] || {} : {};
    } catch {
      res.locals.errors = [];
      res.locals.success = [];
      res.locals.oldInput = {};
    }

    next();
  }
}

import { User } from '../models/User.model';
import { ServerConfig, CompanyConfig } from '../config/environment';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      flash(type: string, message?: string | string[]): string[];
    }
    interface Response {
      locals: {
        currentUser?: User;
        app?: ServerConfig;
        company?: CompanyConfig;
        currentYear?: number;
        currentPath?: string;
        errors?: string[];
        success?: string[];
        oldInput?: Record<string, unknown>;
        title?: string;
        [key: string]: unknown;
      };
    }
  }
}

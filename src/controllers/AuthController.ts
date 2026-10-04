import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { env } from '../config/environment';

export class AuthController {
  public static showLogin(req: Request, res: Response): void {
    res.render('pages/auth/login', {
      title: `Login - ${env.server.appShortName}`
    });
  }

  public static showRegister(req: Request, res: Response): void {
    res.render('pages/auth/register', {
      title: `Create Account - ${env.server.appShortName}`
    });
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { token } = await AuthService.login(email, password);

      res.cookie('auth_token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: env.server.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      if (req.flash) req.flash('success', ['Welcome back!']);
      res.redirect('/parties');
    } catch (err) {
      next(err);
    }
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const { token } = await AuthService.register(name, email, password);

      res.cookie('auth_token', token, {
        httpOnly: true,
        sameSite: 'strict',
        secure: env.server.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      if (req.flash) req.flash('success', ['Account created successfully!']);
      res.redirect('/parties');
    } catch (err) {
      next(err);
    }
  }

  public static logout(req: Request, res: Response): void {
    res.clearCookie('auth_token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: env.server.nodeEnv === 'production'
    });

    if (req.flash) req.flash('success', ['You have logged out successfully.']);
    res.redirect('/login');
  }
}

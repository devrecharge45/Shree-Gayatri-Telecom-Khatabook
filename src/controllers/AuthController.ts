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
      const { email, password, remember } = req.body;
      const isRemember = remember === 'true' || remember === 'on' || remember === true;
      const { token } = await AuthService.login(email, password, isRemember);

      const maxAge = isRemember
        ? 15 * 24 * 60 * 60 * 1000 // 15 days persistent session
        : 24 * 60 * 60 * 1000; // 1 day standard session

      res.cookie('auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.server.nodeEnv === 'production',
        maxAge
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
        sameSite: 'lax',
        secure: env.server.nodeEnv === 'production',
        maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days default
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
      sameSite: 'lax',
      secure: env.server.nodeEnv === 'production'
    });

    if (req.flash) req.flash('success', ['You have logged out successfully.']);
    res.redirect('/login');
  }
}

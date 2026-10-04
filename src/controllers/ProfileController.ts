import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { Party } from '../models/Party.model';
import { Transaction } from '../models/Transaction.model';
import { env } from '../config/environment';

export class ProfileController {
  /**
   * Display User Profile & Company Settings
   */
  public static async showProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const [partiesCount, txCount] = await Promise.all([
        Party.count({ where: { user_id: userId } }),
        Transaction.count({ where: { user_id: userId } })
      ]);

      res.render('pages/profile/index', {
        title: `Profile - ${env.server.appShortName}`,
        partiesCount,
        txCount
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset Password and Automatically Logout
   */
  public static async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { previous_password, new_password } = req.body;

      await AuthService.resetPassword(userId, previous_password, new_password);

      // Force Logout per requirement: "reset password then logout"
      res.clearCookie('auth_token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: env.server.nodeEnv === 'production'
      });

      if (req.flash) {
        req.flash('success', [
          'Password changed successfully! Please login again with your new password.'
        ]);
      }
      res.redirect('/login');
    } catch (err) {
      next(err);
    }
  }
}

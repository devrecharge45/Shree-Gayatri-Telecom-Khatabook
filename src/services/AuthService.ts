import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User.model';
import { env } from '../config/environment';
import { AppError } from '../utils/AppError';

export class AuthService {
  /**
   * Register a new user
   */
  public static async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw AppError.badRequest('An account with this email address already exists.');
    }

    const password_hash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash
    });

    const token = jwt.sign({ id: user.id, email: user.email }, env.security.jwtSecret, {
      expiresIn: env.security.jwtExpiresIn as SignOptions['expiresIn']
    });

    return { user, token };
  }

  /**
   * Login user with credentials
   */
  public static async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, env.security.jwtSecret, {
      expiresIn: env.security.jwtExpiresIn as SignOptions['expiresIn']
    });

    return { user, token };
  }

  /**
   * Reset Password
   */
  public static async resetPassword(
    userId: string,
    previousPass: string,
    newPass: string
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const isMatch = await user.verifyPassword(previousPass);
    if (!isMatch) {
      throw AppError.badRequest('Current password does not match our records');
    }

    const newHash = await User.hashPassword(newPass);
    user.password_hash = newHash;
    await user.save();
  }
}

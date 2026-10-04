import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult, ValidationChain } from 'express-validator';

export class ValidationRules {
  // 1. User Registration Validation
  public static register(): ValidationChain[] {
    return [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .escape(),

      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email address is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 150 })
        .withMessage('Email must not exceed 150 characters'),

      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),

      body('confirmPassword')
        .notEmpty()
        .withMessage('Please confirm your password')
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
          }
          return true;
        })
    ];
  }

  // 2. User Login Validation
  public static login(): ValidationChain[] {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email address is required')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),

      body('password').notEmpty().withMessage('Password is required')
    ];
  }

  // 3. Party CRUD Validation
  public static party(): ValidationChain[] {
    return [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Party name is mandatory')
        .isLength({ min: 2, max: 150 })
        .withMessage('Party name must be between 2 and 150 characters')
        .escape(),

      body('mobile_no')
        .optional({ checkFalsy: true })
        .trim()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Mobile number must be a valid 10-digit number')
        .escape(),

      body('notes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters')
        .escape()
    ];
  }

  // 4. Transaction (Credit / Debit) Validation
  public static transaction(): ValidationChain[] {
    return [
      param('partyId')
        .notEmpty()
        .withMessage('Party ID is required')
        .isUUID(4)
        .withMessage('Invalid party identifier format'),

      body('type')
        .trim()
        .notEmpty()
        .withMessage('Transaction type is required')
        .isIn(['CREDIT', 'DEBIT'])
        .withMessage('Transaction type must be either CREDIT (You Got) or DEBIT (You Gave)'),

      body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0.01, max: 999999999.99 })
        .withMessage('Amount must be a positive number greater than 0')
        .custom((val) => {
          const parts = val.toString().split('.');
          if (parts[1] && parts[1].length > 2) {
            throw new Error('Amount cannot have more than 2 decimal places');
          }
          return true;
        }),

      body('transaction_date')
        .notEmpty()
        .withMessage('Transaction date is required')
        .isISO8601()
        .withMessage('Transaction date must be a valid date (YYYY-MM-DD)'),

      body('notes')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters')
        .escape(),

      body('bill_reference')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 })
        .withMessage('Bill reference cannot exceed 100 characters')
        .escape()
    ];
  }

  // 5. Password Reset Validation
  public static resetPassword(): ValidationChain[] {
    return [
      body('previous_password').notEmpty().withMessage('Current password is required'),

      body('new_password')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('New password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('New password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('New password must contain at least one number')
        .custom((value, { req }) => {
          if (value === req.body.previous_password) {
            throw new Error('New password must be different from previous password');
          }
          return true;
        }),

      body('confirm_new_password')
        .notEmpty()
        .withMessage('Please confirm your new password')
        .custom((value, { req }) => {
          if (value !== req.body.new_password) {
            throw new Error('Confirm password does not match new password');
          }
          return true;
        })
    ];
  }

  // 6. Pagination & Query Filter Validation
  public static listQuery(): ValidationChain[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page number must be a positive integer')
        .toInt(),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),

      query('search').optional().trim().escape(),

      query('filter')
        .optional()
        .isIn(['all', 'get', 'give', 'settled'])
        .withMessage('Invalid filter status')
    ];
  }
}

/**
 * Universal validation runner that preserves old inputs on error
 */
export const validateRequest = (viewToRenderOnError?: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorArray = errors.array().map((err) => err.msg);

    // If client requested JSON (AJAX fetch or mobile API call)
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errorArray
      });
      return;
    }

    // SSR Form submission: Flash errors and preserve old input
    if (req.flash) {
      req.flash('errors', errorArray);
      req.flash('oldInput', req.body);
    }

    // If explicit view specified, re-render immediately; otherwise redirect back
    if (viewToRenderOnError) {
      res.status(422).render(viewToRenderOnError, {
        errors: errorArray,
        oldInput: req.body
      });
      return;
    }

    res.redirect('back');
  };
};

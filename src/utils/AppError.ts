export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(message: string, statusCode = 500, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message: string, errorCode?: string): AppError {
    return new AppError(message, 400, errorCode);
  }

  public static unauthorized(
    message = 'Unauthorized access. Please login.',
    errorCode?: string
  ): AppError {
    return new AppError(message, 401, errorCode);
  }

  public static forbidden(
    message = 'You do not have permission to perform this action',
    errorCode?: string
  ): AppError {
    return new AppError(message, 403, errorCode);
  }

  public static notFound(message = 'Requested resource not found', errorCode?: string): AppError {
    return new AppError(message, 404, errorCode);
  }

  public static unprocessable(message: string, errorCode?: string): AppError {
    return new AppError(message, 422, errorCode);
  }

  public static internal(message = 'Internal server error occurred', errorCode?: string): AppError {
    return new AppError(message, 500, errorCode);
  }
}

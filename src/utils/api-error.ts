export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static BAD_REQUEST(message: string): ApiError {
    return new ApiError(400, message);
  }

  static UNAUTHORIZED(message: string): ApiError {
    return new ApiError(401, message);
  }

  static FORBIDDEN(message: string): ApiError {
    return new ApiError(403, message);
  }

  static NOT_FOUND(message: string): ApiError {
    return new ApiError(404, message);
  }

  static INTERNAL_SERVER_ERROR(message: string): ApiError {
    return new ApiError(500, message);
  }
}

import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { AuthSession } from './session.model';
import { getBearerToken, verifyAccessToken } from './auth.utils';

export const authenticateRequest = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const payload = verifyAccessToken(token);
    const session = await AuthSession.findById(payload.sid).lean();

    if (!session || session.isRevoked || session.expiresAt.getTime() <= Date.now()) {
      throw ApiError.UNAUTHORIZED('Session expired');
    }

    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorizeAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.auth?.role !== 'admin') {
    return next(ApiError.FORBIDDEN('Admin access required'));
  }

  next();
};

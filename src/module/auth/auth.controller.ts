import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { ApiError } from '../../utils/api-error';
import { authValidation } from './auth.validation';
import { AuthService } from './auth.service';

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 3,
    path: '/api/auth',
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
  });
};

export class AuthController {
  private service = new AuthService();

  login = async (req: Request, res: Response) => {
    const validated = authValidation.login.parse({ body: req.body });
    const result = await this.service.login(validated.body, req);

    setRefreshCookie(res, result.tokens.refreshToken);

    return res.status(200).json(
      ApiResponse.success('Login successful', {
        accessToken: result.tokens.accessToken,
        user: result.user,
        session: result.session,
        expiresIn: result.tokens.expiresIn,
      })
    );
  };

  refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw ApiError.UNAUTHORIZED('Refresh token missing');
    }

    const result = await this.service.refresh(refreshToken, req);
    setRefreshCookie(res, result.tokens.refreshToken);

    return res.status(200).json(
      ApiResponse.success('Token refreshed successfully', {
        accessToken: result.tokens.accessToken,
        user: result.user,
        session: result.session,
        expiresIn: result.tokens.expiresIn,
      })
    );
  };

  logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        await this.service.revokeByRefreshToken(refreshToken);
      } catch {
        // ignore invalid refresh token on logout
      }
    }

    clearRefreshCookie(res);
    return res.status(200).json(ApiResponse.success('Logged out successfully'));
  };

  logoutCurrent = async (req: Request, res: Response) => {
    if (!req.auth) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    await this.service.revokeCurrentSession(req.auth.sessionId);
    clearRefreshCookie(res);
    return res.status(200).json(ApiResponse.success('Current session logged out successfully'));
  };

  logoutOthers = async (req: Request, res: Response) => {
    if (!req.auth) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const result = await this.service.revokeOtherSessions(req.auth.userId, req.auth.sessionId);
    return res.status(200).json(ApiResponse.success(result.message));
  };

  logoutAll = async (req: Request, res: Response) => {
    if (!req.auth) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const result = await this.service.revokeAllSessions(req.auth.userId);
    clearRefreshCookie(res);
    return res.status(200).json(ApiResponse.success(result.message));
  };

  me = async (req: Request, res: Response) => {
    if (!req.auth) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const user = await this.service.me(req.auth.userId, req.auth.sessionId);
    return res.status(200).json(ApiResponse.success('Current user fetched successfully', user));
  };

  getSessions = async (req: Request, res: Response) => {
    // if (req.auth) {
    const sessions = await this.service.listSessions(req?.auth);
    return res.status(200).json(ApiResponse.success('Sessions fetched successfully', sessions));
    // }
  };

  revokeSession = async (req: Request, res: Response) => {
    if (!req.auth) {
      throw ApiError.UNAUTHORIZED('Authentication required');
    }

    const session = await this.service.revokeSession(req.params.id, req.auth.userId, req.auth.role);
    return res.status(200).json(ApiResponse.success('Session revoked successfully', session));
  };

  createUser = async (req: Request, res: Response) => {
    const validated = authValidation.createUser.parse({ body: req.body });
    const user = await this.service.createUser(validated.body);
    return res.status(201).json(ApiResponse.success('User created successfully', user));
  };

  getUsers = async (req: Request, res: Response) => {
    const users = await this.service.listUsers();
    return res.status(200).json(ApiResponse.success('Users fetched successfully', users));
  };
}

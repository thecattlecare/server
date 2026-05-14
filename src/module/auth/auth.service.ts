import { Request } from 'express';
import { Types } from 'mongoose';
import { ApiError } from '../../utils/api-error';
import { User, IAuthUserDocument } from './auth.model';
import { AuthSession, IAuthSessionDocument } from './session.model';
import {
  IAuthMeResponse,
  IAuthSession,
  IAuthUser,
  IAuthPayload,
  ICreateUserInput,
  ILoginInput,
  ITokenPairResponse,
  ISessionDeviceInfo,
} from './auth.types';
import {
  buildAuthContext,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  hashToken,
  normalizeRole,
  parseDeviceInfo,
  TOKEN_LIFETIMES,
  verifyPassword,
  verifyRefreshToken,
} from './auth.utils';

const mapUser = (user: IAuthUserDocument): IAuthUser => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

const mapSession = (session: IAuthSessionDocument): IAuthSession => ({
  _id: session._id.toString(),
  userId: session.userId.toString(),
  ipAddress: session.ipAddress,
  userAgent: session.userAgent,
  browser: session.browser,
  os: session.os,
  device: session.device,
  current: false,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  lastUsedAt: session.lastUsedAt,
  expiresAt: session.expiresAt,
  revokedAt: session.revokedAt,
});

export class AuthService {
  private async findUserByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase().trim(), isActive: true }).select('+passwordHash');
  }

  private buildDeviceInfo(req: Pick<Request, 'ip' | 'headers'>): ISessionDeviceInfo {
    return parseDeviceInfo(req.headers['user-agent'], req.ip);
  }

  private async createSessionForUser(user: IAuthUserDocument, req: Pick<Request, 'ip' | 'headers'>) {
    const deviceInfo = this.buildDeviceInfo(req);
    const session = await AuthSession.create({
      userId: user._id,
      refreshTokenHash: hashToken(`${Date.now()}-${Math.random()}`),
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      device: deviceInfo.device,
      isRevoked: false,
      expiresAt: new Date(Date.now() + TOKEN_LIFETIMES.REFRESH_SECONDS * 1000),
      lastUsedAt: new Date(),
    });

    const accessToken = createAccessToken({
      sub: user._id.toString(),
      sid: session._id.toString(),
      role: user.role,
      email: user.email,
    });

    const refreshToken = createRefreshToken({
      sub: user._id.toString(),
      sid: session._id.toString(),
      role: user.role,
      email: user.email,
    });

    session.refreshTokenHash = hashToken(refreshToken);
    session.expiresAt = new Date(Date.now() + TOKEN_LIFETIMES.REFRESH_SECONDS * 1000);
    session.lastUsedAt = new Date();
    await session.save();

    return { session, accessToken, refreshToken };
  }

  async login(payload: ILoginInput, req: Pick<Request, 'ip' | 'headers'>): Promise<ITokenPairResponse> {
    const user = await this.findUserByEmail(payload.email);
    if (!user || !user.passwordHash) {
      throw ApiError.UNAUTHORIZED('Invalid email or password');
    }

    const passwordOk = verifyPassword(payload.password, user.passwordHash);
    if (!passwordOk) {
      throw ApiError.UNAUTHORIZED('Invalid email or password');
    }

    const { session, accessToken, refreshToken } = await this.createSessionForUser(user, req);

    return {
      user: mapUser(user),
      session: { ...mapSession(session), current: true },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: TOKEN_LIFETIMES.ACCESS_SECONDS,
        refreshExpiresIn: TOKEN_LIFETIMES.REFRESH_SECONDS,
      },
    };
  }

  async refresh(refreshToken: string, req: Pick<Request, 'ip' | 'headers'>): Promise<ITokenPairResponse> {
    const payload = verifyRefreshToken(refreshToken);
    const session = await AuthSession.findById(payload.sid).populate('userId').select('+refreshTokenHash');

    if (!session || !session.refreshTokenHash) {
      throw ApiError.UNAUTHORIZED('Session expired');
    }

    if (session.isRevoked || session.expiresAt.getTime() <= Date.now()) {
      throw ApiError.UNAUTHORIZED('Session expired');
    }

    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      throw ApiError.UNAUTHORIZED('Session expired');
    }

    const user = session.userId as unknown as IAuthUserDocument;
    if (!user || !user.isActive) {
      throw ApiError.UNAUTHORIZED('Session expired');
    }

    const newAccessToken = createAccessToken({
      sub: user._id.toString(),
      sid: session._id.toString(),
      role: user.role,
      email: user.email,
    });

    const newRefreshToken = createRefreshToken({
      sub: user._id.toString(),
      sid: session._id.toString(),
      role: user.role,
      email: user.email,
    });

    session.refreshTokenHash = hashToken(newRefreshToken);
    session.expiresAt = new Date(Date.now() + TOKEN_LIFETIMES.REFRESH_SECONDS * 1000);
    session.lastUsedAt = new Date();
    const deviceInfo = this.buildDeviceInfo(req);
    session.ipAddress = deviceInfo.ipAddress;
    session.userAgent = deviceInfo.userAgent;
    session.browser = deviceInfo.browser;
    session.os = deviceInfo.os;
    session.device = deviceInfo.device;
    await session.save();

    return {
      user: mapUser(user),
      session: { ...mapSession(session), current: true },
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: TOKEN_LIFETIMES.ACCESS_SECONDS,
        refreshExpiresIn: TOKEN_LIFETIMES.REFRESH_SECONDS,
      },
    };
  }

  async me(userId: string, sessionId: string): Promise<IAuthMeResponse> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw ApiError.UNAUTHORIZED('User not found');
    }

    return {
      ...mapUser(user),
      sessionId,
    };
  }

  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await AuthSession.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    return {
      sessions: sessions.map((session) => ({
        _id: session._id.toString(),
        userId: session.userId.toString(),
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        browser: session.browser,
        os: session.os,
        device: session.device,
        current: currentSessionId ? session._id.toString() === currentSessionId : false,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
      })) as IAuthSession[],
      currentSessionId: currentSessionId || null,
    };
  }

  async revokeSession(sessionId: string, requesterUserId: string, requesterRole: string) {
    const session = await AuthSession.findById(sessionId);
    if (!session) {
      throw ApiError.NOT_FOUND('Session not found');
    }

    if (requesterRole !== 'admin' && session.userId.toString() !== requesterUserId) {
      throw ApiError.FORBIDDEN('You can only revoke your own sessions');
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();
    return session;
  }

  async revokeCurrentSession(sessionId: string) {
    const session = await AuthSession.findById(sessionId);
    if (!session) {
      throw ApiError.NOT_FOUND('Session not found');
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();
    return session;
  }

  async revokeByRefreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const session = await AuthSession.findById(payload.sid).select('+refreshTokenHash');

    if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
      throw ApiError.UNAUTHORIZED('Session expired');
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();
    return session;
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    await AuthSession.updateMany(
      {
        userId: new Types.ObjectId(userId),
        _id: { $ne: new Types.ObjectId(currentSessionId) },
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      }
    );

    return { message: 'Other sessions revoked successfully' };
  }

  async revokeAllSessions(userId: string) {
    await AuthSession.updateMany(
      {
        userId: new Types.ObjectId(userId),
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      }
    );

    return { message: 'All sessions revoked successfully' };
  }

  async createUser(payload: ICreateUserInput) {
    const existingUser = await User.findOne({ email: payload.email.toLowerCase().trim() });
    if (existingUser) {
      throw ApiError.BAD_REQUEST('Email already exists');
    }

    const user = await User.create({
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      passwordHash: hashPassword(payload.password),
      role: normalizeRole(payload.role),
      isActive: true,
    });

    return mapUser(user);
  }

  async listUsers() {
    const users = await User.find({}).sort({ createdAt: -1 });
    return users.map(mapUser);
  }
}

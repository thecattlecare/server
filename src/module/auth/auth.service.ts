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
  IRequestAuthContext,
} from './auth.types';
import {
  createAccessToken,
  createRefreshToken,
  detectIP,
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
  salary: user.salary,
});

const mapSession = (session: IAuthSessionDocument): IAuthSession => ({
  _id: session._id.toString(),
  userId: session.userId.toString(),
  ipAddress: session.ipAddress,
  userAgent: session.userAgent,
  browser: session.browser,
  os: session.os,
  device: session.device,
  isBot: session.isBot,
  botName: session.botName,
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
  private async findUserByPhone(phone: string) {
    return User.findOne({ phone: phone.trim(), isActive: true }).select('+passwordHash');
  }

  private buildDeviceInfo(req: any): ISessionDeviceInfo {
    // Use express-useragent parsed data and request-ip for detailed information
    return parseDeviceInfo(req.useragent, req.clientIp || req.ip);
  }

  private async createSessionForUser(user: IAuthUserDocument, req: any) {
    const deviceInfo = this.buildDeviceInfo(req);
    const session = await AuthSession.create({
      userId: user._id,
      refreshTokenHash: hashToken(`${Date.now()}-${Math.random()}`),
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      device: deviceInfo.device,
      isBot: deviceInfo.isBot,
      botName: deviceInfo.botName,
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

  async login(payload: ILoginInput, req: any): Promise<ITokenPairResponse> {
    let user: IAuthUserDocument | null = null;
    if (payload.email) {
      user = await this.findUserByEmail(payload.email);
      if (!user || !user.passwordHash) {
        throw ApiError.UNAUTHORIZED('Invalid email or password');
      }
    } else if (payload.phone) {
      user = await this.findUserByPhone(payload.phone.trim());
      if (!user || !user.passwordHash) {
        throw ApiError.UNAUTHORIZED('Invalid phone number or password');
      }
    }
    if (!user || !user.passwordHash) {
      throw ApiError.UNAUTHORIZED('Invalid credentials');
    }

    const passwordOk = verifyPassword(payload.password, user.passwordHash);
    if (!passwordOk) {
      throw ApiError.UNAUTHORIZED('Invalid credentials');
    }

    const { session, accessToken, refreshToken } = await this.createSessionForUser(user, req);

    if (process.env.N8N_WEBHOOK_URL) {
      detectIP(user, session);
    }

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

  async refresh(refreshToken: string, req: any): Promise<ITokenPairResponse> {
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

  async listSessions(authContext?: IRequestAuthContext): Promise<{ sessions: IAuthSession[]; currentSessionId: string | null }> {
    if (authContext?.role === 'admin') {
      const sessions = await AuthSession.find({}).sort({ createdAt: -1 }).lean().populate('userId', 'name email role phone');
      return {
        sessions: sessions.map((session) => ({
          _id: session._id.toString(),
          userId: session.userId,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          browser: session.browser,
          os: session.os,
          device: session.device,
          current: authContext?.sessionId ? session._id.toString() === authContext.sessionId : false,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          lastUsedAt: session.lastUsedAt,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
        })) as IAuthSession[],
        currentSessionId: authContext?.sessionId || null,
      };
    }

    const sessions = await AuthSession.find({ userId: new Types.ObjectId(authContext?.userId as string) })
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
        current: authContext?.sessionId ? session._id.toString() === authContext.sessionId : false,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
      })) as IAuthSession[],
      currentSessionId: authContext?.sessionId || null,
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
    const existingPhone = await User.findOne({ phone: payload.phone?.trim() });
    if (existingUser) {
      throw ApiError.BAD_REQUEST('Email already exists');
    }
    if (existingPhone) {
      throw ApiError.BAD_REQUEST('Phone number already exists');
    }

    const user = await User.create({
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone?.trim(),
      passwordHash: hashPassword(payload.password),
      role: normalizeRole(payload.role),
      isActive: true,
      salary: Number(payload.salary ?? 0),
    });

    return mapUser(user);
  }

  async listUsers() {
    const users = await User.find({}).sort({ createdAt: -1 });
    return users.map(mapUser);
  }
}

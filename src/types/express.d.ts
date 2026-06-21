import { IRequestAuthContext } from '../module/auth/auth.types';
import { UAParser } from 'express-useragent';

declare global {
  namespace Express {
    interface Request {
      auth?: IRequestAuthContext;
      clientIp?: string; // IP address from request-ip
      useragent?: UAParser.IDetails; // User agent details from express-useragent
    }
  }
}

export {};
import { IRequestAuthContext } from '../module/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      auth?: IRequestAuthContext;
    }
  }
}

export {};
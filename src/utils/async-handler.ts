import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const AsyncHandler = (fn: AsyncFunction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req, res, next);

      // Automatically send ApiResponse objects
      if (result && typeof result === 'object' && 'status' in result && 'success' in result) {
        return res.status(result.status).json(result);
      }

      return result;
    } catch (error) {
      next(error);
    }
  };
}

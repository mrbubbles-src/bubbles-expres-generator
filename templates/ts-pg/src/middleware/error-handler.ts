import { GlobalError } from '../types/types.js';
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: GlobalError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    statusCode,
    message: err.message,
  });
};

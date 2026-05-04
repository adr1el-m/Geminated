import type { NextFunction, Request, Response } from "express";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(error.stack);

  const status = res.statusCode ? res.statusCode : 500;

  res.status(status).json({ message: error.message, isError: true });
};

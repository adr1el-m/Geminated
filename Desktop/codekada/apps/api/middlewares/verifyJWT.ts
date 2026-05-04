import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../configs/envalid.js";

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized", isError: true });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized", isError: true });
  }
  jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Verification failed:", err.message, "Token snippet:", token.substring(0, 15));
      return res.status(403).json({ message: "Forbidden", isError: true });
    }
    const payload = decoded as JwtPayload;
    
    // Attach user info to request
    (req as any).user = {
      id: payload.id,
      email: payload.sub,
      role: payload.role
    };
    
    next();
  });
};

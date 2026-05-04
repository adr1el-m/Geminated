import bcrypt from "bcrypt";
import { eq, or } from "drizzle-orm";
import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { db } from "../configs/db.js";
import { env } from "../configs/envalid.js";
import { users } from "../models/userModel.js";
import { patients } from "../models/patientModel.js";
import { facilities } from "../models/facilityModel.js";
import { tryCatch } from "../utils/tryCatch.js";
import crypto from "crypto";

export const registerPatient = async (req: Request, res: Response) => {
  const { email, password, full_name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  const user = await tryCatch(
    db.insert(users).values({
      id: userId,
      email,
      password_hash: hashedPassword,
      role: "patient"
    }).returning()
  );

  if (user.error) return res.status(400).json({ message: "Registration failed" });

  await db.insert(patients).values({
    id: crypto.randomUUID(),
    user_id: userId,
    email,
    full_name
  });

  res.status(201).json({ message: "Patient registered" });
};

export const registerFacility = async (req: Request, res: Response) => {
  const { email, password, name, location, type } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  const user = await tryCatch(
    db.insert(users).values({
      id: userId,
      email,
      password_hash: hashedPassword,
      role: "facility"
    }).returning()
  );

  if (user.error) return res.status(400).json({ message: "Registration failed" });

  await db.insert(facilities).values({
    id: crypto.randomUUID(),
    uid: crypto.randomUUID(), // Compatibility UID
    user_id: userId,
    email,
    name,
    location,
    type,
    is_verified: true
  });

  res.status(201).json({ message: "Facility registered" });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    return res.status(400).json({
      message: "Email Address and Password are required",
      isError: true,
    });
  }

  const foundUser = await tryCatch(
    db.select().from(users).where(eq(users.email, email)),
  );

  if (foundUser.error || !foundUser.data || foundUser.data.length === 0) {
    return res.status(401).json({ message: "Invalid credentials", isError: true });
  }

  const user = foundUser.data![0]!;
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    return res.status(401).json({ message: "Invalid credentials", isError: true });
  }

  const role = (user.role || "patient").toLowerCase();

  const accessToken = jwt.sign(
    { sub: user.email, role: role, id: user.id }, 
    env.ACCESS_TOKEN_SECRET, 
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { sub: user.email }, 
    env.REFRESH_TOKEN_SECRET, 
    { expiresIn: "1d" }
  );

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Get name based on role
  let name = user.email;
  if (role === "patient") {
    const p = await db.select({ name: patients.full_name }).from(patients).where(eq(patients.user_id, user.id)).limit(1);
    if (p[0]) name = p[0].name || name;
  } else if (role === "facility" || role === "admin") {
    const f = await db.select({ name: facilities.name }).from(facilities).where(eq(facilities.user_id, user.id)).limit(1);
    if (f[0]) name = f[0].name;
  }

  res.json({ access_token: accessToken, token_type: "bearer", role: role, name });
};

export const refresh = async (req: Request, res: Response) => {
  const cookies = req.cookies as { jwt?: string };
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(cookies.jwt, env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err || !decoded) return res.status(403).json({ message: "Forbidden" });
    const payload = decoded as JwtPayload;
    
    const foundUser = await tryCatch(db.select().from(users).where(eq(users.email, payload.sub!)));
    if (foundUser.error || !foundUser.data?.[0]) return res.status(401).json({ message: "Unauthorized" });

    const user = foundUser.data![0]!;
    const role = (user.role || "patient").toLowerCase();

    const accessToken = jwt.sign(
      { sub: user.email, role: role, id: user.id }, 
      env.ACCESS_TOKEN_SECRET, 
      { expiresIn: "1d" }
    );
    res.json({ access_token: accessToken });
  });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("jwt", { httpOnly: true, sameSite: "none", secure: true });
  res.json({ message: "Logged out" });
};

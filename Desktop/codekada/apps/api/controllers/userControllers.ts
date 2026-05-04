import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../configs/db.js";
import {
  createUserSchema,
  updateUserSchema,
  users,
  type NewUser,
} from "../models/userModel.js";
import { tryCatch } from "../utils/tryCatch.js";

export const getAllUsers = async (req: Request, res: Response) => {
  const allUsers = await tryCatch(
    db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users),
  );

  if (allUsers.error) {
    return res
      .status(404)
      .json({ message: "Failed to get all users", isError: true });
  }

  res.json(allUsers.data);
};

export const getUser = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "User ID is required", isError: true });
  }

  const user = await tryCatch(
    db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, id)),
  );

  if (user.error) {
    return res
      .status(500)
      .json({ message: "Failed to get user", isError: true });
  }

  if (!user.data || user.data.length === 0) {
    return res.status(404).json({ message: "User not found", isError: true });
  }

  res.json(user.data[0]);
};

export const createUser = async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const { email, password, role } = parsed.data;

  const existing = await tryCatch(
    db.select().from(users).where(eq(users.email, email)),
  );

  if (existing.error) {
    return res
      .status(400)
      .json({ message: "Internal Server Error", isError: true });
  }

  if (existing.data.length > 0) {
    return res
      .status(409)
      .json({ message: "Email Address already exists", isError: true });
  }

  const hashedPassword = await tryCatch(bcrypt.hash(password, 10));

  if (hashedPassword.error) {
    return res
      .status(400)
      .json({ message: "Internal Server Error", isError: true });
  }

  const newUser: NewUser = {
    id: randomUUID(),
    email,
    password_hash: hashedPassword.data,
    role: role,
  };

  const created = await tryCatch(
    db.insert(users).values(newUser).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      created_at: users.created_at,
    }),
  );

  if (created.error) {
    return res
      .status(400)
      .json({ message: "Failed to create user", isError: true });
  }

  res.status(201).json([created.data]);
};

export const updateUser = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "User ID is required", isError: true });
  }

  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const { email, password, role } = parsed.data;

  const updates: Partial<NewUser> = {};
  if (email) updates.email = email;
  if (password) {
    const hashedPassword = await tryCatch(bcrypt.hash(password, 10));
    if (hashedPassword.error) {
      return res
        .status(400)
        .json({ message: "Internal Server Error", isError: true });
    }
    updates.password_hash = hashedPassword.data;
  }
  if (role) updates.role = role;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "No fields to update", isError: true });
  }

  const updated = await tryCatch(
    db.update(users).set(updates).where(eq(users.id, id)).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      created_at: users.created_at,
    }),
  );

  if (updated.error) {
    return res
      .status(400)
      .json({ message: "Failed to update user", isError: true });
  }

  if (!updated.data || updated.data.length === 0) {
    return res.status(404).json({ message: "User not found", isError: true });
  }

  res.json(updated.data);
};

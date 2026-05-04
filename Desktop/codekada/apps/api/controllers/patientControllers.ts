import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../configs/db.js";
import {
  createPatientSchema,
  patients,
  updatePatientSchema,
  type NewPatient,
} from "../models/patientModel.js";
import { tryCatch } from "../utils/tryCatch.js";

export const getAllPatients = async (req: Request, res: Response) => {
  const allPatients = await tryCatch(
    db
      .select({
        id: patients.id,
        user_id: patients.user_id,
        email: patients.email,
        personal_info: patients.personal_info,
        medical_info: patients.medical_info,
        settings: patients.settings,
        activity: patients.activity,
        created_at: patients.created_at,
        updated_at: patients.updated_at,
      })
      .from(patients),
  );

  if (allPatients.error) {
    return res
      .status(500)
      .json({ message: "Failed to get all patients", isError: true });
  }

  res.json(allPatients.data);
};

export const getPatient = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Patient ID is required", isError: true });
  }

  const patient = await tryCatch(
    db
      .select({
        id: patients.id,
        user_id: patients.user_id,
        email: patients.email,
        personal_info: patients.personal_info,
        medical_info: patients.medical_info,
        settings: patients.settings,
        activity: patients.activity,
        created_at: patients.created_at,
        updated_at: patients.updated_at,
      })
      .from(patients)
      .where(eq(patients.id, id)),
  );

  if (patient.error) {
    return res
      .status(500)
      .json({ message: "Failed to get patient", isError: true });
  }

  if (!patient.data || patient.data.length === 0) {
    return res
      .status(404)
      .json({ message: "Patient not found", isError: true });
  }

  res.json(patient.data[0]);
};

export const createPatient = async (req: Request, res: Response) => {
  const parsed = createPatientSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const { user_id, email, personal_info, medical_info, settings, activity } =
    parsed.data;

  const existing = await tryCatch(
    db.select().from(patients).where(eq(patients.email, email)),
  );

  if (existing.error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", isError: true });
  }

  if (existing.data.length > 0) {
    return res
      .status(409)
      .json({ message: "Patient already exists", isError: true });
  }

  const newPatient: NewPatient = {
    id: randomUUID(),
    user_id,
    email,
    personal_info: personal_info ?? {},
    medical_info: medical_info ?? {
      allergies: [],
      surgeries: [],
      conditions: {},
      medications: [],
    },
    settings: settings ?? {},
    activity: activity ?? { consultationHistory: [] },
  };

  const created = await tryCatch(
    db.insert(patients).values(newPatient).returning({
      id: patients.id,
      user_id: patients.user_id,
      email: patients.email,
      personal_info: patients.personal_info,
      medical_info: patients.medical_info,
      settings: patients.settings,
      activity: patients.activity,
      created_at: patients.created_at,
      updated_at: patients.updated_at,
    }),
  );

  if (created.error) {
    return res
      .status(500)
      .json({ message: "Failed to create patient", isError: true });
  }

  res.status(201).json(created.data);
};

export const updatePatient = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Patient ID is required", isError: true });
  }

  const parsed = updatePatientSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const { email, personal_info, medical_info, settings, activity } =
    parsed.data;

  const updates: Partial<NewPatient> = {};
  if (email) updates.email = email;
  if (personal_info !== undefined) updates.personal_info = personal_info;
  if (medical_info !== undefined) updates.medical_info = medical_info;
  if (settings !== undefined) updates.settings = settings;
  if (activity !== undefined) updates.activity = activity;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "No fields to update", isError: true });
  }

  const updated = await tryCatch(
    db.update(patients).set(updates).where(eq(patients.id, id)).returning({
      id: patients.id,
      user_id: patients.user_id,
      email: patients.email,
      personal_info: patients.personal_info,
      medical_info: patients.medical_info,
      settings: patients.settings,
      activity: patients.activity,
      created_at: patients.created_at,
      updated_at: patients.updated_at,
    }),
  );

  if (updated.error) {
    return res
      .status(500)
      .json({ message: "Failed to update patient", isError: true });
  }

  if (!updated.data || updated.data.length === 0) {
    return res
      .status(404)
      .json({ message: "Patient not found", isError: true });
  }

  res.json(updated.data);
};

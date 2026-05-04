import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../configs/db.js";
import {
  consultations,
  createConsultationSchema,
  updateConsultationSchema,
  type NewConsultation,
} from "../models/consultationModel.js";
import { tryCatch } from "../utils/tryCatch.js";

export const getAllConsultations = async (req: Request, res: Response) => {
  const allConsultations = await tryCatch(
    db
      .select({
        id: consultations.id,
        patient_id: consultations.patient_id,
        doctor_name: consultations.doctor_name,
        specialty: consultations.specialty,
        date: consultations.date,
        status: consultations.status,
        notes: consultations.notes,
        data: consultations.data,
        created_at: consultations.created_at,
      })
      .from(consultations),
  );

  if (allConsultations.error) {
    return res
      .status(500)
      .json({ message: "Failed to get all consultations", isError: true });
  }

  res.json(allConsultations.data);
};

export const getConsultation = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Consultation ID is required", isError: true });
  }

  const consultation = await tryCatch(
    db
      .select({
        id: consultations.id,
        patient_id: consultations.patient_id,
        doctor_name: consultations.doctor_name,
        specialty: consultations.specialty,
        date: consultations.date,
        status: consultations.status,
        notes: consultations.notes,
        data: consultations.data,
        created_at: consultations.created_at,
      })
      .from(consultations)
      .where(eq(consultations.id, id)),
  );

  if (consultation.error) {
    return res
      .status(500)
      .json({ message: "Failed to get consultation", isError: true });
  }

  if (!consultation.data || consultation.data.length === 0) {
    return res
      .status(404)
      .json({ message: "Consultation not found", isError: true });
  }

  res.json(consultation.data[0]);
};

export const createConsultation = async (req: Request, res: Response) => {
  const parsed = createConsultationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const { patient_id, doctor_name, specialty, date, status, notes, data } =
    parsed.data;

  const newConsultation: NewConsultation = {
    id: randomUUID(),
    patient_id,
    doctor_name,
    specialty,
    date: date ? new Date(date) : undefined,
    status,
    notes,
    data: data ?? {},
  };

  const created = await tryCatch(
    db.insert(consultations).values(newConsultation).returning(),
  );

  if (created.error) {
    return res
      .status(500)
      .json({ message: "Failed to create consultation", isError: true });
  }

  res.status(201).json(created.data);
};

export const updateConsultation = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Consultation ID is required", isError: true });
  }

  const parsed = updateConsultationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const updates: Partial<NewConsultation> = {};
  const data = parsed.data;

  if (data.doctor_name !== undefined) updates.doctor_name = data.doctor_name;
  if (data.specialty !== undefined) updates.specialty = data.specialty;
  if (data.date !== undefined) updates.date = new Date(data.date);
  if (data.status !== undefined) updates.status = data.status;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.data !== undefined) updates.data = data.data;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "No fields to update", isError: true });
  }

  const updated = await tryCatch(
    db
      .update(consultations)
      .set(updates)
      .where(eq(consultations.id, id))
      .returning(),
  );

  if (updated.error) {
    return res
      .status(500)
      .json({ message: "Failed to update consultation", isError: true });
  }

  if (!updated.data || updated.data.length === 0) {
    return res
      .status(404)
      .json({ message: "Consultation not found", isError: true });
  }

  res.json(updated.data);
};

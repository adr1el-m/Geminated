import { randomUUID } from "crypto";
import { eq, desc, or } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../configs/db.js";
import {
  appointments,
  createAppointmentSchema,
  updateAppointmentSchema,
  type NewAppointment,
} from "../models/appointmentModel.js";
import { tryCatch } from "../utils/tryCatch.js";
import { patients } from "../models/patientModel.js";
import { facilities } from "../models/facilityModel.js";

export const getAllAppointments = async (req: Request, res: Response) => {
  const allAppointments = await tryCatch(
    db.select().from(appointments),
  );
  if (allAppointments.error) return res.status(500).json({ message: "Failed to get appointments" });
  res.json(allAppointments.data);
};

export const getAppointment = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const appointment = await tryCatch(
    db.select().from(appointments).where(eq(appointments.id, id)),
  );
  if (appointment.error || !appointment.data?.[0]) return res.status(404).json({ message: "Not found" });
  res.json(appointment.data[0]);
};

export const createAppointment = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  let patientId = req.body.patient_id;
  if (!patientId && user.role === "patient") {
    const p = await tryCatch(db.select({ id: patients.id }).from(patients).where(eq(patients.user_id, user.id)).limit(1));
    if (!p.error && p.data?.[0]) {
      patientId = p.data[0].id;
    }
  }

  req.body.patient_id = patientId;

  const parsed = createAppointmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues });

  const newAppt = { ...parsed.data, id: randomUUID(), data: parsed.data.data ?? {} };
  const created = await tryCatch(db.insert(appointments).values(newAppt).returning());
  if (created.error) return res.status(500).json({ message: "Failed to create" });
  res.status(201).json(created.data[0]);
};

export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.query;
  const updated = await tryCatch(
    db.update(appointments).set({ status: status as any }).where(eq(appointments.id, id as string)).returning()
  );
  if (updated.error) return res.status(500).json({ message: "Failed to update" });
  res.json(updated.data[0]);
};

export const getMyAppointments = async (req: Request, res: Response) => {
  const user = (req as any).user; 
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  let profileId = "";
  if (user.role === "patient") {
    const p = await db.select({ id: patients.id }).from(patients).where(eq(patients.user_id, user.id)).limit(1);
    if (p[0]) profileId = p[0].id;
  } else {
    const f = await db.select({ id: facilities.id }).from(facilities).where(eq(facilities.user_id, user.id)).limit(1);
    if (f[0]) profileId = f[0].id;
  }

  if (!profileId) return res.json([]); // Return empty array if no profile found

  const myAppts = await tryCatch(
    db
      .select({
        id: appointments.id,
        patient_id: appointments.patient_id,
        facility_id: appointments.facility_id,
        appointment_date: appointments.appointment_date,
        status: appointments.status,
        symptoms_summary: appointments.symptoms_summary,
        triage_score: appointments.triage_score,
        triage_explanation: appointments.triage_explanation,
      })
      .from(appointments)
      .where(or(eq(appointments.patient_id, profileId), eq(appointments.facility_id, profileId)))
      .orderBy(desc(appointments.appointment_date))
  );

  if (myAppts.error) return res.status(500).json({ message: "Error fetching appointments" });

  // Enrich with names
  const enriched = await Promise.all((myAppts.data || []).map(async (appt: any) => {
    const p = await db.select({ name: patients.full_name }).from(patients).where(eq(patients.id, appt.patient_id)).limit(1);
    const f = await db.select({ name: facilities.name }).from(facilities).where(eq(facilities.id, appt.facility_id)).limit(1);
    
    return {
      ...appt,
      patient_name: p[0]?.name || "Unknown Patient",
      facility_name: f[0]?.name || "Unknown Facility"
    };
  }));

  res.json(enriched);
};

export const getFacilities = async (req: Request, res: Response) => {
  const result = await tryCatch(db.select().from(facilities));
  if (result.error) return res.status(500).json({ message: "Error" });
  res.json(result.data);
};

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../configs/db.js";
import {
  createFacilitySchema,
  facilities,
  updateFacilitySchema,
  type NewFacility,
} from "../models/facilityModel.js";
import { tryCatch } from "../utils/tryCatch.js";

export const getAllFacilities = async (req: Request, res: Response) => {
  const allFacilities = await tryCatch(
    db
      .select({
        id: facilities.id,
        uid: facilities.uid,
        user_id: facilities.user_id,
        name: facilities.name,
        type: facilities.type,
        email: facilities.email,
        phone: facilities.phone,
        address: facilities.address,
        city: facilities.city,
        province: facilities.province,
        postal_code: facilities.postal_code,
        country: facilities.country,
        website: facilities.website,
        specialties: facilities.specialties,
        services: facilities.services,
        operating_hours: facilities.operating_hours,
        staff: facilities.staff,
        capacity: facilities.capacity,
        languages: facilities.languages,
        accreditation: facilities.accreditation,
        insurance_accepted: facilities.insurance_accepted,
        license_number: facilities.license_number,
        description: facilities.description,
        is_active: facilities.is_active,
        is_searchable: facilities.is_searchable,
        is_verified: facilities.is_verified,
        profile_complete: facilities.profile_complete,
        created_at: facilities.created_at,
        updated_at: facilities.updated_at,
      })
      .from(facilities),
  );

  if (allFacilities.error) {
    return res
      .status(500)
      .json({ message: "Failed to get all facilities", isError: true });
  }

  res.json(allFacilities.data);
};

export const getFacility = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Facility ID is required", isError: true });
  }

  const facility = await tryCatch(
    db
      .select({
        id: facilities.id,
        uid: facilities.uid,
        user_id: facilities.user_id,
        name: facilities.name,
        type: facilities.type,
        email: facilities.email,
        phone: facilities.phone,
        address: facilities.address,
        city: facilities.city,
        province: facilities.province,
        postal_code: facilities.postal_code,
        country: facilities.country,
        website: facilities.website,
        specialties: facilities.specialties,
        services: facilities.services,
        operating_hours: facilities.operating_hours,
        staff: facilities.staff,
        capacity: facilities.capacity,
        languages: facilities.languages,
        accreditation: facilities.accreditation,
        insurance_accepted: facilities.insurance_accepted,
        license_number: facilities.license_number,
        description: facilities.description,
        is_active: facilities.is_active,
        is_searchable: facilities.is_searchable,
        is_verified: facilities.is_verified,
        profile_complete: facilities.profile_complete,
        created_at: facilities.created_at,
        updated_at: facilities.updated_at,
      })
      .from(facilities)
      .where(eq(facilities.id, id)),
  );

  if (facility.error) {
    return res
      .status(500)
      .json({ message: "Failed to get facility", isError: true });
  }

  if (!facility.data || facility.data.length === 0) {
    return res
      .status(404)
      .json({ message: "Facility not found", isError: true });
  }

  res.json(facility.data[0]);
};

export const createFacility = async (req: Request, res: Response) => {
  const parsed = createFacilitySchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const {
    uid,
    user_id,
    name,
    type,
    email,
    phone,
    address,
    city,
    province,
    postal_code,
    country,
    website,
    specialties,
    services,
    operating_hours,
    staff,
    capacity,
    languages,
    accreditation,
    insurance_accepted,
    license_number,
    description,
    is_active,
    is_searchable,
    is_verified,
    profile_complete,
  } = parsed.data;

  const existingUid = await tryCatch(
    db.select().from(facilities).where(eq(facilities.uid, uid)),
  );

  if (existingUid.error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", isError: true });
  }

  if (existingUid.data.length > 0) {
    return res
      .status(409)
      .json({ message: "Facility UID already exists", isError: true });
  }

  const newFacility: NewFacility = {
    id: randomUUID(),
    uid,
    user_id,
    name,
    type,
    email,
    phone,
    address,
    city,
    province,
    postal_code,
    country,
    website,
    specialties: specialties ?? [],
    services: services ?? [],
    operating_hours: operating_hours ?? {},
    staff: staff ?? {},
    capacity: capacity ?? {},
    languages: languages ?? [],
    accreditation: accreditation ?? [],
    insurance_accepted: insurance_accepted ?? [],
    license_number,
    description,
    is_active: is_active ?? true,
    is_searchable: is_searchable ?? true,
    is_verified: is_verified ?? false,
    profile_complete: profile_complete ?? false,
  };

  const created = await tryCatch(
    db.insert(facilities).values(newFacility).returning(),
  );

  if (created.error) {
    return res
      .status(500)
      .json({ message: "Failed to create facility", isError: true });
  }

  res.status(201).json(created.data);
};

export const updateFacility = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  if (!id) {
    return res
      .status(400)
      .json({ message: "Facility ID is required", isError: true });
  }

  const parsed = updateFacilitySchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ message: parsed.error.issues, isError: true });
  }

  const updates: Partial<NewFacility> = {};
  const data = parsed.data;

  if (data.name) updates.name = data.name;
  if (data.type !== undefined) updates.type = data.type;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.address !== undefined) updates.address = data.address;
  if (data.city !== undefined) updates.city = data.city;
  if (data.province !== undefined) updates.province = data.province;
  if (data.postal_code !== undefined) updates.postal_code = data.postal_code;
  if (data.country !== undefined) updates.country = data.country;
  if (data.website !== undefined) updates.website = data.website;
  if (data.specialties !== undefined) updates.specialties = data.specialties;
  if (data.services !== undefined) updates.services = data.services;
  if (data.operating_hours !== undefined)
    updates.operating_hours = data.operating_hours;
  if (data.staff !== undefined) updates.staff = data.staff;
  if (data.capacity !== undefined) updates.capacity = data.capacity;
  if (data.languages !== undefined) updates.languages = data.languages;
  if (data.accreditation !== undefined)
    updates.accreditation = data.accreditation;
  if (data.insurance_accepted !== undefined)
    updates.insurance_accepted = data.insurance_accepted;
  if (data.license_number !== undefined)
    updates.license_number = data.license_number;
  if (data.description !== undefined) updates.description = data.description;
  if (data.is_active !== undefined) updates.is_active = data.is_active;
  if (data.is_searchable !== undefined)
    updates.is_searchable = data.is_searchable;
  if (data.is_verified !== undefined) updates.is_verified = data.is_verified;
  if (data.profile_complete !== undefined)
    updates.profile_complete = data.profile_complete;

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json({ message: "No fields to update", isError: true });
  }

  const updated = await tryCatch(
    db.update(facilities).set(updates).where(eq(facilities.id, id)).returning(),
  );

  if (updated.error) {
    return res
      .status(500)
      .json({ message: "Failed to update facility", isError: true });
  }

  if (!updated.data || updated.data.length === 0) {
    return res
      .status(404)
      .json({ message: "Facility not found", isError: true });
  }

  res.json(updated.data);
};

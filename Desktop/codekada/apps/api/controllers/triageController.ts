import type { Request, Response } from "express";
import Groq from "groq-sdk";
import crypto from "crypto";
import { env } from "../configs/envalid.js";
import { tryCatch } from "../utils/tryCatch.js";
import { db } from "../configs/db.js";
import { pgTable, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { eq, desc } from "drizzle-orm";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

// Temporary model definition for TriageSession until we consolidate models
export const triageSessions = pgTable("triage_sessions", {
  id: varchar("id").primaryKey().notNull(),
  session_token: varchar("session_token"),
  symptoms_raw: text("symptoms_raw"),
  urgency_level: varchar("urgency_level"),
  urgency_score: integer("urgency_score"),
  region: varchar("region"),
  created_at: timestamp("created_at").defaultNow(),
  language: varchar("language").default("English"),
});

export const getTriage = async (req: Request, res: Response) => {
  const { symptoms, language, session_token, region } = req.body;

  if (!symptoms) {
    return res.status(400).json({ message: "Symptoms are required" });
  }

  const prompt = `
    You are Haliya, a highly skilled AI medical triage assistant for the Philippines.
    Your goal is to save lives by accurately identifying the urgency of symptoms.
    
    Symptoms: ${symptoms}
    Language: ${language || 'English'}
    
    URGENCY SCORING RULES:
    - 9-10: LIFE-THREATENING. Immediate ER/Ambulance required (e.g., severe chest pain, internal bleeding, unconsciousness, severe difficulty breathing, stroke symptoms).
    - 7-8: URGENT. Needs medical attention within hours (e.g., high fever that won't break, deep lacerations, possible fractures).
    - 4-6: NON-URGENT. Needs medical attention but not an emergency (e.g., persistent cough, mild infections, minor injuries).
    - 1-3: SELF-CARE. Can be managed at home (e.g., common cold, minor scrapes).

    CRITICAL: If the patient mentions "internal bleeding", "bleeding from within", or similar, the urgency_score MUST be 10 and urgency_level MUST be "emergency".

    Respond strictly in JSON format with:
    {
      "urgency_level": "self-care" | "clinic" | "er" | "emergency",
      "urgency_score": 1-10,
      "summary": "Brief summary of the issue",
      "next_steps": ["Step 1", "Step 2"],
      "explanation": "Brief medical reasoning for this urgency level in ${language || 'English'}"
    }
  `;

  const completion = await tryCatch(
    groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    })
  );

  if (completion.error || !completion.data) {
    return res.status(500).json({ message: "AI Assessment failed", error: completion.error });
  }

  const result = JSON.parse(completion.data!.choices[0]!.message.content || "{}");

  // Log to DB (Anonymous)
  const sessionId = crypto.randomUUID();
  await tryCatch(
    db.insert(triageSessions).values({
      id: sessionId,
      session_token: session_token || 'anonymous',
      symptoms_raw: symptoms,
      urgency_level: result.urgency_level,
      urgency_score: result.urgency_score,
      region: region || 'Unknown',
      language: language || 'English',
    })
  );

  res.json(result);
};

export const getHistory = async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.json({ history: [], summary: "" });

  const history = await tryCatch(
    db.select()
      .from(triageSessions)
      .where(eq(triageSessions.session_token, token))
      .orderBy(desc(triageSessions.created_at))
  );

  if (history.error || !history.data) {
    return res.status(500).json({ message: "Failed to fetch history" });
  }

  res.json({
    history: history.data,
    summary: history.data.length > 0 ? "You have recent symptom reports logged on this device." : ""
  });
};

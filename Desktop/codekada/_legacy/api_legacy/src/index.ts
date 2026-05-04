import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";

import { classifySymptoms } from "./services/groq";
import { getAdminSummary, saveSymptomReport } from "./services/reports";
import type { TriageInput } from "./types";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const webOrigin = process.env.WEB_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: webOrigin }));
app.use(express.json({ limit: "1mb" }));

const triageInputSchema = z.object({
  text: z.string().min(5),
  age: z.number().int().min(0).max(120).optional(),
  temperature: z.number().min(30).max(45).optional(),
  durationDays: z.number().int().min(0).max(365).optional(),
});

const sanitizeInput = (input: TriageInput): TriageInput => ({
  text: input.text.trim(),
  age: input.age,
  temperature: input.temperature,
  durationDays: input.durationDays,
});

app.post("/api/triage", async (req, res) => {
  const parsed = triageInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input." });
  }

  try {
    const input = sanitizeInput(parsed.data);
    const result = await classifySymptoms(input);
    const saved = await saveSymptomReport(input, result);

    return res.json({
      ...result,
      id: saved?.id ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process triage request.";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/admin/summary", async (_req, res) => {
  try {
    const summary = await getAdminSummary();
    return res.json(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load summary.";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`TriagePH API listening on port ${port}`);
});

import { z } from "zod";

import type { TriageInput, TriageResult } from "../types";

const responseSchema = z.object({
  urgency: z.enum(["low", "medium", "high"]),
  context: z.string().min(3),
  recommendation: z.array(z.string().min(3)).min(1),
  symptom_tags: z.array(z.string().min(2)).min(1),
});

const systemPrompt =
  "You are a clinical triage assistant for TriagePH. Return ONLY a valid JSON object with the fields: " +
  "urgency (low|medium|high), context (1-2 sentences), recommendation (array of 2-4 steps), " +
  "symptom_tags (array of short tags). Use Taglish-friendly phrasing when appropriate. " +
  "If uncertain, choose the higher urgency. Do not include markdown or extra keys.";

const safeParseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Groq response was not valid JSON.");
  }
};

export const classifySymptoms = async (
  input: TriageInput,
): Promise<TriageResult> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set.");
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const userPrompt = [
    `Symptoms: ${input.text}`,
    `Age: ${input.age ?? "unknown"}`,
    `TemperatureC: ${input.temperature ?? "unknown"}`,
    `DurationDays: ${input.durationDays ?? "unknown"}`,
  ].join("\n");

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Groq response did not include content.");
  }

  const parsed = responseSchema.parse(safeParseJson(content));

  return {
    urgency: parsed.urgency,
    context: parsed.context,
    recommendation: parsed.recommendation,
    symptomTags: parsed.symptom_tags,
  };
};

import { PrismaClient } from "@prisma/client";

import type { AdminSummary, TriageInput, TriageResult } from "../types";

let prisma: PrismaClient | null | undefined;

const getPrisma = () => {
  if (prisma !== undefined) {
    return prisma;
  }

  prisma = process.env.DATABASE_URL ? new PrismaClient() : null;
  return prisma;
};

type UrgencyDb = "LOW" | "MEDIUM" | "HIGH";

const mapUrgency = (urgency: TriageResult["urgency"]): UrgencyDb => {
  switch (urgency) {
    case "low":
      return "LOW";
    case "medium":
      return "MEDIUM";
    case "high":
      return "HIGH";
  }
};

const emptySummary: AdminSummary = {
  totalReports: 0,
  urgencyBreakdown: [
    { level: "low", count: 0 },
    { level: "medium", count: 0 },
    { level: "high", count: 0 },
  ],
  topSymptoms: [],
  trend: [],
};

export const saveSymptomReport = async (
  input: TriageInput,
  result: TriageResult,
) => {
  const client = getPrisma();
  if (!client) {
    return null;
  }

  return client.symptomReport.create({
    data: {
      inputText: input.text,
      age: input.age,
      temperature: input.temperature,
      durationDays: input.durationDays,
      urgency: mapUrgency(result.urgency),
      context: result.context,
      recommendation: result.recommendation,
      symptomTags: result.symptomTags,
      aiResponse: result,
    },
  });
};

export const getAdminSummary = async (): Promise<AdminSummary> => {
  const client = getPrisma();
  if (!client) {
    return emptySummary;
  }

  const totalReports = await client.symptomReport.count();
  const urgencyCounts = await client.symptomReport.groupBy({
    by: ["urgency"],
    _count: { urgency: true },
  });

  const urgencyMap: Record<UrgencyDb, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  urgencyCounts.forEach((item: { urgency: UrgencyDb; _count: { urgency: number } }) => {
    urgencyMap[item.urgency] = item._count.urgency;
  });

  const recentReports = await client.symptomReport.findMany({
    select: { symptomTags: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const symptomCounts = new Map<string, number>();
  const trendCounts = new Map<string, number>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    trendCounts.set(key, 0);
    return {
      key,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  recentReports.forEach((report: { symptomTags: unknown; createdAt: Date }) => {
    const tags = Array.isArray(report.symptomTags)
      ? report.symptomTags.filter(
          (tag: unknown): tag is string => typeof tag === "string",
        )
      : [];

    tags.forEach((tag: string) => {
      const normalized = tag.trim().toLowerCase();
      if (!normalized) {
        return;
      }
      symptomCounts.set(normalized, (symptomCounts.get(normalized) || 0) + 1);
    });

    const key = report.createdAt.toISOString().slice(0, 10);
    if (trendCounts.has(key)) {
      trendCounts.set(key, (trendCounts.get(key) || 0) + 1);
    }
  });

  const topSymptoms = [...symptomCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  const trend = trendDays.map((day) => ({
    label: day.label,
    count: trendCounts.get(day.key) || 0,
  }));

  return {
    totalReports,
    urgencyBreakdown: [
      { level: "low", count: urgencyMap.LOW },
      { level: "medium", count: urgencyMap.MEDIUM },
      { level: "high", count: urgencyMap.HIGH },
    ],
    topSymptoms,
    trend,
  };
};

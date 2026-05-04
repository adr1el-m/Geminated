import type { Request, Response } from "express";
import { db } from "../configs/db.js";
import { triageSessions } from "./triageController.js";
import { pgTable, text, real, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql, eq, desc, gte } from "drizzle-orm";
import { tryCatch } from "../utils/tryCatch.js";

// Temporary model for OutbreakAlert
export const outbreakAlerts = pgTable("outbreak_alerts", {
  id: varchar("id").primaryKey().notNull(),
  symptom_cluster: varchar("symptom_cluster"),
  region: varchar("region"),
  spike_percentage: real("spike_percentage"),
  severity: varchar("severity"),
  message: text("message"),
  created_at: timestamp("created_at").defaultNow(),
});

export const getDashboardSummary = async (req: Request, res: Response) => {
  const result = await tryCatch(
    db.select({ 
      count: sql`count(*)`,
      avg_urgency: sql`avg(urgency_score)`
    }).from(triageSessions)
  );

  if (result.error || !result.data) {
    return res.status(500).json({ message: "Failed to fetch stats", error: String(result.error) });
  }

  // Get most affected region
  const regionResult = await db.select({ 
    region: triageSessions.region,
    count: sql`count(*)`
  }).from(triageSessions).groupBy(triageSessions.region).orderBy(desc(sql`count(*)`)).limit(1);

  res.json({
    total_reports_today: Number(result.data![0]!.count),
    avg_urgency_score: Number(result.data![0]!.avg_urgency || 0).toFixed(1),
    most_affected_region: regionResult[0]?.region || "None",
    active_alerts: 0
  });
};

export const getRegionalStats = async (req: Request, res: Response) => {
  const result = await tryCatch(
    db.select({
      region: triageSessions.region,
      report_count: sql`count(*)`,
      avg_urgency: sql`avg(urgency_score)`
    })
    .from(triageSessions)
    .groupBy(triageSessions.region)
  );

  if (result.error || !result.data) {
    return res.status(500).json({ message: "Failed to fetch regional stats", error: String(result.error) });
  }

  const data = result.data.map(r => ({
    region: r.region || "Unknown",
    report_count: Number(r.report_count),
    avg_urgency: Number(r.avg_urgency || 0).toFixed(1)
  }));

  res.json(data);
};

export const getTrends = async (req: Request, res: Response) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await tryCatch(
    db.select({
      date: sql`DATE(created_at)`,
      count: sql`count(*)`
    })
    .from(triageSessions)
    .where(gte(triageSessions.created_at, sevenDaysAgo))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`)
  );

  if (result.error || !result.data) {
    return res.status(500).json({ message: "Failed to fetch trends", error: String(result.error) });
  }

  const data = result.data.map(r => ({
    date: r.date,
    count: Number(r.count)
  }));

  res.json(data);
};

export const getAlerts = async (req: Request, res: Response) => {
  const result = await tryCatch(
    db.select().from(outbreakAlerts).orderBy(desc(outbreakAlerts.created_at)).limit(5)
  );

  if (result.error || !result.data) {
    return res.status(500).json({ message: "Failed to fetch alerts", error: String(result.error) });
  }

  res.json(result.data);
};

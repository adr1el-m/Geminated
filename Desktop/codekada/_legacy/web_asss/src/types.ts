export type TriageResult = {
  urgency: "low" | "medium" | "high";
  context: string;
  recommendation: string[];
  symptomTags?: string[];
  id?: string | null;
};

export type AdminSummary = {
  totalReports: number;
  urgencyBreakdown: { level: "low" | "medium" | "high"; count: number }[];
  topSymptoms: { label: string; count: number }[];
  trend: { label: string; count: number }[];
};

export interface TriageRequest {
  symptoms: string;
  age?: number;
  sex?: string;
  duration?: string;
  conditions?: string[];
  language?: string;
  session_token?: string;
  region?: string;
}

export interface TriageResponse {
  urgency_level: 'self-care' | 'clinic' | 'er' | 'emergency';
  urgency_score: number;
  summary: string;
  next_steps: string[];
  explanation: string;
}

export interface DashboardSummary {
  total_reports_today: number;
  avg_urgency_score: number;
  most_affected_region: string;
  active_alerts: number;
}

export interface RegionStat {
  region: string;
  report_count: number;
  avg_urgency: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface Alert {
  id: string;
  symptom_cluster: string;
  region: string;
  spike_percentage: number;
  severity: 'watch' | 'alert' | 'warning';
  message: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function getTriage(data: TriageRequest): Promise<TriageResponse> {
  const response = await fetch(`${API_URL}/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to get triage result');
  return response.json();
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_URL}/dashboard/summary`);
  if (!response.ok) throw new Error('Failed to fetch dashboard summary');
  return response.json();
}

export async function getByRegion(): Promise<RegionStat[]> {
  const response = await fetch(`${API_URL}/dashboard/regional`);
  if (!response.ok) throw new Error('Failed to fetch regional stats');
  return response.json();
}

export async function getTrend(): Promise<TrendData[]> {
  const response = await fetch(`${API_URL}/dashboard/trends`);
  if (!response.ok) throw new Error('Failed to fetch trend data');
  return response.json();
}

export async function getActiveAlerts(): Promise<Alert[]> {
  const response = await fetch(`${API_URL}/alerts`);
  if (!response.ok) throw new Error('Failed to fetch active alerts');
  return response.json();
}

export async function getHistory(token: string): Promise<{ history: any[], summary: string }> {
  const response = await fetch(`${API_URL}/triage/history?token=${token}`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}

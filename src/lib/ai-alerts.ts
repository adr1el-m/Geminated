import { db } from './db';

export async function getAiFieldAlerts() {
  try {
    const alerts = await db`
      select * from ai_field_alerts
      order by (case when sentiment = 'Critical' then 1 
                     when sentiment = 'Warning' then 2 
                     else 3 end), 
               affected_count desc
    `;
    return alerts;
  } catch (error) {
    console.error("Failed to fetch AI field alerts:", error);
    return [];
  }
}

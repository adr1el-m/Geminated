import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Perform a lightweight database connectivity check.
  // Returns 503 if the database is unreachable so uptime monitors
  // and load balancers can act on the failure immediately.
  try {
    await db`SELECT 1`;
  } catch {
    return Response.json(
      {
        status: 'error',
        service: 'star-link',
        db: 'unreachable',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  return Response.json(
    {
      status: 'ok',
      service: 'star-link',
      db: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

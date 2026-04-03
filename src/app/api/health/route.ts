export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'star-link',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

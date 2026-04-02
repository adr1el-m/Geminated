import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const rows = (await db`
    select file_name, mime_type, file_data
    from resources
    where id = ${id}
    limit 1
  `) as {
    file_name: string;
    mime_type: string;
    file_data: Buffer;
  }[];

  const document = rows[0];

  if (!document) {
    return new Response('Document not found', { status: 404 });
  }

  return new Response(new Uint8Array(document.file_data), {
    headers: {
      'Content-Type': document.mime_type,
      'Content-Disposition': `attachment; filename="${document.file_name}"`,
    },
  });
}
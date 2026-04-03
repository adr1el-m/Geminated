import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ensureModerationSchema } from '@/lib/community';
import { MOCK_SEED_EMAILS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await ensureModerationSchema();
  const currentUser = await getCurrentUser();

  const rows = (await db`
    select
      r.file_name,
      r.mime_type,
      r.file_data,
      r.moderation_status,
      r.author_id,
      u.email as author_email
    from resources r
    left join profiles u on u.id = r.author_id
    where r.id = ${id}
    limit 1
  `) as {
    file_name: string;
    mime_type: string;
    file_data: Buffer;
    moderation_status: 'pending' | 'approved' | 'rejected';
    author_id: string;
    author_email: string | null;
  }[];

  const document = rows[0];

  if (!document) {
    return new Response('Document not found', { status: 404 });
  }

  const canAccessUnapproved =
    currentUser?.role === 'admin' || currentUser?.id === document.author_id;

  const isPublicMockDocument =
    document.moderation_status === 'pending' &&
    !!document.author_email &&
    MOCK_SEED_EMAILS.includes(document.author_email);

  if (document.moderation_status !== 'approved' && !canAccessUnapproved && !isPublicMockDocument) {
    return new Response('Document not found', { status: 404 });
  }

  return new Response(new Uint8Array(document.file_data), {
    headers: {
      'Content-Type': document.mime_type,
      'Content-Disposition': `attachment; filename="${document.file_name}"`,
    },
  });
}
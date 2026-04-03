import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ensureModerationSchema } from '@/lib/community';
import { MOCK_SEED_EMAILS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeFileName(fileName: string) {
  const cleaned = fileName
    .replace(/[\r\n\t]/g, '')
    .replace(/["\\]/g, '')
    .replace(/[^a-zA-Z0-9._()\- ]+/g, '_')
    .trim()
    .slice(0, 140);

  return cleaned || 'document.bin';
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [first] = forwardedFor.split(',');
    return first?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!UUID_REGEX.test(id)) {
    return new Response('Invalid document ID.', { status: 400 });
  }

  const rateLimitResult = checkRateLimit({
    key: `download:${getClientIp(request)}`,
    windowMs: 60 * 1000,
    maxRequests: 40,
  });

  if (!rateLimitResult.allowed) {
    return new Response('Too many download requests.', {
      status: 429,
      headers: {
        'Retry-After': String(rateLimitResult.retryAfterSeconds),
      },
    });
  }

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

  const safeFileName = sanitizeFileName(document.file_name);

  return new Response(new Uint8Array(document.file_data), {
    headers: {
      'Content-Type': document.mime_type,
      'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
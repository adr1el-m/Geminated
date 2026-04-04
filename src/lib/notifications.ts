import { db } from './db';

let notificationsSchemaReady: Promise<void> | null = null;

type JsonRecord = Record<string, unknown>;

export type NotificationEntry = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  metadata: JsonRecord;
  read_at: string | null;
  created_at: string;
};

async function ensureNotificationsSchema() {
  if (!notificationsSchemaReady) {
    notificationsSchemaReady = (async () => {
      await db`
        create table if not exists notifications (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references profiles(id) on delete cascade,
          type text not null default 'info',
          title text not null,
          message text not null,
          link_url text,
          metadata jsonb not null default '{}'::jsonb,
          read_at timestamptz,
          created_at timestamptz not null default timezone('utc'::text, now())
        )
      `;
      await db`
        create index if not exists notifications_user_created_idx
        on notifications(user_id, created_at desc)
      `;
      await db`
        create index if not exists notifications_user_read_idx
        on notifications(user_id, read_at)
      `;
    })().catch((error) => {
      notificationsSchemaReady = null;
      throw error;
    });
  }

  await notificationsSchemaReady;
}

function normalizeText(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength);
}

export async function createNotification(input: {
  userId: string;
  type?: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  metadata?: JsonRecord;
}) {
  await ensureNotificationsSchema();

  const title = normalizeText(input.title, 180);
  const message = normalizeText(input.message, 1200);

  if (!title || !message) {
    return;
  }

  await db`
    insert into notifications (user_id, type, title, message, link_url, metadata)
    values (
      ${input.userId},
      ${normalizeText(input.type ?? 'info', 60)},
      ${title},
      ${message},
      ${input.linkUrl ?? null},
      ${input.metadata ?? {}}
    )
  `;
}

export async function createNotificationsForAdmins(input: {
  title: string;
  message: string;
  type?: string;
  linkUrl?: string;
  metadata?: JsonRecord;
  excludeUserId?: string;
}) {
  await ensureNotificationsSchema();

  const adminRows = (await db`
    select id
    from profiles
    where role = 'admin'
  `) as Array<{ id: string }>;

  for (const admin of adminRows) {
    if (input.excludeUserId && admin.id === input.excludeUserId) {
      continue;
    }

    await createNotification({
      userId: admin.id,
      type: input.type ?? 'moderation',
      title: input.title,
      message: input.message,
      linkUrl: input.linkUrl ?? '/admin',
      metadata: input.metadata,
    });
  }
}

export async function getNotificationsForUser(userId: string, limit = 20) {
  await ensureNotificationsSchema();

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 20;

  const rows = (await db`
    select
      id,
      user_id,
      type,
      title,
      message,
      link_url,
      metadata,
      read_at,
      created_at
    from notifications
    where user_id = ${userId}
    order by created_at desc
    limit ${safeLimit}
  `) as NotificationEntry[];

  return rows;
}

export async function getUnreadNotificationCount(userId: string) {
  await ensureNotificationsSchema();

  const rows = (await db`
    select count(*)::int as count
    from notifications
    where user_id = ${userId}
      and read_at is null
  `) as Array<{ count: number }>;

  return rows[0]?.count ?? 0;
}

export async function markAllNotificationsAsRead(userId: string) {
  await ensureNotificationsSchema();

  await db`
    update notifications
    set read_at = now()
    where user_id = ${userId}
      and read_at is null
  `;
}

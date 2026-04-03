import { db } from './db';
import { MOCK_SEED_EMAILS } from './constants';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

let moderationSchemaReady: Promise<void> | null = null;

export async function ensureModerationSchema() {
  if (!moderationSchemaReady) {
    moderationSchemaReady = (async () => {
      await db`
        alter table forum_posts
        add column if not exists moderation_status text not null default 'pending'
      `;
      await db`
        alter table forum_posts
        add column if not exists moderated_by uuid references profiles(id) on delete set null
      `;
      await db`
        alter table forum_posts
        add column if not exists moderated_at timestamptz
      `;

      await db`
        alter table resources
        add column if not exists moderation_status text not null default 'pending'
      `;
      await db`
        alter table resources
        add column if not exists moderated_by uuid references profiles(id) on delete set null
      `;
      await db`
        alter table resources
        add column if not exists moderated_at timestamptz
      `;

      await db`
        create index if not exists forum_posts_moderation_status_idx
        on forum_posts(moderation_status)
      `;
      await db`
        create index if not exists resources_moderation_status_idx
        on resources(moderation_status)
      `;
    })().catch((error) => {
      moderationSchemaReady = null;
      throw error;
    });
  }

  await moderationSchemaReady;
}

export type ForumTopic = {
  id: string;
  title: string;
  content: string;
  region: string;
  category: string;
  moderation_status: ModerationStatus;
  author_id: string;
  author_name: string;
  created_at: string;
};

export type ResourceUpload = {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  moderation_status: ModerationStatus;
  author_id: string;
  author_name: string;
  created_at: string;
};

export type PendingForumTopic = ForumTopic;
export type PendingResourceUpload = ResourceUpload;

export async function getForumTopics() {
  await ensureModerationSchema();

  const approvedRows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    where p.moderation_status = 'approved'
    order by p.created_at desc
  `) as ForumTopic[];

  if (approvedRows.length > 0) {
    return approvedRows;
  }

  const mockFallbackRows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    where p.moderation_status = 'pending'
      and u.email = any(${MOCK_SEED_EMAILS})
    order by p.created_at desc
  `) as ForumTopic[];

  return mockFallbackRows;
}

export async function getForumTopicById(id: string) {
  await ensureModerationSchema();

  const approvedRows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    where p.id = ${id}
      and p.moderation_status = 'approved'
    limit 1
  `) as ForumTopic[];

  if (approvedRows[0]) {
    return approvedRows[0];
  }

  const mockFallbackRows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    where p.id = ${id}
      and p.moderation_status = 'pending'
      and u.email = any(${MOCK_SEED_EMAILS})
    limit 1
  `) as ForumTopic[];

  return mockFallbackRows[0] ?? null;
}

export async function getResources() {
  await ensureModerationSchema();

  const approvedRows = (await db`
    select
      r.id,
      r.title,
      r.description,
      r.file_name,
      r.mime_type,
      r.file_size,
      r.moderation_status,
      r.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      r.created_at
    from resources r
    left join profiles u on u.id = r.author_id
    where r.moderation_status = 'approved'
    order by r.created_at desc
  `) as ResourceUpload[];

  if (approvedRows.length > 0) {
    return approvedRows;
  }

  const mockFallbackRows = (await db`
    select
      r.id,
      r.title,
      r.description,
      r.file_name,
      r.mime_type,
      r.file_size,
      r.moderation_status,
      r.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      r.created_at
    from resources r
    left join profiles u on u.id = r.author_id
    where r.moderation_status = 'pending'
      and u.email = any(${MOCK_SEED_EMAILS})
    order by r.created_at desc
  `) as ResourceUpload[];

  return mockFallbackRows;
}

export async function getPendingForumTopics() {
  await ensureModerationSchema();

  const rows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    where p.moderation_status = 'pending'
    order by p.created_at asc
  `) as PendingForumTopic[];

  return rows;
}

export async function getPendingResources() {
  await ensureModerationSchema();

  const rows = (await db`
    select
      r.id,
      r.title,
      r.description,
      r.file_name,
      r.mime_type,
      r.file_size,
      r.moderation_status,
      r.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      r.created_at
    from resources r
    left join profiles u on u.id = r.author_id
    where r.moderation_status = 'pending'
    order by r.created_at asc
  `) as PendingResourceUpload[];

  return rows;
}

export async function getApprovedForumTopicsByAuthor(authorId: string) {
  await ensureModerationSchema();

  const rows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    where p.author_id = ${authorId}
      and p.moderation_status = 'approved'
    order by p.created_at desc
  `) as ForumTopic[];

  return rows;
}

export async function getApprovedResourcesByAuthor(authorId: string) {
  await ensureModerationSchema();

  const rows = (await db`
    select
      r.id,
      r.title,
      r.description,
      r.file_name,
      r.mime_type,
      r.file_size,
      r.moderation_status,
      r.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      r.created_at
    from resources r
    left join profiles u on u.id = r.author_id
    where r.author_id = ${authorId}
      and r.moderation_status = 'approved'
    order by r.created_at desc
  `) as ResourceUpload[];

  return rows;
}

export async function createForumTopic(input: {
  title: string;
  content: string;
  region: string;
  category: string;
  authorId: string;
}) {
  await ensureModerationSchema();

  await db`
    insert into forum_posts (title, content, region, category, moderation_status, author_id)
    values (${input.title}, ${input.content}, ${input.region}, ${input.category}, ${'pending'}, ${input.authorId})
  `;
}

export async function createResourceUpload(input: {
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
  authorId: string;
}) {
  await ensureModerationSchema();

  await db`
    insert into resources (
      title,
      description,
      file_name,
      mime_type,
      file_size,
      file_data,
      moderation_status,
      author_id
    )
    values (
      ${input.title},
      ${input.description},
      ${input.fileName},
      ${input.mimeType},
      ${input.fileSize},
      ${input.fileData},
      ${'pending'},
      ${input.authorId}
    )
  `;
}

export async function updateForumTopicModeration(input: {
  id: string;
  status: Exclude<ModerationStatus, 'pending'>;
  moderatedBy: string;
}) {
  await ensureModerationSchema();

  await db`
    update forum_posts
    set
      moderation_status = ${input.status},
      moderated_by = ${input.moderatedBy},
      moderated_at = now()
    where id = ${input.id}
  `;
}

export async function updateResourceModeration(input: {
  id: string;
  status: Exclude<ModerationStatus, 'pending'>;
  moderatedBy: string;
}) {
  await ensureModerationSchema();

  await db`
    update resources
    set
      moderation_status = ${input.status},
      moderated_by = ${input.moderatedBy},
      moderated_at = now()
    where id = ${input.id}
  `;
}
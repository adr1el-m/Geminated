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
        alter table forum_posts
        add column if not exists upvote_count integer not null default 0
      `;
      await db`
        alter table forum_posts
        add column if not exists division text not null default 'Not specified'
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
        create index if not exists forum_posts_region_division_idx
        on forum_posts(region, division)
      `;
      await db`
        create index if not exists resources_moderation_status_idx
        on resources(moderation_status)
      `;

      await db`
        create table if not exists forum_comments (
          id uuid primary key default gen_random_uuid(),
          topic_id uuid not null references forum_posts(id) on delete cascade,
          content text not null,
          image_mime_type text,
          image_data bytea,
          image_file_name text,
          author_id uuid not null references profiles(id) on delete cascade,
          created_at timestamptz not null default timezone('utc'::text, now())
        )
      `;
      await db`
        create index if not exists forum_comments_topic_created_idx
        on forum_comments(topic_id, created_at asc)
      `;

      await db`
        create table if not exists forum_post_votes (
          id uuid primary key default gen_random_uuid(),
          topic_id uuid not null references forum_posts(id) on delete cascade,
          user_id uuid not null references profiles(id) on delete cascade,
          created_at timestamptz not null default timezone('utc'::text, now()),
          unique(topic_id, user_id)
        )
      `;
      await db`
        create index if not exists forum_post_votes_topic_idx
        on forum_post_votes(topic_id)
      `;
      await db`
        create index if not exists forum_post_votes_user_idx
        on forum_post_votes(user_id)
      `;

      await db`
        alter table forum_comments
        add column if not exists image_mime_type text
      `;
      await db`
        alter table forum_comments
        add column if not exists image_data bytea
      `;
      await db`
        alter table forum_comments
        add column if not exists image_file_name text
      `;

      await db`
        alter table resources
        add column if not exists region text not null default 'Unspecified'
      `;
      await db`
        alter table resources
        add column if not exists subject_area text not null default 'General Science'
      `;
      await db`
        alter table resources
        add column if not exists grade_level text not null default 'Multi-level'
      `;
      await db`
        alter table resources
        add column if not exists resource_type text not null default 'Teaching Resource'
      `;
      await db`
        alter table resources
        add column if not exists keywords text[] not null default '{}'::text[]
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
  division: string;
  category: string;
  comment_count: number;
  upvote_count: number;
  moderation_status: ModerationStatus;
  author_id: string;
  author_name: string;
  created_at: string;
};

export type ResourceUpload = {
  id: string;
  title: string;
  description: string | null;
  region: string;
  subject_area: string;
  grade_level: string;
  resource_type: string;
  keywords: string[];
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

export type ForumComment = {
  id: string;
  topic_id: string;
  content: string;
  image_mime_type: string | null;
  image_data: Buffer | Uint8Array | string | null;
  image_file_name: string | null;
  author_id: string;
  author_name: string;
  author_occupation: string;
  author_region: string;
  author_school: string | null;
  author_qualification_level: string;
  created_at: string;
};

export type ModeratedForumTopicResult = {
  id: string;
  author_id: string;
  title: string;
  moderation_status: Exclude<ModerationStatus, 'pending'>;
};

export type ModeratedResourceResult = {
  id: string;
  author_id: string;
  title: string;
  moderation_status: Exclude<ModerationStatus, 'pending'>;
};

export type RemovedForumTopicResult = {
  id: string;
  title: string;
};

export type RemovedResourceResult = {
  id: string;
  title: string;
};

export type RemovedForumCommentResult = {
  id: string;
  topic_id: string;
};

export async function getForumTopics() {
  await ensureModerationSchema();

  const approvedRows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.division,
      p.category,
      coalesce(fc.comment_count, 0) as comment_count,
      coalesce(p.upvote_count, 0) as upvote_count,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      coalesce(p.moderated_at, p.created_at) as created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    left join lateral (
      select count(*)::int as comment_count
      from forum_comments c
      where c.topic_id = p.id
    ) fc on true
    where p.moderation_status = 'approved'
    order by coalesce(p.moderated_at, p.created_at) desc
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
      p.division,
      p.category,
      coalesce(fc.comment_count, 0) as comment_count,
      coalesce(p.upvote_count, 0) as upvote_count,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    left join lateral (
      select count(*)::int as comment_count
      from forum_comments c
      where c.topic_id = p.id
    ) fc on true
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
      p.division,
      p.category,
      coalesce(fc.comment_count, 0) as comment_count,
      coalesce(p.upvote_count, 0) as upvote_count,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      coalesce(p.moderated_at, p.created_at) as created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    left join lateral (
      select count(*)::int as comment_count
      from forum_comments c
      where c.topic_id = p.id
    ) fc on true
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
      p.division,
      p.category,
      coalesce(fc.comment_count, 0) as comment_count,
      coalesce(p.upvote_count, 0) as upvote_count,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    left join lateral (
      select count(*)::int as comment_count
      from forum_comments c
      where c.topic_id = p.id
    ) fc on true
    where p.id = ${id}
      and p.moderation_status = 'pending'
      and u.email = any(${MOCK_SEED_EMAILS})
    limit 1
  `) as ForumTopic[];

  return mockFallbackRows[0] ?? null;
}

export async function getForumCommentsByTopic(topicId: string) {
  await ensureModerationSchema();

  const rows = (await db`
    select
      c.id,
      c.topic_id,
      c.content,
      c.image_mime_type,
      c.image_data,
      c.image_file_name,
      c.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      coalesce(u.occupation, 'Teacher') as author_occupation,
      coalesce(u.region, 'Unspecified') as author_region,
      u.school as author_school,
      coalesce(u.qualification_level, 'Not specified') as author_qualification_level,
      c.created_at
    from forum_comments c
    left join profiles u on u.id = c.author_id
    where c.topic_id = ${topicId}
    order by c.created_at asc
  `) as ForumComment[];

  return rows;
}

export async function getResources() {
  await ensureModerationSchema();

  const approvedRows = (await db`
    select
      r.id,
      r.title,
      r.description,
      r.region,
      r.subject_area,
      r.grade_level,
      r.resource_type,
      r.keywords,
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
      r.region,
      r.subject_area,
      r.grade_level,
      r.resource_type,
      r.keywords,
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
      p.division,
      p.category,
      coalesce(fc.comment_count, 0) as comment_count,
      coalesce(p.upvote_count, 0) as upvote_count,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    left join lateral (
      select count(*)::int as comment_count
      from forum_comments c
      where c.topic_id = p.id
    ) fc on true
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
      r.region,
      r.subject_area,
      r.grade_level,
      r.resource_type,
      r.keywords,
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
      p.division,
      p.category,
      coalesce(fc.comment_count, 0) as comment_count,
      coalesce(p.upvote_count, 0) as upvote_count,
      p.moderation_status,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      coalesce(p.moderated_at, p.created_at) as created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    left join lateral (
      select count(*)::int as comment_count
      from forum_comments c
      where c.topic_id = p.id
    ) fc on true
    where p.author_id = ${authorId}
      and p.moderation_status = 'approved'
    order by coalesce(p.moderated_at, p.created_at) desc
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
      r.region,
      r.subject_area,
      r.grade_level,
      r.resource_type,
      r.keywords,
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
  division: string;
  category: string;
  authorId: string;
}) {
  await ensureModerationSchema();

  const rows = (await db`
    insert into forum_posts (title, content, region, division, category, moderation_status, author_id)
    values (${input.title}, ${input.content}, ${input.region}, ${input.division}, ${input.category}, ${'pending'}, ${input.authorId})
    returning id
  `) as { id: string }[];

  return rows[0]?.id;
}

export async function createForumComment(input: {
  topicId: string;
  content: string;
  imageMimeType?: string | null;
  imageData?: Buffer | null;
  imageFileName?: string | null;
  authorId: string;
}) {
  await ensureModerationSchema();

  const rows = (await db`
    insert into forum_comments (topic_id, content, image_mime_type, image_data, image_file_name, author_id)
    values (
      ${input.topicId},
      ${input.content},
      ${input.imageMimeType ?? null},
      ${input.imageData ?? null},
      ${input.imageFileName ?? null},
      ${input.authorId}
    )
    returning id
  `) as { id: string }[];

  return rows[0]?.id;
}

export async function createResourceUpload(input: {
  title: string;
  description: string | null;
  region: string;
  subjectArea: string;
  gradeLevel: string;
  resourceType: string;
  keywords: string[];
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
  authorId: string;
}) {
  await ensureModerationSchema();

  const rows = (await db`
    insert into resources (
      title,
      description,
      region,
      subject_area,
      grade_level,
      resource_type,
      keywords,
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
      ${input.region},
      ${input.subjectArea},
      ${input.gradeLevel},
      ${input.resourceType},
      ${input.keywords},
      ${input.fileName},
      ${input.mimeType},
      ${input.fileSize},
      ${input.fileData},
      ${'pending'},
      ${input.authorId}
    )
    returning id
  `) as { id: string }[];

  return rows[0]?.id;
}

export async function updateForumTopicModeration(input: {
  id: string;
  status: Exclude<ModerationStatus, 'pending'>;
  moderatedBy: string;
}) {
  await ensureModerationSchema();

  const rows = (await db`
    update forum_posts
    set
      moderation_status = ${input.status},
      created_at = case when ${input.status} = 'approved' then now() else created_at end,
      moderated_by = ${input.moderatedBy},
      moderated_at = now()
    where id = ${input.id}
    returning id, author_id, title, moderation_status
  `) as ModeratedForumTopicResult[];

  return rows[0] ?? null;
}

export async function updateResourceModeration(input: {
  id: string;
  status: Exclude<ModerationStatus, 'pending'>;
  moderatedBy: string;
}) {
  await ensureModerationSchema();

  const rows = (await db`
    update resources
    set
      moderation_status = ${input.status},
      moderated_by = ${input.moderatedBy},
      moderated_at = now()
    where id = ${input.id}
    returning id, author_id, title, moderation_status
  `) as ModeratedResourceResult[];

  return rows[0] ?? null;
}

export async function getUserForumTopicVoteMap(topicIds: string[], userId: string) {
  await ensureModerationSchema();

  if (topicIds.length === 0) {
    return {} as Record<string, boolean>;
  }

  const rows = (await db`
    select topic_id
    from forum_post_votes
    where user_id = ${userId}
      and topic_id = any(${topicIds})
  `) as Array<{ topic_id: string }>;

  const voteMap: Record<string, boolean> = {};
  for (const row of rows) {
    voteMap[row.topic_id] = true;
  }

  return voteMap;
}

export async function toggleForumTopicUpvote(input: { topicId: string; userId: string }) {
  await ensureModerationSchema();

  const existing = (await db`
    select id
    from forum_post_votes
    where topic_id = ${input.topicId}
      and user_id = ${input.userId}
    limit 1
  `) as Array<{ id: string }>;

  if (existing[0]) {
    await db`
      delete from forum_post_votes
      where topic_id = ${input.topicId}
        and user_id = ${input.userId}
    `;

    const rows = (await db`
      update forum_posts
      set upvote_count = greatest(0, upvote_count - 1)
      where id = ${input.topicId}
      returning upvote_count
    `) as Array<{ upvote_count: number }>;

    return {
      upvoted: false,
      upvoteCount: rows[0]?.upvote_count ?? 0,
    };
  }

  await db`
    insert into forum_post_votes (topic_id, user_id)
    values (${input.topicId}, ${input.userId})
    on conflict (topic_id, user_id) do nothing
  `;

  const rows = (await db`
    update forum_posts
    set upvote_count = upvote_count + 1
    where id = ${input.topicId}
    returning upvote_count
  `) as Array<{ upvote_count: number }>;

  return {
    upvoted: true,
    upvoteCount: rows[0]?.upvote_count ?? 0,
  };
}

export async function deleteForumTopicById(id: string) {
  await ensureModerationSchema();

  const rows = (await db`
    delete from forum_posts
    where id = ${id}
    returning id, title
  `) as RemovedForumTopicResult[];

  return rows[0] ?? null;
}

export async function deleteResourceById(id: string) {
  await ensureModerationSchema();

  const rows = (await db`
    delete from resources
    where id = ${id}
    returning id, title
  `) as RemovedResourceResult[];

  return rows[0] ?? null;
}

export async function deleteForumCommentById(id: string) {
  await ensureModerationSchema();

  const rows = (await db`
    delete from forum_comments
    where id = ${id}
    returning id, topic_id
  `) as RemovedForumCommentResult[];

  return rows[0] ?? null;
}
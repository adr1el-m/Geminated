import { db } from './db';

export type ForumTopic = {
  id: string;
  title: string;
  content: string;
  region: string;
  category: string;
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
  author_id: string;
  author_name: string;
  created_at: string;
};

export async function getForumTopics() {
  const rows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    order by p.created_at desc
  `) as ForumTopic[];

  return rows;
}

export async function getForumTopicById(id: string) {
  const rows = (await db`
    select
      p.id,
      p.title,
      p.content,
      p.region,
      p.category,
      p.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      p.created_at
    from forum_posts p
    left join profiles u on u.id = p.author_id
    where p.id = ${id}
    limit 1
  `) as ForumTopic[];

  return rows[0] ?? null;
}

export async function getResources() {
  const rows = (await db`
    select
      r.id,
      r.title,
      r.description,
      r.file_name,
      r.mime_type,
      r.file_size,
      r.author_id,
      coalesce(u.full_name, 'Unknown Author') as author_name,
      r.created_at
    from resources r
    left join profiles u on u.id = r.author_id
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
  await db`
    insert into forum_posts (title, content, region, category, author_id)
    values (${input.title}, ${input.content}, ${input.region}, ${input.category}, ${input.authorId})
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
  await db`
    insert into resources (
      title,
      description,
      file_name,
      mime_type,
      file_size,
      file_data,
      author_id
    )
    values (
      ${input.title},
      ${input.description},
      ${input.fileName},
      ${input.mimeType},
      ${input.fileSize},
      ${input.fileData},
      ${input.authorId}
    )
  `;
}
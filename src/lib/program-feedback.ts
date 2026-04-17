import { db } from './db';

export type ProgramFeedback = {
  id: string;
  delivery_id: string;
  teacher_id: string;
  teacher_name: string | null;
  attended: boolean;
  rating: number | null;
  usefulness_score: number | null;
  comments: string | null;
  submitted_at: string;
};

export type FeedbackSummary = {
  deliveryId: string;
  totalResponses: number;
  attendanceRate: number;
  averageRating: number | null;
  averageUsefulness: number | null;
  recentComments: string[];
};

let feedbackSchemaReady: Promise<void> | null = null;

async function ensureFeedbackSchema() {
  if (!feedbackSchemaReady) {
    feedbackSchemaReady = (async () => {
      await db`
        create table if not exists program_feedback (
          id uuid primary key default gen_random_uuid(),
          delivery_id uuid not null references program_deliveries(id) on delete cascade,
          teacher_id uuid not null references profiles(id) on delete cascade,
          attended boolean not null default true,
          rating integer check (rating >= 1 and rating <= 5),
          usefulness_score integer check (usefulness_score >= 1 and usefulness_score <= 5),
          comments text,
          submitted_at timestamptz not null default now(),
          unique(delivery_id, teacher_id)
        )
      `;
      await db`
        create index if not exists program_feedback_delivery_idx
        on program_feedback(delivery_id, submitted_at desc)
      `;
      await db`
        create index if not exists program_feedback_teacher_idx
        on program_feedback(teacher_id)
      `;
    })().catch((error) => {
      feedbackSchemaReady = null;
      throw error;
    });
  }

  await feedbackSchemaReady;
}

export async function submitFeedback(input: {
  deliveryId: string;
  teacherId: string;
  attended: boolean;
  rating: number | null;
  usefulnessScore: number | null;
  comments: string | null;
}): Promise<ProgramFeedback> {
  await ensureFeedbackSchema();

  const rows = await db`
    insert into program_feedback (
      delivery_id, teacher_id, attended, rating, usefulness_score, comments
    ) values (
      ${input.deliveryId},
      ${input.teacherId},
      ${input.attended},
      ${input.rating},
      ${input.usefulnessScore},
      ${input.comments?.trim() || null}
    )
    on conflict (delivery_id, teacher_id)
    do update set
      attended = excluded.attended,
      rating = excluded.rating,
      usefulness_score = excluded.usefulness_score,
      comments = excluded.comments,
      submitted_at = now()
    returning
      id, delivery_id, teacher_id, null as teacher_name,
      attended, rating, usefulness_score, comments, submitted_at::text
  ` as ProgramFeedback[];

  return rows[0]!;
}

export async function getFeedbackByTeacher(teacherId: string): Promise<{ delivery_id: string }[]> {
  await ensureFeedbackSchema();

  const rows = await db`
    select delivery_id
    from program_feedback
    where teacher_id = ${teacherId}
  ` as { delivery_id: string }[];

  return rows;
}

export async function getFeedbackSummaryForDelivery(deliveryId: string): Promise<FeedbackSummary> {
  await ensureFeedbackSchema();

  const rows = await db`
    select
      pf.attended,
      pf.rating,
      pf.usefulness_score,
      pf.comments
    from program_feedback pf
    where pf.delivery_id = ${deliveryId}
    order by pf.submitted_at desc
  ` as { attended: boolean; rating: number | null; usefulness_score: number | null; comments: string | null }[];

  if (rows.length === 0) {
    return {
      deliveryId,
      totalResponses: 0,
      attendanceRate: 0,
      averageRating: null,
      averageUsefulness: null,
      recentComments: [],
    };
  }

  const attended = rows.filter((r) => r.attended).length;
  const ratedRows = rows.filter((r) => r.rating !== null);
  const usefulRows = rows.filter((r) => r.usefulness_score !== null);

  const averageRating = ratedRows.length > 0
    ? Math.round((ratedRows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratedRows.length) * 10) / 10
    : null;

  const averageUsefulness = usefulRows.length > 0
    ? Math.round((usefulRows.reduce((sum, r) => sum + (r.usefulness_score ?? 0), 0) / usefulRows.length) * 10) / 10
    : null;

  const recentComments = rows
    .map((r) => r.comments)
    .filter((c): c is string => Boolean(c))
    .slice(0, 5);

  return {
    deliveryId,
    totalResponses: rows.length,
    attendanceRate: Math.round((attended / rows.length) * 100),
    averageRating,
    averageUsefulness,
    recentComments,
  };
}

export async function getAllFeedbackSummaries(): Promise<FeedbackSummary[]> {
  await ensureFeedbackSchema();

  const rows = await db`
    select
      pf.delivery_id,
      count(*)::int as total_responses,
      round((sum(case when pf.attended then 1 else 0 end)::numeric / nullif(count(*), 0)::numeric) * 100)::int as attendance_rate,
      round(avg(pf.rating)::numeric, 1)::float as average_rating,
      round(avg(pf.usefulness_score)::numeric, 1)::float as average_usefulness,
      coalesce((
        select array_agg(comment_rows.comments order by comment_rows.submitted_at desc)
        from (
          select comments, submitted_at
          from program_feedback pf_comments
          where pf_comments.delivery_id = pf.delivery_id
            and pf_comments.comments is not null
            and btrim(pf_comments.comments) <> ''
          order by pf_comments.submitted_at desc
          limit 5
        ) as comment_rows
      ), '{}'::text[]) as recent_comments
    from program_feedback pf
    group by pf.delivery_id
    order by count(*) desc
  ` as Array<{
    delivery_id: string;
    total_responses: number;
    attendance_rate: number;
    average_rating: number | null;
    average_usefulness: number | null;
    recent_comments: string[];
  }>;

  return rows.map((row) => ({
    deliveryId: row.delivery_id,
    totalResponses: Number(row.total_responses) || 0,
    attendanceRate: Number(row.attendance_rate) || 0,
    averageRating: row.average_rating === null ? null : Number(row.average_rating),
    averageUsefulness: row.average_usefulness === null ? null : Number(row.average_usefulness),
    recentComments: Array.isArray(row.recent_comments) ? row.recent_comments : [],
  }));
}

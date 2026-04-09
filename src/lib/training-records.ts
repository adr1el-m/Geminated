import { db } from './db';
import { TRAINING_TYPES } from './constants';

export type TrainingType = (typeof TRAINING_TYPES)[number];

export type TrainingRecord = {
  id: string;
  teacher_id: string;
  program_title: string;
  provider: string;
  training_date: string | null;
  duration_hours: number | null;
  training_type: string;
  verified: boolean;
  created_at: string;
};

export type TrainingGapSummary = {
  region: string;
  totalTeachers: number;
  teachersWithTraining: number;
  teachersWithStarTraining: number;
  averageTrainingCount: number;
  trainingCoverageRate: number;
  starTrainingRate: number;
};

async function ensureTrainingSchema() {
  await db`
    create table if not exists training_records (
      id uuid primary key default gen_random_uuid(),
      teacher_id uuid not null references profiles(id) on delete cascade,
      program_title text not null,
      provider text not null default 'Self-reported',
      training_date date,
      duration_hours integer default null,
      training_type text not null default 'External Workshop',
      verified boolean not null default false,
      created_at timestamptz not null default now()
    )
  `;
  await db`
    create index if not exists training_records_teacher_idx
    on training_records(teacher_id, created_at desc)
  `;
}

export async function getTrainingRecordsForTeacher(teacherId: string): Promise<TrainingRecord[]> {
  await ensureTrainingSchema();

  const rows = await db`
    select
      id, teacher_id, program_title, provider,
      training_date::text, duration_hours, training_type, verified, created_at::text
    from training_records
    where teacher_id = ${teacherId}
    order by training_date desc nulls last, created_at desc
  ` as TrainingRecord[];

  return rows;
}

export async function addTrainingRecord(
  teacherId: string,
  input: {
    programTitle: string;
    provider: string;
    trainingDate: string | null;
    durationHours: number | null;
    trainingType: string;
  },
): Promise<TrainingRecord> {
  await ensureTrainingSchema();

  const rows = await db`
    insert into training_records (
      teacher_id, program_title, provider, training_date, duration_hours, training_type
    ) values (
      ${teacherId},
      ${input.programTitle.trim()},
      ${input.provider.trim() || 'Self-reported'},
      ${input.trainingDate || null},
      ${input.durationHours ?? null},
      ${input.trainingType}
    )
    returning
      id, teacher_id, program_title, provider,
      training_date::text, duration_hours, training_type, verified, created_at::text
  ` as TrainingRecord[];

  return rows[0]!;
}

export async function getTrainingGapsByRegion(): Promise<TrainingGapSummary[]> {
  await ensureTrainingSchema();

  const teacherRows = await db`
    select
      p.id,
      p.region,
      count(tr.id)::int as training_count,
      count(case when tr.training_type = 'STAR Capacity-Building' then 1 end)::int as star_count
    from profiles p
    left join training_records tr on tr.teacher_id = p.id
    where p.role = 'teacher'
      and p.consent_data_processing = true
    group by p.id, p.region
  ` as { id: string; region: string; training_count: number; star_count: number }[];

  const regionMap = new Map<string, {
    total: number;
    withTraining: number;
    withStarTraining: number;
    totalTrainingCount: number;
  }>();

  for (const row of teacherRows) {
    const existing = regionMap.get(row.region) ?? {
      total: 0,
      withTraining: 0,
      withStarTraining: 0,
      totalTrainingCount: 0,
    };

    regionMap.set(row.region, {
      total: existing.total + 1,
      withTraining: existing.withTraining + (row.training_count > 0 ? 1 : 0),
      withStarTraining: existing.withStarTraining + (row.star_count > 0 ? 1 : 0),
      totalTrainingCount: existing.totalTrainingCount + row.training_count,
    });
  }

  return [...regionMap.entries()].map(([region, data]) => ({
    region,
    totalTeachers: data.total,
    teachersWithTraining: data.withTraining,
    teachersWithStarTraining: data.withStarTraining,
    averageTrainingCount: data.total > 0
      ? Math.round((data.totalTrainingCount / data.total) * 10) / 10
      : 0,
    trainingCoverageRate: data.total > 0
      ? Math.round((data.withTraining / data.total) * 1000) / 10
      : 0,
    starTrainingRate: data.total > 0
      ? Math.round((data.withStarTraining / data.total) * 1000) / 10
      : 0,
  })).sort((a, b) => a.trainingCoverageRate - b.trainingCoverageRate);
}

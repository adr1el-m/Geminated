import { db } from './db';
import { REGISTRATION_REGIONS } from './constants';

export const PROGRAM_TYPES = [
  'STAR Capacity-Building Workshop',
  'Regional STEM Summit',
  'Teacher Induction Program',
  'Action Research Mentoring',
  'STEM Specialization Bridging',
  'School Twinning Facilitation',
  'Division-Level LAC Session',
  'National Convention',
  'Online Learning Sprint',
] as const;

export type ProgramType = (typeof PROGRAM_TYPES)[number];
export type DeliveryStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export type ProgramDelivery = {
  id: string;
  title: string;
  program_type: string;
  target_region: string;
  target_division: string | null;
  scheduled_date: string;
  status: DeliveryStatus;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

let deliverySchemaReady: Promise<void> | null = null;

async function ensureDeliverySchema() {
  if (!deliverySchemaReady) {
    deliverySchemaReady = (async () => {
      await db`
        create table if not exists program_deliveries (
          id uuid primary key default gen_random_uuid(),
          title text not null,
          program_type text not null,
          target_region text not null default 'National',
          target_division text,
          scheduled_date date not null,
          status text not null default 'scheduled'
            check (status in ('scheduled', 'ongoing', 'completed', 'cancelled')),
          notes text,
          created_by uuid references profiles(id) on delete set null,
          created_at timestamptz not null default now()
        )
      `;
      await db`
        create index if not exists program_deliveries_region_idx
        on program_deliveries(target_region, scheduled_date desc)
      `;
      await db`
        create index if not exists program_deliveries_status_idx
        on program_deliveries(status, scheduled_date desc)
      `;
    })().catch((error) => {
      deliverySchemaReady = null;
      throw error;
    });
  }

  await deliverySchemaReady;
}

export async function getProgramDeliveries(filters?: {
  region?: string;
  status?: DeliveryStatus;
}): Promise<ProgramDelivery[]> {
  await ensureDeliverySchema();

  const region = filters?.region;
  const status = filters?.status;

  const rows = await db`
    select
      pd.id,
      pd.title,
      pd.program_type,
      pd.target_region,
      pd.target_division,
      pd.scheduled_date::text,
      pd.status,
      pd.notes,
      pd.created_by,
      p.full_name as created_by_name,
      pd.created_at::text
    from program_deliveries pd
    left join profiles p on p.id = pd.created_by
    where (${region ?? null}::text is null or pd.target_region = ${region ?? ''} or pd.target_region = 'National')
      and (${status ?? null}::text is null or pd.status = ${status ?? ''})
    order by pd.scheduled_date desc
    limit 100
  ` as ProgramDelivery[];

  return rows;
}

export async function createProgramDelivery(input: {
  title: string;
  programType: string;
  targetRegion: string;
  targetDivision: string | null;
  scheduledDate: string;
  notes: string | null;
  createdBy: string;
}): Promise<ProgramDelivery> {
  await ensureDeliverySchema();

  const rows = await db`
    insert into program_deliveries (
      title, program_type, target_region, target_division,
      scheduled_date, status, notes, created_by
    ) values (
      ${input.title.trim()},
      ${input.programType},
      ${input.targetRegion},
      ${input.targetDivision || null},
      ${input.scheduledDate},
      'scheduled',
      ${input.notes?.trim() || null},
      ${input.createdBy}
    )
    returning
      id, title, program_type, target_region, target_division,
      scheduled_date::text, status, notes, created_by, null as created_by_name, created_at::text
  ` as ProgramDelivery[];

  return rows[0]!;
}

export async function updateProgramDeliveryStatus(
  id: string,
  status: DeliveryStatus,
): Promise<void> {
  await ensureDeliverySchema();
  await db`
    update program_deliveries
    set status = ${status}
    where id = ${id}
  `;
}

export async function getProgramDeliveryById(id: string): Promise<ProgramDelivery | null> {
  await ensureDeliverySchema();

  const rows = await db`
    select
      pd.id, pd.title, pd.program_type, pd.target_region, pd.target_division,
      pd.scheduled_date::text, pd.status, pd.notes, pd.created_by,
      p.full_name as created_by_name, pd.created_at::text
    from program_deliveries pd
    left join profiles p on p.id = pd.created_by
    where pd.id = ${id}
    limit 1
  ` as ProgramDelivery[];

  return rows[0] ?? null;
}

export async function getDeliveriesForTeacherRegion(region: string): Promise<ProgramDelivery[]> {
  await ensureDeliverySchema();

  const rows = await db`
    select
      pd.id, pd.title, pd.program_type, pd.target_region, pd.target_division,
      pd.scheduled_date::text, pd.status, pd.notes, pd.created_by,
      p.full_name as created_by_name, pd.created_at::text
    from program_deliveries pd
    left join profiles p on p.id = pd.created_by
    where pd.target_region = ${region}
       or pd.target_region = 'National'
    order by pd.scheduled_date desc
    limit 50
  ` as ProgramDelivery[];

  return rows;
}

export { REGISTRATION_REGIONS };

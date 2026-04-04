import { db } from './db';

let auditSchemaReady: Promise<void> | null = null;

type JsonRecord = Record<string, unknown>;

export type AuditLogEntry = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changed_fields: JsonRecord;
  metadata: JsonRecord;
  created_at: string;
};

async function ensureAuditSchema() {
  if (!auditSchemaReady) {
    auditSchemaReady = (async () => {
      await db`
        create table if not exists audit_logs (
          id uuid primary key default gen_random_uuid(),
          actor_id uuid references profiles(id) on delete set null,
          action text not null,
          entity_type text not null,
          entity_id text not null,
          changed_fields jsonb not null default '{}'::jsonb,
          metadata jsonb not null default '{}'::jsonb,
          created_at timestamptz not null default timezone('utc'::text, now())
        )
      `;
      await db`
        create index if not exists audit_logs_created_at_idx
        on audit_logs(created_at desc)
      `;
      await db`
        create index if not exists audit_logs_actor_id_idx
        on audit_logs(actor_id)
      `;
    })().catch((error) => {
      auditSchemaReady = null;
      throw error;
    });
  }

  await auditSchemaReady;
}

export async function logAuditEvent(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  changedFields?: JsonRecord;
  metadata?: JsonRecord;
}) {
  await ensureAuditSchema();

  await db`
    insert into audit_logs (actor_id, action, entity_type, entity_id, changed_fields, metadata)
    values (
      ${input.actorId},
      ${input.action},
      ${input.entityType},
      ${input.entityId},
      ${input.changedFields ?? {}},
      ${input.metadata ?? {}}
    )
  `;
}

export async function getRecentAuditLogs(limit = 40) {
  await ensureAuditSchema();

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 40;

  const rows = (await db`
    select
      a.id,
      a.actor_id,
      coalesce(p.full_name, 'System') as actor_name,
      a.action,
      a.entity_type,
      a.entity_id,
      a.changed_fields,
      a.metadata,
      a.created_at
    from audit_logs a
    left join profiles p on p.id = a.actor_id
    order by a.created_at desc
    limit ${safeLimit}
  `) as AuditLogEntry[];

  return rows;
}

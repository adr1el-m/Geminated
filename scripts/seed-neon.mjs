import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.local');
const schemaPath = path.join(rootDir, 'src/lib/db/schema.sql');

if (!fs.existsSync(envPath)) {
  throw new Error('.env.local is missing.');
}

const databaseUrlLine = fs
  .readFileSync(envPath, 'utf8')
  .split(/\r?\n/)
  .find((line) => line.startsWith('DATABASE_URL='));

if (!databaseUrlLine) {
  throw new Error('DATABASE_URL is missing from .env.local.');
}

const connectionString = databaseUrlLine.slice('DATABASE_URL='.length).trim();
const pool = new Pool({ connectionString });

const schemaStatements = fs
  .readFileSync(schemaPath, 'utf8')
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of schemaStatements) {
  await pool.query(statement);
}

const passwordHash = await bcrypt.hash('Password123!', 10);

async function upsertProfile(profile) {
  const occupation = profile.occupation ?? 'Teacher I';
  const division = profile.division ?? 'Not specified';
  const qualificationLevel = profile.qualificationLevel ?? 'Bachelor\'s Degree';
  const gender = profile.gender ?? 'Prefer not to say';
  const ageBracket = profile.ageBracket ?? '35-44';
  const trainingHistory = profile.trainingHistory ?? [];
  const starParticipationStatus = profile.starParticipationStatus ?? 'Active Participant';
  const dataQualityScore = profile.dataQualityScore ?? 82;
  const consentDataProcessing = profile.consentDataProcessing ?? true;
  const consentResearch = profile.consentResearch ?? true;
  const anonymizationOptOut = profile.anonymizationOptOut ?? false;
  const consentVersion = profile.consentVersion ?? 'v1.0';

  const { rows } = await pool.query(
    `insert into profiles (
      id,
      full_name,
      email,
      password_hash,
      occupation,
      region,
      division,
      school,
      qualification_level,
      gender,
      age_bracket,
      subjects_taught,
      training_history,
      star_participation_status,
      consent_data_processing,
      consent_research,
      consent_version,
      consented_at,
      anonymization_opt_out,
      profile_last_updated_at,
      years_of_experience,
      data_quality_score,
      role
    )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
     on conflict (email)
     do update set
       full_name = excluded.full_name,
       occupation = excluded.occupation,
       region = excluded.region,
       division = excluded.division,
       school = excluded.school,
       qualification_level = excluded.qualification_level,
       gender = excluded.gender,
       age_bracket = excluded.age_bracket,
       subjects_taught = excluded.subjects_taught,
       training_history = excluded.training_history,
       star_participation_status = excluded.star_participation_status,
      consent_data_processing = excluded.consent_data_processing,
      consent_research = excluded.consent_research,
      consent_version = excluded.consent_version,
      consented_at = excluded.consented_at,
      anonymization_opt_out = excluded.anonymization_opt_out,
      profile_last_updated_at = excluded.profile_last_updated_at,
       years_of_experience = excluded.years_of_experience,
       data_quality_score = excluded.data_quality_score,
       role = excluded.role
     returning id`,
    [
      crypto.randomUUID(),
      profile.fullName,
      profile.email,
      passwordHash,
      occupation,
      profile.region,
      division,
      profile.school,
      qualificationLevel,
      gender,
      ageBracket,
      profile.subjects,
      trainingHistory,
      starParticipationStatus,
      consentDataProcessing,
      consentResearch,
      consentVersion,
      consentDataProcessing ? new Date().toISOString() : null,
      anonymizationOptOut,
      new Date().toISOString(),
      profile.years,
      dataQualityScore,
      profile.role,
    ]
  );

  return rows[0].id;
}

async function insertForumPostIfMissing(post) {
  const existing = await pool.query('select id from forum_posts where title = $1 limit 1', [post.title]);

  if (existing.rowCount === 0) {
    await pool.query(
      `insert into forum_posts (id, title, content, region, category, moderation_status, author_id)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [crypto.randomUUID(), post.title, post.content, post.region, post.category, 'approved', post.authorId]
    );
  }
}

async function insertResourceIfMissing(resource) {
  const existing = await pool.query('select id from resources where title = $1 limit 1', [resource.title]);

  if (existing.rowCount === 0) {
    await pool.query(
      `insert into resources (id, title, description, file_name, mime_type, file_size, file_data, moderation_status, author_id)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        crypto.randomUUID(),
        resource.title,
        resource.description,
        resource.fileName,
        'text/plain',
        Buffer.byteLength(resource.fileData),
        Buffer.from(resource.fileData),
        'approved',
        resource.authorId,
      ]
    );
  }
}

const adrielId = await upsertProfile({
  fullName: 'Adriel Magalona',
  email: 'adriel@example.org',
  occupation: 'Teacher III',
  region: 'NCR',
  division: 'Quezon City',
  school: 'Quezon City Science High School',
  qualificationLevel: 'Master\'s Degree',
  gender: 'Male',
  ageBracket: '35-44',
  subjects: ['Computer Science', 'STEM Research'],
  trainingHistory: ['2025 AI in STEM Fellowship', '2024 Regional Action Research Bootcamp'],
  starParticipationStatus: 'Active Participant',
  dataQualityScore: 95,
  years: 6,
  role: 'teacher',
});

const janelId = await upsertProfile({
  fullName: 'Janel Rose Trongcoso',
  email: 'janel@example.org',
  occupation: 'Master Teacher I',
  region: 'Region III',
  division: 'San Fernando City',
  school: 'San Miguel National High School',
  qualificationLevel: 'Master\'s Degree',
  gender: 'Female',
  ageBracket: '35-44',
  subjects: ['Physics', 'Research'],
  trainingHistory: ['2025 Division Mentoring Program'],
  starParticipationStatus: 'Alumni',
  dataQualityScore: 92,
  years: 8,
  role: 'teacher',
});

const gemId = await upsertProfile({
  fullName: 'Gem Christian Lazo',
  email: 'gem@example.org',
  occupation: 'Teacher III',
  region: 'Region IV-A',
  division: 'Calamba City',
  school: 'Laguna Senior High School',
  qualificationLevel: 'Master\'s Degree',
  gender: 'Male',
  ageBracket: '35-44',
  subjects: ['Mathematics', 'Data Science'],
  trainingHistory: ['2024 Data Science for Educators Workshop'],
  starParticipationStatus: 'Active Participant',
  dataQualityScore: 93,
  years: 7,
  role: 'teacher',
});

const martiId = await upsertProfile({
  fullName: 'Marti Kier Trance',
  email: 'marti@example.org',
  occupation: 'Teacher II',
  region: 'Region I',
  division: 'Ilocos Norte',
  school: 'Ilocos Norte National High School',
  qualificationLevel: 'Bachelor\'s Degree with Units in MA/MS',
  gender: 'Male',
  ageBracket: '25-34',
  subjects: ['Biology', 'Environmental Science'],
  trainingHistory: ['2025 Science Investigatory Project Coaching'],
  starParticipationStatus: 'Interested',
  dataQualityScore: 88,
  years: 5,
  role: 'teacher',
});

const christineId = await upsertProfile({
  fullName: 'Christine Rio',
  email: 'christine@example.org',
  occupation: 'Head Teacher',
  region: 'CAR',
  division: 'Baguio City',
  school: 'Baguio City National High School',
  qualificationLevel: 'Doctoral Units',
  gender: 'Female',
  ageBracket: '45-54',
  subjects: ['General Science', 'Extension Work'],
  trainingHistory: ['2023 Regional Science Leadership Summit', '2024 STAR Mentor Training'],
  starParticipationStatus: 'Alumni',
  dataQualityScore: 96,
  years: 9,
  role: 'teacher',
});

const adminId = await upsertProfile({
  fullName: 'System Admin',
  email: 'admin@starlink.local',
  occupation: 'Division Office Staff',
  region: 'NCR',
  division: 'Manila',
  school: 'STAR-LINK HQ',
  qualificationLevel: 'Doctoral Degree',
  gender: 'Prefer not to say',
  ageBracket: '45-54',
  subjects: ['Administration'],
  trainingHistory: ['2025 Program Governance Workshop'],
  starParticipationStatus: 'Active Participant',
  dataQualityScore: 90,
  years: 12,
  role: 'admin',
});

await insertForumPostIfMissing({
  title: 'Implementing Project-Based Learning in Off-grid Areas',
  content:
    'Looking for practical ways to run project-based science learning when internet access is limited and lab materials are scarce.',
  region: 'CAR',
  category: 'Pedagogy',
  authorId: janelId,
});

await insertForumPostIfMissing({
  title: 'Integrating AI tools in senior high STEM classes',
  content:
    'Has anyone piloted AI-assisted lesson planning for STEM electives? Sharing rubrics and guardrails would help.',
  region: 'NCR',
  category: 'Resources',
  authorId: adrielId,
});

await insertForumPostIfMissing({
  title: 'Low-cost math modeling activities for large classes',
  content:
    'Need strategies for running modeling activities with 50+ learners and limited devices.',
  region: 'Region IV-A',
  category: 'Pedagogy',
  authorId: gemId,
});

await insertForumPostIfMissing({
  title: 'Need ideas for biodiversity fieldwork alternatives',
  content:
    'Weather disruptions are frequent in our area. What classroom alternatives can preserve inquiry quality?',
  region: 'Region I',
  category: 'Mentorship',
  authorId: martiId,
});

await insertForumPostIfMissing({
  title: 'How to scale extension projects across districts',
  content:
    'Looking for a framework to replicate science outreach projects in neighboring districts without losing quality.',
  region: 'CAR',
  category: 'General',
  authorId: christineId,
});

await insertResourceIfMissing({
  title: 'Gamified Approach to Grade 8 Physics',
  description: 'Starter paper on points-based engagement in Grade 8 physics modules.',
  fileName: 'gamified-physics.txt',
  fileData: 'Gamified Grade 8 Physics starter document.',
  authorId: janelId,
});

await insertResourceIfMissing({
  title: 'Sustainable Community Science Fair',
  description: 'Starter extension project brief for low-cost science fair rollouts.',
  fileName: 'science-fair-brief.txt',
  fileData: 'Community science fair starter brief.',
  authorId: adminId,
});

await insertResourceIfMissing({
  title: 'AI Literacy Guide for STEM Teachers',
  description: 'Practical checklist for introducing safe and responsible AI usage in class.',
  fileName: 'ai-literacy-guide.txt',
  fileData: 'AI literacy starter guide for STEM educators.',
  authorId: adrielId,
});

await insertResourceIfMissing({
  title: 'Mathematical Modeling Pack for Grade 10',
  description: 'Activity sheets and facilitation notes for collaborative problem solving.',
  fileName: 'math-modeling-pack.txt',
  fileData: 'Math modeling activity pack.',
  authorId: gemId,
});

await insertResourceIfMissing({
  title: 'Community Biodiversity Monitoring Toolkit',
  description: 'Low-cost toolkit for student-led biodiversity observations.',
  fileName: 'biodiversity-toolkit.txt',
  fileData: 'Biodiversity monitoring toolkit.',
  authorId: martiId,
});

await insertResourceIfMissing({
  title: 'District Extension Program Playbook',
  description: 'Operations playbook for scaling extension activities across schools.',
  fileName: 'extension-playbook.txt',
  fileData: 'District extension program playbook.',
  authorId: christineId,
});

await pool.end();

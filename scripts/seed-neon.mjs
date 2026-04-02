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

const { rows: profileRows } = await pool.query('select count(*)::int as count from profiles');
const profileCount = profileRows[0]?.count ?? 0;

if (profileCount === 0) {
  const teacherId = crypto.randomUUID();
  const adminId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash('Password123!', 10);

  await pool.query(
    `insert into profiles (id, full_name, email, password_hash, region, school, subjects_taught, years_of_experience, role)
     values
     ($1, $2, $3, $4, $5, $6, $7, $8, $9),
     ($10, $11, $12, $13, $14, $15, $16, $17, $18)`,
    [
      teacherId,
      'Janel Rose Trongcoso',
      'janel@example.org',
      passwordHash,
      'Region III',
      'San Miguel National High School',
      ['Physics', 'Research'],
      8,
      'teacher',
      adminId,
      'System Admin',
      'admin@starlink.local',
      passwordHash,
      'NCR',
      'STAR-LINK HQ',
      ['Administration'],
      12,
      'admin',
    ]
  );

  await pool.query(
    `insert into forum_posts (id, title, content, region, category, author_id)
     values
     ($1, $2, $3, $4, $5, $6),
     ($7, $8, $9, $10, $11, $12),
     ($13, $14, $15, $16, $17, $18)`,
    [
      crypto.randomUUID(),
      'Implementing Project-Based Learning in Off-grid Areas',
      'Looking for practical ways to run project-based science learning when internet access is limited and lab materials are scarce.',
      'CAR',
      'Pedagogy',
      teacherId,
      crypto.randomUUID(),
      'Looking for shared microscopes or alternatives',
      'Our division is short on microscopes. What low-cost alternatives are schools using for microscopy lessons?',
      'Region III',
      'Resources',
      adminId,
      crypto.randomUUID(),
      'Need advice: Teaching Advanced Physics with limited lab gear',
      'I am trying to cover wave phenomena and vectors with very few lab instruments. Any proven activity designs?',
      'Region I',
      'Mentorship',
      teacherId,
    ]
  );

  await pool.query(
    `insert into resources (id, title, description, file_name, mime_type, file_size, file_data, author_id)
     values
     ($1, $2, $3, $4, $5, $6, $7, $8),
     ($9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      crypto.randomUUID(),
      'Gamified Approach to Grade 8 Physics',
      'Starter paper on points-based engagement in Grade 8 physics modules.',
      'gamified-physics.txt',
      'text/plain',
      Buffer.byteLength('Gamified Grade 8 Physics starter document.'),
      Buffer.from('Gamified Grade 8 Physics starter document.'),
      teacherId,
      crypto.randomUUID(),
      'Sustainable Community Science Fair',
      'Starter extension project brief for low-cost science fair rollouts.',
      'science-fair-brief.txt',
      'text/plain',
      Buffer.byteLength('Community science fair starter brief.'),
      Buffer.from('Community science fair starter brief.'),
      adminId,
    ]
  );
}

await pool.end();

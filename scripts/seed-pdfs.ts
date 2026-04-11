import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.local');

// 1. Load Environment Variables
if (!fs.existsSync(envPath)) {
  throw new Error('.env.local is missing.');
}

const envText = fs.readFileSync(envPath, 'utf8');
envText.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is missing from .env.local.');
}

const pool = new Pool({ connectionString });

function buildDeterministicEmbedding(text: string, dimensions = 768): number[] {
  const vector = new Array(dimensions).fill(0);

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const idx = (code + i * 31) % dimensions;
    const weight = ((code % 17) - 8) / 8;
    vector[idx] += weight;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}

// 2. Mock Data Pools
const TOTAL_PDFS = 100;

const TOPICS = [
  "Integrating Robotics in High School Physics",
  "Low-Cost Chemistry Lab Alternatives",
  "Gamification of Algebra Principles",
  "Effective Online Pedagogy in Rural Areas",
  "Flipped Classroom Model for Biology",
  "Assessing Critical Thinking in STEM",
  "Using AI to Grade Math Assignments",
  "Improving Scientific Literacy in Grade 7",
  "Hands-on Experiments with Household Items",
  "Peer Tutoring Strategies in Mathematics",
  "Action Research on Inquiry-Based Science",
  "Overcoming Math Anxiety via Interactive Media",
  "Building Resilience in Junior High Science",
  "Data Loggers in Environmental Science",
  "Micro-certifications for IT Electives"
];

const REGIONS = ["NCR", "Region I", "Region II", "Region III", "Region IV-A", "CAR"];
const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Senior High", "Multi-level"];
const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "Earth Science", "General Science"];

async function run() {
  console.log("Starting PDF generation and local embedding seeding...");

  // Get some valid teacher IDs
  const authorRes = await pool.query("SELECT id FROM profiles WHERE role = 'teacher' LIMIT 20");
  if (authorRes.rowCount === 0) {
    throw new Error('No teachers found in DB. Please run `npm run seed` first to populate profiles.');
  }
  const authors = authorRes.rows.map((r: any) => r.id);

  for (let i = 1; i <= TOTAL_PDFS; i++) {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const grade = GRADES[Math.floor(Math.random() * GRADES.length)];
    const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const authorId = authors[Math.floor(Math.random() * authors.length)];

    const title = `${topic}: Regional Insight ${Math.floor(Math.random() * 1000)}`;
    const description = `This document provides insights on ${topic.toLowerCase()} specifically tailored for ${grade} students in ${region}. It discusses methodologies and outcomes observed in local classrooms focusing on ${subject}.`;
    const keywordsStr = `${subject}, ${grade}, pedagogy, ${topic.split(' ')[0]}`;

    // Generate PDF Buffer
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    
    // Add text body
    const splitText = doc.splitTextToSize(description, 170);
    doc.text(splitText, 20, 30);
    
    // Add metadata
    doc.text(`Region: ${region}`, 20, 70);
    doc.text(`Subject: ${subject}`, 20, 80);
    doc.text(`Grade Level: ${grade}`, 20, 90);
    doc.text(`Keywords: ${keywordsStr}`, 20, 100);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Generate deterministic local embedding
    const textForEmbedding = `${title}\n\n${description}\n\n${keywordsStr}`;
    const embeddingValues = buildDeterministicEmbedding(textForEmbedding);

    const embeddingStr = `[${embeddingValues.join(',')}]`;
    const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.pdf`;

    // Insert into DB
    await pool.query(
      `INSERT INTO resources (
        id, title, description, region, subject_area, grade_level, resource_type,
        keywords, file_name, mime_type, file_size, file_data, moderation_status,
        author_id, embedding, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )`,
      [
        crypto.randomUUID(), title, description, region, subject, grade, 'Action Research',
        keywordsStr.split(', '), fileName, 'application/pdf',
        pdfBuffer.byteLength, pdfBuffer, 'approved', authorId, embeddingStr,
        new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString() // Random past date
      ]
    );

    console.log(`[${i}/${TOTAL_PDFS}] Successfully seeded: ${title}`);
  }

  console.log("Completed seeding 100 mock PDFs!");
  process.exit(0);
}

run().catch(console.error);

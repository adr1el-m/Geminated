import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.local');

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
const pool = new Pool({ connectionString });

const MOCK_FORUM_POSTS = [
  // Cluster 1: Region III Laboratory Support
  {
    title: "Delayed Laboratory Equipment Delivery",
    content: "Our school in Region III has been waiting for the new science laboratory kits since last semester. We need these for the upcoming biology practicals.",
    region: "Region III",
    category: "Resources"
  },
  {
    title: "Broken Microscope Kits in San Fernando",
    content: "We received our laboratory kits today but noticed that 3 out of 5 microscopes have cracked lenses. Has any other school in Region III experienced this?",
    region: "Region III",
    category: "Resources"
  },
  {
    title: "Incomplete Laboratory Manuals for Physics",
    content: "The latest shipment of science kits to Central Luzon schools is missing the facilitator manuals. It is hard to run experiments without the local guidance.",
    region: "Region III",
    category: "Pedagogy"
  },

  // Cluster 2: NCR Digital Connectivity
  {
    title: "Internet Connectivity Issues in Digital Modules",
    content: "The new digital science modules in NCR require high bandwidth that our school internet cannot sustain. Teachers are struggling to implement the lesson plans.",
    region: "NCR",
    category: "Resources"
  },
  {
    title: "Slow Server Access for STEM LMS",
    content: "Students here in Manila are constantly getting 'timeout' errors while trying to access the STEM learning portal during class hours.",
    region: "NCR",
    category: "Resources"
  },
  {
    title: "Need for Offline Alternatives for Digital Science",
    content: "Connectivity in Quezon City public schools is unstable this week. We need downloadable versions of the interactive digital modules.",
    region: "NCR",
    category: "General"
  },

  // Cluster 3: Region IV-A Curriculum
  {
    title: "Integration of Data Science in Math Classes",
    content: "Teachers in Region IV-A are finding it difficult to integrate the new Data Science elective into the existing Grade 10 Math curriculum. Need more training.",
    region: "Region IV-A",
    category: "Pedagogy"
  },
  {
    title: "Curriculum Overlap in Science and Research",
    content: "There is a massive overlap between the Statistics and Research methods modules here in CALABARZON schools. Coordination is needed.",
    region: "Region IV-A",
    category: "Pedagogy"
  }
];

async function seedForum() {
  console.log("Seeding forum posts for NLP analysis...");

  // Get a teacher ID for the posts
  const teacherRes = await pool.query("SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1");
  if (teacherRes.rowCount === 0) {
    throw new Error("No teacher profiles found. Run npm run seed first.");
  }
  const teacherId = teacherRes.rows[0].id;

  for (const post of MOCK_FORUM_POSTS) {
    await pool.query(
      `INSERT INTO forum_posts (id, title, content, region, category, moderation_status, author_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        crypto.randomUUID(), 
        post.title, 
        post.content, 
        post.region, 
        post.category, 
        'approved', 
        teacherId, 
        new Date().toISOString()
      ]
    );
    console.log(`Seeded: ${post.title}`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seedForum().catch(console.error);

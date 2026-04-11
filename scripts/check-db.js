const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
let connectionString = '';
envText.split(/\r?\n/).forEach(line => {
  if (line.startsWith('DATABASE_URL=')) {
    connectionString = line.split('=')[1].trim();
  }
});

const pool = new Pool({ connectionString });

async function check() {
  const res = await pool.query("SELECT id, title, region, moderation_status FROM forum_posts");
  console.log(`Found ${res.rows.length} posts.`);
  res.rows.forEach(r => console.log(`- ${r.title} (${r.region}) [${r.moderation_status}]`));
  process.exit(0);
}

check().catch(console.error);

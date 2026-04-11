import { db } from '../src/lib/db';

async function check() {
  const posts = await db`select id, title, region, moderation_status from forum_posts`;
  console.log("Found posts:", posts.length);
  posts.forEach(p => console.log(`- ${p.title} (${p.region}) [${p.moderation_status}]`));
  process.exit(0);
}

check().catch(console.error);

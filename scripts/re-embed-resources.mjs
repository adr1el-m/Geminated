import postgres from 'postgres';
import 'dotenv/config';

// Initialize Neon client
const db = postgres(process.env.DATABASE_URL, { ssl: 'require' });

function generateTextEmbedding(text, dimensions = 768) {
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

async function main() {
  console.log("🚀 Starting resource re-embedding process...");

  try {
    const resources = await db`
      select id, title, description, keywords, mime_type
      from resources
      where moderation_status = 'approved'
    `;

    console.log(`📦 Found ${resources.length} approved resources to re-embed.`);

    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      console.log(`[${i+1}/${resources.length}] Processing: ${res.title}`);

      // Re-create the embedding context (Simplified version for migration)
      // Note: We don't re-parse PDFs here as we only use metadata for this migration 
      // to keep it fast and non-destructive to the original file data.
      const textForEmbedding = [res.title, res.description, (res.keywords || []).join(' ')]
        .filter(Boolean)
        .join('\n\n');

      const embedding = generateTextEmbedding(textForEmbedding);

      if (embedding && embedding.length > 0) {
        await db`
          update resources
          set embedding = ${JSON.stringify(embedding)}::vector
          where id = ${res.id}
        `;
        console.log(`✅ Updated embedding for: ${res.title}`);
      } else {
        console.error(`❌ Failed to generate embedding for: ${res.title}`);
      }
    }

    console.log("⭐ Re-embedding complete!");
  } catch (error) {
    console.error("Fatal error during re-embedding:", error);
  } finally {
    await db.end();
  }
}

main();

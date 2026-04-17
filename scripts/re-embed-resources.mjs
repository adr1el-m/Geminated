import postgres from 'postgres';
import 'dotenv/config';

// Initialize Neon client
const db = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_EMBEDDING_MODEL = process.env.GROQ_EMBEDDING_MODEL || 'nomic-embed-text-v1.5';
const GROQ_EMBEDDINGS_API_URL = 'https://api.groq.com/openai/v1/embeddings';

function generateDeterministicEmbedding(text, dimensions = 768) {
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

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 8000);
}

async function generateTextEmbedding(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  if (!GROQ_API_KEY || GROQ_API_KEY.includes('your_groq_api_key_here')) {
    return generateDeterministicEmbedding(normalized);
  }

  try {
    const response = await fetch(GROQ_EMBEDDINGS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_EMBEDDING_MODEL,
        input: normalized,
        encoding_format: 'float',
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.error?.message || `Groq embeddings request failed (${response.status})`;
      throw new Error(message);
    }

    const rawVector = payload?.data?.[0]?.embedding;
    if (!Array.isArray(rawVector) || rawVector.length === 0) {
      throw new Error('Groq returned an empty embedding vector.');
    }

    const vector = rawVector.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    if (vector.length === 0) {
      throw new Error('Groq returned a malformed embedding vector.');
    }

    return vector;
  } catch (error) {
    console.warn('Semantic embedding failed, falling back to deterministic embedding:', error instanceof Error ? error.message : error);
    return generateDeterministicEmbedding(normalized);
  }
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

      const embedding = await generateTextEmbedding(textForEmbedding);

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

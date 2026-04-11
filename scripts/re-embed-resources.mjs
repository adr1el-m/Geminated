import { GoogleGenAI } from "@google/genai";
import postgres from 'postgres';
import 'dotenv/config';

// Initialize Neon client
const db = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateTextEmbedding(text) {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });
    return response.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error("Gemini Embedding Error:", error);
    return null;
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

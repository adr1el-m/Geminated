import { GoogleGenAI } from "@google/genai";
import { db } from "./db";

// Initialize the Gemini client.
// It automatically picks up the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    return response.embeddings?.[0]?.values || [];
  } catch (error) {
    console.error("Gemini Embedding Error:", error);
    return [];
  }
}

export async function synthesizeAiAnswer(query: string, contextDocuments: any[]): Promise<string> {
  try {
    const documentsContext = contextDocuments.map(
      (doc, index) =>
        `[Citation ${index + 1} - ${doc.author_name}]: ${doc.title}\nContext: ${doc.description || ""}\nKeywords: ${doc.keywords?.join(", ")}`
    ).join("\n\n");

    const prompt = `You are the STAR-LINK AI Assistant, a specialized helper for STEM educators in the Philippines.
The user is asking: "${query}"

Here are the top 5 most relevant Action Research and Extension resources from our database:
${documentsContext}

Using ONLY the provided resources, generate a conversational, helpful, and highly actionable answer.
Synthesize the methods found in the research and explicitly cite the authors and their papers (e.g., "As suggested in [Title] by [Author]...").
If the provided context does not adequately answer the question, state that clearly and encourage them to check general STEM best practices.
Keep your response well-formatted using markdown. Provide structured, easy-to-read advice.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text || "I'm sorry, I couldn't generate an answer at this time.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Error connecting to the AI brain. Please try again later.";
  }
}

export async function searchSimilarResources(query: string) {
  const queryEmbedding = await generateTextEmbedding(query);
  
  if (!queryEmbedding.length) {
    return [];
  }

  // Neon pgvector cosine distance `<=>` operator to find nearest neighbors
  const closestResources = await db`
    select 
      id, title, description, keywords, author_id, 
      (select full_name from profiles where id = author_id) as author_name,
      file_name, region, subject_area, grade_level, resource_type, created_at,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    from resources
    where moderation_status = 'approved' and embedding is not null
    order by embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    limit 5
  `;

  return closestResources;
}

export async function analyzeForumSentiment(posts: any[]) {
  try {
    const postsContext = posts.map(p => `[Region: ${p.region}] Title: ${p.title}\nContent: ${p.content}`).join("\n---\n");

    const prompt = `You are an AI specialized in Educational NLP analysis for the Department of Science and Technology (DOST).
I will provide a list of forum posts from teachers across different regions in the Philippines.
Your task is to perform "Thematic Clustering" and "Sentiment Detection".

Analyze the following posts:
${postsContext}

Based ONLY on these posts, identify the top 3-5 "Alert Clusters". 
A cluster is a group of posts discussing a similar problem or expressing similar confusion/negativity.

For each cluster, provide:
1. Region: The primary region affected.
2. Cluster Title: A concise name for the issue.
3. Sentiment: One of [Critical, Warning, Constructive].
4. Affected Count: How many teachers/posts are part of this cluster.
5. Description: A brief summary of what they are struggling with.
6. Suggested Intervention: What specific action should the DOST-SEI take?

Return the response ONLY as a valid JSON array of objects. Example:
[
  {
    "region": "Region III",
    "cluster_title": "Laboratoy Equipment Shortage",
    "sentiment": "Critical",
    "affected_count": 5,
    "description": "Teachers are reporting they cannot perform Electromagnetism experiments due to lack of kits.",
    "suggested_intervention": "Prioritize kit delivery to Central Luzon hub."
  }
]
If no significant clusters are found, return an empty array [].`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    // Clean up possible markdown code blocks from AI response
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini NLP Error:", error);
    return [];
  }
}


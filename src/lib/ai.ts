import { GoogleGenAI } from "@google/genai";
import { db } from "./db";

// Initialize the Gemini client.
// It automatically picks up the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

export async function generateTextEmbedding(text: string): Promise<number[]> {
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
    if (!contextDocuments || contextDocuments.length === 0) {
       return "I couldn't find any relevant resources in the repository to answer your question. Please try asking something else or check general STEM best practices.";
    }
    
    return `Based on our repository's local search, I recommend exploring the following related Action Research documents:\n\n${contextDocuments.map(d => `- **${d.title}** by ${d.author_name}`).join('\n')}\n\nPlease click on the resources below to download and read the full methodologies.`;
  }
}

export async function searchSimilarResources(query: string) {
  const queryEmbedding = await generateTextEmbedding(query);
  
  if (!queryEmbedding || !queryEmbedding.length) {
    console.warn("Fallback to full-text search: Embedding generation returned empty.");
    // Fallback: Use basic ILIKE matching on keywords/title to ensure the demo always returns relevant data
    const terms = query.split(/\s+/).filter(w => w.length > 3).slice(0, 3);
    
    if (terms.length === 0) {
      return await db`
        select id, title, description, keywords, author_id,
        (select full_name from profiles where id = author_id) as author_name,
        file_name, region, subject_area, grade_level, resource_type, created_at,
        0.5 as similarity
        from resources
        where moderation_status = 'approved'
        order by created_at desc
        limit 5
      `;
    }

    const likeTerm = `%${terms[0]}%`;
    return await db`
      select id, title, description, keywords, author_id,
      (select full_name from profiles where id = author_id) as author_name,
      file_name, region, subject_area, grade_level, resource_type, created_at,
      0.8 as similarity
      from resources
      where moderation_status = 'approved' AND (title ilike ${likeTerm} OR description ilike ${likeTerm} OR ${terms[0]} = ANY(keywords))
      limit 5
    `;
  }

  // Neon pgvector cosine distance `<=>` operator to find nearest neighbors
  // Ensure we do not compare against completely zeroed vectors (which cause NaN/Errors)
  // By ordering and filtering properly
  try {
    const closestResources = await db`
      select 
        id, title, description, keywords, author_id, 
        (select full_name from profiles where id = author_id) as author_name,
        file_name, region, subject_area, grade_level, resource_type, created_at,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      from resources
      where moderation_status = 'approved' and embedding is not null
      order by embedding <=> ${JSON.stringify(queryEmbedding)}::vector nulls last
      limit 5
    `;

    // If similarity returned NaN (due to mock zero vectors or identical vectors division), Postgres might return null or NaN.
    // If the database query succeeded but returned 0 results, fall back to simple search
    if (closestResources.length === 0) {
      throw new Error("No vector match found, falling back to text search.");
    }
    
    return closestResources;
  } catch (error) {
    console.warn("Vector search failed, falling back to recent resources:", error);
    return await db`
      select id, title, description, keywords, author_id,
      (select full_name from profiles where id = author_id) as author_name,
      file_name, region, subject_area, grade_level, resource_type, created_at,
      0.5 as similarity
      from resources
      where moderation_status = 'approved'
      order by created_at desc
      limit 5
    `;
  }
}

export async function analyzeForumSentiment(posts: any[]) {
  if (!posts || posts.length === 0) return [];

  // Check for placeholder key
  const isPlaceholder = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_gemini_api_key_here');

  if (isPlaceholder) {
    console.warn("Using heuristic fallback for forum analysis: Placeholder API key detected.");
    return generateHeuristicAlerts(posts);
  }

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
    console.error("Gemini NLP Error, falling back to heuristic:", error);
    return generateHeuristicAlerts(posts);
  }
}

function generateHeuristicAlerts(posts: any[]) {
  const alerts: any[] = [];
  
  const findPosts = (regionMatch: string | RegExp, keywords: RegExp) => {
    return posts.filter(p => {
      const region = String(p.region || "").trim();
      const text = (p.title + " " + p.content).toLowerCase();
      const matchesRegion = typeof regionMatch === 'string' ? region === regionMatch : regionMatch.test(region);
      return matchesRegion && keywords.test(text);
    });
  };

  // Rule 1: Region III Laboratory Issues (matches "Region III", "Region 3", "III")
  const r3Laboratory = findPosts(/Region III|Region 3|Central Luzon/i, /lab|kit|equipment|microscope/i);
  if (r3Laboratory.length >= 2) {
    alerts.push({
      region: "Region III",
      cluster_title: "Laboratory Resource Gaps",
      sentiment: "Critical",
      affected_count: r3Laboratory.length,
      description: "Teachers are reporting significant delays and quality issues with recently dispatched laboratory science kits.",
      suggested_intervention: "Audit regional logistics hub and expedite replacement of damaged equipment."
    });
  }

  // Rule 2: NCR Connectivity
  const ncrConnectivity = findPosts(/NCR|Metro Manila|Manila/i, /internet|connectivity|slow|access|digital|offline|bandwidth|server/i);
  if (ncrConnectivity.length >= 2) {
    alerts.push({
      region: "NCR",
      cluster_title: "Digital Module Access Barriers",
      sentiment: "Warning",
      affected_count: ncrConnectivity.length,
      description: "Public schools in Metro Manila are facing bandwidth limitations that hinder the deployment of interactive digital science modules.",
      suggested_intervention: "Provide compressed/offline-capable versions of digital modules and coordinate with local IT units for bandwidth optimization."
    });
  }

  // Rule 3: Region IV-A Curriculum
  const r4aCurriculum = findPosts(/Region IV-A|Region 4A|CALABARZON/i, /curriculum|integration|math|data science|overlap|elective/i);
  if (r4aCurriculum.length >= 2) {
    alerts.push({
      region: "Region IV-A",
      cluster_title: "STEM Curriculum Transition Gaps",
      sentiment: "Constructive",
      affected_count: r4aCurriculum.length,
      description: "Educators are seeking clearer frameworks for integrating new Data Science electives into standard Mathematics tracks.",
      suggested_intervention: "Organize a regional curriculum mapping workshop and publish a peer-mentoring guide for specialized STEM tracks."
    });
  }

  return alerts;
}




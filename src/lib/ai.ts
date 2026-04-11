import { db } from "./db";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_GROQ_MODELS = [
  process.env.GROQ_MODEL,
  process.env.GROQ_CHAT_MODEL,
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
].filter((model): model is string => Boolean(model && model.trim()));

const QUOTA_COOLDOWN_DEFAULT_MS = 60_000;
let quotaBlockedUntilMs = 0;
let loggedEmbeddingFallback = false;

function parseRetryAfterHeaderMs(retryAfter: string | null): number | null {
  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds * 1000));
  }

  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function isModelNotFoundError(error: any) {
  const status = error?.status;
  const message = String(error?.message || "");
  return status === 404 || message.toLowerCase().includes("model") && message.toLowerCase().includes("not found");
}

function isQuotaExceededError(error: any) {
  const status = error?.status;
  const message = String(error?.message || "").toLowerCase();
  return status === 429 || message.includes("rate limit") || message.includes("quota") || message.includes("too many requests");
}

function parseRetryDelayMs(error: any): number | null {
  if (typeof error?.retryAfterMs === "number" && Number.isFinite(error.retryAfterMs)) {
    return Math.max(0, Math.ceil(error.retryAfterMs));
  }

  const message = String(error?.message || "");
  const match = message.match(/retry in\s+([\d.]+)s/i) || message.match(/try again in\s+([\d.]+)s/i);
  if (match) {
    return Math.ceil(Number(match[1]) * 1000);
  }

  return null;
}

function updateQuotaCooldown(error: any) {
  const retryMs = parseRetryDelayMs(error) ?? QUOTA_COOLDOWN_DEFAULT_MS;
  quotaBlockedUntilMs = Math.max(quotaBlockedUntilMs, Date.now() + retryMs);
  return retryMs;
}

function getQuotaWaitSeconds() {
  return Math.max(0, Math.ceil((quotaBlockedUntilMs - Date.now()) / 1000));
}

function buildApiError(status: number, message: string, retryAfterMs?: number) {
  const error: any = new Error(message);
  error.status = status;
  if (typeof retryAfterMs === "number") {
    error.retryAfterMs = retryAfterMs;
  }
  return error;
}

async function generateContentFromGroq(prompt: string, model: string): Promise<{ text: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes("your_groq_api_key_here")) {
    throw buildApiError(401, "GROQ_API_KEY is missing or still set to a placeholder value.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    }),
  });

  const retryAfterMs = parseRetryAfterHeaderMs(response.headers.get("retry-after"));
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiMessage = String(payload?.error?.message || `Groq request failed with status ${response.status}.`);
    throw buildApiError(response.status, apiMessage, retryAfterMs ?? undefined);
  }

  const text = String(payload?.choices?.[0]?.message?.content || "").trim();
  if (!text) {
    throw buildApiError(502, `Groq returned an empty response for model ${model}.`);
  }

  return { text };
}

function truncateText(text: string, maxLength = 180) {
  if (!text) return "No summary available in repository metadata.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function buildLocalRepositoryAnswer(query: string, contextDocuments: any[], quotaWaitSeconds?: number) {
  if (!contextDocuments || contextDocuments.length === 0) {
    return "I couldn't find any relevant resources in the repository to answer your question. Please try asking something else or check general STEM best practices.";
  }

  const topDocs = contextDocuments.slice(0, 5);
  const practiceBullets = topDocs.slice(0, 3).map((doc, index) => {
    const title = doc?.title || `Resource ${index + 1}`;
    const author = doc?.author_name || "Unknown author";
    const description = truncateText(String(doc?.description || ""));
    return `- **${title}** by **${author}**: ${description}`;
  }).join("\n");

  const keywords = Array.from(
    new Set(
      topDocs.flatMap((doc) => Array.isArray(doc?.keywords) ? doc.keywords : [])
        .map((keyword) => String(keyword).trim())
        .filter(Boolean)
    )
  ).slice(0, 8);

  const citations = topDocs.map((doc, index) => {
    const title = doc?.title || `Resource ${index + 1}`;
    const author = doc?.author_name || "Unknown author";
    return `- [${index + 1}] **${title}** by ${author}`;
  }).join("\n");

  const quotaNotice = quotaWaitSeconds && quotaWaitSeconds > 0
    ? `_Cloud AI quota is temporarily exhausted. Using repository-only synthesis for now. Retry full AI generation in about ${quotaWaitSeconds}s._\n\n`
    : "";

  const keywordSection = keywords.length > 0
    ? `#### Priority Themes\n${keywords.map((keyword) => `- ${keyword}`).join("\n")}\n\n`
    : "";

  return `### Evidence-Informed Pedagogical Brief (Repository-Only)\n${quotaNotice}**Instructional question:** ${query}\n\n#### Evidence-Based Insights\n${practiceBullets}\n\n#### Suggested Implementation Plan\n1. Select one strategy from the highest-relevance source and define a 1-2 week classroom pilot.\n2. Set success indicators before deployment (engagement, completion, quiz performance, attendance).\n3. Implement with context adaptation (region, grade band, subject prerequisites, available resources).\n4. Conduct a short reflection cycle and refine strategy for the next teaching period.\n\n${keywordSection}#### Cited Repository Records\n${citations}`;
}

async function generateContentWithFallback(prompt: string) {
  if (Date.now() < quotaBlockedUntilMs) {
    const quotaError: any = new Error(`Groq quota cooldown active. Retry in ${getQuotaWaitSeconds()}s.`);
    quotaError.status = 429;
    throw quotaError;
  }

  let lastError: unknown = null;

  for (const model of DEFAULT_GROQ_MODELS) {
    try {
      return await generateContentFromGroq(prompt, model);
    } catch (error: any) {
      lastError = error;
      if (isModelNotFoundError(error)) {
        console.warn(`Groq model unavailable: ${model}. Trying next fallback.`);
        continue;
      }

      if (isQuotaExceededError(error)) {
        const retryMs = updateQuotaCooldown(error);
        console.warn(`Groq quota exceeded for ${model}. Cooling down for ${Math.ceil(retryMs / 1000)}s.`);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("No available Groq model for text generation.");
}

export async function generateTextEmbedding(text: string): Promise<number[]> {
  void text;
  if (!loggedEmbeddingFallback) {
    loggedEmbeddingFallback = true;
    console.warn("Embeddings are disabled with Groq mode; using lexical repository search fallback.");
  }
  return [];
}

export async function synthesizeAiAnswer(query: string, contextDocuments: any[]): Promise<string> {
  try {
    const documentsContext = contextDocuments.map(
      (doc, index) =>
        `[Citation ${index + 1} - ${doc.author_name}]: ${doc.title}\nContext: ${doc.description || ""}\nKeywords: ${doc.keywords?.join(", ")}`
    ).join("\n\n");

    const prompt = `You are the STAR-LINK AI Assistant, a specialized academic support assistant for STEM educators in the Philippines.
The user is asking: "${query}"

Here are the top 5 most relevant Action Research and Extension resources from our database:
${documentsContext}

  Using ONLY the provided resources, produce a detailed, academically toned synthesis that is practical for classroom implementation.
  Do not invent sources or claims that are not present in the provided context.
  Explicitly connect claims to source citations using bracket notation like [1], [2], [3] corresponding to the listed resources.
  If evidence is limited for any recommendation, state that limitation clearly.

  Return markdown using this structure:
  ### Executive Summary
  ### Contextual Interpretation for Philippine STEM Classrooms
  ### Evidence-Based Instructional Strategies
  - For each strategy: include rationale, implementation steps, and adaptation notes.
  ### 2-Week Implementation Blueprint
  ### Monitoring and Evaluation Indicators
  ### Potential Risks and Mitigation
  ### Cited Resources

  Tone requirements:
  - Scholarly, clear, and concise.
  - Practical and implementation-ready.
  - Avoid generic filler and vague advice.`;

    const response = await generateContentWithFallback(prompt);
    const generated = response.text?.trim();

    return generated || buildLocalRepositoryAnswer(query, contextDocuments);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      const waitSeconds = getQuotaWaitSeconds();
      console.warn(`Groq Chat quota exceeded. Using repository-only fallback for ${waitSeconds}s.`);
      return buildLocalRepositoryAnswer(query, contextDocuments, waitSeconds);
    }

    console.error("Groq Chat Error:", error);
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
  const isPlaceholder = !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_groq_api_key_here');

  if (isPlaceholder) {
    console.warn("Using heuristic fallback for forum analysis: Missing GROQ_API_KEY.");
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
6. Suggested Intervention: A concrete action plan with these labeled sections in plain text:
  Objective:
  Immediate Actions (0-14 days):
  Medium-Term Actions (30-60 days):
  Monitoring Metrics:
  Responsible Units:

Return the response ONLY as a valid, standard JSON array of objects. 
CRITICAL: Do not include literal line breaks (actual newlines) inside property values; use "\\n" for line breaks instead. 
CRITICAL: Ensure all double quotes within string values are escaped as \\".

Example of correct string escaping:
"suggested_intervention": "Objective: Fix the issue.\\nImmediate Actions: Check the \\"equipment\\" thoroughly."

Example:
[
  {
    "region": "Region III",
    "cluster_title": "Laboratory Equipment Shortage",
    "sentiment": "Critical",
    "affected_count": 5,
    "description": "Teachers are reporting they cannot perform Electromagnetism experiments due to lack of kits.",
    "suggested_intervention": "Objective: Restore practical lab delivery for affected schools.\\nImmediate Actions (0-14 days): Validate damaged kit inventory, deploy temporary shared lab kits, and issue classroom-safe alternatives."
  }
]
If no significant clusters are found, return an empty array [].`;

    const response = await generateContentWithFallback(prompt);
    const text = response.text || "[]";

    // 1. Extract JSON body from potential markdown or preamble
    let jsonString = text.trim();
    const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonString = markdownMatch[1];
    } else {
      const firstBracket = jsonString.indexOf('[');
      const lastBracket = jsonString.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        jsonString = jsonString.slice(firstBracket, lastBracket + 1);
      }
    }

    // 2. Initial cleaning (trailing commas and whitespace)
    const cleaned = jsonString.replace(/,\s*([\}\]])/g, '$1').trim();

    try {
      // First attempt: clean up potentially unescaped newlines between property names and values
      // This is a common error where the model puts a real newline instead of \n
      const structuralRepair = cleaned
        .replace(/:\s*"/g, ': "') // Normalize colons
        .replace(/"\s*,\s*"/g, '", "') // Normalize commas
        .replace(/\n\s*"/g, ' "'); // Remove structural newlines if they precede a quote

      // Aggressive but safe: Escape raw newlines inside what appears to be string values
      // We look for sequences between structural JSON characters: ": " .... " ,
      const escapedValues = structuralRepair.replace(/:\s*"([\s\S]*?)"(?=\s*[,\]\}])/g, (match, p1) => {
        const fixed = p1.replace(/\n/g, "\\n").replace(/\r/g, "").replace(/\t/g, "\\t");
        return `: "${fixed}"`;
      });

      const parsed = JSON.parse(escapedValues);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => normalizeAlertOutput(item));
    } catch (finalError) {
      console.error("Structural JSON recovery failed:", finalError);
      throw finalError; // Trigger heuristic fallback
    }
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn("Groq NLP quota exceeded, falling back to heuristic alerts.");
      return generateHeuristicAlerts(posts);
    }

    console.error("Groq NLP Error, falling back to heuristic:", error);
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
      suggested_intervention: "Objective: Restore hands-on laboratory delivery in affected schools.\nImmediate Actions (0-14 days): Audit damaged and missing kit inventory, redeploy functional kits from low-usage hubs, and issue safe interim experiment alternatives.\nMedium-Term Actions (30-60 days): Complete procurement and replacement rollout, then conduct lab readiness coaching for teachers.\nMonitoring Metrics: Percentage of schools with complete lab kits, number of weekly lab sessions delivered, and reported incident/damage rate.\nResponsible Units: Regional logistics hub, division science supervisors, and school property custodians."
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
      suggested_intervention: "Objective: Maintain continuity of digital STEM instruction under bandwidth constraints.\nImmediate Actions (0-14 days): Publish compressed and offline-first module packs, prioritize asynchronous delivery windows, and provide teacher guidance for low-bandwidth facilitation.\nMedium-Term Actions (30-60 days): Coordinate site-by-site network optimization with local IT units and establish regional mirror repositories for learning assets.\nMonitoring Metrics: Module access success rate, student completion rates for digital tasks, and average page/resource load time by school cluster.\nResponsible Units: Regional ICT coordinators, division IT teams, and school e-learning focal persons."
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
      suggested_intervention: "Objective: Improve coherence between Data Science electives and existing Mathematics learning progressions.\nImmediate Actions (0-14 days): Convene a curriculum mapping sprint, align prerequisite competencies, and release sample weekly integration guides.\nMedium-Term Actions (30-60 days): Launch peer-mentoring cohorts and classroom observation cycles focused on transition pain points.\nMonitoring Metrics: Number of schools adopting mapped guides, teacher-reported clarity scores, and student performance consistency across transition units.\nResponsible Units: Regional curriculum specialists, master teachers, and subject coordinators."
    });
  }

  return alerts.map((alert) => normalizeAlertOutput(alert));
}

function normalizeAlertOutput(rawAlert: unknown) {
  const record = typeof rawAlert === "object" && rawAlert !== null ? rawAlert as Record<string, unknown> : {};

  const region = toText(record.region, "Unknown Region");
  const clusterTitle = toText(record.cluster_title, "Thematic Cluster");
  const sentiment = toText(record.sentiment, "Warning");
  const affectedCount = toCount(record.affected_count, 1);
  const description = toText(record.description, "No cluster description provided.");
  const interventionSeed = toText(record.suggested_intervention, "");

  return {
    region,
    cluster_title: clusterTitle,
    sentiment,
    affected_count: affectedCount,
    description,
    suggested_intervention: buildInterventionPlan({
      region,
      cluster_title: clusterTitle,
      sentiment,
      description,
      suggested_intervention: interventionSeed,
    }),
  };
}

function buildInterventionPlan(alert: {
  region: string;
  cluster_title: string;
  sentiment: string;
  description: string;
  suggested_intervention: string;
}) {
  const plan = alert.suggested_intervention.trim();
  const hasStructuredSections = /Objective:\s*|Immediate Actions \(0-14 days\):\s*|Medium-Term Actions \(30-60 days\):\s*|Monitoring Metrics:\s*|Responsible Units:\s*/i.test(plan);

  if (hasStructuredSections) {
    return plan;
  }

  const severityLens = alert.sentiment.toLowerCase() === "critical"
    ? "minimize instructional disruption and recover core STEM competencies rapidly"
    : alert.sentiment.toLowerCase() === "warning"
      ? "stabilize instructional delivery before the issue escalates"
      : "institutionalize good practices and reduce future implementation friction";

  const seedLine = plan ? `Immediate Actions (0-14 days): ${plan}` : `Immediate Actions (0-14 days): Validate issue scope with affected schools, issue interim classroom guidance, and assign regional focal leads.`;

  return [
    `Objective: For ${alert.region}, address \"${alert.cluster_title}\" and ${severityLens}.`,
    seedLine,
    "Medium-Term Actions (30-60 days): Deploy targeted coaching and support resources, institutionalize the intervention workflow, and conduct implementation reviews with division leads.",
    "Monitoring Metrics: Number of schools reached, teacher participation and completion rates, classroom implementation rate, and post-intervention confidence/performance signals.",
    "Responsible Units: Regional program manager, division supervisors, school heads, and designated STEM coordinators.",
  ].join("\n");
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function toCount(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }
  return fallback;
}




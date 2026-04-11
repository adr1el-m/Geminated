'use server';

import { searchSimilarResources, synthesizeAiAnswer, analyzeForumSentiment } from '@/lib/ai';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function askAiAction(query: string) {
  if (!query || query.trim().length === 0) {
    return { error: 'Query is empty' };
  }

  try {
    const similarResources = await searchSimilarResources(query);
    
    if (!similarResources || similarResources.length === 0) {
      return { 
        answer: "I couldn't find any relevant resources in the repository to answer your question. Please try asking something else or check general STEM best practices.",
        resources: []
      };
    }

    const answer = await synthesizeAiAnswer(query, similarResources);

    return {
      answer,
      resources: similarResources
    };
  } catch (err: any) {
    console.error("AI Action Error:", err);
    return { error: 'Something went wrong while asking the AI. Please try again later.' };
  }
}

export async function runForumDiagnosticsAction() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized' };
  }

  try {
    // 1. Fetch latest approved forum posts
    const posts = await db`
      select region, title, content 
      from forum_posts 
      where moderation_status = 'approved'
      order by created_at desc
      limit 50
    `;

    if (posts.length === 0) {
      return { message: 'No forum posts to analyze yet.' };
    }

    // 2. Run AI NLP analysis
    const alerts = await analyzeForumSentiment(posts);

    // 3. Clear old alerts and save new ones
    if (alerts && Array.isArray(alerts) && alerts.length > 0) {
      await db`delete from ai_field_alerts`;
      
      for (const alert of alerts) {
        await db`
          insert into ai_field_alerts (
            region, 
            cluster_title, 
            sentiment, 
            affected_count, 
            description, 
            suggested_intervention
          ) values (
            ${alert.region}, 
            ${alert.cluster_title || 'Thematic Cluster'}, 
            ${alert.sentiment || 'Warning'}, 
            ${Number(alert.affected_count) || 1}, 
            ${alert.description || ''}, 
            ${alert.suggested_intervention || ''}
          )
        `;
      }
    }

    revalidatePath('/admin');
    return { message: `Scan complete. Found ${alerts.length} diagnostic clusters.`, alerts };
  } catch (error) {
    console.error("Diagnostic Error:", error);
    return { error: 'Failed to complete AI diagnostic scan.' };
  }
}

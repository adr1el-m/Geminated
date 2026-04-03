'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  createForumTopic,
  createResourceUpload,
  updateForumTopicModeration,
  updateResourceModeration,
} from '@/lib/community';
import { getRequestFingerprint } from '@/lib/request-meta';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_TOPIC_TITLE = 160;
const MAX_TOPIC_CONTENT = 6000;
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export type CommunityActionState = {
  error: string | null;
};

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export async function createTopicAction(_state: CommunityActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'You need to sign in before posting a topic.' } satisfies CommunityActionState;
  }

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();

  const fingerprint = await getRequestFingerprint(`topic:${user.id}`);
  const attempt = checkRateLimit({
    key: fingerprint,
    windowMs: 10 * 60 * 1000,
    maxRequests: 8,
  });

  if (!attempt.allowed) {
    return {
      error: `Too many topic submissions. Try again in ${attempt.retryAfterSeconds}s.`,
    } satisfies CommunityActionState;
  }

  if (!title || !content || !region || !category) {
    return { error: 'All topic fields are required.' } satisfies CommunityActionState;
  }

  if (title.length > MAX_TOPIC_TITLE || content.length > MAX_TOPIC_CONTENT) {
    return {
      error: 'Topic title or content exceeds allowed length.',
    } satisfies CommunityActionState;
  }

  try {
    await createForumTopic({
      title,
      content,
      region,
      category,
      authorId: user.id,
    });
  } catch (error) {
    return { error: toMessage(error) } satisfies CommunityActionState;
  }

  redirect('/forum?submitted=1');
}

export async function uploadDocumentAction(_state: CommunityActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'You need to sign in before uploading documents.' } satisfies CommunityActionState;
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const document = formData.get('document');

  const fingerprint = await getRequestFingerprint(`upload:${user.id}`);
  const attempt = checkRateLimit({
    key: fingerprint,
    windowMs: 10 * 60 * 1000,
    maxRequests: 6,
  });

  if (!attempt.allowed) {
    return {
      error: `Too many uploads. Try again in ${attempt.retryAfterSeconds}s.`,
    } satisfies CommunityActionState;
  }

  if (!title || !(document instanceof File) || document.size === 0) {
    return { error: 'Title and document file are required.' } satisfies CommunityActionState;
  }

  if (title.length > 160 || (description && description.length > 1500)) {
    return { error: 'Title or description exceeds allowed length.' } satisfies CommunityActionState;
  }

  if (document.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return { error: 'Document exceeds the 10MB upload limit.' } satisfies CommunityActionState;
  }

  const mimeType = document.type || 'application/octet-stream';
  const hasAllowedExtension = /\.(pdf|doc|docx)$/i.test(document.name);

  if (!ALLOWED_UPLOAD_MIME_TYPES.has(mimeType) || !hasAllowedExtension) {
    return {
      error: 'Only PDF, DOC, and DOCX files are allowed.',
    } satisfies CommunityActionState;
  }

  const fileData = Buffer.from(await document.arrayBuffer());

  try {
    await createResourceUpload({
      title,
      description,
      fileName: document.name,
      mimeType,
      fileSize: document.size,
      fileData,
      authorId: user.id,
    });
  } catch (error) {
    return { error: toMessage(error) } satisfies CommunityActionState;
  }

  redirect('/repository?uploaded=1');
}

async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    throw new Error('Only admins can perform moderation actions.');
  }

  return user;
}

async function moderateResourceByStatus(formData: FormData, status: 'approved' | 'rejected') {
  const admin = await requireAdminUser();
  const resourceId = String(formData.get('resourceId') ?? '').trim();

  if (!resourceId) {
    throw new Error('Missing resource ID.');
  }

  await updateResourceModeration({
    id: resourceId,
    status,
    moderatedBy: admin.id,
  });

  redirect('/admin?moderated=1');
}

async function moderateForumTopicByStatus(formData: FormData, status: 'approved' | 'rejected') {
  const admin = await requireAdminUser();
  const topicId = String(formData.get('topicId') ?? '').trim();

  if (!topicId) {
    throw new Error('Missing topic ID.');
  }

  await updateForumTopicModeration({
    id: topicId,
    status,
    moderatedBy: admin.id,
  });

  redirect('/admin?moderated=1');
}

export async function approveResourceAction(formData: FormData) {
  await moderateResourceByStatus(formData, 'approved');
}

export async function rejectResourceAction(formData: FormData) {
  await moderateResourceByStatus(formData, 'rejected');
}

export async function approveTopicAction(formData: FormData) {
  await moderateForumTopicByStatus(formData, 'approved');
}

export async function rejectTopicAction(formData: FormData) {
  await moderateForumTopicByStatus(formData, 'rejected');
}
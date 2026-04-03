'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  createForumTopic,
  createResourceUpload,
  updateForumTopicModeration,
  updateResourceModeration,
} from '@/lib/community';

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

  if (!title || !content || !region || !category) {
    return { error: 'All topic fields are required.' } satisfies CommunityActionState;
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

  if (!title || !(document instanceof File) || document.size === 0) {
    return { error: 'Title and document file are required.' } satisfies CommunityActionState;
  }

  const fileData = Buffer.from(await document.arrayBuffer());

  try {
    await createResourceUpload({
      title,
      description,
      fileName: document.name,
      mimeType: document.type || 'application/octet-stream',
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
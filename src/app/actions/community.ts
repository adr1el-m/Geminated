'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser, hasAcceptedLatestTerms } from '@/lib/auth';
import {
  createForumComment,
  createForumTopic,
  createResourceUpload,
  deleteForumCommentById,
  deleteForumTopicById,
  deleteResourceById,
  toggleForumTopicUpvote,
  updateForumTopicModeration,
  updateResourceModeration,
} from '@/lib/community';
import { getRequestFingerprint } from '@/lib/request-meta';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import { createNotification, createNotificationsForAdmins } from '@/lib/notifications';
import {
  REGION_DIVISIONS_BY_REGION,
  REGISTRATION_REGIONS,
  RESOURCE_GRADE_LEVELS,
  RESOURCE_SUBJECT_AREAS,
  RESOURCE_TYPES,
} from '@/lib/constants';

const MAX_TOPIC_TITLE = 160;
const MAX_TOPIC_CONTENT = 6000;
const MAX_COMMENT_CONTENT = 1500;
const MAX_COMMENT_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_COMMENT_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
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

  if (!hasAcceptedLatestTerms(user)) {
    return { error: 'Please accept the Terms and Conditions in the Hub before posting.' } satisfies CommunityActionState;
  }

  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim();
  const division = String(formData.get('division') ?? '').trim();
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

  if (!title || !content || !region || !division || !category) {
    return { error: 'All topic fields are required.' } satisfies CommunityActionState;
  }

  if (!REGISTRATION_REGIONS.includes(region as (typeof REGISTRATION_REGIONS)[number])) {
    return { error: 'Please select a valid region.' } satisfies CommunityActionState;
  }

  const divisionsForRegion = REGION_DIVISIONS_BY_REGION[region] ?? [];
  if (!divisionsForRegion.includes(division)) {
    return { error: 'Please select a valid division for the selected region.' } satisfies CommunityActionState;
  }

  if (title.length > MAX_TOPIC_TITLE || content.length > MAX_TOPIC_CONTENT) {
    return {
      error: 'Topic title or content exceeds allowed length.',
    } satisfies CommunityActionState;
  }

  try {
    const topicId = await createForumTopic({
      title,
      content,
      region,
      division,
      category,
      authorId: user.id,
    });

    if (topicId) {
      await logAuditEvent({
        actorId: user.id,
        action: 'forum.topic.created',
        entityType: 'forum_post',
        entityId: topicId,
        changedFields: {
          title,
          region,
          division,
          category,
          moderation_status: 'pending',
        },
      });

      await createNotificationsForAdmins({
        type: 'moderation',
        title: 'New forum topic awaiting moderation',
        message: `${user.full_name} submitted "${title}" in ${region} - ${division}.`,
        linkUrl: '/admin',
        metadata: {
          topicId,
          authorId: user.id,
        },
      });
    }
  } catch (error) {
    return { error: toMessage(error) } satisfies CommunityActionState;
  }

  redirect('/forum?submitted=1');
}

export async function createCommentAction(_state: CommunityActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'You need to sign in before posting a comment.' } satisfies CommunityActionState;
  }

  if (!hasAcceptedLatestTerms(user)) {
    return { error: 'Please accept the Terms and Conditions in the Hub before commenting.' } satisfies CommunityActionState;
  }

  const topicId = String(formData.get('topicId') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const image = formData.get('image');

  const fingerprint = await getRequestFingerprint(`comment:${user.id}`);
  const attempt = checkRateLimit({
    key: fingerprint,
    windowMs: 10 * 60 * 1000,
    maxRequests: 25,
  });

  if (!attempt.allowed) {
    return {
      error: `Too many comment submissions. Try again in ${attempt.retryAfterSeconds}s.`,
    } satisfies CommunityActionState;
  }

  if (!topicId) {
    return { error: 'Topic is required.' } satisfies CommunityActionState;
  }

  if (content.length > MAX_COMMENT_CONTENT) {
    return { error: 'Comment exceeds allowed length.' } satisfies CommunityActionState;
  }

  const hasImage = image instanceof File && image.size > 0;
  if (!content && !hasImage) {
    return { error: 'Add comment text or attach an image.' } satisfies CommunityActionState;
  }

  let imageMimeType: string | null = null;
  let imageFileName: string | null = null;
  let imageData: Buffer | null = null;

  if (hasImage && image instanceof File) {
    imageMimeType = image.type || 'application/octet-stream';

    if (!ALLOWED_COMMENT_IMAGE_MIME_TYPES.has(imageMimeType)) {
      return { error: 'Only PNG, JPG, WEBP, and GIF images are allowed for comments.' } satisfies CommunityActionState;
    }

    if (image.size > MAX_COMMENT_IMAGE_BYTES) {
      return { error: 'Comment image exceeds the 5MB limit.' } satisfies CommunityActionState;
    }

    imageFileName = image.name;
    imageData = Buffer.from(await image.arrayBuffer());
  }

  try {
    const commentId = await createForumComment({
      topicId,
      content,
      imageMimeType,
      imageFileName,
      imageData,
      authorId: user.id,
    });

    if (commentId) {
      await logAuditEvent({
        actorId: user.id,
        action: 'forum.comment.created',
        entityType: 'forum_comment',
        entityId: commentId,
        changedFields: {
          topicId,
        },
      });
    }
  } catch (error) {
    return { error: toMessage(error) } satisfies CommunityActionState;
  }

  redirect(`/forum/${topicId}?commented=1`);
}

export async function uploadDocumentAction(_state: CommunityActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: 'You need to sign in before uploading documents.' } satisfies CommunityActionState;
  }

  if (!hasAcceptedLatestTerms(user)) {
    return { error: 'Please accept the Terms and Conditions in the Hub before uploading.' } satisfies CommunityActionState;
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const region = String(formData.get('region') ?? '').trim();
  const subjectArea = String(formData.get('subjectArea') ?? '').trim();
  const gradeLevel = String(formData.get('gradeLevel') ?? '').trim();
  const resourceType = String(formData.get('resourceType') ?? '').trim();
  const keywordsRaw = String(formData.get('keywords') ?? '').trim();
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

  if (!title || !region || !subjectArea || !gradeLevel || !resourceType || !(document instanceof File) || document.size === 0) {
    return { error: 'Title, region, subject area, grade level, resource type, and document are required.' } satisfies CommunityActionState;
  }

  if (title.length > 160 || (description && description.length > 1500)) {
    return { error: 'Title or description exceeds allowed length.' } satisfies CommunityActionState;
  }

  if (!REGISTRATION_REGIONS.includes(region as (typeof REGISTRATION_REGIONS)[number])) {
    return { error: 'Please select a valid region.' } satisfies CommunityActionState;
  }

  if (!RESOURCE_SUBJECT_AREAS.includes(subjectArea as (typeof RESOURCE_SUBJECT_AREAS)[number])) {
    return { error: 'Please select a valid subject area.' } satisfies CommunityActionState;
  }

  if (!RESOURCE_GRADE_LEVELS.includes(gradeLevel as (typeof RESOURCE_GRADE_LEVELS)[number])) {
    return { error: 'Please select a valid grade level.' } satisfies CommunityActionState;
  }

  if (!RESOURCE_TYPES.includes(resourceType as (typeof RESOURCE_TYPES)[number])) {
    return { error: 'Please select a valid resource type.' } satisfies CommunityActionState;
  }

  const keywords = Array.from(
    new Set(
      keywordsRaw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 10);

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
    const resourceId = await createResourceUpload({
      title,
      description,
      region,
      subjectArea,
      gradeLevel,
      resourceType,
      keywords,
      fileName: document.name,
      mimeType,
      fileSize: document.size,
      fileData,
      authorId: user.id,
    });

    if (resourceId) {
      await logAuditEvent({
        actorId: user.id,
        action: 'resource.upload.created',
        entityType: 'resource',
        entityId: resourceId,
        changedFields: {
          title,
          fileName: document.name,
          region,
          subjectArea,
          gradeLevel,
          resourceType,
          moderation_status: 'pending',
        },
      });

      await createNotificationsForAdmins({
        type: 'moderation',
        title: 'New document upload awaiting moderation',
        message: `${user.full_name} uploaded "${title}" for review.`,
        linkUrl: '/admin',
        metadata: {
          resourceId,
          authorId: user.id,
        },
      });
    }
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

  if (!hasAcceptedLatestTerms(user)) {
    redirect('/hub');
  }

  if (user.role !== 'admin') {
    throw new Error('Only admins can perform moderation actions.');
  }

  return user;
}

async function moderateResourceByStatus(formData: FormData, status: 'approved' | 'rejected') {
  const admin = await requireAdminUser();
  const resourceId = String(formData.get('resourceId') ?? '').trim();
  const returnTab = String(formData.get('returnTab') ?? '').trim();

  if (!resourceId) {
    throw new Error('Missing resource ID.');
  }

  const moderatedResource = await updateResourceModeration({
    id: resourceId,
    status,
    moderatedBy: admin.id,
  });

  if (!moderatedResource) {
    throw new Error('Resource not found.');
  }

  await logAuditEvent({
    actorId: admin.id,
    action: `resource.${status}`,
    entityType: 'resource',
    entityId: resourceId,
    changedFields: {
      moderation_status: status,
    },
  });

  await createNotification({
    userId: moderatedResource.author_id,
    type: status,
    title: `Document ${status}`,
    message: `Your document "${moderatedResource.title}" was ${status} by an admin moderator.`,
    linkUrl: '/repository',
    metadata: {
      resourceId,
      status,
    },
  });

  const tabQuery = returnTab ? `&tab=${encodeURIComponent(returnTab)}` : '';
  redirect(`/admin?moderated=1${tabQuery}`);
}

async function moderateForumTopicByStatus(formData: FormData, status: 'approved' | 'rejected') {
  const admin = await requireAdminUser();
  const topicId = String(formData.get('topicId') ?? '').trim();
  const returnTab = String(formData.get('returnTab') ?? '').trim();

  if (!topicId) {
    throw new Error('Missing topic ID.');
  }

  const moderatedTopic = await updateForumTopicModeration({
    id: topicId,
    status,
    moderatedBy: admin.id,
  });

  if (!moderatedTopic) {
    throw new Error('Forum topic not found.');
  }

  await logAuditEvent({
    actorId: admin.id,
    action: `forum.topic.${status}`,
    entityType: 'forum_post',
    entityId: topicId,
    changedFields: {
      moderation_status: status,
    },
  });

  await createNotification({
    userId: moderatedTopic.author_id,
    type: status,
    title: `Forum topic ${status}`,
    message: `Your topic "${moderatedTopic.title}" was ${status} by an admin moderator.`,
    linkUrl: status === 'approved' ? `/forum/${topicId}` : '/forum',
    metadata: {
      topicId,
      status,
    },
  });

  const tabQuery = returnTab ? `&tab=${encodeURIComponent(returnTab)}` : '';
  redirect(`/admin?moderated=1${tabQuery}`);
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

export async function deleteTopicAction(formData: FormData) {
  const admin = await requireAdminUser();
  const topicId = String(formData.get('topicId') ?? '').trim();
  const returnToRaw = String(formData.get('returnTo') ?? '').trim();

  if (!topicId) {
    throw new Error('Missing topic ID.');
  }

  const deleted = await deleteForumTopicById(topicId);

  if (!deleted) {
    throw new Error('Forum topic not found.');
  }

  await logAuditEvent({
    actorId: admin.id,
    action: 'forum.topic.deleted',
    entityType: 'forum_post',
    entityId: topicId,
    changedFields: {
      title: deleted.title,
    },
  });

  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : '/forum';
  redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}removedTopic=1`);
}

export async function deleteResourceAction(formData: FormData) {
  const admin = await requireAdminUser();
  const resourceId = String(formData.get('resourceId') ?? '').trim();
  const returnToRaw = String(formData.get('returnTo') ?? '').trim();

  if (!resourceId) {
    throw new Error('Missing resource ID.');
  }

  const deleted = await deleteResourceById(resourceId);

  if (!deleted) {
    throw new Error('Resource not found.');
  }

  await logAuditEvent({
    actorId: admin.id,
    action: 'resource.deleted',
    entityType: 'resource',
    entityId: resourceId,
    changedFields: {
      title: deleted.title,
    },
  });

  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : '/repository';
  redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}removedResource=1`);
}

export async function deleteCommentAction(formData: FormData) {
  const admin = await requireAdminUser();
  const commentId = String(formData.get('commentId') ?? '').trim();
  const returnToRaw = String(formData.get('returnTo') ?? '').trim();

  if (!commentId) {
    throw new Error('Missing comment ID.');
  }

  const deleted = await deleteForumCommentById(commentId);

  if (!deleted) {
    throw new Error('Comment not found.');
  }

  await logAuditEvent({
    actorId: admin.id,
    action: 'forum.comment.deleted',
    entityType: 'forum_comment',
    entityId: commentId,
    changedFields: {
      topicId: deleted.topic_id,
    },
  });

  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : `/forum/${deleted.topic_id}`;
  redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}removedComment=1`);
}

export async function toggleTopicUpvoteAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!hasAcceptedLatestTerms(user)) {
    redirect('/hub');
  }

  const topicId = String(formData.get('topicId') ?? '').trim();
  const returnToRaw = String(formData.get('returnTo') ?? '').trim();

  if (!topicId) {
    throw new Error('Missing topic ID.');
  }

  await toggleForumTopicUpvote({
    topicId,
    userId: user.id,
  });

  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : '/forum';
  redirect(returnTo);
}
'use client';

import { useActionState } from 'react';
import forumStyles from '@/app/forum/forum.module.css';
import { createCommentAction, type CommunityActionState } from '@/app/actions/community';

const initialState: CommunityActionState = {
  error: null,
};

type ForumCommentFormProps = {
  topicId: string;
};

export default function ForumCommentForm({ topicId }: ForumCommentFormProps) {
  const [state, formAction, pending] = useActionState(createCommentAction, initialState);

  return (
    <form action={formAction} className={forumStyles.commentForm} id="comment-form">
      <input type="hidden" name="topicId" value={topicId} />
      <label className={forumStyles.formBody}>
        Add Comment (text or image)
        <textarea
          name="content"
          rows={3}
          placeholder="Share your insight, question, or recommendation."
        />
      </label>

      <label className={forumStyles.formBody}>
        Attach Image (optional)
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
      </label>

      {state.error ? <p className={forumStyles.formError}>{state.error}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}

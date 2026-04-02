'use client';

import { useActionState } from 'react';
import forumStyles from '@/app/forum/forum.module.css';
import { createTopicAction, type CommunityActionState } from '@/app/actions/community';

import { PHILIPPINE_REGIONS_SHORT } from '@/lib/constants';

const initialState: CommunityActionState = {
  error: null,
};

export default function NewTopicForm() {
  const [state, formAction, pending] = useActionState(createTopicAction, initialState);

  return (
    <form action={formAction} className={forumStyles.topicForm}>
      <div className={forumStyles.formRow}>
        <label>
          Topic Title
          <input name="title" type="text" placeholder="What are you trying to solve?" required />
        </label>
        <label>
          Region
          <select name="region" required defaultValue="">
            <option value="" disabled>Select a region</option>
            {PHILIPPINE_REGIONS_SHORT.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={forumStyles.formRow}>
        <label>
          Category
          <select name="category" required defaultValue="">
            <option value="" disabled>Pick a category</option>
            <option value="Pedagogy">Pedagogy</option>
            <option value="Resources">Resources</option>
            <option value="Mentorship">Mentorship</option>
            <option value="General">General</option>
          </select>
        </label>
      </div>

      <label className={forumStyles.formBody}>
        Message
        <textarea
          name="content"
          rows={5}
          placeholder="Describe the challenge, context, or question in a few sentences."
          required
        />
      </label>

      {state.error && <p className={forumStyles.formError}>{state.error}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Posting...' : '+ New Topic'}
      </button>
    </form>
  );
}
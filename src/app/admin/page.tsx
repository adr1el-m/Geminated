import Link from 'next/link';
import { redirect } from 'next/navigation';
import adminStyles from './admin.module.css';
import { getCurrentUser } from '@/lib/auth';
import { getPendingForumTopics, getPendingResources } from '@/lib/community';
import {
  approveResourceAction,
  rejectResourceAction,
  approveTopicAction,
  rejectTopicAction,
} from '@/app/actions/community';

type PageProps = {
  searchParams: Promise<{ moderated?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/hub');
  }

  const { moderated } = await searchParams;
  const [pendingResources, pendingTopics] = await Promise.all([
    getPendingResources(),
    getPendingForumTopics(),
  ]);

  return (
    <div className={adminStyles.pageContainer}>
      <header className={adminStyles.header}>
        <div>
          <h1 className={adminStyles.title}>Admin Moderation Dashboard</h1>
          <p className={adminStyles.subtitle}>
            Approve or reject pending document uploads and community forum topics before they go public.
          </p>
        </div>
        <Link href="/profile" className="btn btn-secondary" style={{ height: 'fit-content' }}>
          Back to Profile
        </Link>
      </header>

      {moderated === '1' ? (
        <section className={`${adminStyles.notice} card`}>
          <strong>Moderation updated.</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>The selected content has been processed.</span>
        </section>
      ) : null}

      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Pending Documents ({pendingResources.length})</h2>
        {pendingResources.length === 0 ? (
          <div className="card">
            <p className={adminStyles.empty}>No documents are waiting for moderation.</p>
          </div>
        ) : (
          <div className={adminStyles.queue}>
            {pendingResources.map((resource) => (
              <article key={resource.id} className="card">
                <div className={adminStyles.itemHeader}>
                  <h3>{resource.title}</h3>
                  <span className={adminStyles.badge}>Pending</span>
                </div>
                <p className={adminStyles.meta}>
                  Uploaded by {resource.author_name} • {new Date(resource.created_at).toLocaleString()}
                </p>
                <p className={adminStyles.meta}>File: {resource.file_name}</p>
                {resource.description ? <p className={adminStyles.description}>{resource.description}</p> : null}
                <div className={adminStyles.actions}>
                  <form action={approveResourceAction}>
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <button type="submit" className="btn btn-primary">Approve</button>
                  </form>
                  <form action={rejectResourceAction}>
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <button type="submit" className="btn btn-secondary">Reject</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Pending Forum Topics ({pendingTopics.length})</h2>
        {pendingTopics.length === 0 ? (
          <div className="card">
            <p className={adminStyles.empty}>No forum topics are waiting for moderation.</p>
          </div>
        ) : (
          <div className={adminStyles.queue}>
            {pendingTopics.map((topic) => (
              <article key={topic.id} className="card">
                <div className={adminStyles.itemHeader}>
                  <h3>{topic.title}</h3>
                  <span className={adminStyles.badge}>Pending</span>
                </div>
                <p className={adminStyles.meta}>
                  Posted by {topic.author_name} • {topic.region} • {topic.category}
                </p>
                <p className={adminStyles.description}>{topic.content}</p>
                <div className={adminStyles.actions}>
                  <form action={approveTopicAction}>
                    <input type="hidden" name="topicId" value={topic.id} />
                    <button type="submit" className="btn btn-primary">Approve</button>
                  </form>
                  <form action={rejectTopicAction}>
                    <input type="hidden" name="topicId" value={topic.id} />
                    <button type="submit" className="btn btn-secondary">Reject</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

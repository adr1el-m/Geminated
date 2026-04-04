import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import forumStyles from '../forum.module.css';
import { getCurrentUser } from '@/lib/auth';
import { deleteCommentAction, deleteTopicAction } from '@/app/actions/community';
import ForumCommentForm from '@/components/ForumCommentForm';
import { getForumCommentsByTopic, getForumTopicById, getForumTopics } from '@/lib/community';
import { formatDateTimeNoSeconds } from '@/lib/date-format';

function toCommentImageDataUrl(value: Buffer | Uint8Array | string | null, mimeType: string | null) {
  if (!value || !mimeType) {
    return null;
  }

  if (typeof value === 'string') {
    if (value.startsWith('\\x')) {
      const hex = value.slice(2);
      return `data:${mimeType};base64,${Buffer.from(hex, 'hex').toString('base64')}`;
    }

    return `data:${mimeType};base64,${value}`;
  }

  const binary = value instanceof Uint8Array ? Buffer.from(value) : value;
  return `data:${mimeType};base64,${binary.toString('base64')}`;
}

function getAvatarByName(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes('janel')) return '/img/janel.jpeg';
  if (normalized.includes('gem')) return '/img/gem.jpeg';
  if (normalized.includes('adriel')) return '/img/adriel.jpg';
  if (normalized.includes('marti')) return '/img/marti.jpeg';
  if (normalized.includes('christine')) return '/img/christine.jpeg';

  return null;
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ commented?: string; removedComment?: string }>;
};

export default async function ForumTopicPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { commented, removedComment } = await searchParams;
  const topic = await getForumTopicById(id);

  if (!topic) {
    notFound();
  }

  const [relatedTopics, comments, user] = await Promise.all([
    getForumTopics().then((items) => items.filter((item) => item.id !== id).slice(0, 3)),
    getForumCommentsByTopic(id),
    getCurrentUser(),
  ]);

  return (
    <div className={forumStyles.pageContainer}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/forum" className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
          Back to Forum
        </Link>
        {user?.role === 'admin' ? (
          <form action={deleteTopicAction} style={{ display: 'inline-flex', marginLeft: '0.6rem' }}>
            <input type="hidden" name="topicId" value={id} />
            <input type="hidden" name="returnTo" value="/forum" />
            <button type="submit" className="btn btn-secondary">Remove Topic</button>
          </form>
        ) : null}
      </div>

      <article className={`${forumStyles.topicCard} card`} style={{ marginBottom: '2rem' }}>
        <div className={forumStyles.topicHeader}>
          <span className={forumStyles.category}>{topic.category}</span>
          <span className={forumStyles.regionBadge}>{topic.region}</span>
        </div>

        <h1 className={forumStyles.title} style={{ marginBottom: '0.5rem' }}>{topic.title}</h1>

        <div className={forumStyles.topicMeta} style={{ marginTop: 0 }}>
          <div className={forumStyles.author}>
            <div className={forumStyles.avatarMini}>
              {getAvatarByName(topic.author_name) ? (
                <Image
                  src={getAvatarByName(topic.author_name) as string}
                  alt={topic.author_name}
                  fill
                  sizes="24px"
                  style={{ objectFit: 'cover' }}
                />
              ) : null}
            </div>
            <span>
              Posted by{' '}
              <Link href={`/profile/${topic.author_id}`} className={forumStyles.authorProfileLink}>
                <strong>{topic.author_name}</strong>
              </Link>
            </span>
          </div>
          <div className={forumStyles.stats}>
            <span className={forumStyles.statItem}>{formatDateTimeNoSeconds(topic.created_at)}</span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
          {topic.content}
        </div>
      </article>

      <section className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Comments ({comments.length})</h2>

        {commented === '1' ? (
          <p className={forumStyles.commentNotice}>Comment posted successfully.</p>
        ) : null}

        {removedComment === '1' ? (
          <p className={forumStyles.commentNotice}>Comment removed successfully.</p>
        ) : null}

        {user ? (
          <ForumCommentForm topicId={id} />
        ) : (
          <p className={forumStyles.commentLoginHint}>
            <Link href="/login">Sign in</Link> to post a comment.
          </p>
        )}

        <div className={forumStyles.commentList}>
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first to contribute.</p>
          ) : (
            comments.map((comment) => {
              const imageDataUrl = toCommentImageDataUrl(comment.image_data, comment.image_mime_type);

              return (
                <article key={comment.id} className={forumStyles.commentItem}>
                  <div className={forumStyles.commentHeader}>
                    <Link href={`/profile/${comment.author_id}`} className={forumStyles.authorProfileLink}>
                      <strong>{comment.author_name}</strong>
                    </Link>
                    <span>{formatDateTimeNoSeconds(comment.created_at)}</span>
                  </div>
                  {comment.content ? <p className={forumStyles.commentBody}>{comment.content}</p> : null}
                  {imageDataUrl ? (
                    <Image
                      src={imageDataUrl}
                      alt={comment.image_file_name ?? 'Comment attachment'}
                      width={900}
                      height={600}
                      unoptimized
                      className={forumStyles.commentImage}
                    />
                  ) : null}
                  {user?.role === 'admin' ? (
                    <form action={deleteCommentAction} style={{ marginTop: '0.55rem' }}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <input type="hidden" name="returnTo" value={`/forum/${id}`} />
                      <button type="submit" className={forumStyles.deleteActionBtn}>Remove Comment</button>
                    </form>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginBottom: '1rem' }}>Related Topics</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {relatedTopics.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No related topics yet.</p>
          ) : (
            relatedTopics.map((relatedTopic) => (
              <Link key={relatedTopic.id} href={`/forum/${relatedTopic.id}`} className={forumStyles.topicTitle}>
                {relatedTopic.title}
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
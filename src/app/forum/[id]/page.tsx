import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import forumStyles from '../forum.module.css';
import { getForumTopicById, getForumTopics } from '@/lib/community';

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
};

export default async function ForumTopicPage({ params }: PageProps) {
  const { id } = await params;
  const topic = await getForumTopicById(id);

  if (!topic) {
    notFound();
  }

  const relatedTopics = (await getForumTopics()).filter((item) => item.id !== id).slice(0, 3);

  return (
    <div className={forumStyles.pageContainer}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/forum" className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
          Back to Forum
        </Link>
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
              Posted by <strong>{topic.author_name}</strong>
            </span>
          </div>
          <div className={forumStyles.stats}>
            <span className={forumStyles.statItem}>{new Date(topic.created_at).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
          {topic.content}
        </div>
      </article>

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
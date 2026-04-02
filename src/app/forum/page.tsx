import forumStyles from './forum.module.css';
import Link from 'next/link';
import Image from 'next/image';
import NewTopicForm from '@/components/NewTopicForm';
import { getForumTopics } from '@/lib/community';
import { PHILIPPINE_REGIONS_SHORT } from '@/lib/constants';

function getAvatarByName(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes('janel')) return '/img/janel.jpeg';
  if (normalized.includes('gem')) return '/img/gem.jpeg';
  if (normalized.includes('adriel')) return '/img/adriel.jpg';
  if (normalized.includes('marti')) return '/img/marti.jpeg';
  if (normalized.includes('christine')) return '/img/christine.jpeg';

  return null;
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 22s7-6.16 7-12a7 7 0 1 0-14 0c0 5.84 7 12 7 12z" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21 11.5A8.5 8.5 0 0 1 12.5 20H7l-4 3v-5.5A8.5 8.5 0 1 1 21 11.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default async function ForumPage() {
  const topics = await getForumTopics();

  return (
    <div className={forumStyles.pageContainer}>
      <header className={forumStyles.header}>
        <div className={forumStyles.titleBlock}>
          <h1 className={forumStyles.title}>Regional Discussion Forums</h1>
          <p className={forumStyles.subtitle}>
            Ask questions, share localized implementation challenges, and form mentorship networks across regions.
          </p>
        </div>
        <Link href="#new-topic" className="btn btn-primary" style={{ height: 'fit-content' }}>
          + New Topic
        </Link>
      </header>

      <div className={forumStyles.layout}>
        <aside className={forumStyles.sidebar}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 className={forumStyles.sidebarTitle}>Regions</h3>
            <ul className={forumStyles.navLinks}>
              <li><Link href="/forum" className={forumStyles.active}>All Regions</Link></li>
              {PHILIPPINE_REGIONS_SHORT.map((region) => (
                <li key={region}><Link href={`/forum?region=${region}`}>{region}</Link></li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ padding: '1rem', marginTop: '1.5rem' }} id="new-topic">
            <h3 className={forumStyles.sidebarTitle}>Start a topic</h3>
            <NewTopicForm />
          </div>
        </aside>

        <main className={forumStyles.feed}>
          {topics.length === 0 ? (
            <div className="card">
              <h3>No topics yet</h3>
              <p>Be the first to start a discussion in the community hub.</p>
            </div>
          ) : (
            topics.map((topic) => (
              <article key={topic.id} className={`${forumStyles.topicCard} card`}>
                <div className={forumStyles.topicHeader}>
                  <span className={forumStyles.category}>{topic.category}</span>
                  <span className={forumStyles.regionBadge}>
                    <PinIcon />
                    {topic.region}
                  </span>
                </div>

                <Link href={`/forum/${topic.id}`} className={forumStyles.topicTitle}>
                  {topic.title}
                </Link>

                <p className={forumStyles.topicExcerpt}>{topic.content}</p>

                <div className={forumStyles.topicMeta}>
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
                    <span className={forumStyles.statItem}>
                      <MessageIcon />
                      New post
                    </span>
                    <span className={forumStyles.statItem}>
                      <ClockIcon />
                      {new Date(topic.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

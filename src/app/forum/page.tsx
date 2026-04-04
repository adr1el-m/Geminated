import forumStyles from './forum.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { deleteTopicAction, toggleTopicUpvoteAction } from '@/app/actions/community';
import { getForumTopics, getUserForumTopicVoteMap } from '@/lib/community';
import { PHILIPPINE_REGIONS_SHORT } from '@/lib/constants';
import { formatDateTimeNoSeconds } from '@/lib/date-format';

type PageProps = {
  searchParams: Promise<{ submitted?: string; region?: string; sort?: string; removedTopic?: string }>;
};

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

export default async function ForumPage({ searchParams }: PageProps) {
  const { submitted, region, sort, removedTopic } = await searchParams;
  const [topics, user] = await Promise.all([getForumTopics(), getCurrentUser()]);
  const activeRegion = PHILIPPINE_REGIONS_SHORT.includes(region ?? '') ? (region as string) : null;
  const activeSort = sort === 'most_comments' || sort === 'most_upvotes' ? sort : 'recent';

  const filteredTopicsBase = activeRegion
    ? topics.filter((topic) => topic.region === activeRegion)
    : topics;

  const filteredTopics = [...filteredTopicsBase].sort((a, b) => {
    if (activeSort === 'most_comments') {
      if (b.comment_count !== a.comment_count) return b.comment_count - a.comment_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    if (activeSort === 'most_upvotes') {
      if (b.upvote_count !== a.upvote_count) return b.upvote_count - a.upvote_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const voteMap = user
    ? await getUserForumTopicVoteMap(filteredTopics.map((topic) => topic.id), user.id)
    : {};

  const returnToParams = new URLSearchParams();
  if (activeRegion) returnToParams.set('region', activeRegion);
  if (activeSort !== 'recent') returnToParams.set('sort', activeSort);
  const returnTo = `/forum${returnToParams.toString() ? `?${returnToParams.toString()}` : ''}`;

  return (
    <div className={forumStyles.pageContainer}>
      <header className={forumStyles.header}>
        <div className={forumStyles.titleBlock}>
          <h1 className={forumStyles.title}>Regional Discussion Forums</h1>
          <p className={forumStyles.subtitle}>
            Ask questions, share localized implementation challenges, and form mentorship networks across regions.
          </p>
        </div>
        <Link href="/forum/new" className="btn btn-primary" style={{ height: 'fit-content' }}>
          + New Topic
        </Link>
      </header>

      <div className={forumStyles.layout}>
        <aside className={forumStyles.sidebar}>
          <div className={`${forumStyles.sidebarCard} card`}>
            <h3 className={forumStyles.sidebarTitle}>Regions</h3>
            <ul className={forumStyles.navLinks}>
              <li>
                <Link
                  href="/forum"
                  className={`${forumStyles.navLink} ${!activeRegion ? forumStyles.navLinkActive : ''}`.trim()}
                >
                  All Regions
                </Link>
              </li>
              {PHILIPPINE_REGIONS_SHORT.map((region) => (
                <li key={region}>
                  <Link
                    href={`/forum?region=${encodeURIComponent(region)}`}
                    className={`${forumStyles.navLink} ${activeRegion === region ? forumStyles.navLinkActive : ''}`.trim()}
                  >
                    {region}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className={forumStyles.feed}>
          {submitted === '1' ? (
            <div className="card" style={{ borderColor: 'rgba(34, 139, 58, 0.3)' }}>
              <h3 style={{ marginBottom: '0.25rem' }}>Topic submitted for approval</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                Thanks for contributing. Your topic will appear publicly once an admin approves it.
              </p>
            </div>
          ) : null}

          {removedTopic === '1' ? (
            <div className="card" style={{ borderColor: 'rgba(220, 38, 38, 0.25)' }}>
              <h3 style={{ marginBottom: '0.25rem' }}>Forum topic removed</h3>
              <p style={{ color: 'var(--text-muted)' }}>The selected topic was removed by an admin moderator.</p>
            </div>
          ) : null}

          {activeRegion ? (
            <div className={`${forumStyles.activeRegionBanner} card`}>
              <strong>Viewing Region:</strong> {activeRegion}
            </div>
          ) : null}

          <form method="get" className={forumStyles.sortBar}>
            {activeRegion ? <input type="hidden" name="region" value={activeRegion} /> : null}
            <label htmlFor="sort" className={forumStyles.sortLabel}>Sort by</label>
            <select id="sort" name="sort" defaultValue={activeSort} className={forumStyles.sortSelect}>
              <option value="recent">Most Recent</option>
              <option value="most_comments">Most Comments</option>
              <option value="most_upvotes">Most Upvotes</option>
            </select>
            <button type="submit" className="btn btn-secondary">Apply</button>
          </form>

          {filteredTopics.length === 0 ? (
            <div className="card">
              <h3>{activeRegion ? `No topics yet for ${activeRegion}` : 'No topics yet'}</h3>
              <p>
                {activeRegion
                  ? 'No approved topics match this region yet. Try another region or start a new topic.'
                  : 'Be the first to start a discussion in the community hub.'}
              </p>
            </div>
          ) : (
            filteredTopics.map((topic) => (
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
                      Posted by{' '}
                      <Link href={`/profile/${topic.author_id}`} className={forumStyles.authorProfileLink}>
                        <strong>{topic.author_name}</strong>
                      </Link>
                    </span>
                  </div>
                  <div className={forumStyles.stats}>
                    <Link href={`/forum/${topic.id}#comment-form`} className={forumStyles.commentActionLink}>
                      <MessageIcon />
                      Comment ({topic.comment_count})
                    </Link>
                    <form action={toggleTopicUpvoteAction}>
                      <input type="hidden" name="topicId" value={topic.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" className={forumStyles.voteActionBtn}>
                        ▲ {voteMap[topic.id] ? 'Upvoted' : 'Upvote'} ({topic.upvote_count})
                      </button>
                    </form>
                    <span className={forumStyles.statItem}>
                      <ClockIcon />
                      {formatDateTimeNoSeconds(topic.created_at)}
                    </span>
                    {user?.role === 'admin' ? (
                      <form action={deleteTopicAction}>
                        <input type="hidden" name="topicId" value={topic.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit" className={forumStyles.deleteActionBtn}>Remove</button>
                      </form>
                    ) : null}
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

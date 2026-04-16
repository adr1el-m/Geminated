import Link from 'next/link';
import { redirect } from 'next/navigation';
import dashStyles from './dashboard.module.css';
import { getCurrentUser, hasAcceptedLatestTerms } from '@/lib/auth';
import { getForumTopics } from '@/lib/community';
import { getNotificationsForUser, getUnreadNotificationCount } from '@/lib/notifications';
import { formatDateTimeNoSeconds } from '@/lib/date-format';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!hasAcceptedLatestTerms(user)) {
    redirect('/hub');
  }

  const [topics, notifications, unreadNotifications] = await Promise.all([
    getForumTopics(),
    getNotificationsForUser(user.id, 5),
    getUnreadNotificationCount(user.id),
  ]);

  // Sort topics by upvotes (trending) and take top 4
  const trendingTopics = [...topics]
    .sort((a, b) => b.upvote_count - a.upvote_count)
    .slice(0, 4);

  return (
    <div className={dashStyles.container}>
      <header className={dashStyles.header}>
        <h1 className={dashStyles.title}>Welcome back, {user.full_name.split(' ')[0]}!</h1>
        <p className={dashStyles.subtitle}>
          Here is your personalized overview of what&lsquo;s happening in the STAR-LINK community today.
        </p>
      </header>

      <div className={dashStyles.statsGrid}>
        <div className={dashStyles.statCard}>
          <div className={dashStyles.statValue}>{unreadNotifications}</div>
          <div className={dashStyles.statLabel}>Unread Notifications</div>
        </div>
        <div className={dashStyles.statCard}>
          <div className={dashStyles.statValue}>{trendingTopics.length}</div>
          <div className={dashStyles.statLabel}>Trending Topics</div>
        </div>
        {user.role === 'admin' ? (
          <div className={dashStyles.statCard}>
            <div className={dashStyles.statValue}>Admin</div>
            <div className={dashStyles.statLabel}>Role Access</div>
          </div>
        ) : (
          <div className={dashStyles.statCard}>
            <div className={dashStyles.statValue}>{user.occupation || 'N/A'}</div>
            <div className={dashStyles.statLabel}>Position</div>
          </div>
        )}
      </div>

      <div className={dashStyles.grid}>
        <section className={dashStyles.section}>
          <h2 className={dashStyles.sectionTitle}>
             Trending Forum Topics
          </h2>
          {trendingTopics.length === 0 ? (
            <div className={dashStyles.emptyState}>No topics available yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {trendingTopics.map((topic) => (
                <div key={topic.id} className={dashStyles.card}>
                  <div className={dashStyles.cardHeader}>
                    <h3 className={dashStyles.cardTitle}>{topic.title}</h3>
                    <span className={dashStyles.badge}>{topic.upvote_count} Upvotes</span>
                  </div>
                  <p className={dashStyles.cardMeta}>
                    By {topic.author_name} • {topic.category}
                  </p>
                  <p className={dashStyles.cardDescription}>
                    {topic.content.length > 100 ? topic.content.slice(0, 100) + '...' : topic.content}
                  </p>
                  <div className={dashStyles.actionLinks}>
                    <Link href={`/forum/${topic.id}`} className={dashStyles.inlineLink}>Read More</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
             <Link href="/forum" className="btn btn-secondary">Visit Community Forums</Link>
          </div>
        </section>

        <section className={dashStyles.section}>
          <h2 className={dashStyles.sectionTitle}>
             Recent Notifications
          </h2>
          {notifications.length === 0 ? (
            <div className={dashStyles.emptyState}>You have no new notifications.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map((notif) => (
                <div key={notif.id} className={dashStyles.card} style={{ borderLeft: !notif.read_at ? '4px solid var(--primary-blue)' : undefined }}>
                  <div className={dashStyles.cardHeader}>
                    <h3 className={dashStyles.cardTitle}>{notif.title}</h3>
                  </div>
                  <p className={dashStyles.cardMeta}>{formatDateTimeNoSeconds(notif.created_at)}</p>
                  <p className={dashStyles.cardDescription}>{notif.message}</p>
                  {notif.link_url && (
                    <div className={dashStyles.actionLinks}>
                      <Link href={notif.link_url} className={dashStyles.inlineLink}>View Details</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        
        <section className={dashStyles.section}>
          <h2 className={dashStyles.sectionTitle}>
             Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user.role === 'admin' && (
              <Link href="/admin" className="btn btn-primary" style={{ textAlign: 'center' }}>
                Open Admin Dashboard
              </Link>
            )}
            <Link href="/profile" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              Update My Profile
            </Link>
            <Link href="/programs" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              Browse Programs
            </Link>
            <Link href="/repository/upload" className="btn btn-secondary" style={{ textAlign: 'center' }}>
              Share a Resource
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

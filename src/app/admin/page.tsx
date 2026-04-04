import Link from 'next/link';
import { redirect } from 'next/navigation';
import adminStyles from './admin.module.css';
import { getCurrentUser } from '@/lib/auth';
import { getPendingForumTopics, getPendingResources } from '@/lib/community';
import { getRegionalInsightsDashboard } from '@/lib/regional-insights';
import { getRecentAuditLogs } from '@/lib/audit';
import { REGIONAL_DATA_DICTIONARY } from '@/lib/data-dictionary';
import { formatDateTimeNoSeconds } from '@/lib/date-format';
import { REGION_DISPLAY_NAMES, REGISTRATION_REGIONS } from '@/lib/constants';
import { getNotificationsForUser, getUnreadNotificationCount } from '@/lib/notifications';
import { markAllNotificationsReadAction } from '@/app/actions/notifications';
import {
  approveResourceAction,
  rejectResourceAction,
  approveTopicAction,
  rejectTopicAction,
} from '@/app/actions/community';

type PageProps = {
  searchParams: Promise<{ moderated?: string; tab?: string }>;
};

type AdminTabId =
  | 'regional'
  | 'notifications'
  | 'privacy'
  | 'freshness'
  | 'dictionary'
  | 'audit'
  | 'underserved'
  | 'segmentation'
  | 'pending-documents'
  | 'pending-topics';

export default async function AdminPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/hub');
  }

  const { moderated, tab } = await searchParams;
  const [pendingResources, pendingTopics, insights, auditLogs, notifications, unreadNotifications] = await Promise.all([
    getPendingResources(),
    getPendingForumTopics(),
    getRegionalInsightsDashboard(),
    getRecentAuditLogs(25),
    getNotificationsForUser(user.id, 20),
    getUnreadNotificationCount(user.id),
  ]);

  const needsByRegion = new Map(insights.needsSegmentation.map((item) => [item.region, item]));
  const freshnessByRegion = new Map(insights.freshnessIndicators.map((item) => [item.region, item]));

  const tabs: Array<{ id: AdminTabId; label: string }> = [
    { id: 'regional', label: 'Regional Dashboard' },
    { id: 'notifications', label: `Notifications (${unreadNotifications})` },
    { id: 'privacy', label: 'Privacy & Consent' },
    { id: 'freshness', label: 'Data Freshness' },
    { id: 'dictionary', label: 'Data Dictionary' },
    { id: 'audit', label: 'Audit Trail' },
    { id: 'underserved', label: 'Underserved Areas' },
    { id: 'segmentation', label: 'Needs Segmentation' },
    { id: 'pending-documents', label: `Pending Documents (${pendingResources.length})` },
    { id: 'pending-topics', label: `Pending Topics (${pendingTopics.length})` },
  ];

  const activeTab = tabs.some((item) => item.id === tab) ? (tab as AdminTabId) : 'regional';

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

      <nav className={adminStyles.tabBar} aria-label="Admin sections">
        <ul className={adminStyles.tabList}>
          {tabs.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin?tab=${encodeURIComponent(item.id)}`}
                className={`${adminStyles.tabLink} ${activeTab === item.id ? adminStyles.tabLinkActive : ''}`.trim()}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {activeTab === 'notifications' ? (
      <section className={adminStyles.section}>
        <div className={adminStyles.sectionHeaderInline}>
          <h2 className={adminStyles.sectionTitle}>Admin Notifications ({unreadNotifications} unread)</h2>
          {unreadNotifications > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <input type="hidden" name="returnTo" value="/admin" />
              <button type="submit" className="btn btn-secondary">Mark all as read</button>
            </form>
          ) : null}
        </div>
        {notifications.length === 0 ? (
          <div className="card">
            <p className={adminStyles.empty}>No notifications yet.</p>
          </div>
        ) : (
          <div className={adminStyles.queue}>
            {notifications.map((item) => (
              <article key={item.id} className={`card ${!item.read_at ? adminStyles.unreadNotification : ''}`}>
                <div className={adminStyles.itemHeader}>
                  <h3>{item.title}</h3>
                  <span className={adminStyles.metricBadge}>{formatDateTimeNoSeconds(item.created_at)}</span>
                </div>
                <p className={adminStyles.description}>{item.message}</p>
                {item.link_url ? (
                  <Link href={item.link_url} className={adminStyles.inlineLink}>Open related page</Link>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'regional' ? (
      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Regional Profile Dashboard</h2>
        <p className={adminStyles.meta} style={{ marginBottom: '0.8rem' }}>
          All configured regions are listed below. Open a region card to view full teacher directory details,
          participation metrics, and operational profile indicators.
        </p>
        <div className={adminStyles.analyticsGrid}>
          {REGISTRATION_REGIONS.map((region) => {
            const segmentation = needsByRegion.get(region);
            const freshness = freshnessByRegion.get(region);

            return (
              <article key={region} className={`card ${adminStyles.regionCard}`}>
                <div className={adminStyles.itemHeader}>
                  <h3>{REGION_DISPLAY_NAMES[region] ?? region}</h3>
                  <span className={adminStyles.metricBadge}>{segmentation?.totalTeachers ?? 0} teachers</span>
                </div>
                <p className={adminStyles.meta}>Divisions represented: {insights.divisionSnapshots.filter((item) => item.region === region).length}</p>
                <p className={adminStyles.meta}>New teachers: {segmentation?.newTeachers ?? 0}</p>
                <p className={adminStyles.meta}>Master track: {segmentation?.masterTrackTeachers ?? 0}</p>
                <p className={adminStyles.meta}>Completeness: {freshness?.completenessPercentage ?? 0}%</p>
                <p className={adminStyles.meta}>Last updated: {formatDateTimeNoSeconds(freshness?.lastUpdatedAt ?? new Date())}</p>
                <Link href={`/admin/regions/${encodeURIComponent(region)}`} className={adminStyles.inlineLink}>
                  Open regional profile
                </Link>
              </article>
            );
          })}
        </div>

        <h3 className={adminStyles.subSectionTitle}>Regional Coverage Gap Panel</h3>
        <div className={adminStyles.analyticsGrid}>
          {insights.coverageGaps.map((gap) => (
            <article key={gap.region} className="card">
              <div className={adminStyles.itemHeader}>
                <h3>{REGION_DISPLAY_NAMES[gap.region] ?? gap.region}</h3>
                <span
                  className={
                    gap.gapLevel === 'critical'
                      ? adminStyles.riskBadge
                      : gap.gapLevel === 'warning'
                        ? adminStyles.badge
                        : adminStyles.metricBadge
                  }
                >
                  {gap.gapLevel.toUpperCase()}
                </span>
              </div>
              <p className={adminStyles.meta}>Teachers captured: {gap.teacherCount}</p>
              <p className={adminStyles.meta}>Division coverage: {gap.coveredDivisions}/{gap.expectedDivisions} ({gap.coveragePercentage}%)</p>
              <p className={adminStyles.meta}>
                Missing divisions: {gap.missingDivisions.length > 0 ? gap.missingDivisions.slice(0, 4).join(', ') : 'None'}
                {gap.missingDivisions.length > 4 ? ` +${gap.missingDivisions.length - 4} more` : ''}
              </p>
            </article>
          ))}
        </div>

        <h3 className={adminStyles.subSectionTitle}>Top Priority Regions</h3>
        <div className={adminStyles.queue}>
          {insights.topPriorityRegions.slice(0, 8).map((item, index) => (
            <article key={item.region} className="card">
              <div className={adminStyles.itemHeader}>
                <h3>{index + 1}. {REGION_DISPLAY_NAMES[item.region] ?? item.region}</h3>
                <span className={adminStyles.riskBadge}>Priority {item.priorityScore}</span>
              </div>
              <p className={adminStyles.meta}>Teachers: {item.teacherCount} • STAR Access: {item.starAccessRate}% • Completeness: {item.completenessPercentage}%</p>
              <p className={adminStyles.meta}>Avg Underserved Score: {item.averageUnderservedScore}</p>
              <p className={adminStyles.description}>Drivers: {item.reasons.join(', ')}</p>
            </article>
          ))}
        </div>

        <h3 className={adminStyles.subSectionTitle}>Program Recommendation Cards</h3>
        <div className={adminStyles.analyticsGrid}>
          {insights.programRecommendations.slice(0, 8).map((item) => (
            <article key={item.region} className="card">
              <div className={adminStyles.itemHeader}>
                <h3>{REGION_DISPLAY_NAMES[item.region] ?? item.region}</h3>
                <span className={adminStyles.metricBadge}>Priority {item.priorityScore}</span>
              </div>
              <p className={adminStyles.meta}>Teachers: {item.teacherCount}</p>
              <p className={adminStyles.meta}>Rationale: {item.rationale.join(', ')}</p>
              <ul className={adminStyles.compactList}>
                {item.recommendedPrograms.map((program) => (
                  <li key={program}>{program}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeTab === 'privacy' ? (
      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Privacy & Consent Layer</h2>
        <div className={adminStyles.analyticsGrid}>
          <article className="card">
            <h3>Research Consent Summary</h3>
            <p className={adminStyles.meta}>Consented Teachers: {insights.anonymizedResearchSummary.totalConsentedTeachers}</p>
            <p className={adminStyles.meta}>Anonymized Dataset Rows: {insights.anonymizedResearchSummary.anonymizedDatasetRows}</p>
            <p className={adminStyles.meta}>Regions Covered: {insights.anonymizedResearchSummary.includedRegions}</p>
          </article>
          <article className="card">
            <h3>Data Minimization Policy</h3>
            <p className={adminStyles.meta}>Operational dashboard uses consented processing records only.</p>
            <p className={adminStyles.meta}>Research view includes only anonymized, consented, non-opt-out records.</p>
            <p className={adminStyles.meta}>Personally identifiable data is excluded from analytics cards.</p>
          </article>
        </div>
      </section>
      ) : null}

      {activeTab === 'freshness' ? (
      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Data Freshness Indicators</h2>
        {insights.freshnessIndicators.length === 0 ? (
          <div className="card">
            <p className={adminStyles.empty}>No freshness indicators available yet.</p>
          </div>
        ) : (
          <div className={adminStyles.analyticsGrid}>
            {insights.freshnessIndicators.map((item) => (
              <article key={item.region} className="card">
                <h3>{item.region}</h3>
                <p className={adminStyles.meta}>Teacher Records: {item.teacherCount}</p>
                <p className={adminStyles.meta}>Completeness: {item.completenessPercentage}%</p>
                <p className={adminStyles.meta}>Last Updated: {formatDateTimeNoSeconds(item.lastUpdatedAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'dictionary' ? (
      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Metadata & Data Dictionary</h2>
        <div className={adminStyles.queue}>
          {REGIONAL_DATA_DICTIONARY.map((item) => (
            <article key={item.indicator} className="card">
              <h3>{item.indicator}</h3>
              <p className={adminStyles.meta}><strong>Definition:</strong> {item.definition}</p>
              <p className={adminStyles.meta}><strong>Formula:</strong> {item.formula}</p>
              <p className={adminStyles.meta}><strong>Source:</strong> {item.source}</p>
              <p className={adminStyles.meta}><strong>Refresh:</strong> {item.updateFrequency}</p>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {activeTab === 'audit' ? (
      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Audit Trail</h2>
        {auditLogs.length === 0 ? (
          <div className="card">
            <p className={adminStyles.empty}>No audit events recorded yet.</p>
          </div>
        ) : (
          <div className={adminStyles.queue}>
            {auditLogs.map((entry) => (
              <article key={entry.id} className="card">
                <div className={adminStyles.itemHeader}>
                  <h3>{entry.action}</h3>
                  <span className={adminStyles.metricBadge}>{formatDateTimeNoSeconds(entry.created_at)}</span>
                </div>
                <p className={adminStyles.meta}>Actor: {entry.actor_name}</p>
                <p className={adminStyles.meta}>Entity: {entry.entity_type} ({entry.entity_id})</p>
                <p className={adminStyles.meta}>Changes: {Object.keys(entry.changed_fields || {}).join(', ') || 'none'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'underserved' ? (
      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Underserved Area Detection</h2>
        <p className={adminStyles.meta} style={{ marginBottom: '0.8rem' }}>
          Rule-based scoring flags low density, low qualification rates, low STAR access, and high out-of-field teaching.
        </p>
        {insights.underservedAreas.length === 0 ? (
          <div className="card">
            <p className={adminStyles.empty}>No areas are currently flagged as underserved based on configured thresholds.</p>
          </div>
        ) : (
          <div className={adminStyles.queue}>
            {insights.underservedAreas.slice(0, 10).map((area) => (
              <article key={`${area.region}:${area.division}`} className="card">
                <div className={adminStyles.itemHeader}>
                  <h3>{area.region} - {area.division}</h3>
                  <span className={adminStyles.riskBadge}>Score {area.underservedScore}</span>
                </div>
                <p className={adminStyles.meta}>Teachers: {area.teacherCount} • Avg Experience: {area.averageExperience}</p>
                <p className={adminStyles.description}>Reasons: {area.underservedReasons.join(', ')}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'segmentation' ? (
      <section className={adminStyles.section}>
        <h2 className={adminStyles.sectionTitle}>Needs Segmentation</h2>
        <p className={adminStyles.meta} style={{ marginBottom: '0.8rem' }}>
          Regional segmentation for new teachers, mid-career, veteran cohorts, master track mentors, and STEM specialization gaps.
        </p>
        {insights.needsSegmentation.length === 0 ? (
          <div className="card">
            <p className={adminStyles.empty}>No segmentation data available yet.</p>
          </div>
        ) : (
          <div className={adminStyles.analyticsGrid}>
            {insights.needsSegmentation.map((segment) => (
              <article key={segment.region} className="card">
                <h3>{segment.region}</h3>
                <p className={adminStyles.meta}>Total Teachers: {segment.totalTeachers}</p>
                <p className={adminStyles.meta}>New Teachers: {segment.newTeachers}</p>
                <p className={adminStyles.meta}>Mid-career: {segment.midCareerTeachers}</p>
                <p className={adminStyles.meta}>Veteran: {segment.veteranTeachers}</p>
                <p className={adminStyles.meta}>Master Track: {segment.masterTrackTeachers}</p>
                <p className={adminStyles.meta}>STEM Gap: {segment.stemSpecializationGap}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'pending-documents' ? (
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
                  Uploaded by {resource.author_name} • {formatDateTimeNoSeconds(resource.created_at)}
                </p>
                <p className={adminStyles.meta}>File: {resource.file_name}</p>
                {resource.description ? <p className={adminStyles.description}>{resource.description}</p> : null}
                <div className={adminStyles.actions}>
                  <form action={approveResourceAction}>
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <input type="hidden" name="returnTab" value={activeTab} />
                    <button type="submit" className="btn btn-primary">Approve</button>
                  </form>
                  <form action={rejectResourceAction}>
                    <input type="hidden" name="resourceId" value={resource.id} />
                    <input type="hidden" name="returnTab" value={activeTab} />
                    <button type="submit" className="btn btn-secondary">Reject</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}

      {activeTab === 'pending-topics' ? (
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
                    <input type="hidden" name="returnTab" value={activeTab} />
                    <button type="submit" className="btn btn-primary">Approve</button>
                  </form>
                  <form action={rejectTopicAction}>
                    <input type="hidden" name="topicId" value={topic.id} />
                    <input type="hidden" name="returnTab" value={activeTab} />
                    <button type="submit" className="btn btn-secondary">Reject</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      ) : null}
    </div>
  );
}

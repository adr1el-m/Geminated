import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import regionStyles from './region.module.css';
import { getCurrentUser } from '@/lib/auth';
import { REGION_DISPLAY_NAMES, REGISTRATION_REGIONS } from '@/lib/constants';
import { getRegionProfileDetails } from '@/lib/regional-insights';
import { formatDateTimeNoSeconds } from '@/lib/date-format';

type PageProps = {
  params: Promise<{ region: string }>;
};

export default async function AdminRegionProfilePage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/hub');
  }

  const { region: rawRegion } = await params;
  const region = decodeURIComponent(rawRegion);

  if (!REGISTRATION_REGIONS.includes(region as (typeof REGISTRATION_REGIONS)[number])) {
    notFound();
  }

  const details = await getRegionProfileDetails(region);

  return (
    <div className={regionStyles.pageContainer}>
      <header className={regionStyles.header}>
        <div>
          <h1>{REGION_DISPLAY_NAMES[region] ?? region}</h1>
          <p>
            Regional profile deep dive with teacher directory, qualification coverage, participation, consent, and data quality indicators.
          </p>
        </div>
        <Link href="/admin" className="btn btn-secondary">Back to Admin Dashboard</Link>
      </header>

      <section className={regionStyles.metricsGrid}>
        <article className="card">
          <h3>Total Teachers</h3>
          <p className={regionStyles.metricValue}>{details.teacherCount}</p>
        </article>
        <article className="card">
          <h3>Divisions Covered</h3>
          <p className={regionStyles.metricValue}>{details.divisionsCovered}</p>
        </article>
        <article className="card">
          <h3>Avg Experience</h3>
          <p className={regionStyles.metricValue}>{details.averageExperience} years</p>
        </article>
        <article className="card">
          <h3>Avg Data Quality</h3>
          <p className={regionStyles.metricValue}>{details.averageDataQualityScore}/100</p>
        </article>
        <article className="card">
          <h3>Consent Processing Rate</h3>
          <p className={regionStyles.metricValue}>{details.consentDataProcessingRate}%</p>
        </article>
        <article className="card">
          <h3>Consent Research Rate</h3>
          <p className={regionStyles.metricValue}>{details.consentResearchRate}%</p>
        </article>
        <article className="card">
          <h3>Anonymization Opt-out</h3>
          <p className={regionStyles.metricValue}>{details.anonymizationOptOutRate}%</p>
        </article>
        <article className="card">
          <h3>Latest Update</h3>
          <p className={regionStyles.metricValueSmall}>{formatDateTimeNoSeconds(details.lastUpdatedAt)}</p>
        </article>
      </section>

      <section className={regionStyles.splitGrid}>
        <article className="card">
          <h3>Top Subjects</h3>
          {details.topSubjects.length === 0 ? (
            <p className={regionStyles.empty}>No subject data available yet.</p>
          ) : (
            <ul className={regionStyles.simpleList}>
              {details.topSubjects.map((subject) => (
                <li key={subject.subject}>{subject.subject} ({subject.count})</li>
              ))}
            </ul>
          )}
        </article>
        <article className="card">
          <h3>STAR Participation Mix</h3>
          {details.participationMix.length === 0 ? (
            <p className={regionStyles.empty}>No participation data available yet.</p>
          ) : (
            <ul className={regionStyles.simpleList}>
              {details.participationMix.map((item) => (
                <li key={item.status}>{item.status}: {item.count} ({item.rate}%)</li>
              ))}
            </ul>
          )}
        </article>
        <article className="card">
          <h3>Qualification Mix</h3>
          {details.qualificationMix.length === 0 ? (
            <p className={regionStyles.empty}>No qualification data available yet.</p>
          ) : (
            <ul className={regionStyles.simpleList}>
              {details.qualificationMix.map((item) => (
                <li key={item.level}>{item.level}: {item.count} ({item.rate}%)</li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section>
        <h2 className={regionStyles.sectionTitle}>Teacher Directory</h2>
        {details.teachers.length === 0 ? (
          <div className="card">
            <p className={regionStyles.empty}>No teacher records found for this region.</p>
          </div>
        ) : (
          <div className={regionStyles.teacherGrid}>
            {details.teachers.map((teacher) => (
              <article key={teacher.id} className="card">
                <div className={regionStyles.teacherHeader}>
                  <h3>{teacher.fullName}</h3>
                  <span className={regionStyles.qualityBadge}>DQ {teacher.dataQualityScore}</span>
                </div>
                <p className={regionStyles.meta}>STAR ID: {teacher.starId}</p>
                <p className={regionStyles.meta}>Occupation: {teacher.occupation}</p>
                <p className={regionStyles.meta}>Division: {teacher.division}</p>
                <p className={regionStyles.meta}>School: {teacher.school}</p>
                <p className={regionStyles.meta}>Qualification: {teacher.qualificationLevel}</p>
                <p className={regionStyles.meta}>Experience: {teacher.yearsOfExperience} years</p>
                <p className={regionStyles.meta}>Participation: {teacher.starParticipationStatus}</p>
                <p className={regionStyles.meta}>
                  Consent: Processing {teacher.consentDataProcessing ? 'Yes' : 'No'} | Research {teacher.consentResearch ? 'Yes' : 'No'} | Opt-out {teacher.anonymizationOptOut ? 'Yes' : 'No'}
                </p>
                <p className={regionStyles.meta}>Updated: {formatDateTimeNoSeconds(teacher.profileLastUpdatedAt)}</p>
                <p className={regionStyles.meta}>
                  Subjects: {teacher.subjectsTaught.length > 0 ? teacher.subjectsTaught.join(', ') : 'Not specified'}
                </p>
                <Link href={`/profile/${teacher.id}`} className={regionStyles.profileLink}>Open profile</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

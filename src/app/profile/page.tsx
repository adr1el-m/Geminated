import profileStyles from './profile.module.css';
import { getCurrentUser, hasAcceptedLatestTerms } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { signOutAction } from '../actions/auth';
import Link from 'next/link';
import Image from 'next/image';
import ProfileEditForm from '@/components/ProfileEditForm';
import { AddTrainingForm } from '@/components/AddTrainingForm';
import PrivacyPanel from '@/components/PrivacyPanel';
import { formatDateTimeNoSeconds } from '@/lib/date-format';
import { getNotificationsForUser, getUnreadNotificationCount } from '@/lib/notifications';
import { markAllNotificationsReadAction } from '@/app/actions/notifications';
import { getTrainingRecordsForTeacher } from '@/lib/training-records';

function getAvatarByName(name: string, role: string) {
  if (role === 'admin') return '/img/favicon.png';

  const normalized = name.toLowerCase();

  if (normalized.includes('janel')) return '/img/janel.jpeg';
  if (normalized.includes('gem')) return '/img/gem.jpeg';
  if (normalized.includes('adriel')) return '/img/adriel.jpg';
  if (normalized.includes('marti')) return '/img/marti.jpeg';
  if (normalized.includes('christine')) return '/img/christine.jpeg';

  return null;
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ updated?: string; deletion_requested?: string; deletion_cancelled?: string }> }) {
  const params = await searchParams;
  const profile = await getCurrentUser();

  if (!profile) {
    redirect('/login');
  }

  if (!hasAcceptedLatestTerms(profile)) {
    redirect('/hub');
  }

  const [notifications, unreadNotifications, trainingRecords] = await Promise.all([
    getNotificationsForUser(profile.id, 20),
    getUnreadNotificationCount(profile.id),
    getTrainingRecordsForTeacher(profile.id),
  ]);

  return (
    <div className={profileStyles.container}>
      <header className={profileStyles.header}>
        <div className={profileStyles.avatarLarge}>
          {getAvatarByName(profile.full_name, profile.role) ? (
            <Image
              src={getAvatarByName(profile.full_name, profile.role) as string}
              alt={profile.full_name}
              fill
              sizes="100px"
              style={{ objectFit: 'cover' }}
            />
          ) : null}
        </div>
        <div className={profileStyles.headerInfo}>
          <h1>{profile.full_name}</h1>
          <p className={profileStyles.roleBadge}>{profile.role.toUpperCase()}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {profile.role === 'admin' ? (
            <Link href="/admin" className="btn btn-primary">
              Admin Dashboard
            </Link>
          ) : null}
          <form action={signOutAction}>
            <button type="submit" className="btn btn-secondary">
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <div className={profileStyles.contentGrid}>
        <section className={`${profileStyles.infoSection} card`}>
          <h3>Professional Information</h3>
          <div className={profileStyles.infoItem}>
            <span>STAR ID</span>
            <strong>{profile.star_id}</strong>
          </div>
          <div className={profileStyles.infoItem}>
            <span>Email</span>
            <strong>{profile.email}</strong>
          </div>
          <div className={profileStyles.infoItem}>
            <span>Occupation / Role</span>
            <strong>{profile.occupation}</strong>
          </div>
          <div className={profileStyles.infoItem}>
            <span>Last Profile Update</span>
            <strong>{formatDateTimeNoSeconds(profile.profile_last_updated_at)}</strong>
          </div>

          {profile.role === 'teacher' && (
            <>
              <div className={profileStyles.infoItem}>
                <span>Region</span>
                <strong>{profile.region}</strong>
              </div>
              <div className={profileStyles.infoItem}>
                <span>Division</span>
                <strong>{profile.division}</strong>
              </div>
              <div className={profileStyles.infoItem}>
                <span>School / Institution</span>
                <strong>{profile.school}</strong>
              </div>
              <div className={profileStyles.infoItem}>
                <span>Highest Qualification</span>
                <strong>{profile.qualification_level}</strong>
              </div>
              <div className={profileStyles.infoItem}>
                <span>Demographics</span>
                <strong>{profile.gender} • {profile.age_bracket}</strong>
              </div>
              <div className={profileStyles.infoItem}>
                <span>STAR Participation</span>
                <strong>{profile.star_participation_status}</strong>
              </div>
              <div className={profileStyles.infoItem}>
                <span>Data Quality Score</span>
                <strong>{profile.data_quality_score}/100</strong>
              </div>
              <div className={profileStyles.infoItem}>
                <span>Subjects Taught</span>
                <div className={profileStyles.tagGrid}>
                  {profile.subjects_taught?.length > 0 ? (
                    profile.subjects_taught.map((tag) => (
                      <span key={tag} className={profileStyles.tag}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className={profileStyles.muted}>No subjects added yet.</span>
                  )}
                </div>
              </div>
              <div className={profileStyles.infoItem}>
                <span>Years of Experience</span>
                <strong>{profile.years_of_experience} Years</strong>
              </div>
            </>
          )}

          {profile.role === 'teacher' && (
            <div className={profileStyles.infoItem}>
              <span>Structured Training Records ({trainingRecords.length})</span>
              {trainingRecords.length === 0 ? (
                <span className={profileStyles.muted}>No structured training records yet.</span>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {trainingRecords.map((record) => (
                    <li key={record.id} style={{ fontSize: '0.88rem', borderLeft: '3px solid var(--primary-blue)', paddingLeft: '0.75rem' }}>
                      <strong>{record.program_title}</strong>
                      {record.training_date ? <span style={{ color: 'var(--text-muted)' }}> · {record.training_date}</span> : null}
                      {record.duration_hours ? <span style={{ color: 'var(--text-muted)' }}> · {record.duration_hours}h</span> : null}
                      <br />
                      <span style={{ color: 'var(--text-muted)' }}>{record.training_type} · {record.provider}</span>
                      {record.verified ? <span style={{ color: '#15803d', fontWeight: 600, marginLeft: '0.4rem' }}> ✓ Verified</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {profile.role === 'teacher' && (
            <div className={profileStyles.infoItem}>
              <span>Add Training Record</span>
              <AddTrainingForm />
            </div>
          )}

          <div className={profileStyles.editSection}>
            <h4>Edit Profile</h4>
            <ProfileEditForm
              initial={{
                fullName: profile.full_name,
                occupation: profile.occupation,
                region: profile.region,
                division: profile.division,
                school: profile.school,
                qualificationLevel: profile.qualification_level,
                gender: profile.gender,
                ageBracket: profile.age_bracket,
                subjectsTaught: profile.subjects_taught ?? [],
                trainingHistory: profile.training_history ?? [],
                starParticipationStatus: profile.star_participation_status,
                consentDataProcessing: profile.consent_data_processing,
                consentResearch: profile.consent_research,
                anonymizationOptOut: profile.anonymization_opt_out,
                yearsOfExperience: profile.years_of_experience,
                role: profile.role,
              }}
            />
          </div>
        </section>

        <section className={`${profileStyles.infoSection} card`}>
          <h3>Data Privacy &amp; Account</h3>
          {params.deletion_requested === '1' ? <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '0.75rem' }}>✓ Account deletion has been requested. You have 30 days to cancel.</p> : null}
          {params.deletion_cancelled === '1' ? <p style={{ color: '#22863a', fontWeight: 600, marginBottom: '0.75rem' }}>✓ Deletion request has been cancelled. Your account is safe.</p> : null}
          <PrivacyPanel
            consentDataProcessing={profile.consent_data_processing}
            consentResearch={profile.consent_research}
            anonymizationOptOut={profile.anonymization_opt_out}
            consentVersion={profile.consent_version}
            consentedAt={profile.consented_at}
            dataRetentionExpiresAt={profile.data_retention_expires_at}
            deletionRequestedAt={profile.deletion_requested_at}
            createdAt={profile.created_at}
          />
        </section>

        <section className={`${profileStyles.activitySection} card`}>
          <div className={profileStyles.notificationsHeader}>
            <h3>Notifications ({unreadNotifications} unread)</h3>
            {unreadNotifications > 0 ? (
              <form action={markAllNotificationsReadAction}>
                <input type="hidden" name="returnTo" value="/profile" />
                <button type="submit" className="btn btn-secondary">Mark all as read</button>
              </form>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <p className={profileStyles.muted}>No notifications yet.</p>
          ) : (
            <div className={profileStyles.notificationsList}>
              {notifications.map((item) => (
                <article key={item.id} className={`${profileStyles.notificationItem} ${!item.read_at ? profileStyles.notificationUnread : ''}`}>
                  <div className={profileStyles.notificationTopRow}>
                    <strong>{item.title}</strong>
                    <span>{formatDateTimeNoSeconds(item.created_at)}</span>
                  </div>
                  <p>{item.message}</p>
                  {item.link_url ? (
                    <Link href={item.link_url} className={profileStyles.notificationLink}>Open related page</Link>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          <div className={profileStyles.emptyActivity}>
            <p>You can create forum topics and upload documents from the community pages.</p>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/forum" className="btn btn-primary">
                Start a Topic
              </Link>
              <Link href="/repository/upload" className="btn btn-secondary">
                Upload a Document
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

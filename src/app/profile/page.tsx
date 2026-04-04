import profileStyles from './profile.module.css';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { signOutAction } from '../actions/auth';
import Link from 'next/link';
import Image from 'next/image';
import ProfileEditForm from '@/components/ProfileEditForm';
import { formatDateTimeNoSeconds } from '@/lib/date-format';
import { getNotificationsForUser, getUnreadNotificationCount } from '@/lib/notifications';
import { markAllNotificationsReadAction } from '@/app/actions/notifications';

function getAvatarByName(name: string, role: string) {
  if (role === 'admin') return '/img/admin-profile.png';

  const normalized = name.toLowerCase();

  if (normalized.includes('janel')) return '/img/janel.jpeg';
  if (normalized.includes('gem')) return '/img/gem.jpeg';
  if (normalized.includes('adriel')) return '/img/adriel.jpg';
  if (normalized.includes('marti')) return '/img/marti.jpeg';
  if (normalized.includes('christine')) return '/img/christine.jpeg';

  return null;
}

export default async function ProfilePage() {
  const profile = await getCurrentUser();

  if (!profile) {
    redirect('/login');
  }

  const [notifications, unreadNotifications] = await Promise.all([
    getNotificationsForUser(profile.id, 20),
    getUnreadNotificationCount(profile.id),
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
            <span>Occupation</span>
            <strong>{profile.occupation}</strong>
          </div>
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
            <span>Privacy & Consent</span>
            <strong>
              Processing: {profile.consent_data_processing ? 'Granted' : 'Not Granted'} • Research: {profile.consent_research ? 'Granted' : 'Not Granted'} • Anonymization Opt-out: {profile.anonymization_opt_out ? 'Yes' : 'No'}
            </strong>
          </div>
          <div className={profileStyles.infoItem}>
            <span>Last Profile Update</span>
            <strong>{formatDateTimeNoSeconds(profile.profile_last_updated_at)}</strong>
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
          <div className={profileStyles.infoItem}>
            <span>Training History</span>
            <div className={profileStyles.tagGrid}>
              {profile.training_history?.length > 0 ? (
                profile.training_history.map((item) => (
                  <span key={item} className={profileStyles.tag}>
                    {item}
                  </span>
                ))
              ) : (
                <span className={profileStyles.muted}>No training records yet.</span>
              )}
            </div>
          </div>

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
              }}
            />
          </div>
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

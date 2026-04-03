import profileStyles from './profile.module.css';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { signOutAction } from '../actions/auth';
import Link from 'next/link';
import Image from 'next/image';
import ProfileEditForm from '@/components/ProfileEditForm';

function getAvatarByName(name: string) {
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

  return (
    <div className={profileStyles.container}>
      <header className={profileStyles.header}>
        <div className={profileStyles.avatarLarge}>
          {getAvatarByName(profile.full_name) ? (
            <Image
              src={getAvatarByName(profile.full_name) as string}
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
            <span>Email</span>
            <strong>{profile.email}</strong>
          </div>
          <div className={profileStyles.infoItem}>
            <span>Region</span>
            <strong>{profile.region}</strong>
          </div>
          <div className={profileStyles.infoItem}>
            <span>School / Institution</span>
            <strong>{profile.school}</strong>
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

          <div className={profileStyles.editSection}>
            <h4>Edit Profile</h4>
            <ProfileEditForm
              initial={{
                fullName: profile.full_name,
                region: profile.region,
                school: profile.school,
                subjectsTaught: profile.subjects_taught ?? [],
                yearsOfExperience: profile.years_of_experience,
              }}
            />
          </div>
        </section>

        <section className={`${profileStyles.activitySection} card`}>
          <h3>My Contributions</h3>
          <div className={profileStyles.emptyActivity}>
            <p>You can now create forum topics and upload documents from the community pages.</p>
            <Link href="/forum" className="btn btn-primary">
              Start a Topic
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

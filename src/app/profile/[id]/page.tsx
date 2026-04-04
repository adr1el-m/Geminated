import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import profileStyles from '../profile.module.css';
import { getCurrentUser, getPublicProfileById } from '@/lib/auth';
import {
  getApprovedForumTopicsByAuthor,
  getApprovedResourcesByAuthor,
} from '@/lib/community';

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

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const [viewer, profile] = await Promise.all([getCurrentUser(), getPublicProfileById(id)]);

  if (!profile) {
    notFound();
  }

  const [topics, resources] = await Promise.all([
    getApprovedForumTopicsByAuthor(profile.id),
    getApprovedResourcesByAuthor(profile.id),
  ]);

  const isOwnProfile = viewer?.id === profile.id;

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
          {isOwnProfile ? (
            <Link href="/profile" className="btn btn-primary">My Profile</Link>
          ) : null}
          <Link href="/forum" className="btn btn-secondary">Back to Forum</Link>
        </div>
      </header>

      <div className={profileStyles.contentGrid}>
        <section className={`${profileStyles.infoSection} card`}>
          <h3>Public Information</h3>
          <div className={profileStyles.infoItem}>
            <span>STAR ID</span>
            <strong>{profile.star_id}</strong>
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
            <span>Subjects Taught</span>
            <div className={profileStyles.tagGrid}>
              {profile.subjects_taught?.length > 0 ? (
                profile.subjects_taught.map((subject) => (
                  <span key={subject} className={profileStyles.tag}>
                    {subject}
                  </span>
                ))
              ) : (
                <span className={profileStyles.muted}>No subjects shared.</span>
              )}
            </div>
          </div>
          <div className={profileStyles.infoItem}>
            <span>Years of Experience</span>
            <strong>{profile.years_of_experience} Years</strong>
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
            <span>Member Since</span>
            <strong>{new Date(profile.created_at).toLocaleDateString()}</strong>
          </div>
        </section>

        <section className={`${profileStyles.activitySection} card`}>
          <h3>Published Contributions</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--institutional-blue)' }}>Forum Topics</h4>
            {topics.length === 0 ? (
              <p className={profileStyles.muted}>No approved forum topics yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {topics.slice(0, 6).map((topic) => (
                  <Link key={topic.id} href={`/forum/${topic.id}`} style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
                    {topic.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--institutional-blue)' }}>Repository Uploads</h4>
            {resources.length === 0 ? (
              <p className={profileStyles.muted}>No approved documents yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {resources.slice(0, 6).map((resource) => (
                  <Link key={resource.id} href={`/api/documents/${resource.id}`} style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
                    {resource.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

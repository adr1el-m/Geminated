import Link from 'next/link';
import Image from 'next/image';
import repoStyles from './repository.module.css';
import { getResources } from '@/lib/community';
import { PHILIPPINE_REGIONS_SHORT } from '@/lib/constants';

type PageProps = {
  searchParams: Promise<{ uploaded?: string }>;
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

export default async function RepositoryPage({ searchParams }: PageProps) {
  const { uploaded } = await searchParams;
  const resources = await getResources();

  return (
    <div className={repoStyles.pageContainer}>
      <div className={repoStyles.header}>
        <div className={repoStyles.titleBlock}>
          <h1 className={repoStyles.title}>Research & Extension Projects</h1>
          <p className={repoStyles.subtitle}>
            Upload a document to Neon and browse the latest shared research and extension materials.
          </p>
        </div>
        <a href="/repository/upload" className="btn btn-primary" style={{ height: 'fit-content' }}>
          + Upload Document
        </a>
      </div>

      <div className={repoStyles.filterBar}>
        <select className={repoStyles.filterSelect} defaultValue="">
          <option value="" disabled>
            Filter by Region
          </option>
          {PHILIPPINE_REGIONS_SHORT.map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>

        <select className={repoStyles.filterSelect} defaultValue="">
          <option value="" disabled>
            Subject Area
          </option>
          <option value="Physics">Physics</option>
          <option value="Mathematics">Mathematics</option>
          <option value="General Science">General Science</option>
        </select>

        <input
          type="search"
          placeholder="Search keywords, authors, or topics..."
          className={repoStyles.searchInput}
        />
      </div>

      {uploaded === '1' ? (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(34, 139, 58, 0.3)' }}>
          <h3 style={{ marginBottom: '0.25rem' }}>Document submitted for approval</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Your upload is now pending admin review and will appear in the repository after approval.
          </p>
        </div>
      ) : null}

      <div className={repoStyles.grid}>
        {resources.length === 0 ? (
          <div className="card">
            <h3>No documents yet</h3>
            <p>Upload the first research or extension document to start the library.</p>
          </div>
        ) : (
          resources.map((project) => (
            <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={repoStyles.cardHeader}>
                <span className={repoStyles.tag}>Document</span>
                <span className={repoStyles.regionBadge}>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className={repoStyles.projectTitle}>{project.title}</h3>
              <p className={repoStyles.projectAbstract}>{project.description || 'No description provided.'}</p>

              <div className={repoStyles.cardFooter}>
                <div className={repoStyles.authorInfo}>
                  <div className={repoStyles.avatar}>
                    {getAvatarByName(project.author_name) ? (
                      <Image
                        src={getAvatarByName(project.author_name) as string}
                        alt={project.author_name}
                        fill
                        sizes="36px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : null}
                  </div>
                  <div className={repoStyles.authorDetails}>
                    <Link href={`/profile/${project.author_id}`} className={repoStyles.authorProfileLink}>
                      <strong>{project.author_name}</strong>
                    </Link>
                    <span>{project.file_name}</span>
                  </div>
                </div>
                <Link href={`/api/documents/${project.id}`} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Download
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

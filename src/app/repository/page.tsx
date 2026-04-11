import Link from 'next/link';
import Image from 'next/image';
import repoStyles from './repository.module.css';
import { getCurrentUser } from '@/lib/auth';
import { deleteResourceAction } from '@/app/actions/community';
import { getResources } from '@/lib/community';
import {
  REGION_DISPLAY_NAMES,
  REGISTRATION_REGIONS,
  RESOURCE_SUBJECT_AREAS,
} from '@/lib/constants';
import { formatDateTimeNoSeconds } from '@/lib/date-format';
import AIRepositorySearch from '@/components/AIRepositorySearch';

type PageProps = {
  searchParams: Promise<{ uploaded?: string; removedResource?: string; region?: string; subject?: string; q?: string }>;
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
  const { uploaded, removedResource, region, subject, q } = await searchParams;
  const [resources, user] = await Promise.all([getResources(), getCurrentUser()]);
  const selectedRegion = REGISTRATION_REGIONS.includes(region as (typeof REGISTRATION_REGIONS)[number]) ? region : '';
  const selectedSubject = RESOURCE_SUBJECT_AREAS.includes(subject as (typeof RESOURCE_SUBJECT_AREAS)[number]) ? subject : '';
  const searchTerm = String(q ?? '').trim().toLowerCase();

  const filteredResources = resources.filter((project) => {
    if (selectedRegion && project.region !== selectedRegion) {
      return false;
    }

    if (selectedSubject && project.subject_area !== selectedSubject) {
      return false;
    }

    if (!searchTerm) {
      return true;
    }

    const searchable = [
      project.title,
      project.description ?? '',
      project.author_name,
      project.subject_area,
      project.resource_type,
      project.grade_level,
      ...(project.keywords ?? []),
    ]
      .join(' ')
      .toLowerCase();

    return searchable.includes(searchTerm);
  });

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

      <form className={repoStyles.filterBar} method="get">
        <select className={repoStyles.filterSelect} name="region" defaultValue={selectedRegion}>
          <option value="">All Regions</option>
          {REGISTRATION_REGIONS.map((optionRegion) => (
            <option key={optionRegion} value={optionRegion}>{REGION_DISPLAY_NAMES[optionRegion] ?? optionRegion}</option>
          ))}
        </select>

        <select className={repoStyles.filterSelect} name="subject" defaultValue={selectedSubject}>
          <option value="">All Subject Areas</option>
          {RESOURCE_SUBJECT_AREAS.map((subjectArea) => (
            <option key={subjectArea} value={subjectArea}>{subjectArea}</option>
          ))}
        </select>

        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search keywords, authors, or topics..."
          className={repoStyles.searchInput}
        />

        <div className={repoStyles.filterActions}>
          <button type="submit" className="btn btn-primary">Apply</button>
          <Link href="/repository" className="btn btn-secondary">Reset</Link>
        </div>
      </form>

      {uploaded === '1' ? (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(34, 139, 58, 0.3)' }}>
          <h3 style={{ marginBottom: '0.25rem' }}>Document submitted for approval</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Your upload is now pending admin review and will appear in the repository after approval.
          </p>
        </div>
      ) : null}

      {removedResource === '1' ? (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(220, 38, 38, 0.25)' }}>
          <h3 style={{ marginBottom: '0.25rem' }}>Resource removed</h3>
          <p style={{ color: 'var(--text-muted)' }}>The selected research or extension resource was removed by an admin moderator.</p>
        </div>
      ) : null}

      <AIRepositorySearch />

      <div className={repoStyles.grid}>
        {filteredResources.length === 0 ? (
          <div className="card">
            <h3>No matching documents</h3>
            <p>Try changing your filters or upload a new research or extension document.</p>
          </div>
        ) : (
          filteredResources.map((project) => (
            <div
              key={project.id}
              id={`resource-${project.id}`}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', scrollMarginTop: '6.5rem' }}
            >
              <div className={repoStyles.cardHeader}>
                <span className={repoStyles.tag}>{project.resource_type}</span>
                <span className={repoStyles.regionBadge}>{formatDateTimeNoSeconds(project.created_at)}</span>
              </div>
              <h3 className={repoStyles.projectTitle}>{project.title}</h3>
              <p className={repoStyles.projectAbstract}>{project.description || 'No description provided.'}</p>

              <div className={repoStyles.tagsWrap}>
                <span className={repoStyles.metaTag}>{REGION_DISPLAY_NAMES[project.region] ?? project.region}</span>
                <span className={repoStyles.metaTag}>{project.subject_area}</span>
                <span className={repoStyles.metaTag}>{project.grade_level}</span>
                {(project.keywords ?? []).slice(0, 3).map((keyword) => (
                  <span key={keyword} className={repoStyles.metaTag}>{keyword}</span>
                ))}
              </div>

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
                <div className={repoStyles.cardActions}>
                  <Link href={`/api/documents/${project.id}`} className={`btn btn-primary ${repoStyles.cardActionBtn}`}>
                    Download
                  </Link>
                  {user?.role === 'admin' ? (
                    <form action={deleteResourceAction} className={repoStyles.inlineActionForm}>
                      <input type="hidden" name="resourceId" value={project.id} />
                      <input
                        type="hidden"
                        name="returnTo"
                        value={`/repository?${new URLSearchParams({
                          ...(selectedRegion ? { region: selectedRegion } : {}),
                          ...(selectedSubject ? { subject: selectedSubject } : {}),
                          ...(q ? { q: String(q) } : {}),
                        }).toString()}`}
                      />
                      <button type="submit" className={`btn btn-secondary ${repoStyles.cardActionBtn}`}>Remove</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

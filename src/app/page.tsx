import homeStyles from './page.module.css';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={homeStyles.pageContainer}>
      {/* Hero Section */}
      <section className={homeStyles.hero}>
        <div className={homeStyles.heroContent}>
          <h1 className={homeStyles.title}>
            Turning Isolated Innovations Into <span className={homeStyles.highlight}>National Assets.</span>
          </h1>
          <p className={homeStyles.subtitle}>
            Connect, collaborate, and share impactful Action Research and Extension Projects with STEM educators across the Philippines. This platform enriches the e-STAR.ph static repository with a dynamic social layer.
          </p>
          <div className={homeStyles.ctaGroup}>
            <Link href="/repository" className="btn btn-primary">
              Browse Research
            </Link>
            <Link href="/forum" className="btn btn-secondary">
              Join the Discussion
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className={homeStyles.featureSection}>
        <h2 className={homeStyles.sectionTitle}>Platform Highlights</h2>
        <div className={homeStyles.featureGrid}>
          
          <div className="card">
            <h3>Action Research DB</h3>
            <p>Upload your local findings, download methodologies, and tag entries by subject and region to facilitate impactful national search operations.</p>
          </div>
          
          <div className="card">
            <h3>Regional Forums</h3>
            <p>Engage with localized communities. Share pedagogical challenges, implementation tips, and mentorship opportunities tailored to your division.</p>
          </div>

          <div className="card">
            <h3>Teacher Heatmaps</h3>
            <p>Analyze an integrated map generating accurate regional profiles of STEM teachers highlighting specializations, demographics, and identifying underserved areas.</p>
          </div>
          
        </div>
      </section>
      
      {/* Stats Callout (Admin insight preview) */}
      <section className={`${homeStyles.statsCallout} glass`}>
        <div className={homeStyles.statCard}>
          <h4>340+</h4>
          <p>Active Educators</p>
        </div>
        <div className={homeStyles.statCard}>
          <h4>1,200+</h4>
          <p>Resources Shared</p>
        </div>
        <div className={homeStyles.statCard}>
          <h4>17</h4>
          <p>Active Regional Hubs</p>
        </div>
      </section>
    </div>
  );
}

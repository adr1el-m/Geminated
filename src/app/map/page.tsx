'use client';

import dynamic from 'next/dynamic';
import mapStyles from './map.module.css';

// Dynamically import Map to prevent SSR errors with Leaflet accessing window
const MapWithNoSSR = dynamic(() => import('@/components/MapWrapper'), {
  ssr: false,
  loading: () => <div className={mapStyles.loadingMap}>Loading Regional Data...</div>
});

export default function RegionalMapPage() {
  return (
    <div className={mapStyles.pageContainer}>
      <div className={mapStyles.header}>
        <h1 className={mapStyles.title}>Regional Teacher Profile Map</h1>
        <p className={mapStyles.subtitle}>
          Integrated data system generating accurate regional profiles of science and mathematics teachers. 
          Identify underserved areas and generate actionable insights to inform strategic delivery of STAR programs.
        </p>
      </div>

      <div className={mapStyles.contentGrid}>
        <div className={`${mapStyles.mapContainer} card`}>
          <MapWithNoSSR />
        </div>

        <div className={mapStyles.sidebar}>
          <div className="card">
            <h3 className={mapStyles.sidebarTitle}>Actionable Insights</h3>
            <ul className={mapStyles.insightList}>
              <li className={mapStyles.critical}>
                <strong>BARMM Needs Intervention</strong>
                <p>Only 20 active teachers mapped with low average experience. Recommend priority for upcoming STAR capacity-building batch.</p>
              </li>
              <li className={mapStyles.warning}>
                <strong>CAR Specialization Gap</strong>
                <p>High demand for Math resources, but 80% of teachers are Science-focused. Subsidize Mathematics Action Research formulation.</p>
              </li>
              <li className={mapStyles.stable}>
                <strong>Region III Mentorship Ready</strong>
                <p>High concentration of 10+ year teachers. Potential candidates to mentor CAR and Region VIII educators.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

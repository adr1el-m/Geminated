// This component must be dynamically imported with ssr: false
'use client';

import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngBoundsExpression } from 'leaflet';
import mapStyles from '@/app/map/map.module.css';

type Severity = 'low' | 'medium' | 'high' | 'critical';

function WarningIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d="M12 3 2 21h20L12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

// Mock regional data points based on Challenge Statement
const regionsData = [
  { id: 1, name: 'Region I', position: [16.037, 120.334] as [number, number], teachers: 120, avgExperience: 8, severity: 'low' },
  { id: 2, name: 'CAR', position: [17.351, 121.171] as [number, number], teachers: 45, avgExperience: 5, severity: 'high' },
  { id: 3, name: 'Region III', position: [15.485, 120.712] as [number, number], teachers: 210, avgExperience: 10, severity: 'low' },
  { id: 4, name: 'BARMM', position: [7.213, 124.246] as [number, number], teachers: 20, avgExperience: 3, severity: 'critical' },
  { id: 5, name: 'Region VIII', position: [11.968, 125.043] as [number, number], teachers: 60, avgExperience: 6, severity: 'medium' },
] as const;

const PHILIPPINES_BOUNDS: LatLngBoundsExpression = [
  [4.3, 117.0],
  [21.4, 126.95],
];

const severityColors: Record<Severity, string> = {
  low: '#15803d',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
};

export default function MapWrapper() {
  return (
    <MapContainer
      bounds={PHILIPPINES_BOUNDS}
      maxBounds={PHILIPPINES_BOUNDS}
      maxBoundsViscosity={1}
      minZoom={5}
      maxZoom={10}
      zoomSnap={0.5}
      preferCanvas
      style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        noWrap
      />
      
      {regionsData.map(region => {
        const color = severityColors[region.severity];
        
        // Radius based on teacher count
        const radius = Math.max(10, Math.min(region.teachers / 5, 40));

        return (
          <CircleMarker
            key={region.id}
            center={region.position}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.56,
              weight: 2,
            }}
            radius={radius}
          >
            <Popup className={mapStyles.regionPopup}>
              <div className={mapStyles.popupContent}>
                <h3 className={mapStyles.popupTitle}>{region.name} Area</h3>
                <p className={mapStyles.popupMetric}><strong>Registered STEM Teachers:</strong> {region.teachers}</p>
                <p className={mapStyles.popupMetric}><strong>Avg. Qualification Exp:</strong> {region.avgExperience} yrs</p>
                {region.severity === 'critical' ? (
                  <p className={`${mapStyles.popupTag} ${mapStyles.tagCritical}`}>
                    <WarningIcon />
                    Highly Underserved Area (Target for STAR program)
                  </p>
                ) : (
                  <p className={`${mapStyles.popupTag} ${mapStyles.tagStable}`}>
                    Stable participation
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

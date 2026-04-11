// This component must be dynamically imported with ssr: false
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Popup, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngBoundsExpression } from 'leaflet';
import mapStyles from '@/app/map/map.module.css';
import {
  geometryToLeafletPositions,
  shapeNameToRegionCode,
  type GeoBoundaryFeatureCollection,
  type LeafletPolygonPositions,
} from '@/lib/map-boundaries';

type Severity = 'low' | 'medium' | 'high' | 'critical';

type ChoroplethMetric = 'teacherDensity' | 'averageExperience' | 'underservedScore';

type RegionMapPoint = {
  region: string;
  displayName: string;
  teacherCount: number;
  teacherDensity: number;
  averageExperience: number;
  underservedScore: number;
  expectedDivisions: number;
  divisionCoverageRate: number;
  severity: Severity;
  highlights: string[];
};

type MapWrapperProps = {
  regions: RegionMapPoint[];
  activeMetric: ChoroplethMetric;
  activeTimeLabel: string;
  selectedRegion?: string | null;
  onRegionSelect?: (region: string) => void;
};

function WarningIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d="M12 3 2 21h20L12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

const PHILIPPINES_BOUNDS: LatLngBoundsExpression = [
  [3.2, 115.8],
  [23.9, 127.8],
];

function getMetricValue(region: RegionMapPoint, metric: ChoroplethMetric) {
  if (metric === 'teacherDensity') {
    return region.teacherDensity;
  }

  if (metric === 'averageExperience') {
    return region.averageExperience;
  }

  return region.underservedScore;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getChoroplethColor(metric: ChoroplethMetric, normalizedValue: number) {
  const value = clamp(normalizedValue, 0, 1);

  if (metric === 'underservedScore') {
    if (value >= 0.66) return '#b42318';
    if (value >= 0.33) return '#d97706';
    return '#2e7d32';
  }

  if (value >= 0.66) return '#2e7d32';
  if (value >= 0.33) return '#f9a825';
  return '#b71c1c';
}

export default function MapWrapper({
  regions,
  activeMetric,
  activeTimeLabel,
  selectedRegion = null,
  onRegionSelect,
}: MapWrapperProps) {
  const [boundaryByRegion, setBoundaryByRegion] = useState<Record<string, LeafletPolygonPositions>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
          setTheme(newTheme || 'light');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    
    // Initial check
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
    if (currentTheme) setTheme(currentTheme);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadBoundaries() {
      try {
        const response = await fetch('/data/philippines-adm1.geojson', { cache: 'force-cache' });

        if (!response.ok) {
          throw new Error('Unable to load Philippine regional boundaries.');
        }

        const data = (await response.json()) as GeoBoundaryFeatureCollection;
        const nextBoundaryByRegion: Record<string, LeafletPolygonPositions> = {};

        for (const feature of data.features ?? []) {
          const regionCode = shapeNameToRegionCode(feature.properties?.shapeName ?? '');

          if (!regionCode) {
            continue;
          }

          const positions = geometryToLeafletPositions(feature.geometry);

          if (!positions) {
            continue;
          }

          nextBoundaryByRegion[regionCode] = positions;
        }

        if (isActive) {
          setBoundaryByRegion(nextBoundaryByRegion);
        }
      } catch {
        if (isActive) {
          setBoundaryByRegion({});
        }
      }
    }

    loadBoundaries();

    return () => {
      isActive = false;
    };
  }, []);

  const metricValues = regions.map((item) => getMetricValue(item, activeMetric));
  const metricMin = metricValues.length > 0 ? Math.min(...metricValues) : 0;
  const metricMax = metricValues.length > 0 ? Math.max(...metricValues) : 1;
  const metricRange = Math.max(0.0001, metricMax - metricMin);
  const regionsWithBoundaries = useMemo(() => {
    return regions.filter((region) => Boolean(boundaryByRegion[region.region]));
  }, [regions, boundaryByRegion]);

  return (
    <MapContainer
      bounds={PHILIPPINES_BOUNDS}
      boundsOptions={{ padding: [24, 24] }}
      maxBounds={PHILIPPINES_BOUNDS}
      maxBoundsViscosity={0.6}
      minZoom={5}
      maxZoom={10}
      zoomSnap={0.5}
      preferCanvas
      style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url={theme === 'dark' 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        }
        noWrap
      />

      {regionsWithBoundaries.map((region) => {
        const positions = boundaryByRegion[region.region];

        if (!positions) {
          return null;
        }

        const metricValue = getMetricValue(region, activeMetric);
        const normalizedValue = (metricValue - metricMin) / metricRange;
        const borderColor = getChoroplethColor(activeMetric, normalizedValue);
        const isSelected = selectedRegion === region.region;
        const borderWeight = region.severity === 'critical'
          ? 2.8
          : region.severity === 'high'
            ? 2.4
            : 1.9;

        return (
          <Polygon
            key={region.region}
            positions={positions}
            pathOptions={{
              color: borderColor,
              fillColor: borderColor,
              fillOpacity: isSelected ? 0.18 : 0.08,
              weight: isSelected ? borderWeight + 0.8 : borderWeight,
              opacity: isSelected ? 1 : 0.95,
            }}
            eventHandlers={{
              click: () => {
                onRegionSelect?.(region.region);
              },
            }}
          >
            <Tooltip permanent direction="center" className={mapStyles.regionLabel}>
              {region.region}
            </Tooltip>
            <Popup
              className={mapStyles.regionPopup}
              autoPan
              autoPanPaddingTopLeft={[24, 96]}
              autoPanPaddingBottomRight={[24, 24]}
            >
              <div className={mapStyles.popupContent}>
                <h3 className={mapStyles.popupTitle}>{region.displayName}</h3>
                <p className={mapStyles.popupMetric}><strong>Time Slice:</strong> {activeTimeLabel}</p>
                <p className={mapStyles.popupMetric}><strong>Registered STEM Teachers:</strong> {region.teacherCount}</p>
                <p className={mapStyles.popupMetric}><strong>Teacher Density:</strong> {region.teacherDensity} teachers/division</p>
                <p className={mapStyles.popupMetric}><strong>Avg. Teaching Experience:</strong> {region.averageExperience} yrs</p>
                <p className={mapStyles.popupMetric}><strong>Underserved Score:</strong> {region.underservedScore}</p>
                <p className={mapStyles.popupMetric}><strong>Division Coverage:</strong> {region.divisionCoverageRate}%</p>
                {region.highlights.length > 0 ? (
                  <p className={mapStyles.popupMetric}><strong>Signals:</strong> {region.highlights.slice(0, 2).join('; ')}</p>
                ) : null}
                {region.severity === 'critical' || region.severity === 'high' ? (
                  <p className={`${mapStyles.popupTag} ${mapStyles.tagCritical}`}>
                    <WarningIcon />
                    Priority intervention area
                  </p>
                ) : (
                  <p className={`${mapStyles.popupTag} ${mapStyles.tagStable}`}>
                    Monitor and sustain support
                  </p>
                )}
              </div>
            </Popup>
          </Polygon>
        );
      })}

    </MapContainer>
  );
}

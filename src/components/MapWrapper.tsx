// This component must be dynamically imported with ssr: false
'use client';

import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

function WarningIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d="M12 3 2 21h20L12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

// Fix for default Leaflet markers in Next.js
const customMarker = new L.Icon({
  iconUrl: '/img/marker-icon.png',
  iconRetinaUrl: '/img/marker-icon-2x.png',
  shadowUrl: '/img/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Mock regional data points based on Challenge Statement
const regionsData = [
  { id: 1, name: 'Region I', position: [16.037, 120.334] as [number, number], teachers: 120, avgExperience: 8, severity: 'low' },
  { id: 2, name: 'CAR', position: [17.351, 121.171] as [number, number], teachers: 45, avgExperience: 5, severity: 'high' },
  { id: 3, name: 'Region III', position: [15.485, 120.712] as [number, number], teachers: 210, avgExperience: 10, severity: 'low' },
  { id: 4, name: 'BARMM', position: [7.213, 124.246] as [number, number], teachers: 20, avgExperience: 3, severity: 'critical' },
  { id: 5, name: 'Region VIII', position: [11.968, 125.043] as [number, number], teachers: 60, avgExperience: 6, severity: 'medium' },
];

export default function MapWrapper() {
  
  // Set default marker icon (fixes missing icons in prod/dev)
  useEffect(() => {
    L.Marker.prototype.options.icon = customMarker;
  }, []);

  return (
    <MapContainer 
      center={[12.8797, 121.7740]} 
      zoom={6} 
      style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {regionsData.map(region => {
        // Color code based on severity/underserved areas
        let color = '#15803d'; // Green - well served
        if (region.severity === 'medium') color = '#f59e0b'; // Gold
        if (region.severity === 'high') color = '#ef4444'; // Red
        if (region.severity === 'critical') color = '#7f1d1d'; // Dark Red
        
        // Radius based on teacher count
        const radius = Math.max(10, Math.min(region.teachers / 5, 40));

        return (
          <CircleMarker
            key={region.id}
            center={region.position}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.6 }}
            radius={radius}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter' }}>
                <h3 style={{ margin: '0 0 5px 0', color: 'var(--institutional-blue)' }}>{region.name} Area</h3>
                <p style={{ margin: 0, fontSize: '13px' }}><strong>Registered STEM Teachers:</strong> {region.teachers}</p>
                <p style={{ margin: 0, fontSize: '13px' }}><strong>Avg. Qualification Exp:</strong> {region.avgExperience} yrs</p>
                {region.severity === 'critical' ? (
                  <p
                    style={{
                      margin: '5px 0 0 0',
                      fontSize: '12px',
                      color: '#ef4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <WarningIcon />
                    Highly Underserved Area (Target for STAR program)
                  </p>
                ) : (
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'gray' }}>
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

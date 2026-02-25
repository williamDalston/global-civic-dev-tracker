'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapNeighborhood {
  name: string;
  slug: string;
  centerLat: number | null;
  centerLng: number | null;
  permitCount: number;
}

interface NeighborhoodMapProps {
  neighborhoods: MapNeighborhood[];
  center: [number, number];
  zoom?: number;
  height?: string;
  baseUrl: string;
}

export function NeighborhoodMap({
  neighborhoods,
  center,
  zoom = 12,
  height = '400px',
  baseUrl,
}: NeighborhoodMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    const withCoords = neighborhoods.filter(
      (n): n is MapNeighborhood & { centerLat: number; centerLng: number } =>
        n.centerLat != null && n.centerLng != null
    );

    const maxCount = Math.max(...withCoords.map((n) => n.permitCount), 1);

    for (const hood of withCoords) {
      const radius = 8 + (hood.permitCount / maxCount) * 24;
      const opacity = 0.4 + (hood.permitCount / maxCount) * 0.4;

      const circle = L.circleMarker([hood.centerLat, hood.centerLng], {
        radius,
        fillColor: '#3b82f6',
        fillOpacity: opacity,
        color: '#2563eb',
        weight: 2,
      }).addTo(map);

      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const popup = `
        <div style="font-family:system-ui;font-size:13px;text-align:center;">
          <strong>${esc(hood.name)}</strong><br/>
          ${hood.permitCount.toLocaleString()} permits<br/>
          <a href="${esc(baseUrl)}/${esc(hood.slug)}" style="color:#3b82f6;">Explore →</a>
        </div>
      `;
      circle.bindPopup(popup);
    }

    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(
        withCoords.map((n) => [n.centerLat, n.centerLng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [neighborhoods, baseUrl]);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div ref={mapRef} style={{ height, width: '100%' }} />
      <div className="border-t border-border bg-card px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Circle size represents relative permit volume. Click a neighborhood to explore.
        </p>
      </div>
    </div>
  );
}

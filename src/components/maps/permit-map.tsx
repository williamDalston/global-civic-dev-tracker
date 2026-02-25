'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CATEGORY_COLORS: Record<string, string> = {
  'new-construction': '#22c55e',
  renovation: '#3b82f6',
  demolition: '#ef4444',
  electrical: '#f59e0b',
  plumbing: '#06b6d4',
  hvac: '#8b5cf6',
  roofing: '#ec4899',
  mechanical: '#6366f1',
  'fire-safety': '#f97316',
  signage: '#14b8a6',
  other: '#6b7280',
  general: '#6b7280',
};

function markerColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#6b7280';
}

function createCircleIcon(color: string) {
  return L.divIcon({
    html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid rgba(255,255,255,0.8);box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

export interface MapPermit {
  id: number;
  latitude: number;
  longitude: number;
  propertyAddress: string;
  permitCategory: string;
  status: string;
  slug: string;
  estimatedCost?: string | number | null;
}

interface PermitMapProps {
  permits: MapPermit[];
  center: [number, number];
  zoom?: number;
  height?: string;
  baseUrl?: string;
}

export function PermitMap({
  permits,
  center,
  zoom = 13,
  height = '400px',
  baseUrl,
}: PermitMapProps) {
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

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add permit markers
    for (const permit of permits) {
      const color = markerColor(permit.permitCategory);
      const icon = createCircleIcon(color);

      const cost = permit.estimatedCost
        ? `$${Number(permit.estimatedCost).toLocaleString()}`
        : 'N/A';

      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const popupContent = `
        <div style="font-family:system-ui;font-size:13px;max-width:220px;">
          <strong>${esc(permit.propertyAddress)}</strong><br/>
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;"></span>
          ${esc(permit.permitCategory.replace(/-/g, ' '))}<br/>
          <span style="color:#666;">Est. cost: ${esc(cost)}</span>
          ${baseUrl ? `<br/><a href="${esc(baseUrl)}/${esc(permit.slug)}" style="color:#3b82f6;">View details →</a>` : ''}
        </div>
      `;

      L.marker([permit.latitude, permit.longitude], { icon })
        .bindPopup(popupContent)
        .addTo(map);
    }

    // Fit bounds if we have markers
    if (permits.length > 0) {
      const bounds = L.latLngBounds(
        permits.map((p) => [p.latitude, p.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [permits, baseUrl]);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div ref={mapRef} style={{ height, width: '100%' }} />
      {permits.length > 0 && (
        <div className="flex flex-wrap gap-3 border-t border-border bg-card px-4 py-2">
          {Object.entries(CATEGORY_COLORS)
            .filter(([cat]) => permits.some((p) => p.permitCategory === cat))
            .map(([cat, color]) => (
              <span key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                />
                {cat.replace(/-/g, ' ')}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

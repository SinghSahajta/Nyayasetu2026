'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { inIndia } from '@/lib/geo';

export interface LatLng { lat: number; lng: number }

// A plain CSS pin, so we don't depend on Leaflet's bundled marker images.
const pin = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#4338ca;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

const INDIA_CENTER: LatLng = { lat: 22.5, lng: 79 };

// Pins outside India are refused (the API enforces it too); onOutside lets the form say so.
function ClickToPlace({ onChange, onOutside }: { onChange: (p: LatLng) => void; onOutside?: () => void }) {
  useMapEvents({
    click: (e) => (inIndia(e.latlng.lat, e.latlng.lng) ? onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) : onOutside?.()),
  });
  return null;
}

function FlyTo({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [value, map]);
  return null;
}

/** Click the map or drag the pin to set the issue location. */
export default function LocationPicker({ value, onChange, onOutside }: { value: LatLng | null; onChange: (p: LatLng) => void; onOutside?: () => void }) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : [INDIA_CENTER.lat, INDIA_CENTER.lng]}
      zoom={value ? 17 : 5}
      className="h-72 w-full rounded-lg border border-gray-300 z-0"
      scrollWheelZoom={false}
      minZoom={4}
      maxBounds={[[5, 67], [38.5, 98.5]]}
      maxBoundsViscosity={1}
    >
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickToPlace onChange={onChange} onOutside={onOutside} />
      <FlyTo value={value} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pin}
          draggable
          eventHandlers={{ dragend: (e) => { const m = e.target as L.Marker; const p = m.getLatLng(); if (inIndia(p.lat, p.lng)) onChange({ lat: p.lat, lng: p.lng }); else { onOutside?.(); if (value) m.setLatLng([value.lat, value.lng]); } } }}
        />
      )}
    </MapContainer>
  );
}

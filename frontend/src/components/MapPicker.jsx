import { useEffect, useRef, useState } from 'react';

// Simple MapPicker that loads Leaflet from CDN and allows the user to click to pick a point.
// Props: open (bool), onClose(), onSelect({ lat, lng, address })
export default function MapPicker({ open, onClose, onSelect, initial }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(initial || null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const ensureLeaflet = async () => {
      if (!window.L) {
        // Load CSS
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
        // Load script
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      if (cancelled) return;

      // init map
      const L = window.L;
      // If the map exists (e.g., reopening), remove it and create a fresh instance to avoid blank tiles
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (e) {}
        mapRef.current = null;
        markerRef.current = null;
      }

      mapRef.current = L.map(containerRef.current).setView(initial ? [initial.lat, initial.lng] : [8.9475, 125.5406], 13);
      L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps'
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setPicked({ lat, lng });
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      });

      if (initial) {
        markerRef.current = L.marker([initial.lat, initial.lng]).addTo(mapRef.current);
      }

      setLoading(false);
    };

    ensureLeaflet().catch((e) => {
      console.error('Failed to load leaflet', e);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      try {
        if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      } catch (e) {}
    };
  }, [open, initial]);

  const handleConfirm = async () => {
    if (!picked) return;
    // Try reverse geocode via Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${picked.lat}&lon=${picked.lng}`);
      const data = await res.json();
      const address = data.display_name || '';
      onSelect({ lat: picked.lat, lng: picked.lng, address });
    } catch (e) {
      onSelect({ lat: picked.lat, lng: picked.lng, address: '' });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-navy-900 rounded-lg w-[90%] max-w-3xl p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Pick delivery location</h3>
        <div ref={containerRef} className="w-full h-72 rounded bg-gray-800 overflow-hidden" />
        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={handleConfirm} disabled={!picked} className="btn-primary">Confirm Location</button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { MapPin, Copy, ExternalLink } from 'lucide-react';

// Read-only map viewer modal
// Props: open (bool), onClose(), initial { lat, lng, address }
export default function MapViewer({ open, onClose, initial }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Cleanup function will remove map when modal closes so it can be recreated
    const ensureLeaflet = async () => {
      if (!window.L) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      if (cancelled) return;
      const L = window.L;
      if (!mapRef.current && containerRef.current && initial && initial.lat && initial.lng) {
        mapRef.current = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView([initial.lat, initial.lng], 15);
        L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { attribution: '&copy; Google Maps' }).addTo(mapRef.current);
        markerRef.current = L.marker([initial.lat, initial.lng]).addTo(mapRef.current);
      } else if (mapRef.current && initial && initial.lat && initial.lng) {
        // If map already exists (rare), update marker and view
        try {
          mapRef.current.setView([initial.lat, initial.lng], 15);
          if (markerRef.current) markerRef.current.setLatLng([initial.lat, initial.lng]);
          else markerRef.current = L.marker([initial.lat, initial.lng]).addTo(mapRef.current);
          // invalidate size in case container was hidden
          setTimeout(() => { try { mapRef.current.invalidateSize(); } catch (e) {} }, 50);
        } catch (e) {
          // ignore
        }
      }

      setLoading(false);
    };

    ensureLeaflet().catch((e) => {
      console.error('Failed to load leaflet', e);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      // Clean up Leaflet map to prevent stale containers causing blank map on reopen
      try {
        if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      } catch (e) {}
    };
  }, [open, initial]);

  if (!open) return null;

  const copyAddress = () => {
    if (!initial?.address) return;
    navigator.clipboard?.writeText(initial.address);
  };

  const openMaps = () => {
    if (initial?.lat && initial?.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${initial.lat},${initial.lng}`, '_blank');
    } else if (initial?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(initial.address)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-navy-900 rounded-lg w-[90%] max-w-2xl p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery Location</h3>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-white">Close</button>
        </div>

        {initial?.lat && initial?.lng ? (
          <div>
            <div ref={containerRef} className="w-full h-64 rounded bg-gray-800 overflow-hidden mt-3" />
          </div>
        ) : (
          <div className="w-full h-64 rounded bg-gray-800 overflow-hidden mt-3 flex items-center justify-center text-gray-400">No coordinates to preview on map</div>
        )}

        <div className="mt-3 bg-navy-950 p-3 rounded">
          <div className="text-sm text-gray-400 mb-2">Address</div>
          <div className="text-sm text-white break-words">{initial?.address || 'No address available'}</div>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => { copyAddress(); }} className="btn-outline py-1 px-3 flex items-center gap-2"><Copy className="w-4 h-4" /> Copy</button>
            <button onClick={openMaps} className="btn-primary py-1 px-3 flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Open in Maps</button>
            <div className="ml-auto text-xs text-gray-400">{initial?.lat && initial?.lng ? `Coords: ${initial.lat.toFixed(5)}, ${initial.lng.toFixed(5)}` : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

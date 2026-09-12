import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import api from "../../services/api";

// react-leaflet's default marker icon URLs break under bundlers like Vite —
// point them at the CDN-hosted assets instead of relying on webpack's
// asset-loader behavior, which Vite doesn't replicate the same way.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const INDIA_CENTER = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

function inputClass() {
  return "w-full rounded-md border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none";
}

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ initialAddress = "", onChange }) {
  const [marker, setMarker] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [resolvedName, setResolvedName] = useState("");
  const [resolveError, setResolveError] = useState("");
  const [address, setAddress] = useState(initialAddress);

  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);

  async function handleMapClick(lat, lon) {
    setMarker({ lat, lon });
    setResolving(true);
    setResolveError("");
    setResolvedName("");
    try {
      const res = await api.post("/api/v1/geocode/reverse", { lat, lon });
      setResolvedName(res.data.display_name);
      onChange({ mode: "coords", lat, lon, display_name: res.data.display_name });
    } catch {
      setResolveError("Could not resolve a name for this location, but the coordinates are saved.");
      onChange({ mode: "coords", lat, lon, display_name: null });
    } finally {
      setResolving(false);
    }
  }

  function handleAddressChange(value) {
    setAddress(value);
    setMarker(null);
    setResolvedName("");
    setResolveError("");
    onChange({ mode: "address", address: value });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border border-border" style={{ height: 260 }}>
        <MapContainer
          center={marker ? [marker.lat, marker.lon] : INDIA_CENTER}
          zoom={marker ? 10 : INDIA_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleMapClick} />
          {marker && <Marker position={[marker.lat, marker.lon]} />}
        </MapContainer>
      </div>

      {marker && (
        <p className="text-xs text-text-secondary">
          {resolving && "Resolving location…"}
          {!resolving && resolvedName && `Resolved to: ${resolvedName}`}
          {!resolving && resolveError && resolveError}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm text-text-secondary" htmlFor="location-address">
          Or type an address
        </label>
        <input
          id="location-address"
          type="text"
          placeholder="City, region, country"
          className={inputClass()}
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Coordinates for Ayacucho, Peru (Historic Center / Plaza Mayor as reference)
// Or a specific location if provided. 
const position: [number, number] = [-13.159495, -74.223841]; 

export default function Map() {
  useEffect(() => {
    // Fix leaflet marker icons issue in React
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // Custom Gold Marker
  const customMarkerHtml = renderToStaticMarkup(
    <div style={{ color: "#d97706", filter: "drop-shadow(0px 4px 6px rgba(0,0,0,0.5))" }}>
      <MapPin size={42} fill="#1c1917" strokeWidth={1.5} />
    </div>
  );

  const customIcon = L.divIcon({
    html: customMarkerHtml,
    className: "",
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42],
  });

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-stone-800">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
        style={{ background: "#0c0a09" }}
      >
        {/* CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={position} icon={customIcon}>
          <Popup className="custom-popup">
            <div className="text-center p-1">
              <h3 className="font-serif font-bold text-stone-900 text-sm">Hotel Kametza</h3>
              <p className="text-xs text-stone-500 mt-1">Tu descanso en Ayacucho</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Map Overlay Vignette for luxury blend */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] z-10" />
    </div>
  );
}

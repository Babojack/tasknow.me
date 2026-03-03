import React from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function RadarMap({ tasks, onTaskClick, center, radius }) {
  const createCustomIcon = (task) => {
    const html = `
      <div style="position: relative;">
        <div style="
          width: 20px;
          height: 20px;
          background: ${task.is_live ? 'black' : 'white'};
          border: 3px solid ${task.is_live ? 'white' : 'black'};
          ${task.is_live ? 'animation: pulse 2s infinite;' : ''}
        "></div>
      </div>
    `;
    return L.divIcon({
      html,
      className: "custom-marker",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <div className="border-4 border-black bg-white overflow-hidden">
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-container {
          background: white !important;
          filter: grayscale(1) contrast(1.2);
        }
        .leaflet-tile-pane {
          opacity: 0.5;
        }
      `}</style>

      {/* Radar Rings */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut",
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black"
            style={{ width: "100px", height: "100px" }}
          />
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <MapController center={center} zoom={13} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* User Location Circle */}
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: "black",
            fillColor: "black",
            fillOpacity: 0.1,
            weight: 2,
            dashArray: "5, 5",
          }}
        />

        {/* User Center Marker */}
        <Marker
          position={center}
          icon={L.divIcon({
            html: '<div style="width: 30px; height: 30px; background: black; border: 3px solid white; border-radius: 50%; animation: pulse 2s infinite;"></div>',
            className: 'custom-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })}
        />

        {/* Task Markers */}
        {tasks.map((task) => (
          <Marker
            key={task.id}
            position={[task.latitude, task.longitude]}
            icon={createCustomIcon(task)}
            eventHandlers={{
              click: () => onTaskClick(task),
            }}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3 space-y-2 text-xs z-20">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border-2 border-black" />
          <span className="font-bold">NORMAL</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-black border-2 border-white" />
          <span className="font-bold">LIVE</span>
        </div>
      </div>
    </div>
  );
}
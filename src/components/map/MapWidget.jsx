import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Zap, Euro, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/i18n/TranslationContext";

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

export default function MapWidget({ tasks, onTaskClick, center, isExpanded, onToggleExpand }) {
  const { t } = useTranslation();
  const createCustomIcon = (task) => {
    const color = task.is_live ? "#dc2626" : "#3b82f6";
    const html = `
      <div style="position: relative;">
        <div style="
          width: 40px;
          height: 40px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          ${task.is_live ? "animation: pulse 2s infinite;" : ""}
        ">
          <span style="color: white; font-size: 20px; font-weight: bold;">
            ${task.is_live ? "⚡" : "📍"}
          </span>
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: "custom-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className={`fixed ${
          isExpanded
            ? "inset-0 z-50"
            : "right-4 top-20 lg:top-4 bottom-24 lg:bottom-4 w-80 lg:w-96 z-40"
        } transition-all duration-300`}
      >
        <Card className="h-full flex flex-col shadow-2xl border-2 border-gray-200 overflow-hidden">
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            .custom-marker {
              background: none;
              border: none;
            }
            .leaflet-container {
              z-index: 0;
            }
          `}</style>

          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-white border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold">{t("taskMap")}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={center}
              zoom={isExpanded ? 13 : 12}
              style={{ width: "100%", height: "100%" }}
            >
              <MapController center={center} zoom={isExpanded ? 13 : 12} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />

              {tasks.map((task) => (
                <Marker
                  key={task.id}
                  position={[task.latitude, task.longitude]}
                  icon={createCustomIcon(task)}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                        {task.is_live && (
                          <Badge className="bg-red-500 text-white ml-2 shrink-0">
                            LIVE
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm font-bold text-green-600">
                          <Euro className="w-4 h-4 mr-1" />
                          {task.is_live
                            ? (task.price * (1 + task.live_premium_percent / 100)).toFixed(2)
                            : task.price.toFixed(2)}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onTaskClick(task)}
                          className="text-xs h-7"
                        >
                          {t("openTask")}
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full" />
                <span>{t("normalTasks")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                <span>{t("liveTasks")}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
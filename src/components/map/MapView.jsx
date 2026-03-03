
import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Zap, Euro, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTranslation } from "@/components/i18n/TranslationContext";

// Fix для иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Define CATEGORY_ICONS for marker display based on task category
const CATEGORY_ICONS = {
  "cleaning": "🧹",
  "repair": "🛠️",
  "delivery": "📦",
  "shopping": "🛒",
  "gardening": "🌾",
  "pet_care": "🐾",
  "tutoring": "📚",
  "tech_support": "💻",
  "assembly": "🔨",
  "other": "✨",
  // Add more categories as needed
};

function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

/**
 * MapView component to display tasks on a Leaflet map.
 * @param {Object} props
 * @param {Array<Object>} props.tasks - List of task objects to display. Each task should have id, latitude, longitude, title, description, price, is_live, live_premium_percent, is_asap, asap_premium_percent, category.
 * @param {Function} props.onTaskClick - Callback function when a task popup button is clicked.
 * @param {Array<number>} props.userLocation - Current user's [latitude, longitude].
 * @param {Function} props.onLocationChange - Callback when user's location is updated.
 * @param {'price' | 'category'} [props.markerDisplay='price'] - Determines what to display on the marker.
 */
export default function MapView({ tasks, onTaskClick, userLocation, onLocationChange, markerDisplay = "price" }) {
  const { t } = useTranslation();
  const defaultCenter = userLocation || [52.520008, 13.404954]; // Berlin as default center
  const [mapCenter, setMapCenter] = React.useState(defaultCenter);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = [position.coords.latitude, position.coords.longitude];
          setMapCenter(newCenter);
          if (onLocationChange) {
            onLocationChange(newCenter);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          // Optionally, show a user-friendly message
          alert("Unable to retrieve your location. Please ensure location services are enabled.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  /**
   * Creates a custom HTML icon for a map marker based on task properties.
   * @param {Object} task - The task object.
   * @returns {L.DivIcon} A Leaflet DivIcon instance.
   */
  const createCustomIcon = (task) => {
    const isAsap = task.is_asap; // Assume task has `is_asap` boolean property
    // Calculate price, applying ASAP premium if applicable.
    // `asap_premium_percent` is assumed to be a number.
    const price = isAsap
      ? (task.price * (1 + (task.asap_premium_percent || 0) / 100)).toFixed(0)
      : task.price.toFixed(0);

    // Determine content based on markerDisplay prop
    const content = markerDisplay === "price"
      ? `€${price}` // Euro sign in front of the price
      : CATEGORY_ICONS[task.category] || "⚡"; // Fallback to "⚡" if category icon not found

    return L.divIcon({
      html: `<div style="
        width: 50px;
        height: 50px;
        background: ${isAsap ? 'black' : 'white'};
        color: ${isAsap ? 'white' : 'black'};
        border: 4px solid ${isAsap ? 'white' : 'black'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: ${markerDisplay === 'price' ? '11px' : '20px'};
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ${isAsap ? 'animation: pulse 2s infinite;' : ''}
      ">${content}</div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      </style>`,
      className: '', // Clear default Leaflet marker class
      iconSize: [50, 50],
      iconAnchor: [25, 25], // Center the icon
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Global styles for Leaflet container.
          The previous custom-marker and pulse animation styles are removed
          as the new icon embeds its own styling directly. */}
      <style>{`
        .leaflet-container {
          z-index: 0;
        }
      `}</style>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        className="rounded-xl"
      >
        <MapController center={mapCenter} zoom={13} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {tasks.map((task) => (
          <Marker
            key={task.id}
            position={[task.latitude, task.longitude]}
            icon={createCustomIcon(task)} // Use the new custom icon
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{task.title}</h3>
                  {task.is_live && (
                    <Badge className="bg-red-500 text-white ml-2">
                      <Zap className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                  )}
                  {/* Display ASAP badge if task is ASAP and not live (live takes precedence) */}
                  {task.is_asap && !task.is_live && (
                    <Badge className="bg-blue-500 text-white ml-2">
                      <Zap className="w-3 h-3 mr-1" />
                      ASAP
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {task.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm font-bold text-green-600">
                    <Euro className="w-4 h-4 mr-1" />
                    {/* Display calculated price for ASAP tasks, otherwise regular price */}
                    {task.is_asap
                      ? (task.price * (1 + (task.asap_premium_percent || 0) / 100)).toFixed(2)
                      : task.price.toFixed(2)}
                    {task.is_live && (
                      <span className="text-xs text-red-600 ml-1">
                        +{task.live_premium_percent}%
                      </span>
                    )}
                    {/* Display ASAP premium percentage if applicable and not live */}
                    {task.is_asap && !task.is_live && (
                      <span className="text-xs text-blue-600 ml-1">
                        +{task.asap_premium_percent}%
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onTaskClick(task)}
                    className="text-xs"
                  >
                    {t("readMore")}
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <Button
        onClick={handleLocateMe}
        className="absolute bottom-4 right-4 z-[1000] rounded-full w-12 h-12 p-0 bg-white hover:bg-gray-50 text-blue-600 shadow-lg"
        aria-label="Locate me"
      >
        <Navigation className="w-5 h-5" />
      </Button>
    </div>
  );
}

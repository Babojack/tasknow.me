
import React, { useState, useEffect } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation } from "@/components/i18n/TranslationContext";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Euro, Tag, RefreshCw, Loader2, ArrowLeft } from "lucide-react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import MapFilters from "../components/map/MapFilters";
import CitySelector from "../components/city/CitySelector";
import AsapPanel from "../components/tasks/AsapPanel";
import TaskCard from "../components/tasks/TaskCard";

const CATEGORY_ICONS = {
  покупки: "🛒",
  доставка: "📦",
  уборка: "🧹",
  ремонт: "🔧",
  переезд: "🚚",
  животные: "🐾",
  обучение: "📚",
  фото_видео: "📷",
  другое: "⚡",
};

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// SONAR-EFFEKT aus dem Standort-Punkt - expandierender Kreis!
function SonarRadarOverlay({ center, radius, isActive }) {
  const map = useMap();
  const [element, setElement] = React.useState(null);

  React.useEffect(() => {
    if (!isActive || !map || !center) return;

    const container = L.DomUtil.create('div', 'sonar-container');
    container.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 1000;
    `;

    const updatePosition = () => {
      if (!center) return;
      const point = map.latLngToContainerPoint(center);
      const size = 300; // Sonar size
      
      container.style.left = `${point.x - size/2}px`;
      container.style.top = `${point.y - size/2}px`;
      container.style.width = `${size}px`;
      container.style.height = `${size}px`;
    };

    // Sonar element
    L.DomUtil.create('div', 'sonar-pulse', container);

    updatePosition();
    map.on('move', updatePosition);
    map.on('zoom', updatePosition);

    map.getPane('overlayPane').appendChild(container);
    setElement(container);

    const timeout = setTimeout(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
      setElement(null);
    }, 2000); // 2 seconds animation

    return () => {
      clearTimeout(timeout);
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
      setElement(null);
    };
  }, [isActive, center, radius, map]);

  return (
    <>
      <style>{`
        .sonar-container {
          position: absolute;
          width: 300px;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sonar-pulse {
          position: absolute;
          width: 6px;
          height: 6px;
          background: transparent;
          border: 2px solid rgba(0, 0, 0, 0.8);
          border-radius: 50%;
          animation: sonarExpand 2s ease-out forwards;
          box-shadow: 
            inset 0 0 25px 5px rgba(0, 0, 0, 0.3),
            0 0 10px 2px rgba(0, 0, 0, 0.5);
        }

        @keyframes sonarExpand {
          0% {
            width: 6px;
            height: 6px;
            opacity: 1;
            border-width: 3px;
          }
          50% {
            opacity: 0.6;
            border-width: 2px;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
            border-width: 1px;
          }
        }
      `}</style>
    </>
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export default function MapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState("Berlin");
  const [mapCenter, setMapCenter] = useState([52.520008, 13.404954]);
  const [userLocation, setUserLocation] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null); // PLZ search location
  const [filterMode, setFilterMode] = useState("gps"); // "gps" or "plz"
  const [radius, setRadius] = useState(5000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markerDisplay, setMarkerDisplay] = useState("price");
  const [postcodeSearch, setPostcodeSearch] = useState("");
  const [postcodeSuggestions, setPostcodeSuggestions] = useState([]);
  const [showPostcodeSuggestions, setShowPostcodeSuggestions] = useState(false);
  const [searchingPostcode, setSearchingPostcode] = useState(false);
  const [sonarActive, setSonarActive] = useState(false);
  const postcodeInputRef = React.useRef(null);
  const [filters, setFilters] = useState({
    asapOnly: false,
    categories: [],
    maxPrice: 200,
    sortBy: "distance",
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  React.useEffect(() => {
    if (user && user.user_type !== "executor") {
      navigate(createPageUrl("CustomerTasks"));
    }
  }, [user, navigate]);

  // GPS STANDORT HOLEN
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log("📍 GPS location:", location.lat, location.lng);
          setUserLocation(location);
          if (!searchLocation) { // Only set map center if no PLZ search is active
            setMapCenter([location.lat, location.lng]);
          }
        },
        (error) => {
          console.log("Geolocation error:", error);
          if (user?.latitude && user?.longitude) {
            setUserLocation({ lat: user.latitude, lng: user.longitude });
            if (!searchLocation) { // Only set map center if no PLZ search is active
              setMapCenter([user.latitude, user.longitude]);
            }
          }
        }
      );
    } else if (user?.latitude && user?.longitude) {
      setUserLocation({ lat: user.latitude, lng: user.longitude });
      if (!searchLocation) { // Only set map center if no PLZ search is active
        setMapCenter([user.latitude, user.longitude]);
      }
    }
  }, [user, searchLocation]); // Added searchLocation to dependencies

  // PLZ SUCHE
  React.useEffect(() => {
    const searchPostcode = async () => {
      const query = postcodeSearch.trim();
      
      if (!query || query.length < 3) {
        setPostcodeSuggestions([]);
        setShowPostcodeSuggestions(false);
        setSearchingPostcode(false);
        return;
      }

      setSearchingPostcode(true);
      
      try {
        const searchQuery = `${query}, Germany`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          setPostcodeSuggestions([]);
          setShowPostcodeSuggestions(false);
          setSearchingPostcode(false);
          return;
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setPostcodeSuggestions(data);
          setShowPostcodeSuggestions(data.length > 0);
        } else {
          setPostcodeSuggestions([]);
          setShowPostcodeSuggestions(false);
        }
      } catch (error) {
        console.error("❌ PLZ SEARCH ERROR:", error);
        setPostcodeSuggestions([]);
        setShowPostcodeSuggestions(false);
      } finally {
        setSearchingPostcode(false);
      }
    };

    const timer = setTimeout(searchPostcode, 1000); // 1 Sekunde Verzögerung
    return () => clearTimeout(timer);
  }, [postcodeSearch]);

  const handleSelectPostcode = (suggestion) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };
    setSearchLocation(location); // Set search location
    setMapCenter([location.lat, location.lng]);
    setPostcodeSearch(suggestion.display_name.split(',')[0]);
    setShowPostcodeSuggestions(false);
    setPostcodeSuggestions([]);
    setFilterMode("plz"); // Switch to PLZ mode
    console.log("🔄 Switched to PLZ mode");
  };

  const handleGetLocation = () => {
    console.log("📍 Get Location Button clicked");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log("✅ GPS location received:", location);
          setUserLocation(location);
          setSearchLocation(null); // Clear search location
          setMapCenter([location.lat, location.lng]);
          setPostcodeSearch(""); // Clear postcode search input
          setFilterMode("gps"); // Switch to GPS mode
          console.log("🔄 Switched to GPS mode");
        },
        (error) => {
          console.error("❌ GPS error:", error);
          alert("Could not get your location. Please check location permissions.");
        }
      );
    } else {
      console.warn("⚠️ Geolocation not supported");
      alert("Your browser does not support geolocation.");
    }
  };

  const getZoomLevel = (radiusMeters) => {
    if (radiusMeters <= 500) return 15;
    if (radiusMeters <= 1000) return 14;
    if (radiusMeters <= 2000) return 13;
    if (radiusMeters <= 3000) return 12;
    if (radiusMeters <= 5000) return 11;
    return 10;
  };

  const currentZoom = getZoomLevel(radius);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const tasks = await demoApi.entities.Task.filter({ status: "open" }, "-created_date");
      return tasks;
    },
    refetchInterval: 5000, // Häufiger aktualisieren
    staleTime: 0,
  });

  // DYNAMISCHE FILTERUNG nach Modus (GPS oder PLZ)
  const filteredTasks = React.useMemo(() => {
    let tasks = [...allTasks];
    tasks = tasks.filter(t => !!(t.latitude && t.longitude));
    
    if (filterMode === "plz" && searchLocation) {
      // PLZ MODE: Aufgaben im Radius von 30km um PLZ anzeigen
      tasks = tasks.filter(task => {
        const distance = calculateDistance(
          searchLocation.lat,
          searchLocation.lng,
          task.latitude,
          task.longitude
        );
        return distance <= 30000; // 30km für PLZ
      });
    } else if (filterMode === "gps" && userLocation) {
      // GPS MODE: Aufgaben im Radius von 20km um GPS anzeigen
      tasks = tasks.filter(task => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          task.latitude,
          task.longitude
        );
        return distance <= 20000; // 20km für GPS
      });
    }
    
    if (filters.asapOnly) {
      tasks = tasks.filter((t) => t.is_asap);
    }
    if (filters.categories && filters.categories.length > 0) {
      tasks = tasks.filter((t) => filters.categories.includes(t.category));
    }
    tasks = tasks.filter((t) => t.price <= filters.maxPrice);
    
    return tasks;
  }, [allTasks, filters, userLocation, searchLocation, filterMode]); // Neue Abhängigkeiten hinzugefügt

  const asapTasks = filteredTasks.filter((t) => t.is_asap);
  
  const handleCitySelect = (city) => {
    setSelectedCity(city.name);
    const location = { lat: city.lat, lng: city.lng };
    setSearchLocation(location); // Stadtauswahl fungiert nun als PLZ-Suche
    setMapCenter([city.lat, city.lng]);
    setFilterMode("plz"); // Wechselt in den PLZ-Modus
    setPostcodeSearch(city.name); // Optional postcodeSearch mit Stadtnamen setzen
  };

  const handleTaskClick = (task) => {
    navigate(createPageUrl("TaskDetail") + `?id=${task.id}`);
  };

  const handleRefresh = () => {
    console.log("🔄 Sonar refresh triggered");
    setSonarActive(true);
    
    setTimeout(() => {
      setSonarActive(false);
    }, 2000); // Entspricht der Sonar-Animationsdauer
  };

  const createCustomIcon = (task) => {
    const isAsap = task.is_asap;
    const price = isAsap 
      ? (task.price * (1 + (task.asap_premium_percent || 0) / 100)).toFixed(0) // Fallback für asap_premium_percent hinzugefügt
      : task.price.toFixed(0);
    
    const content = markerDisplay === "price" 
      ? `${price}€`
      : CATEGORY_ICONS[task.category] || "⚡";

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
        font-size: ${markerDisplay === 'price' ? '12px' : '20px'};
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        ${isAsap ? 'animation: pulse 2s infinite;' : ''}
      ">${content}</div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      </style>`,
      className: '',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-10 h-10 md:w-12 md:h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  // VOLLBILD MODUS
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[200] bg-white">
        {/* Map Container */}
        <div className="w-full h-full relative">
          <MapContainer
            center={mapCenter}
            zoom={currentZoom}
            style={{ width: "100%", height: "100%" }}
            className="grayscale"
            zoomControl={true}
          >
            <MapUpdater center={mapCenter} zoom={currentZoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />

            {/* SONAR WELLEN-EFFEKT */}
            <SonarRadarOverlay 
              center={filterMode === "plz" && searchLocation ? [searchLocation.lat, searchLocation.lng] : (userLocation ? [userLocation.lat, userLocation.lng] : mapCenter)}
              radius={radius}
              isActive={sonarActive}
            />

            {(searchLocation || userLocation) && (
              <Circle
                center={filterMode === "plz" && searchLocation ? [searchLocation.lat, searchLocation.lng] : (userLocation ? [userLocation.lat, userLocation.lng] : mapCenter)}
                radius={radius}
                pathOptions={{
                  color: '#E45826',
                  fillColor: '#E45826',
                  fillOpacity: 0.05,
                  weight: 3,
                  dashArray: '10, 10'
                }}
              />
            )}

            {filteredTasks.map((task) => (
              <Marker
                key={task.id}
                position={[task.latitude, task.longitude]}
                icon={createCustomIcon(task)}
                zIndexOffset={100}
                eventHandlers={{
                  click: () => handleTaskClick(task),
                }}
              />
            ))}

            {(searchLocation || userLocation) && (
              <Marker
                position={filterMode === "plz" && searchLocation ? [searchLocation.lat, searchLocation.lng] : (userLocation ? [userLocation.lat, userLocation.lng] : mapCenter)}
                zIndexOffset={1000}
                icon={L.divIcon({
                  html: '<div style="width: 20px; height: 20px; background: #E45826; border: 4px solid white; border-radius: 50%; box-shadow: 0 0 20px rgba(228, 88, 38, 0.8);"></div>',
                  className: '',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              />
            )}
          </MapContainer>

          {/* Kontrollleiste oben */}
          <div className="absolute top-3 left-3 right-3 md:top-4 md:left-4 md:right-4 z-[1000] flex items-center justify-between gap-2 min-h-[44px]">
            <button
              onClick={() => setIsFullscreen(false)}
              className="shrink-0 px-3 py-2 md:px-4 md:py-3 border-2 md:border-4 border-black bg-white hover:bg-black hover:text-white transition-all duration-200 font-black flex items-center gap-2 text-sm md:text-base"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline">{t("back")}</span>
            </button>

            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <button
                onClick={handleRefresh}
                disabled={sonarActive}
                className="w-9 h-9 md:w-12 md:h-12 border-2 md:border-4 border-black bg-[#E45826] text-white hover:bg-white hover:text-black transition-all duration-200 font-bold flex items-center justify-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${sonarActive ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex gap-0 border-2 md:border-4 border-black bg-white overflow-hidden">
                <button
                  onClick={() => setMarkerDisplay("price")}
                  className={`w-9 h-9 md:w-12 md:h-12 font-bold transition-all duration-200 flex items-center justify-center shrink-0 ${
                    markerDisplay === "price"
                      ? "bg-[#E45826] text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  <Euro className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => setMarkerDisplay("icon")}
                  className={`w-9 h-9 md:w-12 md:h-12 font-bold transition-all duration-200 flex items-center justify-center shrink-0 border-l-2 md:border-l-4 border-black ${
                    markerDisplay === "icon"
                      ? "bg-[#E45826] text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  <Tag className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Status – above attribution */}
          <div className="absolute bottom-14 left-4 bg-black text-white p-3 md:p-4 border-2 md:border-4 border-white z-[1000]">
            <div className="text-[10px] md:text-xs font-black tracking-wider mb-2">{t("status")}</div>
            <div className="space-y-1 text-xs md:text-sm font-bold">
              <div>{t("radius")}: {(radius / 1000).toFixed(1)} KM</div>
              <div>{t("tasks")}: {filteredTasks.length}</div>
              <div className="text-[#E45826]">{t("auto")}: 10s</div>
            </div>
          </div>

          {/* Legend – above attribution */}
          <div className="absolute bottom-14 right-4 bg-white border-2 md:border-4 border-black p-3 md:p-4 text-xs md:text-sm z-[1000]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-white border-2 border-black rounded-full flex items-center justify-center text-[10px] md:text-xs font-black">
                {markerDisplay === "price" ? "€" : "🛒"}
              </div>
              <span className="font-bold text-[10px] md:text-xs">{t("normal")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-black border-2 border-white rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-black">
                {markerDisplay === "price" ? "€" : "⚡"}
              </div>
              <span className="font-bold text-[10px] md:text-xs">{t("asap")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NORMALER MODUS
  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-8">
        <CitySelector onSelectCity={handleCitySelect} currentCity={selectedCity} />

        {/* PLZ SUCHEN UND FILTER - NEBENEINANDER! */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-4">
          <div className="border-2 md:border-4 border-black bg-white p-3 md:p-4">
            <Label className="font-black mb-2 block text-xs md:text-sm">{t("searchPostalCode")}</Label>
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative min-w-0">
                  <Input
                    ref={postcodeInputRef}
                    placeholder="10115, Berlin..."
                    value={postcodeSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPostcodeSearch(value);
                    }}
                    onFocus={() => {
                      if (postcodeSuggestions.length > 0) {
                        setShowPostcodeSuggestions(true);
                      }
                    }}
                    className="border-2 border-black text-sm h-9 md:h-10 w-full"
                    autoComplete="off"
                  />
                  
                  {searchingPostcode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-3 py-2 border-2 border-black bg-[#E45826] text-white hover:bg-white hover:text-black transition-all duration-200 font-bold shrink-0"
                  title={t("gpsLocation")}
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>

              {showPostcodeSuggestions && postcodeSuggestions.length > 0 && (
                <div 
                  className="absolute left-0 right-0 mt-2 bg-white border-2 md:border-4 border-black max-h-60 overflow-y-auto z-[99999] shadow-2xl"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  {postcodeSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectPostcode(suggestion);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-black hover:text-white transition-colors border-b-2 border-black last:border-b-0 font-bold text-xs"
                    >
                      <p className="truncate">{suggestion.display_name}</p>
                      {suggestion.address?.postcode && (
                        <p className="text-[10px] opacity-70 mt-1">
                          📮 PLZ: {suggestion.address.postcode}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {filterMode && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className={`${filterMode === 'gps' ? 'bg-[#E45826]' : 'bg-blue-600'} text-white border-2 border-black text-[10px]`}>
                    {filterMode === 'gps' && `📍 ${t("gpsLocation")} (20km)`}
                    {filterMode === 'plz' && '🔍 PLZ (30km)'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <div className="border-2 md:border-4 border-black bg-white p-3 md:p-4">
            <MapFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {asapTasks.length > 0 && (
          <AsapPanel asapTasks={asapTasks} onTaskClick={handleTaskClick} />
        )}

        <div className="space-y-3 md:space-y-4">
          <div className="border-2 md:border-4 border-black bg-white overflow-hidden relative transition-all duration-300 h-[400px] md:h-[500px]">
            <div className="absolute top-4 right-4 left-4 md:left-auto z-[150] flex flex-wrap items-center justify-end gap-2 md:gap-3">
              <button
                onClick={handleRefresh}
                disabled={sonarActive}
                className="w-9 h-9 shrink-0 border-2 border-black bg-[#E45826] text-white hover:bg-white hover:text-black transition-all duration-200 font-bold flex items-center justify-center disabled:opacity-50 md:w-auto md:px-4 md:py-2"
                title={t("refresh")}
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${sonarActive ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex shrink-0 gap-0 border-2 border-black bg-white overflow-hidden rounded-none">
                <button
                  onClick={() => setMarkerDisplay("price")}
                  className={`w-9 h-9 font-bold transition-all duration-200 flex items-center justify-center shrink-0 ${
                    markerDisplay === "price"
                      ? "bg-[#E45826] text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  } md:w-auto md:px-3 md:py-2`}
                  title={t("normal")}
                >
                  <Euro className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => setMarkerDisplay("icon")}
                  className={`w-9 h-9 font-bold transition-all duration-200 flex items-center justify-center shrink-0 border-l-2 border-black ${
                    markerDisplay === "icon"
                      ? "bg-[#E45826] text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  } md:w-auto md:px-3 md:py-2`}
                  title={t("asap")}
                >
                  <Tag className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>

              <button
                onClick={() => setIsFullscreen(true)}
                className="w-9 h-9 shrink-0 border-2 border-black bg-white hover:bg-[#E45826] hover:text-white transition-all duration-200 font-bold flex items-center justify-center text-base md:w-auto md:px-4 md:py-2"
                title={t("fullscreen")}
              >
                ⛶
              </button>
            </div>

            <MapContainer
              center={mapCenter}
              zoom={currentZoom}
              style={{ width: "100%", height: "100%" }}
              className="grayscale"
              zoomControl={true}
            >
              <MapUpdater center={mapCenter} zoom={currentZoom} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />

              {/* SONAR WELLEN-EFFEKT */}
              <SonarRadarOverlay 
                center={filterMode === "plz" && searchLocation ? [searchLocation.lat, searchLocation.lng] : (userLocation ? [userLocation.lat, userLocation.lng] : mapCenter)}
                radius={radius}
                isActive={sonarActive}
              />

              {/* Only show the radius circle around the active search location */}
              {(searchLocation || userLocation) && (
                <Circle
                  center={filterMode === "plz" && searchLocation ? [searchLocation.lat, searchLocation.lng] : (userLocation ? [userLocation.lat, userLocation.lng] : mapCenter)}
                  radius={radius}
                  pathOptions={{
                    color: '#E45826',
                    fillColor: '#E45826',
                    fillOpacity: 0.05,
                    weight: 3,
                    dashArray: '10, 10'
                  }}
                />
              )}

              {filteredTasks.map((task) => (
                <Marker
                  key={task.id}
                  position={[task.latitude, task.longitude]}
                  icon={createCustomIcon(task)}
                  zIndexOffset={100}
                  eventHandlers={{
                    click: () => handleTaskClick(task),
                  }}
                />
              ))}

              {/* User/center marker on top so it's never covered by task markers */}
              {(searchLocation || userLocation) && (
                <Marker
                  position={filterMode === "plz" && searchLocation ? [searchLocation.lat, searchLocation.lng] : (userLocation ? [userLocation.lat, userLocation.lng] : mapCenter)}
                  zIndexOffset={1000}
                  icon={L.divIcon({
                    html: '<div style="width: 20px; height: 20px; background: #E45826; border: 4px solid white; border-radius: 50%; box-shadow: 0 0 20px rgba(228, 88, 38, 0.8);"></div>',
                    className: '',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                />
              )}
            </MapContainer>

            <div className="absolute bottom-12 left-2 bg-black text-white p-2 border border-white z-[150]">
              <div className="text-[8px] font-black tracking-wider mb-1">{t("status")}</div>
              <div className="space-y-0.5 text-[10px] font-bold">
                <div>{t("radius")}: {(radius / 1000).toFixed(1)} KM</div>
                <div>{t("tasks")}: {filteredTasks.length}</div>
                <div className="text-[#E45826]">{t("auto")}: 10s</div>
              </div>
            </div>

            <div className="absolute bottom-12 right-2 bg-white border border-black p-2 text-[10px] z-[150]">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-4 h-4 bg-white border border-black rounded-full flex items-center justify-center text-[8px] font-black">
                  {markerDisplay === "price" ? "€" : "🛒"}
                </div>
                <span className="font-bold text-[8px]">{t("normal")}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-black border border-white rounded-full flex items-center justify-center text-white text-[8px] font-black">
                  {markerDisplay === "price" ? "€" : "⚡"}
                </div>
                <span className="font-bold text-[8px]">{t("asap")}</span>
              </div>
            </div>
          </div>

          <div className="border-2 md:border-4 border-black bg-white p-3 md:p-4">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <Label className="font-black text-xs md:text-sm">{t("radius")}: {(radius / 1000).toFixed(1)} KM</Label>
            </div>
            <Slider
              value={[radius]}
              onValueChange={([value]) => setRadius(value)}
              min={250}
              max={10000}
              step={250}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] md:text-xs font-bold mt-2 text-gray-600">
              <span>250M</span>
              <span>2.5KM</span>
              <span>5KM</span>
              <span>10KM</span>
            </div>
          </div>
        </div>

        <div className="overflow-hidden mt-4">
          <div className="mb-3 md:mb-4 p-2 md:p-4 bg-black text-white border-2 md:border-4 border-black flex items-center justify-between">
            <h2 className="font-black text-base md:text-xl tracking-tighter">{t("tasks")}</h2>
            <span className="text-lg md:text-2xl font-black">{filteredTasks.length}</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="border-2 md:border-4 border-black bg-white p-8 md:p-12 text-center">
              <p className="font-black text-xl md:text-2xl mb-2">{t("noTasks")}</p>
              <p className="text-gray-600 font-bold text-sm md:text-base">{t("noTasksFound")}</p>
              <p className="text-xs md:text-sm text-gray-500 mt-2">{t("checkFiltersOrChangeLocation")}</p>
            </div>
          ) : (
            <div className="grid gap-2 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

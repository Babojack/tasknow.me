
import React from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, MapPin, Euro, Clock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/i18n/TranslationContext";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

export default function AsapPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = React.useState({});
  const [userLocation, setUserLocation] = React.useState(null);
  const [searchLocation, setSearchLocation] = React.useState(null); // New state for search location
  const [filterMode, setFilterMode] = React.useState("gps"); // New state for filter mode: "gps" or "plz"

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log("📍 ASAP: User location:", location);
          setUserLocation(location);
        },
        (error) => {
          console.log("Geolocation error:", error);
          if (user?.latitude && user?.longitude) {
            setUserLocation({
              lat: user.latitude,
              lng: user.longitude
            });
          }
        }
      );
    } else if (user?.latitude && user?.longitude) {
      setUserLocation({
        lat: user.latitude,
        lng: user.longitude
      });
    }
  }, [user]);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ["asap-tasks"],
    queryFn: async () => {
      const tasks = await demoApi.entities.Task.filter(
        {
          status: "open",
          is_asap: true,
        },
        "-created_date"
      );
      // console.log("🔄 ASAP: Loaded ALL ASAP tasks:", tasks.length); // Removed debug log
      // tasks.forEach(t => {
      //   console.log(`  - ${t.title}: lat=${t.latitude}, lng=${t.longitude}, expires=${t.asap_expires_at}, address=${t.address}`); // Removed debug log
      // });
      return tasks;
    },
    refetchInterval: 5000, // Changed refetch interval
    // staleTime: 0, // Removed per outline
    // cacheTime: 0, // Removed per outline
  });

  // ДИНАМИЧЕСКАЯ ФИЛЬТРАЦИЯ
  const filteredTasks = React.useMemo(() => {
    const centerLocation = searchLocation || userLocation;
    if (!centerLocation) {
        // console.log("🚫 ASAP: No center location (user or search) for filtering."); // Removed debug log
        return [];
    }
    
    // Max distance in meters
    const maxDistance = filterMode === "plz" ? 30000 : 20000; // 30km for PLZ, 20km for GPS
    
    const tasks = allTasks.filter(task => {
      if (!task.latitude || !task.longitude) {
        // console.log(`❌ ${task.title}: No coordinates`); // Removed debug log
        return false;
      }
      
      const distance = calculateDistance(
        centerLocation.lat,
        centerLocation.lng,
        task.latitude,
        task.longitude
      );
      
      return distance <= maxDistance;
    }).map(task => {
      const distance = calculateDistance(
        centerLocation.lat,
        centerLocation.lng,
        task.latitude,
        task.longitude
      );
      return { ...task, distance };
    }).sort((a, b) => a.distance - b.distance);

    // console.log(`✅ ASAP: Showing ${tasks.length} tasks within ${maxDistance / 1000}km radius.`); // Removed debug log
    return tasks;
  }, [allTasks, userLocation, searchLocation, filterMode]);

  // console.log("🎯 ASAP Final:", filteredTasks.length, "tasks"); // Removed debug log

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = {};
      filteredTasks.forEach((task) => {
        if (task.asap_expires_at) {
          const now = new Date();
          const expires = new Date(task.asap_expires_at);
          const seconds = Math.max(0, Math.floor((expires - now) / 1000));
          newTimeLeft[task.id] = seconds;
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [filteredTasks]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTaskClick = (task) => {
    navigate(createPageUrl("TaskDetail") + `?id=${task.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-10 h-10 md:w-12 md:h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  // userLocation is used as the default centerLocation when searchLocation is not set
  // So, if neither userLocation nor searchLocation is available, we prompt for location.
  if (!userLocation && !searchLocation) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="border-2 md:border-4 border-black bg-yellow-50 p-6 md:p-8 text-center">
            <AlertCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-yellow-600" />
            <h3 className="text-xl md:text-2xl font-black text-black mb-2">
              {t("locationRequired").toUpperCase()}
            </h3>
            <p className="text-sm md:text-base text-gray-600 font-bold">
              {t("enableLocationAsap")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2 md:p-4 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-black flex items-center justify-center">
              <Zap className="w-5 h-5 md:w-8 md:h-8 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-black tracking-tighter">
                {t("asapTasksTitle")}
              </h1>
              <p className="text-xs md:text-base text-gray-600 font-bold">
                {t("urgentTasksWithPremiumAll")}
              </p>
            </div>
          </div>

          <div className="border-2 md:border-4 border-black bg-yellow-50 p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex items-start gap-2 md:gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs md:text-sm mb-1">{t("reactFast").toUpperCase()}</p>
                <p className="text-[10px] md:text-xs text-gray-600 font-bold">
                  {t("asapReady")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="border-2 md:border-4 border-black bg-white p-8 md:p-12 text-center">
            <Zap className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl md:text-2xl font-black text-black mb-2">
              {t("noAsapTasks").toUpperCase()}
            </h3>
            <p className="text-sm md:text-base text-gray-600 font-bold mb-2">
              {t("noAsapNearby")}
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              {t("weNotifyAsap")}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <p className="text-sm md:text-base font-black">
                {filteredTasks.length} {filteredTasks.length === 1 ? t("urgentTask").toUpperCase() : t("urgentTasks").toUpperCase()}
              </p>
            </div>

            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="border-2 md:border-4 border-black bg-black text-white cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px]] transition-all overflow-hidden"
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardContent className="p-3 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                        <div className="flex-1 min-w-0 space-y-2 md:space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base md:text-2xl font-black line-clamp-1 flex-1">
                              {task.title}
                            </h3>
                            <Badge className="bg-white text-black border-2 border-white shrink-0 text-[10px] md:text-xs font-black">
                              +{task.asap_premium_percent}%
                            </Badge>
                          </div>

                          <p className="text-xs md:text-sm text-gray-300 line-clamp-2">
                            {task.description}
                          </p>

                          <div className="flex flex-col gap-2 md:flex-row md:gap-4 text-[10px] md:text-sm">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                              <span className="truncate">{task.address}</span>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 text-yellow-400">
                              <span className="font-bold">
                                {/* task.distance is in meters, convert to km */}
                                {(task.distance / 1000).toFixed(1)} km entfernt
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-4 shrink-0 border-t md:border-t-0 md:border-l border-white md:border-l-2 pt-3 md:pt-0 md:pl-6">
                          <div className="flex items-center gap-1 md:flex-col md:items-end">
                            <span className="text-xs md:text-sm text-gray-400">{t("asapPremium")}:</span>
                            <div className="flex items-center gap-1 text-2xl md:text-4xl font-black">
                              <Euro className="w-5 h-5 md:w-8 md:h-8" />
                              <span>
                                {(task.price * (1 + task.asap_premium_percent / 100)).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {timeLeft[task.id] !== undefined && (
                            <div className="flex items-center gap-2 bg-white text-black px-3 py-2 md:px-4 md:py-3 border-2 border-white">
                              <Clock className="w-4 h-4 md:w-5 md:h-5" />
                              <span className="text-lg md:text-2xl font-mono font-black">
                                {formatTime(timeLeft[task.id])}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

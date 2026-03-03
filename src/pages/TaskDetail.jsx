
import React, { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Euro,
  CheckCircle,
  CheckSquare,
  Shield,
  Star,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/components/i18n/TranslationContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Leaflet imports
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS

// Функция расчета расстояния
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

export default function TaskDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false); // New state for review dialog
  const [rating, setRating] = useState(0); // New state for review rating
  const [reviewComment, setReviewComment] = useState(""); // New state for review comment
  const [userLocation, setUserLocation] = useState(null); // New state for user's current location
  const [distanceToTask, setDistanceToTask] = useState(null); // New state for distance to task
  
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get("id");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const tasks = await demoApi.entities.Task.filter({ id: taskId });
      const task = tasks[0];
      console.log("📋 Task loaded:", task);
      console.log("📸 Task photos:", task?.photo_urls);
      return task;
    },
    enabled: !!taskId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  // Получаем текущее местоположение пользователя
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log("📍 User location:", location);
          setUserLocation(location);
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Fallback to user's registered location if geolocation fails
          if (currentUser?.latitude && currentUser?.longitude) {
            setUserLocation({
              lat: currentUser.latitude,
              lng: currentUser.longitude
            });
          }
        }
      );
    } else if (currentUser?.latitude && currentUser?.longitude) {
      // If geolocation is not supported, use user's registered location
      setUserLocation({
        lat: currentUser.latitude,
        lng: currentUser.longitude
      });
    }
  }, [currentUser]); // Depend on currentUser to fetch location if available

  // Вычисляем расстояние до задачи
  React.useEffect(() => {
    if (task && userLocation && task.latitude && task.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        task.latitude,
        task.longitude
      );
      setDistanceToTask(distance);
      console.log("📏 Distance to task:", (distance / 1000).toFixed(1), "km");
    }
  }, [task, userLocation]); // Recalculate if task or userLocation changes

  const { data: owner } = useQuery({
    queryKey: ["user", task?.owner_id],
    queryFn: async () => {
      if (!task?.owner_id) return null;
      const users = await demoApi.entities.User.filter({ id: task.owner_id });
      return users[0];
    },
    enabled: !!task?.owner_id,
    retry: false, // Prevents automatic retries on errors like 403
    onError: (err) => {
      console.log("Could not load owner data:", err);
      // Optionally, you could set an error state here if needed for UI,
      // but for 403 on owner data, usually just not displaying the owner is fine.
    },
  });

  const { data: todos = [] } = useQuery({
    queryKey: ["todos", taskId],
    queryFn: () => demoApi.entities.TodoItem.filter({ task_id: taskId }, "order"),
    enabled: !!taskId,
  });

  const { data: existingApplication } = useQuery({
    queryKey: ["application", taskId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const apps = await demoApi.entities.TaskApplication.filter({
        task_id: taskId,
        executor_id: currentUser.id,
      });
      return apps[0] || null;
    },
    enabled: !!taskId && !!currentUser,
  });

  const { data: existingReview } = useQuery({
    queryKey: ["review", taskId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser || !task) return null;
      const reviews = await demoApi.entities.Review.filter({
        task_id: taskId,
        from_user_id: currentUser.id,
      });
      return reviews[0] || null;
    },
    enabled: !!taskId && !!currentUser && !!task, // Ensure task data is available
  });

  const applyMutation = useMutation({
    mutationFn: async (message) => {
      // ПРОВЕРКА РАССТОЯНИЯ!
      if (distanceToTask && distanceToTask > 20000) { // 20 km limit
        throw new Error("LOCATION_TOO_FAR");
      }

      return demoApi.entities.TaskApplication.create({
        task_id: taskId,
        executor_id: currentUser.id,
        customer_id: task.owner_id,
        message,
        status: "pending",
        executor_rating: currentUser.rating || 0,
        executor_completed_tasks: currentUser.total_tasks_completed || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", taskId] });
      setShowApplicationDialog(false);
      setApplicationMessage("");
      setError(null); // Clear any previous errors
    },
    onError: (err) => {
      if (err.message === "LOCATION_TOO_FAR") {
        setError(
          `This task is too far away. You are ${(distanceToTask / 1000).toFixed(1)} km from the task. You can only accept tasks within 20 km.`
        );
      } else {
        setError("Error sending application.");
      }
      console.error(err);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ rating, comment }) => {
      if (!task || !currentUser) {
        throw new Error("Task or current user not available for review.");
      }
      return demoApi.entities.Review.create({
        task_id: taskId,
        from_user_id: currentUser.id,
        to_user_id: task.executor_id, // Review is for the assigned executor
        rating,
        comment,
        type: "executor", // Assuming review is for executor
      });
    },
    onSuccess: async () => {
      // Update executor's rating only if there is an executor
      if (task && task.executor_id) {
        const executorReviews = await demoApi.entities.Review.filter({ to_user_id: task.executor_id });
        
        let avgRating = 0;
        if (executorReviews.length > 0) {
          avgRating = executorReviews.reduce((sum, r) => sum + r.rating, 0) / executorReviews.length;
        }
        
        await demoApi.entities.User.update(task.executor_id, { rating: avgRating });
        queryClient.invalidateQueries({ queryKey: ["user", task.executor_id] }); // Invalidate executor's user data
      }
      
      queryClient.invalidateQueries({ queryKey: ["review", taskId] }); // Invalidate current task's review
      queryClient.invalidateQueries({ queryKey: ["task", taskId] }); // Invalidate task to potentially re-evaluate canReview if needed
      setShowReviewDialog(false);
      setRating(0);
      setReviewComment("");
      setError(null); // Clear any previous errors
    },
    onError: (err) => {
      setError("Error sending review.");
      console.error(err);
    },
  });

  const handleApplyClick = () => {
    // Проверяем расстояние перед открытием диалога
    if (distanceToTask && distanceToTask > 20000) {
      setError(
        `This task is too far away. You are ${(distanceToTask / 1000).toFixed(1)} km from the task. You can only accept tasks within 20 km.`
      );
      return;
    }
    setShowApplicationDialog(true);
    setError(null); // Clear any previous errors if dialog is opened
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="font-bold text-gray-500">{t("taskNotFound")}</p>
      </div>
    );
  }

  // Changed to asap premium
  const finalPrice = task.is_asap
    ? task.price * (1 + task.asap_premium_percent / 100)
    : task.price;

  const isTooFar = distanceToTask && distanceToTask > 20000;

  const canApply =
    currentUser &&
    currentUser.user_type === "executor" &&
    task.status === "open" &&
    task.owner_id !== currentUser.id &&
    !existingApplication;
    // Note: isTooFar check is handled by disabling the button and error message

  const hasApplied = !!existingApplication;

  const canReview = 
    currentUser &&
    task.status === "completed" && // Only allow review if task is completed
    currentUser.id === task.owner_id && // Only task owner can review the executor
    task.executor_id && // Only if an executor was assigned
    !existingReview; // Only if no review has been left by the owner for this task

  return (
    <div className="min-h-screen bg-white p-2 md:p-4 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
          <button
            onClick={() => navigate(createPageUrl("Map"))}
            className="w-10 h-10 md:w-12 md:h-12 border-2 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-black tracking-tighter truncate">
              {task.title}
            </h1>
            <p className="text-gray-600 mt-1 font-mono text-xs md:text-sm">
              {format(new Date(task.created_date), "d MMMM yyyy, HH:mm")}
            </p>
          </div>
          {/* Changed to asap premium */}
          {task.is_asap && (
            <div className="px-2 md:px-4 py-1 md:py-2 border-2 border-black bg-black text-white font-black tracking-wider text-xs md:text-base shrink-0">
              ⚡ ASAP
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-2 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        {/* Показываем расстояние если пользователь - исполнитель */}
        {currentUser?.user_type === "executor" && distanceToTask !== null && (
          <div className={`mb-6 border-2 md:border-4 p-3 md:p-4 ${
            isTooFar ? "border-red-600 bg-red-50" : "border-green-600 bg-green-50"
          }`}>
            <div className="flex items-center gap-2 md:gap-3">
              <MapPin className={`w-5 h-5 md:w-6 md:h-6 ${isTooFar ? "text-red-600" : "text-green-600"}`} />
              <div className="flex-1">
                <p className="font-black text-sm md:text-base">
                  {t("distance")}: {(distanceToTask / 1000).toFixed(1)} km
                </p>
                {isTooFar ? (
                  <p className="text-xs md:text-sm text-red-700 font-bold">
                    ⚠️ {t("taskTooFarShort")}
                  </p>
                ) : (
                  <p className="text-xs md:text-sm text-green-700 font-bold">
                    ✅ {t("inRange")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* ИНФОРМАЦИЯ О ЗАКАЗЧИКЕ */}
            {owner && (
              <div className="border-4 border-black bg-white">
                <div className="p-4 border-b-2 border-black">
                  <h3 className="font-black tracking-tighter text-xl">{t("tasker").toUpperCase()}</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {owner.avatar_url ? (
                      <img
                        src={owner.avatar_url}
                        alt={owner.full_name}
                        className="w-20 h-20 border-4 border-black object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-3xl font-black border-4 border-black">
                        {owner.full_name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-2xl font-black">{owner.full_name}</h4>
                        {owner.is_verified && (
                          <Badge className="bg-blue-600 text-white border-2 border-black">
                            <Shield className="w-3 h-3 mr-1" />
                            VERIFIZIERT
                          </Badge>
                        )}
                        {owner.user_type === "organization" && (
                          <Badge className="bg-purple-600 text-white border-2 border-black">
                            ORGANIZATION
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold">{owner.rating?.toFixed(1) || "0.0"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-bold">{owner.total_tasks_created || 0} {t("tasksCreated")}</span>
                          </div>
                        </div>
                        
                        {owner.bio && (
                          <p className="text-sm text-gray-600 mt-2">{owner.bio}</p>
                        )}
                        
                        {owner.organization_name && (
                          <div className="mt-2 pt-2 border-t-2 border-gray-200">
                            <p className="text-sm font-bold text-gray-700">
                              🏢 {owner.organization_name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FOTOS GALERIE */}
            {task.photo_urls && Array.isArray(task.photo_urls) && task.photo_urls.length > 0 && (
              <div className="border-4 border-black bg-white">
                <div className="p-4 border-b-2 border-black">
                  <h3 className="font-black tracking-tighter text-xl">FOTOS ({task.photo_urls.length})</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {task.photo_urls.map((url, index) => (
                      <div key={index} className="border-2 border-black overflow-hidden group cursor-pointer">
                        <img
                          src={url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                          onClick={() => window.open(url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="border-4 border-black bg-white">
              <div className="p-4 border-b-2 border-black">
                <h3 className="font-black tracking-tighter text-xl">{t("taskDescription").toUpperCase()}</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-900 whitespace-pre-wrap font-medium leading-relaxed">{task.description}</p>
              </div>
            </div>

            {/* Todos */}
            {todos.length > 0 && (
              <div className="border-4 border-black bg-white">
                <div className="p-4 border-b-2 border-black">
                  <h3 className="font-black tracking-tighter text-xl flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    {t("executionSteps").toUpperCase()} ({todos.length})
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {todos.map((todo, index) => (
                    <div
                      key={todo.id}
                      className="border-2 border-black p-3 bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center font-black">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black tracking-tight">{todo.title}</h4>
                          {todo.description && (
                            <p className="text-sm text-gray-600 mt-1 font-medium">{todo.description}</p>
                          )}
                        </div>
                        {todo.is_completed && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAP - рядом с описанием */}
            <div className="border-4 border-black bg-white overflow-hidden">
              <div className="p-4 border-b-2 border-black">
                <h3 className="font-black tracking-tighter text-xl flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t("location").toUpperCase()}
                </h3>
              </div>
              {task.latitude && task.longitude && (
                <div className="h-[400px] border-t-2 border-black">
                  <MapContainer
                    center={[task.latitude, task.longitude]}
                    zoom={15}
                    style={{ width: "100%", height: "100%" }}
                    className="grayscale"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <Marker 
                      position={[task.latitude, task.longitude]}
                      icon={L.divIcon({
                        html: `
                          <div style="position: relative; width: 60px; height: 60px; display: flex; justify-content: center; align-items: center;">
                              <!-- Sonar Pulse -->
                              <div style="
                                  position: absolute;
                                  width: 40px;
                                  height: 40px; /* Initial size before animation */
                                  border-radius: 50%;
                                  background: rgba(0, 0, 0, 0.4);
                                  animation: sonar-pulse 2s infinite ease-out;
                                  z-index: 1;
                                  top: 10px;
                                  left: 10px;
                              "></div>
                              <!-- Main Marker -->
                              <div style="
                                  position: absolute;
                                  width: 40px;
                                  height: 40px;
                                  background: black;
                                  border: 3px solid white;
                                  border-radius: 50%;
                                  z-index: 2;
                                  top: 10px;
                                  left: 10px;
                              "></div>
                              <style>
                                  @keyframes sonar-pulse {
                                      0% {
                                          transform: scale(0.5); /* Starts smaller */
                                          opacity: 0.8;
                                      }
                                      100% {
                                          transform: scale(1.5); /* Expands to 1.5 times its initial size (40px -> 60px) */
                                          opacity: 0;
                                      }
                                  }
                              </style>
                          </div>
                        `,
                        className: '',
                        iconSize: [60, 60], // Make iconSize larger to contain the pulse
                        iconAnchor: [30, 30], // Anchor at the center of the 60x60 container
                      })}
                    />
                  </MapContainer>
                </div>
              )}
              <div className="p-4 border-t-2 border-black">
                <p className="font-bold text-lg">{task.address}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Price */}
            <div className="border-4 border-black bg-white">
              <div className="p-4 border-b-2 border-black">
                <h3 className="font-black tracking-tighter text-xl flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  BEZAHLUNG {/* German translation */}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Grundpreis:</span> {/* German translation */}
                    <span>{task.price.toFixed(2)} EUR</span>
                  </div>

                  {/* Changed to asap premium */}
                  {task.is_asap && (
                    <div className="flex justify-between text-sm font-bold">
                      <span>{t("asapPremium")}:</span>
                      <span>
                        +{((task.price * task.asap_premium_percent) / 100).toFixed(2)} EUR
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-3xl font-black pt-2 border-t-2 border-black">
                    <span>GESAMT:</span> {/* German translation */}
                    <span>{finalPrice.toFixed(2)} EUR</span>
                  </div>
                </div>

                {canApply && (
                  <button
                    onClick={handleApplyClick}
                    disabled={isTooFar || applyMutation.isPending}
                    className={`w-full py-4 border-2 border-black transition-all font-black tracking-wider ${
                      isTooFar || applyMutation.isPending
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-black text-white hover:bg-white hover:text-black"
                    }`}
                  >
                    {applyMutation.isPending ? t("sending") : (isTooFar ? t("tooFarAway").toUpperCase() : t("apply").toUpperCase())}
                  </button>
                )}

                {hasApplied && (
                  <div className="p-4 border-2 border-black text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-black">{t("youHaveApplied").toUpperCase()}</p>
                    <p className="text-sm font-bold mt-1">
                      Status: {existingApplication.status === "pending" && t("pending").toUpperCase()}
                      {existingApplication.status === "accepted" && t("accepted").toUpperCase()}
                      {existingApplication.status === "rejected" && t("rejected").toUpperCase()}
                    </p>
                  </div>
                )}

                {currentUser?.user_type !== "executor" && (
                  <div className="p-4 border-2 border-black text-center">
                    <p className="text-sm font-bold text-gray-600">
                      {t("onlyDoersCanApply")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ОЦЕНКА ИСПОЛНИТЕЛЯ */}
            {canReview && (
              <div className="border-4 border-black bg-white">
                <div className="p-4 border-b-2 border-black">
                  <h3 className="font-black tracking-tighter text-xl">{t("rating").toUpperCase()}</h3>
                </div>
                <div className="p-6">
                  <button
                    onClick={() => { setShowReviewDialog(true); setError(null); }}
                    className="w-full py-4 border-2 border-black bg-green-600 text-white hover:bg-white hover:text-black transition-all font-black"
                  >
                    {t("rateDoer").toUpperCase()}
                  </button>
                </div>
              </div>
            )}

            {existingReview && (
              <div className="border-4 border-black bg-white">
                <div className="p-4 border-b-2 border-black">
                  <h3 className="font-black tracking-tighter text-xl">{t("yourRating").toUpperCase()}</h3>
                </div>
                <div className="p-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-2xl ${i < existingReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  {existingReview.comment && (
                    <p className="text-sm text-gray-700">{existingReview.comment}</p>
                  )}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="border-4 border-black bg-white">
              <div className="p-4 border-b-2 border-black">
                <h3 className="font-black tracking-tighter text-xl">DETAILS</h3> {/* German translation */}
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-600">{t("category")}</span>
                  <span className="font-black">{task.category.toUpperCase()}</span>
                </div>

                {task.estimated_duration_minutes && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-600">Zeit</span> {/* German translation */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-black">{task.estimated_duration_minutes} MIN</span> {/* German translation */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KEIN LOKALES CHAT WIDGET MEHR - ТОЛЬКО ГЛОБАЛЬНЫЙ */}

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("applicationForTask")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">{t("messageToCustomer")}</label>
              <Textarea
                id="message"
                placeholder={t("whySuitedForTask")}
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-gray-700">
                {t("profileSentWithApplication")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowApplicationDialog(false); setError(null); }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => applyMutation.mutate(applicationMessage)}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? t("sending") : t("sendApplication")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rateDoer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t("rating")}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-4xl hover:scale-110 transition-transform"
                  >
                    <span className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700">Kommentar (optional)</label> {/* German translation */}
              <Textarea
                id="reviewComment"
                placeholder={t("shareExperience")}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowReviewDialog(false); setError(null); }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => reviewMutation.mutate({ rating, comment: reviewComment })}
              disabled={rating === 0 || reviewMutation.isPending}
            >
              {reviewMutation.isPending ? t("sending") : t("sendReview")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

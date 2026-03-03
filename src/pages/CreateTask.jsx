
import React, { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  MapPin,
  Euro,
  ArrowLeft,
  CheckSquare,
  Loader2,
  Camera,
} from "lucide-react";
import { useTranslation } from "@/components/i18n/TranslationContext";
import { CATEGORY_LABELS } from "@/components/i18n/TranslationContext";

const CATEGORIES = [
  "покупки",
  "доставка",
  "уборка",
  "ремонт",
  "переезд",
  "животные",
  "обучение",
  "фото_видео",
  "другое",
];

const CATEGORY_ICONS = {
  покупки: "🛒",
  доставка: "📦",
  уборка: "🧹",
  ремонт: "🔧",
  переезд: "🚚",
  животные: "🐾",
  обучение: "📚", // Fixed syntax error here
  фото_видео: "📷",
  другое: "⚡",
};

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUrls, setPhotoUrls] = useState([]);
  
  const [addressInput, setAddressInput] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "покупки",
    price: "",
    pricing_type: "fixed",
    estimated_duration_minutes: "",
    latitude: null,
    longitude: null,
    address: "",
    is_asap: false,
    asap_premium_percent: 10,
    asap_radius_meters: 500,
    asap_duration_seconds: 120,
  });

  React.useEffect(() => {
    if (location.state?.taskData) {
      const aiData = location.state.taskData;
      setFormData(prev => ({
        ...prev,
        ...aiData,
      }));
      setAddressInput(aiData.address || "");
    }
  }, [location.state]);

  React.useEffect(() => {
    const searchAddress = async () => {
      const query = addressInput.trim();
      
      if (!query || query.length < 3) {
        setAddressSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSearchingAddress(true);
      
      try {
        const searchQuery = `${query}, Germany`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          setAddressSuggestions([]);
          setShowSuggestions(false);
          setSearchingAddress(false);
          return;
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setAddressSuggestions(data);
          setShowSuggestions(true);
        } else {
          setAddressSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("❌ ERROR:", error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSearchingAddress(false);
      }
    };

    const timer = setTimeout(searchAddress, 1000);
    return () => clearTimeout(timer);
  }, [addressInput]);

  const handleSelectAddress = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    setAddressInput(suggestion.display_name);
    setFormData({
      ...formData,
      address: suggestion.display_name,
      latitude: lat,
      longitude: lon,
    });
    
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleGetLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
      try {
        const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setAddressInput(address);
            setFormData({
              ...formData,
              latitude,
              longitude,
              address,
            });
          } catch (error) {
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setAddressInput(address);
            setFormData({
              ...formData,
              latitude,
              longitude,
              address,
            });
          }
          
          setGettingLocation(false);
        },
        (error) => {
          setError(t("locationCouldNotBeDetermined"));
          setGettingLocation(false);
        }
      );
    } else {
      setError(t("geolocationNotSupported"));
      setGettingLocation(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    console.log("📸 Uploading", files.length, "photos...");
    
    try {
      const uploadPromises = files.map(file =>
        demoApi.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      console.log("✅ Photos uploaded:", urls);
      setPhotoUrls([...photoUrls, ...urls]);
    } catch (err) {
      setError(t("errorUploadingPhotos"));
      console.error("❌ Photo upload error:", err);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = (index) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const user = await demoApi.auth.me();
      
      if (!taskData.latitude || !taskData.longitude) {
        throw new Error(t("provideValidLocation"));
      }

      const now = new Date();
      const asapExpiresAt = new Date(now.getTime() + taskData.asap_duration_seconds * 1000);

      console.log("🚀 CREATING TASK with photos:", photoUrls);

      const task = await demoApi.entities.Task.create({
        ...taskData,
        owner_id: user.id,
        status: "open",
        photo_urls: photoUrls,
        asap_expires_at: taskData.is_asap ? asapExpiresAt.toISOString() : null,
      });

      console.log("✅ TASK CREATED with photo_urls:", task.photo_urls);

      if (todos.length > 0) {
        const todoPromises = todos.map((todo, index) =>
          demoApi.entities.TodoItem.create({
            task_id: task.id,
            title: todo.title,
            description: todo.description || "",
            order: index,
            is_completed: false,
          })
        );
        await Promise.all(todoPromises);
      }

      return task;
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['tasks'] });
      queryClient.removeQueries({ queryKey: ['asap-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['asap-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['customerTasks'] });
      
      setTimeout(() => {
        navigate(createPageUrl("CustomerTasks"));
      }, 100);
    },
    onError: (err) => {
      console.error("❌ TASK CREATION ERROR:", err);
      setError(err.message || t("errorCreatingTask"));
    },
  });

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;
    setTodos([...todos, { title: newTodoTitle, description: "" }]);
    setNewTodoTitle("");
  };

  const handleRemoveTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.latitude || !formData.longitude) {
      setError(t("provideLocation"));
      return;
    }
    if (!formData.title.trim()) {
      setError(t("provideTitle"));
      return;
    }
    if (!formData.description.trim()) {
      setError(t("provideDescription"));
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError(t("provideValidPrice"));
      return;
    }

    createTaskMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      estimated_duration_minutes: formData.estimated_duration_minutes
        ? parseInt(formData.estimated_duration_minutes)
        : null,
    });
  };

  const finalPrice = formData.is_asap && formData.price
    ? parseFloat(formData.price) * (1 + formData.asap_premium_percent / 100)
    : parseFloat(formData.price) || 0;

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 border-2 border-black bg-white hover:bg-black hover:text-white transition-all duration-200 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-black tracking-tighter">{t("createTask").toUpperCase()}</h1>
            <p className="text-gray-600 font-bold">{t("describeWhatYouNeed")}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 border-2 border-black bg-red-50 p-4 transition-all duration-300">
            <p className="font-bold text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-4 border-black bg-white">
            <CardHeader className="p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter">{t("preview").toUpperCase()}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gray-100 border-2 border-black h-48 flex items-center justify-center">
                <div className="text-8xl">
                  {CATEGORY_ICONS[formData.category] || "⚡"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white">
            <CardHeader className="p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter">{t("basicInformation").toUpperCase()}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-black tracking-tighter">{t("titleLabel").toUpperCase()} *</Label>
                <Input
                  id="title"
                  placeholder={t("titlePlaceholder")}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="border-2 border-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-black tracking-tighter">{t("descriptionLabel").toUpperCase()} *</Label>
                <Textarea
                  id="description"
                  placeholder={t("describeTaskDetail")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                  className="border-2 border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-black tracking-tighter">{t("category").toUpperCase()} *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="border-2 border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat] || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-black tracking-tighter">{t("durationMin").toUpperCase()}</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="30"
                    value={formData.estimated_duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_duration_minutes: e.target.value })
                    }
                    className="border-2 border-black"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FOTOS HOCHLADEN */}
          <Card className="border-4 border-black bg-white">
            <CardHeader className="p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter flex items-center gap-2">
                <Camera className="w-5 h-5" />
                {t("photos").toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploadingPhotos ? (
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-spin" />
                      <p className="text-gray-600 font-bold">{t("photosUploading")}</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">
                        {t("clickToUploadPhotos")}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {t("pngJpgUpTo10mb")}
                      </p>
                    </>
                  )}
                </label>
              </div>

              {photoUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover border-2 border-black"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 w-8 h-8 bg-red-600 text-white hover:bg-red-700 border-2 border-black transition-all flex items-center justify-center font-bold text-lg leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white">
            <CardHeader className="p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t("location").toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="font-black tracking-tighter">{t("addressOrPostcode").toUpperCase()} *</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="address"
                      placeholder={t("addressPlaceholder")}
                      value={addressInput}
                      onChange={(e) => {
                        setAddressInput(e.target.value);
                        setFormData({ ...formData, address: e.target.value, latitude: null, longitude: null });
                      }}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      required
                      className="border-2 border-black"
                      autoComplete="off"
                    />
                    
                    {searchingAddress && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}

                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div 
                        className="absolute top-full left-0 right-0 mt-1 bg-white border-4 border-black max-h-60 overflow-y-auto shadow-2xl"
                        style={{ zIndex: 99999 }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectAddress(suggestion);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-black hover:text-white transition-colors border-b-2 border-black last:border-b-0 font-bold"
                          >
                            <p className="text-sm">{suggestion.display_name}</p>
                            {suggestion.address?.postcode && (
                              <p className="text-xs opacity-70 mt-1">
                                📮 {t("postcode")}: {suggestion.address.postcode}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="border-2 border-black bg-white hover:bg-black hover:text-white transition-all shrink-0"
                  >
                    {gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : "GPS"}
                  </Button>
                </div>
                
                {formData.latitude && formData.longitude && (
                  <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 p-2 border-2 border-green-600">
                    <CheckSquare className="w-4 h-4" />
                    {t("locationSelected")}: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white">
            <CardHeader className="p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter flex items-center gap-2">
                <Euro className="w-5 h-5" />
                {t("price").toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="font-black tracking-tighter">{t("paymentMethod").toUpperCase()} *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all border-2 border-black ${
                      formData.pricing_type === "fixed"
                        ? "bg-black text-white"
                        : "bg-white hover:bg-gray-100"
                    }`}
                    onClick={() => setFormData({ ...formData, pricing_type: "fixed" })}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold">{t("fixedPrice")}</p>
                      <p className={`text-xs mt-1 ${formData.pricing_type === "fixed" ? "text-gray-300" : "text-gray-600"}`}>
                        {t("forEntireTask")}
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all border-2 border-black ${
                      formData.pricing_type === "hourly"
                        ? "bg-black text-white"
                        : "bg-white hover:bg-gray-100"
                    }`}
                    onClick={() => setFormData({ ...formData, pricing_type: "hourly" })}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold">{t("hourlyRate")}</p>
                      <p className={`text-xs mt-1 ${formData.pricing_type === "hourly" ? "text-gray-300" : "text-gray-600"}`}>
                        {t("perWorkHour")}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="font-black tracking-tighter">
                  {formData.pricing_type === "hourly" ? t("hourlyRateEur") : t("priceEur")} *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="border-2 border-black"
                />
              </div>

              {formData.price && (
                <div className="p-3 bg-gray-100 border-2 border-black rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>{t("basePrice")}:</span>
                    <span className="font-semibold">{parseFloat(formData.price).toFixed(2)} EUR</span>
                  </div>
                  {formData.is_asap && (
                    <>
                      <div className="flex justify-between text-sm text-red-600">
                        <span>{t("asapSurcharge")} (+{formData.asap_premium_percent}%):</span>
                        <span className="font-semibold">
                          +{(parseFloat(formData.price) * formData.asap_premium_percent / 100).toFixed(2)} EUR
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-300">
                        <span>{t("total")}:</span>
                        <span className="text-green-600">{finalPrice.toFixed(2)} EUR</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white">
            <CardHeader className="p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                {t("subtasks").toUpperCase()} (TODO)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {todos.map((todo, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-100 border-2 border-black rounded-lg"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <span className="flex-1 font-medium">{todo.title}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTodo(index)}
                    className="p-1 h-auto hover:bg-gray-200"
                  >
                    ✕
                  </Button>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder={t("addStep")}
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTodo();
                    }
                  }}
                  className="border-2 border-black"
                />
                <Button
                  type="button"
                  onClick={handleAddTodo}
                  disabled={!newTodoTitle.trim()}
                  className="border-2 border-black bg-white hover:bg-black hover:text-white transition-all"
                >
                  {t("add")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-black bg-white transition-all duration-300 hover:shadow-lg">
            <CardHeader className="p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter flex items-center gap-2">
                <Zap className="w-5 h-5" />
                ASAP — {t("urgentTask").toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 border-2 border-black rounded-lg transition-all duration-300 hover:bg-red-100">
                <div>
                  <Label className="text-base font-black tracking-tighter">{t("markTaskAsUrgent").toUpperCase()}</Label>
                  <p className="text-sm text-gray-600 font-bold mt-1">
                    {t("doersNearbyNotified")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_asap: !formData.is_asap })}
                  className={`relative w-14 h-8 border-2 border-black transition-all duration-300 ${
                    formData.is_asap ? "bg-black" : "bg-white"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 border-2 border-black bg-white transition-all duration-300 ${
                      formData.is_asap ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {formData.is_asap && (
                <div className="space-y-4 p-4 bg-orange-50 border-2 border-black rounded-lg">
                  <div className="space-y-2">
                    <Label className="font-black tracking-tighter">{t("urgencySurcharge").toUpperCase()}</Label>
                    <Select
                      value={formData.asap_premium_percent.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, asap_premium_percent: parseInt(value) })
                      }
                    >
                      <SelectTrigger className="border-2 border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black">
                        <SelectItem value="5">+5% {t("percentOfPrice")}</SelectItem>
                        <SelectItem value="10">+10% {t("percentOfPrice")}</SelectItem>
                        <SelectItem value="15">+15% {t("percentOfPrice")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black tracking-tighter">{t("searchRadius").toUpperCase()}</Label>
                    <Select
                      value={formData.asap_radius_meters.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, asap_radius_meters: parseInt(value) })
                      }
                    >
                      <SelectTrigger className="border-2 border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black">
                        <SelectItem value="250">250 {t("meters")}</SelectItem>
                        <SelectItem value="500">500 {t("meters")}</SelectItem>
                        <SelectItem value="1000">1 {t("kilometers")}</SelectItem>
                        <SelectItem value="2000">2 {t("kilometers")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-black tracking-tighter">{t("responseTime").toUpperCase()}</Label>
                    <Select
                      value={formData.asap_duration_seconds.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, asap_duration_seconds: parseInt(value) })
                      }
                    >
                      <SelectTrigger className="border-2 border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black">
                        <SelectItem value="20">20 {t("seconds")}</SelectItem>
                        <SelectItem value="60">1 {t("minute")}</SelectItem>
                        <SelectItem value="120">2 {t("minutes")}</SelectItem>
                        <SelectItem value="300">5 {t("minutes")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <button
            type="submit"
            className="w-full h-14 md:h-12 text-lg border-4 border-black bg-[#E45826] text-white hover:bg-white hover:text-black transition-all duration-300 font-black tracking-wider mt-6"
            disabled={createTaskMutation.isPending || uploadingPhotos}
          >
            {createTaskMutation.isPending || uploadingPhotos ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadingPhotos ? t("photosUploading").toUpperCase() : t("creating").toUpperCase()}
              </span>
            ) : (
              <span>{t("create").toUpperCase()}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}


import React, { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  TrendingUp,
  LogOut,
  Shield,
  Building2,
  Edit2,
  Save,
  X,
  Camera,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const [editForm, setEditForm] = useState({
    phone: "",
    bio: "",
    avatar_url: "",
    city: "",
  });

  React.useEffect(() => {
    if (user) {
      setEditForm({
        phone: user.phone || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || "",
        city: user.city || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => demoApi.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setIsEditing(false);
    },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await demoApi.integrations.Core.UploadFile({ file });
      setEditForm({ ...editForm, avatar_url: file_url });
    } catch (err) {
      console.error("Error uploading avatar:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleLogout = () => {
    demoApi.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="font-bold text-gray-500">{t("userNotFound")}</p>
      </div>
    );
  }

  // Determine which avatar URL to display based on editing state
  const displayAvatarUrl = isEditing ? editForm.avatar_url : user.avatar_url;

  return (
    <div className="min-h-screen bg-white p-2 md:p-4 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-black text-black tracking-tighter">
            {t("profile").toUpperCase()}
          </h1>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-black text-white border-2 md:border-4 border-black hover:bg-white hover:text-black font-black text-sm md:text-base h-9 md:h-auto"
            >
              <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">{t("edit").toUpperCase()}</span>
              <span className="md:hidden">{t("edit").toUpperCase()}</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="border-2 border-black font-black text-sm md:text-base h-9 md:h-auto px-2 md:px-4"
              >
                <X className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">{t("cancel").toUpperCase()}</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="bg-green-600 text-white border-2 border-black hover:bg-green-700 font-black text-sm md:text-base h-9 md:h-auto px-2 md:px-4"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                    <span className="hidden md:inline">{t("save").toUpperCase()}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Avatar & Basic Info */}
        <Card className="border-2 md:border-4 border-black bg-white mb-4 md:mb-6">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              <div className="relative">
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt={user.full_name}
                    className="w-32 h-32 border-4 border-black object-cover" // Applied outline styling
                  />
                ) : (
                  <div className="w-32 h-32 bg-black text-white flex items-center justify-center text-5xl font-black border-4 border-black"> {/* Applied outline styling */}
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-2 md:mb-3">
                  <h2 className="text-2xl md:text-3xl font-black">{user.full_name}</h2>
                  <div className="flex gap-2">
                    {user.is_verified && (
                      <Badge className="bg-blue-600 text-white border-2 border-black text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {t("verified").toUpperCase()}
                      </Badge>
                    )}
                    {user.user_type === "organization" && (
                      <Badge className="bg-purple-600 text-white border-2 border-black text-xs">
                        <Building2 className="w-3 h-3 mr-1" />
                        ORG
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-sm text-gray-600 font-bold">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Mail className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <Phone className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.city && (
                    <div className="flex items-center gap-1 md:gap-2">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                      <span>{user.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        {isEditing && (
          <Card className="border-2 md:border-4 border-black bg-white mb-4 md:mb-6">
            <CardHeader className="p-3 md:p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter text-lg md:text-xl">
                {t("editProfile").toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="space-y-2">
                <Label className="font-black text-xs md:text-sm">{t("phone").toUpperCase()}</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="border-2 border-black text-sm md:text-base h-9 md:h-10"
                  placeholder="+49..."
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black text-xs md:text-sm">{t("city").toUpperCase()}</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="border-2 border-black text-sm md:text-base h-9 md:h-10"
                  placeholder="Berlin"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black text-xs md:text-sm">{t("bio").toUpperCase()}</Label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="border-2 border-black text-sm md:text-base min-h-[80px] md:min-h-[100px]"
                  placeholder={t("aboutMe") + "..."}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bio */}
        {!isEditing && user.bio && (
          <Card className="border-2 md:border-4 border-black bg-white mb-4 md:mb-6">
            <CardHeader className="p-3 md:p-4 border-b-2 border-black">
              <CardTitle className="font-black tracking-tighter text-lg md:text-xl">{t("aboutMe").toUpperCase()}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <p className="text-sm md:text-base text-gray-700 font-medium">{user.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <Card className="border-2 md:border-4 border-black bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-yellow-500 mb-1 md:mb-2">
                <Star className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">{t("rating").toUpperCase()}</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">{user.rating?.toFixed(1) || "0.0"}</p>
            </CardContent>
          </Card>

          <Card className="border-2 md:border-4 border-black bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-green-600 mb-1 md:mb-2">
                <Award className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">{t("tasks").toUpperCase()}</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">
                {user.user_type === "executor" ? user.total_tasks_completed : user.total_tasks_created || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 md:border-4 border-black bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-blue-600 mb-1 md:mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">LEVEL</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">{user.level || 1}</p>
            </CardContent>
          </Card>

          <Card className="border-2 md:border-4 border-black bg-white">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-purple-600 mb-1 md:mb-2">
                <Award className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">XP</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">{user.xp_points || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full border-2 md:border-4 border-black font-black text-sm md:text-base h-10 md:h-12"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          {t("logout").toUpperCase()}
        </Button>
      </div>
    </div>
  );
}

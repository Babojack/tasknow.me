import { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Camera,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function VerificationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState({
    front: false,
    back: false,
    selfie: false,
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: verificationRequest } = useQuery({
    queryKey: ["verification", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const requests = await demoApi.entities.VerificationRequest.filter(
        {
          user_id: user.id,
        },
        "-created_date"
      );
      return requests[0] || null;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    document_type: "id_card",
    document_front_url: "",
    document_back_url: "",
    selfie_url: "",
  });

  const submitVerificationMutation = useMutation({
    mutationFn: async (data) => {
      return demoApi.entities.VerificationRequest.create({
        ...data,
        user_id: user.id,
        user_type: user.user_type,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    onError: (err) => {
      setError(t("errorSendingRequest"));
      console.error(err);
    },
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading({ ...uploading, [field]: true });
    try {
      const { file_url } = await demoApi.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [`${field}_url`]: file_url });
    } catch (err) {
      setError(t("errorLoadingFile"));
      console.error(err);
    } finally {
      setUploading({ ...uploading, [field]: false });
    }
  };

  const handleSubmit = () => {
    if (!formData.document_front_url || !formData.selfie_url) {
      setError(t("uploadAllDocuments"));
      return;
    }

    if (
      ["id_card", "drivers_license"].includes(formData.document_type) &&
      !formData.document_back_url
    ) {
      setError(t("uploadBackOfDocument"));
      return;
    }

    submitVerificationMutation.mutate(formData);
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_started: { color: "bg-gray-200 text-gray-800", icon: AlertCircle, text: t("notStarted") },
      pending: { color: "bg-yellow-200 text-yellow-800", icon: Clock, text: t("underReview") },
      approved: { color: "bg-green-200 text-green-800", icon: CheckCircle, text: t("approved") },
      rejected: { color: "bg-red-200 text-red-800", icon: XCircle, text: t("rejected") },
    };

    const badge = badges[status] || badges.not_started;
    const Icon = badge.icon;

    return (
      <Badge className={`${badge.color} flex items-center gap-1`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If already verified
  if (user.is_verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-300 bg-green-50">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t("youAreVerified")}
              </h2>
              <p className="text-gray-600 mb-6">
                {t("accountVerified")}
              </p>
              <Button
                onClick={() => navigate(createPageUrl("Profile"))}
                className="bg-green-600 hover:bg-green-700"
              >
                {t("goToProfile")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If request is pending
  if (verificationRequest?.status === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-yellow-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-yellow-300 bg-yellow-50">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t("requestUnderReview")}
              </h2>
              <p className="text-gray-600 mb-6">
                {t("weReviewYourDocuments")}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("Profile"))}
              >
                {t("backToProfile")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If rejected
  if (verificationRequest?.status === "rejected") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t("requestRejected")}
                </h2>
                <p className="text-gray-600">
                  {t("requestNotApproved")}
                </p>
              </div>

              {verificationRequest.rejection_reason && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>
                    <strong>{t("reason")}:</strong> {verificationRequest.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => {
                  setFormData({
                    document_type: "id_card",
                    document_front_url: "",
                    document_back_url: "",
                    selfie_url: "",
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {t("submitAgain")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Verification form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Profile"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("accountVerification")}</h1>
            <p className="text-gray-600 mt-1">
              {t("verifyIdentity")}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              {t("uploadDocuments")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Type */}
            <div className="space-y-2">
              <Label>{t("documentType")}</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_card">{t("idCard")}</SelectItem>
                  <SelectItem value="passport">{t("passport")}</SelectItem>
                  <SelectItem value="drivers_license">{t("driversLicense")}</SelectItem>
                  {user.user_type === "organization" && (
                    <SelectItem value="business_registration">
                      {t("businessRegistration")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Document Front */}
            <div className="space-y-2">
              <Label>{t("documentFront")}</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {formData.document_front_url ? (
                  <div className="space-y-3">
                    <img
                      src={formData.document_front_url}
                      alt="Document front"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, document_front_url: "" })}
                    >
                      {t("change")}
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "document_front")}
                      className="hidden"
                    />
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    {uploading.front ? (
                      <p className="text-gray-600">{t("uploading")}</p>
                    ) : (
                      <>
                        <p className="text-gray-700 font-medium">
                          {t("clickToUpload")}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t("pngJpgUpTo10mbShort")}
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Document Back (if needed) */}
            {["id_card", "drivers_license"].includes(formData.document_type) && (
              <div className="space-y-2">
                <Label>{t("documentBack")}</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  {formData.document_back_url ? (
                    <div className="space-y-3">
                      <img
                        src={formData.document_back_url}
                        alt="Document back"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, document_back_url: "" })}
                      >
                        {t("change")}
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "document_back")}
                        className="hidden"
                      />
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      {uploading.back ? (
                        <p className="text-gray-600">{t("uploading")}</p>
                      ) : (
                        <>
                          <p className="text-gray-700 font-medium">
                            {t("clickToUpload")}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {t("pngJpgUpTo10mbShort")}
                          </p>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Selfie */}
            <div className="space-y-2">
              <Label>{t("selfieWithDocument")}</Label>
              <p className="text-sm text-gray-600">
                {t("selfieInstruction")}
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {formData.selfie_url ? (
                  <div className="space-y-3">
                    <img
                      src={formData.selfie_url}
                      alt="Selfie"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, selfie_url: "" })}
                    >
                      {t("change")}
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "selfie")}
                      className="hidden"
                    />
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    {uploading.selfie ? (
                      <p className="text-gray-600">{t("uploading")}</p>
                    ) : (
                      <>
                        <p className="text-gray-700 font-medium">
                          {t("clickToUpload")}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t("pngJpgUpTo10mbShort")}
                        </p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                {t("importantInfo")}
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>{t("verificationTips1")}</li>
                <li>{t("verificationTips2")}</li>
                <li>{t("verificationTips3")}</li>
                <li>{t("verificationTips4")}</li>
              </ul>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitVerificationMutation.isPending}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {submitVerificationMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t("sending")}</span>
                </div>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  {t("submitForReview")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
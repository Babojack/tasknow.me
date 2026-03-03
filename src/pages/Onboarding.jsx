import { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Briefcase, User, Building2, CheckCircle, AlertCircle, Zap, Loader2 } from "lucide-react";
import { useTranslation } from "@/components/i18n/TranslationContext";
import { motion } from "framer-motion";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [error, setError] = useState(null);
  
  // NEUE FELDER
  const [isNonEU, setIsNonEU] = useState(false);
  const [organizationTaxId, setOrganizationTaxId] = useState("");
  const [idDocumentFront, setIdDocumentFront] = useState(null);
  const [idDocumentBack, setIdDocumentBack] = useState(null);
  const [workPermit, setWorkPermit] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      setUploading(true);
      
      try {
        let idFrontUrl = null;
        let idBackUrl = null;
        let workPermitUrl = null;

        // DOKUMENTE HOCHLADEN
        if (idDocumentFront) {
          const { file_url } = await demoApi.integrations.Core.UploadFile({ file: idDocumentFront });
          idFrontUrl = file_url;
        }

        if (idDocumentBack) {
          const { file_url } = await demoApi.integrations.Core.UploadFile({ file: idDocumentBack });
          idBackUrl = file_url;
        }

        if (workPermit && isNonEU) {
          const { file_url } = await demoApi.integrations.Core.UploadFile({ file: workPermit });
          workPermitUrl = file_url;
        }

        // VERIFICATION REQUEST ERSTELLEN
        await demoApi.entities.VerificationRequest.create({
          user_id: user.id,
          user_type: selectedType,
          status: "pending",
          document_type: "id_card",
          document_front_url: idFrontUrl,
          document_back_url: idBackUrl,
          work_permit_url: workPermitUrl,
        });

        // USER UPDATEN
        const updateData = {
          user_type: selectedType,
          onboarding_completed: true,
          subscribe_newsletter: subscribeNewsletter,
          verification_status: "pending",
        };

        if (selectedType === "organization") {
          updateData.organization_tax_id = organizationTaxId;
        }

        await demoApi.auth.updateMe(updateData);
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      if (selectedType === "executor") {
        navigate(createPageUrl("Map"));
      } else {
        navigate(createPageUrl("CustomerTasks"));
      }
    },
    onError: (err) => {
      setError(t("errorSaving"));
      setUploading(false);
    },
  });

  const handleContinue = () => {
    if (!selectedType) {
      setError(t("selectUserType"));
      return;
    }
    
    if (!agreeToTerms) {
      setError(t("termsRequired"));
      return;
    }

    // VALIDIERUNG FÜR DOKUMENTE
    if (!idDocumentFront || !idDocumentBack) {
      setError(t("uploadBothSidesOfId"));
      return;
    }

    if (isNonEU && !workPermit) {
      setError(t("uploadWorkPermit"));
      return;
    }

    if (selectedType === "organization" && !organizationTaxId) {
      setError(t("enterTaxId"));
      return;
    }

    setError(null);
    updateUserMutation.mutate();
  };

  const userTypes = [
    {
      type: "executor",
      icon: Briefcase,
      title: t("executor"),
      description: t("acceptTasksEarnMoney"),
      color: "bg-blue-50 border-blue-600 hover:bg-blue-100",
    },
    {
      type: "customer",
      icon: User,
      title: t("customer"),
      description: t("createTasksFindHelpers"),
      color: "bg-green-50 border-green-600 hover:bg-green-100",
    },
    {
      type: "organization",
      icon: Building2,
      title: t("organization"),
      description: t("manageTasksForBusiness"),
      color: "bg-purple-50 border-purple-600 hover:bg-purple-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-4 border-black shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-black mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black text-black tracking-tighter mb-2">
                {t("welcome")}
              </h1>
              <p className="text-gray-600 font-bold">
                {t("selectUserType")}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 border-2 border-red-600 bg-red-50 p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-bold text-red-600">{error}</p>
              </motion.div>
            )}

            {/* User Type Selection */}
            <div className="grid gap-4 mb-8">
              {userTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.type;
                
                return (
                  <motion.button
                    key={type.type}
                    onClick={() => setSelectedType(type.type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-6 border-4 border-black transition-all text-left relative overflow-hidden ${
                      isSelected
                        ? "bg-[#E45826] text-white"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`w-12 h-12 border-2 border-black flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-white text-black" : "bg-black text-white"
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black mb-1">{type.title}</h3>
                        <p className={`text-sm ${isSelected ? "text-white" : "text-gray-600"} font-bold`}>
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-6 h-6 shrink-0" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* DOKUMENTE HOCHLADEN */}
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 mb-8"
              >
                <div className="border-4 border-black p-6 bg-gray-50">
                  <h3 className="font-black text-lg mb-4">DOKUMENTE HOCHLADEN</h3>
                  
                  {/* AUSWEIS VORDERSEITE */}
                  <div className="space-y-2 mb-4">
                    <Label className="font-black">{t("idFront")}</Label>
                    <div className="border-2 border-black p-4 bg-white">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setIdDocumentFront(e.target.files[0])}
                        className="border-0 p-0"
                      />
                      {idDocumentFront && (
                        <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {idDocumentFront.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AUSWEIS RÜCKSEITE */}
                  <div className="space-y-2 mb-4">
                    <Label className="font-black">{t("idBack")}</Label>
                    <div className="border-2 border-black p-4 bg-white">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setIdDocumentBack(e.target.files[0])}
                        className="border-0 p-0"
                      />
                      {idDocumentBack && (
                        <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {idDocumentBack.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* NON-EU CHECKBOX */}
                  {selectedType === "executor" && (
                    <div className="flex items-center gap-3 mb-4">
                      <Checkbox
                        id="nonEU"
                        checked={isNonEU}
                        onCheckedChange={setIsNonEU}
                        className="border-2 border-black data-[state=checked]:bg-[#E45826] data-[state=checked]:border-[#E45826]"
                      />
                      <Label htmlFor="nonEU" className="font-bold cursor-pointer">
                        {t("notEUCitizen")}
                      </Label>
                    </div>
                  )}

                  {/* ARBEITSGENEHMIGUNG (NUR FÜR NON-EU) */}
                  {isNonEU && selectedType === "executor" && (
                    <div className="space-y-2 mb-4">
                      <Label className="font-black">Arbeitsgenehmigung *</Label>
                      <div className="border-2 border-black p-4 bg-white">
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setWorkPermit(e.target.files[0])}
                          className="border-0 p-0"
                        />
                        {workPermit && (
                          <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {workPermit.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEUERIDENTIFIKATIONSNUMMER (NUR FÜR ORGANIZATIONS) */}
                  {selectedType === "organization" && (
                    <div className="space-y-2">
                      <Label className="font-black">{t("taxId")}</Label>
                      <Input
                        placeholder="DE123456789"
                        value={organizationTaxId}
                        onChange={(e) => setOrganizationTaxId(e.target.value)}
                        className="border-2 border-black"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Terms & Newsletter */}
            <div className="space-y-4 mb-8 border-4 border-black p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={setAgreeToTerms}
                  className="mt-1 border-2 border-black data-[state=checked]:bg-[#E45826] data-[state=checked]:border-[#E45826]"
                />
                <Label htmlFor="terms" className="font-bold cursor-pointer">
                  {t("agreeToTerms")} <span className="text-red-600">*</span>
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="newsletter"
                  checked={subscribeNewsletter}
                  onCheckedChange={setSubscribeNewsletter}
                  className="mt-1 border-2 border-black data-[state=checked]:bg-[#E45826] data-[state=checked]:border-[#E45826]"
                />
                <Label htmlFor="newsletter" className="font-bold cursor-pointer">
                  {t("subscribeNewsletter")}
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleContinue}
              disabled={updateUserMutation.isPending || uploading || !selectedType || !agreeToTerms}
              className="w-full h-14 text-lg bg-[#E45826] text-white hover:bg-white hover:text-black border-4 border-black font-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading || updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t("uploadingShort")}
                </>
              ) : (
                t("getStarted")
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
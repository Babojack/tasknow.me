import React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Send,
  Shield,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Euro,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { motion } from "framer-motion";
import { TranslationProvider, useTranslation } from "@/components/i18n/TranslationContext";
import { useAuth } from "@/lib/AuthContext";

function LandingContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user, setUserType } = useAuth();
  const [showRolePicker, setShowRolePicker] = React.useState(false);

  const handleLogin = () => {
    setShowRolePicker(true);
  };

  const handleGoToApp = () => {
    if (user?.user_type === "executor") {
      navigate(createPageUrl("Map"));
    } else if (user?.user_type === "customer" || user?.user_type === "organization") {
      navigate(createPageUrl("CustomerTasks"));
    } else {
      navigate(createPageUrl("Map"));
    }
  };

  const handleContinueAsDoer = () => {
    setUserType("executor");
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setShowRolePicker(false);
    navigate(createPageUrl("Map"));
  };

  const handleContinueAsTasker = () => {
    setUserType("customer");
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    setShowRolePicker(false);
    navigate(createPageUrl("CustomerTasks"));
  };

  const handleBlogClick = () => {
    navigate(createPageUrl("blog"));
  };

  const handleComingSoonClick = () => {
    navigate(createPageUrl("ComingSoon"));
  };

  const steps = [
    {
      number: "01",
      titleKey: "step1",
      descKey: "step1Desc",
    },
    {
      number: "02",
      titleKey: "step2",
      descKey: "step2Desc",
    },
    {
      number: "03",
      titleKey: "step3",
      descKey: "step3Desc",
    },
    {
      number: "04",
      titleKey: "step4",
      descKey: "step4Desc",
    },
  ];

  const features = [
    {
      icon: Zap,
      titleKey: "asapMode",
      descKey: "asapModeDesc",
    },
    {
      icon: Shield,
      titleKey: "verifiedUsers",
      descKey: "verifiedUsersDesc",
    },
    {
      icon: Euro,
      titleKey: "fairPrices",
      descKey: "fairPricesDesc",
    },
    {
      icon: MapPin,
      titleKey: "localHelpers",
      descKey: "localHelpersDesc",
    },
  ];

  const benefitKeys = [
    "noCommission",
    "securePayment",
    "ratingSystem",
    "support247",
    "insuranceCoverage",
    "fastPayout",
  ];

  return (
    <div className="min-h-screen bg-white relative">
      <Dialog open={showRolePicker} onOpenChange={setShowRolePicker}>
        <DialogContent className="sm:max-w-md border-2 md:border-4 border-black bg-white p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl md:text-2xl font-black tracking-tighter text-center">
              {t("chooseRole")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 pt-4">
            <Card
              className="border-2 md:border-4 border-black cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all hover:border-[#E45826]"
              onClick={handleContinueAsDoer}
            >
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#E45826] border-2 border-black mx-auto mb-3 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h4 className="text-lg font-black mb-1">{t("roleDoer")}</h4>
                <p className="text-sm text-gray-600 font-bold">{t("earnWithSkills")}</p>
                <Button className="mt-3 w-full bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black text-sm">
                  {t("roleDoer")}
                </Button>
              </CardContent>
            </Card>
            <Card
              className="border-2 md:border-4 border-black cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all hover:border-[#E45826]"
              onClick={handleContinueAsTasker}
            >
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#E45826] border-2 border-black mx-auto mb-3 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h4 className="text-lg font-black mb-1">{t("roleTasker")}</h4>
                <p className="text-sm text-gray-600 font-bold">{t("tasksInMinutes")}</p>
                <Button className="mt-3 w-full bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black text-sm">
                  {t("roleTasker")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed inset-0 bg-[linear-gradient(#e5e7eb_1px,transparent_1px),linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] bg-[size:100px_100px] opacity-50 pointer-events-none z-0" />

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-40px, 30px) rotate(-120deg); }
          66% { transform: translate(25px, -25px) rotate(-240deg); }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, 40px) rotate(180deg); }
        }

        .floating-shape {
          position: absolute;
          opacity: 0.08;
          pointer-events: none;
        }

        .shape-1 {
          top: 10%;
          left: 8%;
          width: 200px;
          height: 200px;
          border: 3px solid #000;
          border-radius: 50%;
          animation: float1 20s ease-in-out infinite;
        }

        .shape-2 {
          top: 60%;
          left: 15%;
          width: 150px;
          height: 150px;
          border: 3px solid #000;
          border-radius: 50%;
          animation: float2 25s ease-in-out infinite;
        }

        .shape-3 {
          top: 15%;
          right: 10%;
          width: 180px;
          height: 180px;
          border: 3px solid #000;
          animation: float3 22s ease-in-out infinite;
        }

        .shape-4 {
          bottom: 15%;
          right: 12%;
          width: 220px;
          height: 220px;
          border: 3px solid #000;
          transform: rotate(45deg);
          animation: float1 28s ease-in-out infinite reverse;
        }

        .shape-5 {
          top: 45%;
          left: 5%;
          width: 100px;
          height: 100px;
          border: 3px solid #000;
          border-radius: 50%;
          animation: float2 18s ease-in-out infinite;
        }

        .shape-6 {
          bottom: 25%;
          left: 20%;
          width: 120px;
          height: 120px;
          border: 3px solid #000;
          animation: float3 24s ease-in-out infinite;
        }
      `}</style>

      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-black flex items-center justify-center">
              <Zap className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <h1 className="text-lg md:text-2xl font-black text-black tracking-tighter">TASKNOW</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              onClick={handleBlogClick}
              variant="ghost"
              className="hidden lg:flex border-2 border-black bg-white hover:bg-black hover:text-white font-black"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              BLOG
            </Button>

            <Button
              onClick={handleComingSoonClick}
              variant="ghost"
              className="hidden lg:flex border-2 border-black bg-white hover:bg-[#E45826] hover:text-white font-black"
            >
              🚀 COMING SOON
            </Button>

            {user ? (
              <button
                onClick={handleLogin}
                className="w-10 h-10 rounded-full border-2 border-black bg-white hover:bg-[#E45826] hover:border-[#E45826] transition-all flex items-center justify-center shrink-0 overflow-hidden"
                title={user.full_name}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black text-white flex items-center justify-center font-black text-sm">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </button>
            ) : (
              <Button
                onClick={handleLogin}
                className="bg-[#E45826] text-white border-2 border-black hover:bg-white hover:text-black font-black transition-all text-xs md:text-base px-3 py-1.5 md:px-4 md:py-2 h-auto"
              >
                {t("getStarted")}
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center justify-center px-3 md:px-4 overflow-hidden">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
        <div className="floating-shape shape-5"></div>
        <div className="floating-shape shape-6"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 border-2 border-black bg-white mb-6 md:mb-8 font-bold text-xs md:text-base">
              <Zap className="w-4 h-4 md:w-5 md:h-5" />
              {t("betaJoin")}
            </div>

            <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-black tracking-tighter mb-4 md:mb-6">
              TASKNOW
            </h1>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-700 mb-4 md:mb-6">
              {t("landingTagline")}
            </h2>

            <p className="text-base md:text-xl text-gray-600 font-medium mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
              {t("fastestPlatform")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
              <Button
                onClick={handleLogin}
                size="lg"
                className="h-12 md:h-16 px-6 md:px-10 text-base md:text-lg bg-black text-white border-2 md:border-4 border-black hover:bg-white hover:text-black font-black transition-all"
              >
                <ArrowRight className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                {t("login").toUpperCase()}
              </Button>
              <Button
                onClick={handleLogin}
                size="lg"
                variant="outline"
                className="h-12 md:h-16 px-6 md:px-10 text-base md:text-lg bg-white text-black border-2 md:border-4 border-black hover:bg-[#E45826] hover:text-white hover:border-[#E45826] font-black transition-all"
              >
                <Users className="mr-2 w-4 h-4 md:w-5 md:h-5" />
                {t("register").toUpperCase()}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center text-sm md:text-base font-bold text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{t("freeRegistration")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{t("verifiedUsers")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{t("securePaymentTitle")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-3 md:px-4 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tighter mb-3 md:mb-4">
              {t("whyTaskNow")}
            </h3>
            <p className="text-base md:text-xl text-gray-600 font-bold max-w-3xl mx-auto">
              {t("intelligentPlatform")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="border-2 md:border-4 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px]] transition-all h-full">
                    <CardContent className="p-4 md:p-6">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-[#E45826] border-2 md:border-4 border-black mb-3 md:mb-4 flex items-center justify-center">
                        <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                      </div>
                      <h4 className="text-lg md:text-xl font-black mb-2 md:mb-3">{t(feature.titleKey)}</h4>
                      <p className="text-sm md:text-base text-gray-600 font-bold leading-relaxed">{t(feature.descKey)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 bg-gray-50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="border-2 md:border-4 border-black bg-white overflow-hidden">
                <img
                  src="https://s1.directupload.eu/images/251026/umawdd2a.png"
                  alt="TaskNow for taskers"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="inline-block mb-3 md:mb-4 px-3 py-1.5 md:px-4 md:py-2 bg-black text-white font-black border-2 border-black text-xs md:text-base">
                {t("forCustomers")}
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-black tracking-tighter mb-4 md:mb-6">
                {t("tasksInMinutes")}
              </h3>
              <p className="text-base md:text-lg text-gray-600 font-bold mb-4 md:mb-6 leading-relaxed">
                {t("noTimeForShopping")}
              </p>
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#E45826] border-2 border-black shrink-0 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black mb-1 text-sm md:text-base">{t("verifiedHelpersTitle")}</h5>
                    <p className="text-xs md:text-sm text-gray-600 font-bold">{t("verifiedHelpersDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#E45826] border-2 border-black shrink-0 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black mb-1 text-sm md:text-base">{t("securePaymentTitle")}</h5>
                    <p className="text-xs md:text-sm text-gray-600 font-bold">{t("securePaymentDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#E45826] border-2 border-black shrink-0 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black mb-1 text-sm md:text-base">{t("support24Title")}</h5>
                    <p className="text-xs md:text-sm text-gray-600 font-bold">{t("support24Desc")}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-[#E45826] text-white border-2 md:border-4 border-black hover:bg-white hover:text-black font-black h-12 md:h-14 px-6 md:px-8 text-sm md:text-base"
              >
                {t("createTaskNow")}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="inline-block mb-3 md:mb-4 px-3 py-1.5 md:px-4 md:py-2 bg-black text-white font-black border-2 border-black text-xs md:text-base">
                {t("forExecutors")}
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-black tracking-tighter mb-4 md:mb-6">
                {t("earnWithSkills")}
              </h3>
              <p className="text-base md:text-lg text-gray-600 font-bold mb-4 md:mb-6 leading-relaxed">
                {t("useYourTime")}
              </p>
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#E45826] border-2 border-black shrink-0 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black mb-1 text-sm md:text-base">{t("flexibleHours")}</h5>
                    <p className="text-xs md:text-sm text-gray-600 font-bold">{t("flexibleHoursDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#E45826] border-2 border-black shrink-0 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black mb-1 text-sm md:text-base">{t("instantPayout")}</h5>
                    <p className="text-xs md:text-sm text-gray-600 font-bold">{t("instantPayoutDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-[#E45826] border-2 border-black shrink-0 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-black mb-1 text-sm md:text-base">{t("buildReputation")}</h5>
                    <p className="text-xs md:text-sm text-gray-600 font-bold">{t("buildReputationDesc")}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-[#E45826] text-white border-2 md:border-4 border-black hover:bg-white hover:text-black font-black h-12 md:h-14 px-6 md:px-8 text-sm md:text-base"
              >
                {t("startEarning")}
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>

            <div>
              <div className="border-2 md:border-4 border-black bg-white overflow-hidden">
                <img
                  src="https://s1.directupload.eu/images/251026/8ifxz8bw.png"
                  alt="TaskNow for doers"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-12 md:py-20 px-3 md:px-4 bg-gray-50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tighter mb-3 md:mb-4">
              {t("landingHowItWorks")}
            </h3>
            <p className="text-base md:text-xl text-gray-600 font-bold max-w-3xl mx-auto">
              {t("landingHowItWorks")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {steps.map((step, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative"
                >
                  <Card className="border-2 md:border-4 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px]] transition-all h-full">
                    <CardContent className="p-6 md:p-8 text-center">
                      <div className="absolute -top-4 md:-top-6 left-1/2 -translate-x-1/2 w-8 h-8 md:w-12 md:h-12 bg-[#E45826] border-2 md:border-4 border-black flex items-center justify-center">
                        <span className="text-lg md:text-2xl font-black text-white">{step.number}</span>
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4 mt-3 md:mt-4">
                      </div>
                      <h4 className="text-xl md:text-2xl font-black mb-2 md:mb-3">{t(step.titleKey)}</h4>
                      <p className="text-sm md:text-base text-gray-600 font-bold leading-relaxed">{t(step.descKey)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-3 md:px-4 bg-white relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tighter mb-6 md:mb-10">
            {t("yourBenefits")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
            {benefitKeys.map((benefitKey, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-center gap-3 md:gap-4 p-4 md:p-5 border-2 md:border-4 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-[#E45826] shrink-0" />
                <span className="text-base md:text-lg font-bold text-gray-700">{t(benefitKey)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20 px-3 md:px-4 bg-black text-white relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6 tracking-tighter">
            {t("readyToStart")}
          </h3>
          <p className="text-base md:text-xl font-bold mb-6 md:mb-8 text-gray-300">
            {t("joinThousands")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-2 md:border-4 border-white hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px]] transition-all cursor-pointer bg-white" onClick={handleLogin}>
              <CardContent className="p-6 md:p-8 text-center">
                <Users className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-black" />
                <h4 className="text-xl md:text-2xl font-black mb-2 text-black">{t("landingExecutor")}</h4>
                <p className="text-sm md:text-base text-gray-600 font-bold mb-3 md:mb-4">{t("earnWithSkills")}</p>
                <Button className="w-full bg-[#E45826] text-white border-2 border-black hover:bg-black hover:text-white font-black text-sm md:text-base">
                  {t("register")}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 md:border-4 border-white hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px]] transition-all cursor-pointer bg-white" onClick={handleLogin}>
              <CardContent className="p-6 md:p-8 text-center">
                <CheckCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-black" />
                <h4 className="text-xl md:text-2xl font-black mb-2 text-black">{t("landingCustomer")}</h4>
                <p className="text-sm md:text-base text-gray-600 font-bold mb-3 md:mb-4">{t("tasksInMinutes")}</p>
                <Button className="w-full bg-[#E45826] text-white border-2 border-black hover:bg-black hover:text-white font-black text-sm md:text-base">
                  {t("createTaskNow")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t-2 md:border-t-4 border-black bg-white py-8 md:py-12 px-3 md:px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black flex items-center justify-center">
                  <Zap className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-black">TASKNOW</h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 font-bold leading-relaxed mb-3 md:mb-4">
                {t("footerPlatform")}
              </p>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/4915901234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-2 border-black bg-green-500 text-white hover:bg-white hover:text-black transition-all font-bold text-xs md:text-sm"
                >
                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                  WhatsApp
                </a>
                <a
                  href="https://t.me/tasknow_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 border-2 border-black bg-blue-500 text-white hover:bg-white hover:text-black transition-all font-bold text-xs md:text-sm"
                >
                  <Send className="w-3 h-3 md:w-4 md:h-4" />
                  Telegram
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-black text-base md:text-lg mb-3 md:mb-4 border-b-2 border-black pb-2">{t("quickLinks")}</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors">
                    {t("aboutUs")}
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors">
                    {t("howItWorks")}
                  </a>
                </li>
                <li>
                  <button
                    onClick={handleBlogClick}
                    className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors"
                  >
                    Blog
                  </button>
                </li>
                <li>
                  <button
                    onClick={handleComingSoonClick}
                    className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors"
                  >
                    Coming Soon
                  </button>
                </li>
                <li>
                  <a href="#" className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors">
                    {t("faq")}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-base md:text-lg mb-3 md:mb-4 border-b-2 border-black pb-2">{t("legal")}</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors">
                    {t("terms")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors">
                    {t("privacy")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors">
                    {t("imprint")}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm md:text-base text-gray-600 hover:text-[#E45826] font-bold transition-colors">
                    {t("cookiePolicy")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 md:pt-8 border-t-2 border-black">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs md:text-base text-gray-600 font-bold text-center md:text-left">
                © 2025 TaskNow. {t("madeWithLove")}
              </p>

              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 border-2 border-black bg-white hover:bg-[#E45826] hover:text-white transition-all flex items-center justify-center"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 border-2 border-black bg-white hover:bg-[#E45826] hover:text-white transition-all flex items-center justify-center"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 border-2 border-black bg-white hover:bg-[#E45826] hover:text-white transition-all flex items-center justify-center"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <TranslationProvider>
      <LandingContent />
    </TranslationProvider>
  );
}
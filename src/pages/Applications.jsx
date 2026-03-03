
import { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, CheckCircle, XCircle, MessageSquare, User, Award, Clock, CheckCheck, X, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [applicationToAccept, setApplicationToAccept] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // BEWERBUNGEN LADEN
      const apps = await demoApi.entities.TaskApplication.filter({ customer_id: user.id }, "-created_date");

      if (apps.length === 0) return [];

      // EXECUTOR IDs SAMMELN
      const executorIds = [...new Set(apps.map(app => app.executor_id).filter(Boolean))];

      // ALLE EXECUTORS AUF EINMAL LADEN (EFFIZIENTER!)
      let executorMap = new Map();
      
      if (executorIds.length > 0) {
        try {
          const executors = await demoApi.entities.User.filter({ 
            id: { in: executorIds } 
          });
          executorMap = new Map(executors.map(executor => [executor.id, executor]));
          console.log("✅ Loaded executors:", executorMap);
        } catch (err) {
          console.error("⚠️ Could not load all executors in batch, attempting individual fetches:", err);
          // FALLBACK: Versuche einzeln zu laden
          for (const executorId of executorIds) {
            try {
              const execs = await demoApi.entities.User.filter({ id: executorId });
              if (execs.length > 0) {
                executorMap.set(executorId, execs[0]);
              }
            } catch (e) {
              console.error(`⚠️ Could not load executor ${executorId} individually:`, e);
            }
          }
        }
      }

      // BEWERBUNGEN MIT EXECUTOR-DATEN ANREICHERN
      return apps.map(app => {
        const executorUser = executorMap.get(app.executor_id);
        console.log("📝 Application executor data:", {
          executor_id: app.executor_id,
          executorUser,
          full_name: executorUser?.full_name,
          is_verified: executorUser?.is_verified
        });
        
        return {
          ...app,
          executor_user: executorUser || null,
          executor_name: executorUser?.full_name || `Executor ${app.executor_id?.slice(0, 8)}` || "Unknown",
          executor_avatar_url: executorUser?.avatar_url || null,
          executor_rating: executorUser?.rating || null,
          executor_completed_tasks: executorUser?.total_tasks_completed || 0,
          executor_is_verified: executorUser?.is_verified || false,
        };
      });
    },
    enabled: !!user,
    refetchInterval: 5000,
    retry: 1,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["customer-tasks"],
    queryFn: () =>
      user ? demoApi.entities.Task.filter({ owner_id: user.id }) : [],
    enabled: !!user,
  });

  const { data: applicationsCount = {} } = useQuery({
    queryKey: ["applicationsCount", user?.id],
    queryFn: async () => {
      if (!user) return {};
      const apps = await demoApi.entities.TaskApplication.filter({ customer_id: user.id });
      const counts = {};
      apps.forEach(app => {
        if (!counts[app.task_id]) counts[app.task_id] = 0;
        if (app.status === "pending") counts[app.task_id]++;
      });
      return counts;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const getTaskForApplication = (app) => {
    return tasks.find((t) => t.id === app.task_id);
  };

  const acceptApplicationMutation = useMutation({
    mutationFn: async ({ application, task }) => {
      // 1. APPLICATION AUF ACCEPTED SETZEN
      await demoApi.entities.TaskApplication.update(application.id, { status: "accepted" });
      
      // 2. ALLE ANDEREN APPLICATIONS ABLEHNEN
      const otherApps = applications.filter(app => 
        app.task_id === task.id && app.id !== application.id
      );
      await Promise.all(
        otherApps.map(app =>
          demoApi.entities.TaskApplication.update(app.id, { status: "rejected" })
        )
      );
      
      // 3. TASK STATUS UND EXECUTOR SETZEN
      await demoApi.entities.Task.update(task.id, {
        status: "accepted",
        executor_id: application.executor_id,
        accepted_at: new Date().toISOString(),
      });

      // EMAIL BENACHRICHTIGUNG
      try {
        const executorUsers = await demoApi.entities.User.filter({ id: application.executor_id });
        const executor = executorUsers[0];
        
        if (executor?.email) {
          await demoApi.integrations.Core.SendEmail({
            to: executor.email,
            subject: `✅ Your application was accepted - ${task?.title}`,
            body: `Hello ${executor?.full_name || 'User'},\n\nYour application for the task "${task?.title}" has been accepted!\n\nYou can now communicate with the tasker and start the task.\n\nGood luck!\nTaskNow Team`
          });
        }
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }

      return { application, task };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["customer-tasks"] });
      setShowProfileDialog(false);
      setConfirmDialogOpen(false);
      setApplicationToAccept(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (applicationId) =>
      demoApi.entities.TaskApplication.update(applicationId, { status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setShowProfileDialog(false);
      setConfirmDialogOpen(false);
      setApplicationToAccept(null);
    },
  });

  const handleAcceptClick = (application) => {
    setApplicationToAccept(application);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAccept = () => {
    if (applicationToAccept) {
      const task = getTaskForApplication(applicationToAccept);
      if (task) {
        acceptApplicationMutation.mutate({ application: applicationToAccept, task: task });
      } else {
        console.error("Task not found for application:", applicationToAccept);
      }
    }
  };

  const handleStartChat = async (application) => {
    if (!user || !application) return;

    const existingMessages = await demoApi.entities.Message.filter({
      task_id: application.task_id,
      $or: [
        { from_user_id: user.id, to_user_id: application.executor_id },
        { from_user_id: application.executor_id, to_user_id: user.id }
      ]
    });

    if (existingMessages.length === 0) {
      await demoApi.entities.Message.create({
        task_id: application.task_id,
        from_user_id: user.id,
        to_user_id: application.executor_id,
        message_text: t("helloMessage"),
        is_read: false,
      });

      try {
        const executorUsers = await demoApi.entities.User.filter({ id: application.executor_id });
        const executor = executorUsers[0];
        
        if (executor?.email) {
          demoApi.integrations.Core.SendEmail({
            to: executor.email,
            subject: `💬 New message from the tasker`,
            body: `Hello ${executor.full_name},\n\nThe tasker would like to discuss details about your application.\n\nReply now in the TaskNow app.\n\nTaskNow Team`
          }).catch(err => console.error("Email error:", err));
        }
      } catch (emailErr) {
        console.error("Failed to send chat initiation email:", emailErr);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["messages"] });
    
    navigate(
      createPageUrl("Chat") +
        `?taskId=${application.task_id}&userId=${application.executor_id}`
    );
  };

  const pendingApps = applications.filter((a) => a.status === "pending");
  const acceptedApps = applications.filter((a) => a.status === "accepted");
  const rejectedApps = applications.filter((a) => a.status === "rejected");

  const openChat = (application) => {
    navigate(
      createPageUrl("Chat") +
        `?taskId=${application.task_id}&userId=${application.executor_id}`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-2 md:p-4 lg:p-8 pb-24 md:pb-8 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 md:w-12 md:h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2 md:p-4 lg:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-black text-black tracking-tighter mb-1 md:mb-2">
            {t("applications").toUpperCase()}
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-bold">
            {t("applicationsToYourTasks")}
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full h-auto bg-transparent border-0 gap-2 mb-4 md:mb-6 p-0 grid grid-cols-3">
            <TabsTrigger 
              value="pending" 
              className="h-auto p-0 border-2 md:border-4 border-black bg-white data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
            >
              <div className="w-full py-3 md:py-4 px-2 md:px-3 flex flex-col items-center gap-1 md:gap-2">
                <Clock className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-black tracking-wider">{t("new").toUpperCase()}</span>
                <div className="text-2xl md:text-3xl font-black">{pendingApps.length}</div>
              </div>
            </TabsTrigger>

            <TabsTrigger 
              value="accepted" 
              className="h-auto p-0 border-2 md:border-4 border-black bg-white data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all"
            >
              <div className="w-full py-3 md:py-4 px-2 md:px-3 flex flex-col items-center gap-1 md:gap-2">
                <CheckCheck className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-black tracking-wider">{t("accepted").toUpperCase()}</span>
                <div className="2xl md:text-3xl font-black">{acceptedApps.length}</div>
              </div>
            </TabsTrigger>

            <TabsTrigger 
              value="rejected" 
              className="h-auto p-0 border-2 md:border-4 border-black bg-white data-[state=active]:bg-gray-400 data-[state=active]:text-white transition-all"
            >
              <div className="w-full py-3 md:py-4 px-2 md:px-3 flex flex-col items-center gap-1 md:gap-2">
                <X className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm font-black tracking-wider">{t("rejected").toUpperCase()}</span>
                <div className="2xl md:text-3xl font-black">{rejectedApps.length}</div>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            {pendingApps.length === 0 ? (
              <Card className="border-2 md:border-4 border-black">
                <CardContent className="py-8 md:py-12 text-center">
                  <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm md:text-base font-bold text-gray-500">
                    {t("noNewApplications")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {pendingApps.map((app) => {
                  const task = getTaskForApplication(app);
                  return (
                    <Card key={app.id} className="border-2 md:border-4 border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                      <CardHeader className="p-2 md:p-3 border-b-2 border-black">
                        <CardTitle className="text-xs md:text-sm font-black line-clamp-2">
                          {task?.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 md:p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          {app.executor_avatar_url ? (
                            <img
                              src={app.executor_avatar_url}
                              alt={app.executor_name}
                              className="w-10 h-10 border-2 border-black object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-sm font-black border-2 border-black shrink-0">
                              {app.executor_name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-black text-xs truncate">
                                {app.executor_name}
                              </p>
                              {app.executor_is_verified && (
                                <Shield className="w-4 h-4 text-blue-600 fill-blue-600 shrink-0" title="Verifiziert" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-600 font-bold">
                              <div className="flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                                <span>{app.executor_rating?.toFixed(1) || "N/A"}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" />
                                <span>{app.executor_completed_tasks || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {app.message && (
                          <div className="p-2 bg-gray-50 border border-black text-[10px]">
                            <p className="text-gray-700 font-medium line-clamp-2">{app.message}</p>
                          </div>
                        )}

                        <div className="text-[9px] text-gray-500 font-bold">
                          {format(new Date(app.created_date), "d MMM yyyy, HH:mm")}
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border border-black font-bold text-[10px] h-7"
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowProfileDialog(true);
                            }}
                          >
                            <User className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white border border-black font-bold text-[10px] h-7"
                            onClick={() => handleAcceptClick(app)}
                            disabled={acceptApplicationMutation.isPending}
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="border border-black font-bold text-[10px] h-7"
                            onClick={() => rejectMutation.mutate(app.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <Button
                          onClick={() => handleStartChat(app)}
                          variant="outline"
                          className="w-full border border-black bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold text-[10px] h-7"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          <span>Chat</span>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accepted" className="mt-0">
            {acceptedApps.length === 0 ? (
              <Card className="border-2 md:border-4 border-black">
                <CardContent className="py-8 md:py-12 text-center">
                  <p className="text-sm md:text-base font-bold text-gray-500">
                    {t("noAcceptedApplications")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {acceptedApps.map((app) => {
                  const task = getTaskForApplication(app);
                  
                  console.log("🎯 RENDERING ACCEPTED APP:", {
                    app_id: app.id,
                    executor_name: app.executor_name,
                    executor_is_verified: app.executor_is_verified,
                    executor_avatar_url: app.executor_avatar_url,
                    task_title: task?.title
                  });
                  
                  return (
                    <Card key={app.id} className="border-2 md:border-4 border-black overflow-hidden">
                      {/* TASK HEADER */}
                      <CardHeader className="p-3 md:p-4 border-b-2 border-black bg-green-50">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm md:text-base font-black flex-1 line-clamp-2">
                            {task?.title || t("task")}
                          </CardTitle>
                          <Badge className="bg-green-600 text-white text-xs shrink-0 border-2 border-white">{t("accepted").toUpperCase()}</Badge>
                        </div>
                      </CardHeader>

                      {/* EXECUTOR INFO + CHAT BUTTON */}
                      <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                        {/* EXECUTOR PROFIL */}
                        <div className="flex items-start gap-2 md:gap-3 p-3 bg-white border-2 border-black">
                          {/* AVATAR */}
                          {app.executor_avatar_url ? (
                            <img
                              src={app.executor_avatar_url}
                              alt={app.executor_name}
                              className="w-12 h-12 md:w-16 md:h-16 border-2 md:border-4 border-black object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-black text-white flex items-center justify-center text-xl md:text-2xl font-black border-2 md:border-4 border-black shrink-0">
                              {app.executor_name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}

                          {/* NAME + STATS */}
                          <div className="flex-1 min-w-0">
                            {/* NAME + VERIFIZIERUNG */}
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-black text-sm md:text-base truncate">
                                {app.executor_name || "Unbekannt"}
                              </p>
                              {app.executor_is_verified && (
                                <div className="shrink-0 w-6 h-6 bg-blue-600 rounded flex items-center justify-center" title="Verifiziert">
                                  <Shield className="w-4 h-4 text-white fill-white" />
                                </div>
                              )}
                            </div>

                            {/* RATING + TASKS */}
                            <div className="flex items-center gap-2 text-xs text-gray-600 font-bold">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span>{app.executor_rating?.toFixed(1) || "N/A"}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                <span>{app.executor_completed_tasks || 0} {t("tasksCount")}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CHAT BUTTON */}
                        <Button
                          className="w-full bg-black text-white border-2 md:border-4 border-black hover:bg-white hover:text-black font-black text-sm md:text-base h-10 md:h-12"
                          onClick={() => openChat(app)}
                        >
                          <MessageSquare className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                          {t("openChat")}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            {rejectedApps.length === 0 ? (
              <Card className="border-2 md:border-4 border-black">
                <CardContent className="py-8 md:py-12 text-center">
                  <p className="text-sm md:text-base font-bold text-gray-500">
                    {t("noRejectedApplications")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {rejectedApps.map((app) => {
                  const task = getTaskForApplication(app);
                  return (
                    <Card key={app.id} className="border-2 md:border-4 border-black opacity-60">
                      <CardHeader className="p-3 md:p-4 border-b-2 border-black">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm md:text-base font-black flex-1 line-clamp-2">
                            {task?.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs border-black shrink-0">{t("rejected").toUpperCase()}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4">
                        <p className="text-xs md:text-sm text-gray-600 font-bold truncate">
                          {app.executor_name}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedApplication && (
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="max-w-[95vw] md:max-w-md border-4 border-black">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl font-black">
                {t("executorProfile")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4 py-3 md:py-4">
              <div className="flex items-center gap-3 md:gap-4">
                {selectedApplication.executor_avatar_url ? (
                  <img
                    src={selectedApplication.executor_avatar_url}
                    alt={selectedApplication.executor_name}
                    className="w-12 h-12 md:w-16 md:h-16 border-2 md:border-4 border-black object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-black text-white flex items-center justify-center text-xl md:text-2xl font-black border-2 md:border-4 border-black shrink-0">
                    {selectedApplication.executor_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-base md:text-lg">
                      {selectedApplication.executor_name}
                    </p>
                    {selectedApplication.executor_is_verified && (
                      <div className="w-6 h-6 bg-blue-600 border-2 border-blue-600 flex items-center justify-center shrink-0" title="Verifiziert">
                        <Shield className="w-4 h-4 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{selectedApplication.executor_rating?.toFixed(1) || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="p-2 md:p-3 bg-gray-50 border-2 border-black">
                  <p className="text-[10px] md:text-xs text-gray-600 font-bold">{t("tasks")}</p>
                  <p className="text-xl md:text-2xl font-black">
                    {selectedApplication.executor_completed_tasks || 0}
                  </p>
                </div>
                <div className="p-2 md:p-3 bg-gray-50 border-2 border-black">
                  <p className="text-[10px] md:text-xs text-gray-600 font-bold">{t("rating")}</p>
                  <p className="text-xl md:text-2xl font-black">
                    {selectedApplication.executor_rating?.toFixed(1) || "—"}
                  </p>
                </div>
              </div>

              {selectedApplication.message && (
                <div>
                  <Label className="text-xs md:text-sm font-black">{t("message")}:</Label>
                  <div className="mt-2 p-2 md:p-3 bg-blue-50 border-2 border-black text-xs md:text-sm">
                    <p>{selectedApplication.message}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProfileDialog(false)}
                className="w-full border-2 border-black font-bold text-sm"
              >
                {t("close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="border-4 border-black bg-white max-w-[95vw] md:max-w-lg mx-4">
          <DialogHeader>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 border-2 border-black flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
              </div>
              <DialogTitle className="font-black text-lg md:text-xl">
                {t("acceptApplication")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm md:text-base text-gray-700 font-bold space-y-3">
              <p>
                {t("acceptingWithoutChat")}
              </p>
              <div className="p-3 md:p-4 border-2 border-yellow-600 bg-yellow-50">
                <p className="font-black text-yellow-800 mb-2 text-sm md:text-base">💡 EMPFEHLUNG:</p>
                <ul className="space-y-2 text-xs md:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 shrink-0">•</span>
                    <span>{t("checkExecutorProfile")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 shrink-0">•</span>
                    <span>{t("discussDetailsInChat")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 shrink-0">•</span>
                    <span>{t("clarifyBeforeAccept")}</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs md:text-sm text-gray-600">
                {t("afterAcceptNote")}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              className="w-full border-2 border-black bg-white hover:bg-gray-100 font-black text-sm md:text-base h-10 md:h-12"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                if (applicationToAccept) {
                  handleStartChat(applicationToAccept);
                  setConfirmDialogOpen(false);
                }
              }}
              variant="outline"
              className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-black text-sm md:text-base h-10 md:h-12"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t("startChatFirst")}
            </Button>
            <Button
              onClick={handleConfirmAccept}
              disabled={acceptApplicationMutation.isPending}
              className="w-full bg-green-600 text-white border-2 border-black hover:bg-white hover:text-green-600 hover:border-green-600 font-black text-sm md:text-base h-10 md:h-12"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Trotzdem annehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

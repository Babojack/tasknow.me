
import { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, Clock, Euro, MapPin, TrendingUp, CheckSquare, MessageSquare } from "lucide-react"; // Removed Star, User as they are unused in the return block, added CheckSquare, MessageSquare
import { format } from "date-fns";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function MyTasksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("all");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: myTasks = [], isLoading } = useQuery({
    queryKey: ["myExecutorTasks", user?.id],
    queryFn: async () => {
      const tasks = await demoApi.entities.Task.filter({ executor_id: user.id }, "-created_date");
      return tasks;
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Filter tasks for tabs
  const allTasks = myTasks;
  const activeTasks = myTasks.filter(t => t.status === "in_progress" || t.status === "accepted");
  // Include cancelled tasks for deletion purposes in the completed tab
  const completedTasks = myTasks.filter(t => t.status === "completed" || t.status === "cancelled");

  const completeMutation = useMutation({
    mutationFn: (taskId) =>
      demoApi.entities.Task.update(taskId, {
        status: "completed",
        completed_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myExecutorTasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => demoApi.entities.Task.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myExecutorTasks"] });
    },
  });

  const handleDeleteTask = async (taskId, taskStatus) => {
    if (taskStatus !== "completed" && taskStatus !== "cancelled") {
      alert("You can only delete completed or cancelled tasks!");
      return;
    }

    if (window.confirm(t("deleteTaskConfirm"))) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const openChat = (task) => {
    // Assuming a Chat page exists and takes taskId as a query parameter
    navigate(createPageUrl("Chat") + `?taskId=${task.id}`);
  };

  const statusColors = {
    accepted: "bg-green-100 text-green-800 border-green-800",
    in_progress: "bg-yellow-100 text-yellow-800 border-yellow-800",
    completed: "bg-blue-100 text-blue-800 border-blue-800",
    cancelled: "bg-red-100 text-red-800 border-red-800", // Added cancelled status color for consistency
  };

  const statusLabels = {
    accepted: t("accepted"),
    in_progress: t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
  };

  const stats = {
    total: myTasks.length,
    active: activeTasks.length,
    completed: myTasks.filter(t => t.status === "completed").length, // Only count truly completed for stats
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-10 h-10 md:w-12 md:h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-black text-black tracking-tighter mb-2">
            {t("myTasks").toUpperCase()}
          </h1>
          <p className="text-xs md:text-base text-gray-600 font-bold">{t("tasksYouAccepted")}</p>
        </div>

        {/* Stats - компактные */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="border-2 md:border-4 border-black bg-white p-2 md:p-4">
            <div className="flex items-center gap-1 text-black mb-1">
              <CheckCircle className="w-3 h-3 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs font-black">GESAMT</span>
            </div>
            <p className="text-xl md:text-4xl font-black">{stats.total}</p>
          </div>

          <div className="border-2 md:border-4 border-black bg-white p-2 md:p-4">
            <div className="flex items-center gap-1 text-yellow-600 mb-1">
              <TrendingUp className="w-3 h-3 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs font-black">AKTIV</span>
            </div>
            <p className="text-xl md:text-4xl font-black">{stats.active}</p>
          </div>

          <div className="border-2 md:border-4 border-black bg-white p-2 md:p-4">
            <div className="flex items-center gap-1 text-green-600 mb-1">
              <CheckCircle className="w-3 h-3 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs font-black">ERLEDIGT</span>
            </div>
            <p className="text-xl md:text-4xl font-black">{stats.completed}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-auto h-auto p-0 mb-4 bg-transparent">
            <TabsTrigger
              value="all"
              className="px-4 py-2 text-xs md:text-sm font-black border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none h-auto"
            >
              ALLE ({allTasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="px-4 py-2 text-xs md:text-sm font-black border-y-2 border-black border-r-2 md:border-l-0 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none h-auto"
            >
              AKTIV ({activeTasks.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="px-4 py-2 text-xs md:text-sm font-black border-2 border-black data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none h-auto"
            >
              ERLEDIGT ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* ALL TASKS TAB */}
          <TabsContent value="all" className="mt-0">
            {allTasks.length === 0 ? (
              <Card className="border-2 md:border-4 border-black bg-white">
                <CardContent className="py-8 md:py-12 text-center">
                  <CheckSquare className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl md:text-2xl font-black text-black mb-2">
                    {t("noTasks").toUpperCase()}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 font-bold">
                    {t("noAcceptedTasks")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {allTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="border-2 md:border-4 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] transition-all cursor-pointer"
                    onClick={() => navigate(createPageUrl("TaskDetail") + `?id=${task.id}`)}
                  >
                    {/* HEADER - KOMPAKT */}
                    <CardHeader className="p-3 md:p-4 border-b-2 border-black bg-gray-50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-sm md:text-base font-black line-clamp-2 flex-1">
                          {task.title}
                        </CardTitle>
                        <Badge className={`${statusColors[task.status]} shrink-0 text-xs font-black`}>
                          {statusLabels[task.status]}
                        </Badge>
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500 font-bold">
                        {format(new Date(task.created_date), "d. MMM yyyy", { locale: ru })}
                      </div>
                    </CardHeader>

                    {/* CONTENT - KOMPAKT */}
                    <CardContent className="p-3 md:p-4 space-y-2">
                      {/* DESCRIPTION - MAX 2 ZEILEN */}
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 font-medium">
                        {task.description}
                      </p>

                      {/* ADDRESS - KOMPAKT */}
                      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-600 font-bold">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{task.address}</span>
                      </div>

                      {/* DURATION - KOMPAKT */}
                      {task.estimated_duration_minutes && (
                        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-600 font-bold">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{task.estimated_duration_minutes} Min</span>
                        </div>
                      )}

                      {/* PRICE & ACTION BUTTON */}
                      <div className="pt-2 border-t border-black md:border-t-2 flex items-center justify-between">
                        <div className="flex items-center gap-0.5 md:gap-1 font-black text-lg md:text-xl">
                          <Euro className="w-4 h-4 md:w-5 md:h-5" />
                          <span>{task.price.toFixed(2)}</span>
                        </div>

                        {(task.status === "accepted" || task.status === "in_progress") && (
                          <Button
                            size="sm"
                            // Changed variant to primary-like as per outline's visual
                            className="bg-black text-white border-2 border-black hover:bg-white hover:text-black text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3 font-black"
                            onClick={(e) => {
                              e.stopPropagation();
                              openChat(task);
                            }}
                          >
                            <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Chat
                          </Button>
                        )}
                        {task.status === "completed" && (
                          <div className="flex items-center gap-1 text-green-600 text-xs md:text-sm font-bold">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="hidden md:inline">Abgeschlossen</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ACTIVE TASKS TAB */}
          <TabsContent value="active" className="mt-0">
            {activeTasks.length === 0 ? (
              <Card className="border-2 md:border-4 border-black bg-white">
                <CardContent className="py-8 md:py-12 text-center">
                  <TrendingUp className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl md:text-2xl font-black text-black mb-2">
                    {t("noActiveTasks").toUpperCase()}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 font-bold">
                    {t("noActiveTasks")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {activeTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="border-2 md:border-4 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] transition-all cursor-pointer"
                    onClick={() => navigate(createPageUrl("TaskDetail") + `?id=${task.id}`)}
                  >
                    {/* HEADER - KOMPAKT (specific styles for active tab) */}
                    <CardHeader className="p-3 md:p-4 border-b-2 border-black bg-orange-50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-sm md:text-base font-black line-clamp-2 flex-1">
                          {task.title}
                        </CardTitle>
                        {/* Specific badge style for active tasks */}
                        <Badge className="bg-orange-500 text-white shrink-0 text-xs font-black">
                          {statusLabels[task.status]}
                        </Badge>
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500 font-bold">
                        {format(new Date(task.created_date), "d. MMM yyyy", { locale: ru })}
                      </div>
                    </CardHeader>

                    <CardContent className="p-3 md:p-4 space-y-2">
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 font-medium">
                        {task.description}
                      </p>

                      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-600 font-bold">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{task.address}</span>
                      </div>

                      {task.estimated_duration_minutes && (
                        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-600 font-bold">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{task.estimated_duration_minutes} Min</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-black md:border-t-2 flex items-center justify-between">
                        <div className="flex items-center gap-0.5 md:gap-1 font-black text-lg md:text-xl">
                          <Euro className="w-4 h-4 md:w-5 md:h-5" />
                          <span>{task.price.toFixed(2)}</span>
                        </div>

                        <Button
                          size="sm"
                          className="bg-black text-white border-2 border-black hover:bg-white hover:text-black text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3 font-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            openChat(task);
                          }}
                        >
                          <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* COMPLETED TASKS TAB */}
          <TabsContent value="completed" className="mt-0">
            {completedTasks.length === 0 ? (
              <Card className="border-2 md:border-4 border-black bg-white">
                <CardContent className="py-8 md:py-12 text-center">
                  <CheckCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl md:text-2xl font-black text-black mb-2">
                    {t("noCompletedTasks").toUpperCase()}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 font-bold">
                    {t("noCompletedTasks")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {completedTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="border-2 md:border-4 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] transition-all cursor-pointer"
                    onClick={() => navigate(createPageUrl("TaskDetail") + `?id=${task.id}`)}
                  >
                    <CardHeader className="p-3 md:p-4 border-b-2 border-black bg-gray-50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-sm md:text-base font-black line-clamp-2 flex-1">
                          {task.title}
                        </CardTitle>
                        <Badge className={`${statusColors[task.status]} shrink-0 text-xs font-black`}>
                          {statusLabels[task.status]}
                        </Badge>
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500 font-bold">
                        {format(new Date(task.created_date), "d. MMM yyyy", { locale: ru })}
                      </div>
                    </CardHeader>

                    <CardContent className="p-3 md:p-4 space-y-2">
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2 font-medium">
                        {task.description}
                      </p>

                      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-600 font-bold">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{task.address}</span>
                      </div>

                      {task.estimated_duration_minutes && (
                        <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-gray-600 font-bold">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{task.estimated_duration_minutes} Min</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-black md:border-t-2 flex items-center justify-between">
                        <div className="flex items-center gap-0.5 md:gap-1 font-black text-lg md:text-xl">
                          <Euro className="w-4 h-4 md:w-5 md:h-5" />
                          <span>{task.price.toFixed(2)}</span>
                        </div>

                        {/* Completed status indicator */}
                        <div className="flex items-center gap-1 text-green-600 text-xs md:text-sm font-bold">
                          <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="hidden md:inline">Abgeschlossen</span>
                        </div>
                      </div>
                    </CardContent>

                    {/* DELETE BUTTON - For completed or cancelled tasks (now within CardFooter) */}
                    {(task.status === "completed" || task.status === "cancelled") && (
                      <CardFooter className="p-3 md:p-4 border-t-2 border-black bg-gray-50">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating to task detail
                            handleDeleteTask(task.id, task.status);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold"
                          disabled={deleteTaskMutation.isPending}
                        >
                          {deleteTaskMutation.isPending ? t("deleting") : `🗑️ ${t("deleteTask")}`}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

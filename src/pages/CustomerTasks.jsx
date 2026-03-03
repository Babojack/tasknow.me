import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Euro, Clock, MapPin, Plus, MessageSquare, TrendingUp, CheckCircle } from "lucide-react";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function CustomerTasksPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: myTasks = [], isLoading, refetch } = useQuery({
    queryKey: ["customerTasks", user?.id],
    queryFn: async () => {
      const tasks = await demoApi.entities.Task.filter({ owner_id: user.id }, "-created_date");
      console.log("Customer tasks loaded:", tasks);
      return tasks;
    },
    enabled: !!user,
    refetchInterval: 5000,
    staleTime: 0,
    cacheTime: 0,
  });

  const { data: applicationsCount = {} } = useQuery({
    queryKey: ["applicationsCount", user?.id],
    queryFn: async () => {
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

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => demoApi.entities.Task.delete(taskId),
    onSuccess: () => {
      refetch();
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

  const statusColors = {
    open: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabels = {
    open: t("open"),
    accepted: t("accepted"),
    in_progress: t("inProgress"),
    completed: t("completed"),
    cancelled: t("cancelled"),
  };

  // Statistik
  const stats = {
    total: myTasks.length,
    open: myTasks.filter(t => t.status === "open").length,
    in_progress: myTasks.filter(t => t.status === "in_progress" || t.status === "accepted").length,
    completed: myTasks.filter(t => t.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-3 py-4 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-black tracking-tighter mb-1 md:mb-2">
                {t("myTasks").toUpperCase()}
              </h1>
              <p className="text-sm md:text-base text-gray-600 font-bold">{t("allTasksYouCreated")}</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("CreateTask"))}
              className="w-full md:w-auto bg-[#E45826] text-white border-2 md:border-4 border-black hover:bg-white hover:text-black font-black text-sm md:text-base h-10 md:h-12"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t("createTask").toUpperCase()}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
            <div className="border-2 md:border-4 border-black bg-white p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-[#E45826] mb-1 md:mb-2">
                <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">{t("total").toUpperCase()}</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">{stats.total}</p>
            </div>

            <div className="border-2 md:border-4 border-black bg-white p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-blue-600 mb-1 md:mb-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">{t("open").toUpperCase()}</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">{stats.open}</p>
            </div>

            <div className="border-2 md:border-4 border-black bg-white p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-[#E45826] mb-1 md:mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">{t("inProgress").toUpperCase()}</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">{stats.in_progress}</p>
            </div>

            <div className="border-2 md:border-4 border-black bg-white p-3 md:p-4">
              <div className="flex items-center gap-1 md:gap-2 text-green-600 mb-1 md:mb-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black">{t("completed").toUpperCase()}</span>
              </div>
              <p className="text-2xl md:text-4xl font-black">{stats.completed}</p>
            </div>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <div className="border-2 md:border-4 border-black bg-white p-8 md:p-12 text-center">
            <Briefcase className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl md:text-2xl font-black text-black mb-2">
              {t("noTasks").toUpperCase()}
            </h3>
            <p className="text-sm md:text-base text-gray-600 font-bold mb-4 md:mb-6">
              {t("createYourFirstTask")}
            </p>
            <Button
              onClick={() => navigate(createPageUrl("CreateTask"))}
              className="bg-black text-white border-2 md:border-4 border-black hover:bg-white hover:text-black font-black"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t("createTask").toUpperCase()}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {myTasks.map((task) => (
              <div
                key={task.id}
                className="border-2 md:border-4 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px]] transition-all"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => navigate(createPageUrl("TaskDetail") + `?id=${task.id}`)}
                >
                  <div className="p-3 md:p-4 border-b border-black md:border-b-2 bg-gray-50">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="font-black text-base md:text-lg line-clamp-2 tracking-tight flex-1">
                        {task.title}
                      </h3>
                      <Badge className={`${statusColors[task.status]} shrink-0 text-xs`}>
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                    {task.is_asap && (
                      <Badge className="bg-black text-white text-xs">
                        ⚡ ASAP
                      </Badge>
                    )}
                  </div>

                  <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2 font-medium break-words">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 font-bold">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                      <span className="truncate">{task.address}</span>
                    </div>

                    {task.estimated_duration_minutes && (
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 font-bold">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                        <span>{task.estimated_duration_minutes} Min</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-black md:border-t-2">
                      <div className="flex items-center gap-0.5 md:gap-1 font-black text-xl md:text-2xl">
                        <Euro className="w-4 h-4 md:w-6 md:h-6" />
                        <span>{task.price.toFixed(2)}</span>
                      </div>
                      {applicationsCount[task.id] > 0 && (
                        <Badge className="bg-orange-100 text-orange-800 border border-black md:border-2 text-xs">
                          <MessageSquare className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                          {applicationsCount[task.id]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* DELETE BUTTON - NUR FÜR COMPLETED/CANCELLED */}
                {(task.status === "completed" || task.status === "cancelled") && (
                  <div className="p-3 md:p-4 border-t-2 border-black bg-gray-50">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id, task.status);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold"
                      disabled={deleteTaskMutation.isPending}
                    >
                      {deleteTaskMutation.isPending ? t("deleting") : `🗑️ ${t("deleteTask")}`}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

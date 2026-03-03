import { demoApi } from "@/api/demoClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Euro, Clock, MapPin, Plus, Users } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function OrganizationTasksPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: myTasks = [], isLoading } = useQuery({
    queryKey: ["organizationTasks", user?.id],
    queryFn: () => demoApi.entities.Task.filter({ owner_id: user.id }, "-created_date"),
    enabled: !!user,
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = {
    total: myTasks.length,
    active: myTasks.filter(t => t.status === "in_progress").length,
    completed: myTasks.filter(t => t.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.organization_name || t("organizationTasks")}
            </h1>
            <p className="text-gray-600">{t("manageCompanyTasks")}</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("CreateTask"))}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("createTask")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">{t("totalTasks")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-gray-600">{t("active")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-600">{t("completed")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {myTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("noTasksYet")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("createFirstTaskForCompany")}
              </p>
              <Button
                onClick={() => navigate(createPageUrl("CreateTask"))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t("createTask")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myTasks.map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(createPageUrl("TaskDetail") + `?id=${task.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{task.title}</CardTitle>
                    <Badge className={statusColors[task.status]}>
                      {statusLabels[task.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{task.address}</span>
                  </div>

                  {task.estimated_duration_minutes && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{task.estimated_duration_minutes} {t("minutes")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1 text-green-600 font-bold">
                      <Euro className="w-5 h-5" />
                      <span className="text-xl">{task.price.toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(task.created_date), "d MMM")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
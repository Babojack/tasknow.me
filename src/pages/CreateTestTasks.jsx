import { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function CreateTestTasksPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [createdTasks, setCreatedTasks] = useState([]);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const createTestTasksMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not found");

      // Per city: 2 random (normal) tasks + 1 ASAP task. English copy.
      const cities = [
        { name: "Berlin", lat: 52.520008, lng: 13.404954, address: "Friedrichstraße 123, 10117 Berlin" },
        { name: "Frankfurt", lat: 50.110924, lng: 8.682127, address: "Zeil 112, 60313 Frankfurt" },
        { name: "Hamburg", lat: 53.551086, lng: 9.993682, address: "Mönckebergstraße 7, 20095 Hamburg" },
        { name: "Munich", lat: 48.135125, lng: 11.581981, address: "Viktualienmarkt 3, 80331 München" },
      ];
      const normalTemplates = [
        { title: "Pick up groceries", description: "Need someone to pick up a small grocery list and bring to my address.", category: "покупки", price: 15, minutes: 30 },
        { title: "Package to post office", description: "One parcel to drop at the nearest post office. About 5kg.", category: "доставка", price: 12, minutes: 20 },
        { title: "Apartment cleaning", description: "2-room apartment cleaning after move-out. About 60 sqm.", category: "уборка", price: 80, minutes: 180 },
        { title: "Assemble IKEA shelf", description: "One IKEA Billy shelf to assemble. Tools provided.", category: "ремонт", price: 25, minutes: 60 },
        { title: "Dog walk", description: "My Labrador needs a walk in the park. He is friendly and well trained.", category: "животные", price: 18, minutes: 45 },
        { title: "Documents to office", description: "Important documents need to be delivered to the council office today.", category: "доставка", price: 20, minutes: 30 },
        { title: "Balcony cleaning", description: "Balcony about 8 sqm plus window cleaning.", category: "уборка", price: 35, minutes: 90 },
        { title: "Mount ceiling lamp", description: "Ceiling lamp to mount in living room. Ladder available.", category: "ремонт", price: 20, minutes: 30 },
      ];
      const asapTemplates = [
        { title: "Urgent pharmacy pickup", description: "Prescription ready at pharmacy. Pick up and bring to me as soon as possible.", category: "покупки", price: 10, minutes: 15, premium: 15 },
        { title: "Urgent delivery to airport", description: "Item must be delivered to the airport today. Time-sensitive.", category: "доставка", price: 35, minutes: 60, premium: 15 },
        { title: "Urgent flowers for birthday", description: "Nice bouquet for a birthday today. Please deliver to address.", category: "покупки", price: 30, minutes: 25, premium: 10 },
        { title: "Urgent parcel to DHL", description: "Parcel must reach DHL today. About 5kg.", category: "доставка", price: 12, minutes: 20, premium: 10 },
      ];

      const testTasks = [];
      let templateIdx = 0;
      let asapIdx = 0;
      for (const city of cities) {
        const base = { status: "open", owner_id: user.id, latitude: city.lat, longitude: city.lng, address: city.address };
        // 2 random (normal) tasks
        for (let i = 0; i < 2; i++) {
          const tpl = normalTemplates[templateIdx % normalTemplates.length];
          templateIdx++;
          testTasks.push({
            ...base,
            title: `${tpl.title} (${city.name})`,
            description: tpl.description,
            category: tpl.category,
            price: tpl.price,
            is_asap: false,
            estimated_duration_minutes: tpl.minutes,
          });
        }
        // 1 ASAP task per city
        const asap = asapTemplates[asapIdx % asapTemplates.length];
        asapIdx++;
        testTasks.push({
          ...base,
          title: `${asap.title} (${city.name})`,
          description: asap.description,
          category: asap.category,
          price: asap.price,
          is_asap: true,
          asap_premium_percent: asap.premium,
          estimated_duration_minutes: asap.minutes,
        });
      }

      const createdTasks = await demoApi.entities.Task.bulkCreate(testTasks);
      return createdTasks;
    },
    onSuccess: (tasks) => {
      setCreatedTasks(tasks);
    },
  });

  if (!user || user.email !== "jey.afandiyev@gmail.com") {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <Card className="border-4 border-black max-w-md">
          <CardContent className="p-8 text-center">
            <p className="font-black text-xl mb-4">{t("accessDenied")}</p>
            <p className="text-gray-600 font-bold">
              {t("thisPageAdminOnly")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(createPageUrl("CustomerTasks"))}
            className="w-12 h-12 border-2 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-black tracking-tighter">
              {t("createTestTasks")}
            </h1>
            <p className="text-gray-600 font-bold">
              {t("testTasksSubtitle")}
            </p>
          </div>
        </div>

        {createdTasks.length === 0 ? (
          <Card className="border-4 border-black">
            <CardHeader className="border-b-2 border-black">
              <CardTitle className="font-black">{t("createTasks")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("berlinTasks")}</p>
                    <p className="text-sm text-gray-600">{t("twoRandomOneAsap")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("frankfurtTasks")}</p>
                    <p className="text-sm text-gray-600">{t("twoRandomOneAsap")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("hamburgTasks")}</p>
                    <p className="text-sm text-gray-600">{t("twoRandomOneAsap")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("munichTasks")}</p>
                    <p className="text-sm text-gray-600">{t("twoRandomOneAsap")}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => createTestTasksMutation.mutate()}
                disabled={createTestTasksMutation.isPending}
                size="lg"
                className="w-full bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black h-14"
              >
                {createTestTasksMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("creatingTasks")}
                  </>
                ) : (
                  t("createTestTasksButton")
                )}
              </Button>

              {createTestTasksMutation.isError && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-600">
                  <p className="font-bold text-red-600">
                    {t("errorCreatingTasks")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-4 border-black">
            <CardHeader className="border-b-2 border-black bg-green-50">
              <CardTitle className="font-black text-green-600 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                {t("successfullyCreated")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="font-bold mb-4">
                {createdTasks.length} {t("tasksWereCreated")}
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-bold">
                  <span>🏙️ Berlin:</span>
                  <span>{t("threeTasks")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>🏙️ Frankfurt:</span>
                  <span>{t("threeTasks")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>🏙️ Hamburg:</span>
                  <span>{t("threeTasks")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>🏙️ Munich:</span>
                  <span>{t("threeTasks")}</span>
                </div>
              </div>
              <Button
                onClick={() => navigate(createPageUrl("CustomerTasks"))}
                className="w-full bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black"
              >
                {t("toMyTasks")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
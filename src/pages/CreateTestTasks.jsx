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

      const testTasks = [
        // BERLIN - 5 Aufgaben
        {
          title: "Lebensmittel aus REWE abholen",
          description: "Ich brauche jemanden, der für mich Lebensmittel aus dem REWE in der Friedrichstraße abholt. Liste wird per Chat geschickt.",
          category: "покупки",
          price: 15,
          latitude: 52.520008,
          longitude: 13.404954,
          address: "Friedrichstraße 123, 10117 Berlin",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 30
        },
        {
          title: "Paket zur Post bringen",
          description: "Ein Paket muss dringend zur nächsten DHL Filiale gebracht werden. Es wiegt ca. 5kg.",
          category: "доставка",
          price: 12,
          latitude: 52.516275,
          longitude: 13.377704,
          address: "Unter den Linden 45, 10117 Berlin",
          status: "open",
          owner_id: user.id,
          is_asap: true,
          asap_premium_percent: 10,
          estimated_duration_minutes: 20
        },
        {
          title: "Wohnungsreinigung nach Umzug",
          description: "2-Zimmer Wohnung muss nach Auszug gereinigt werden. Ca. 60qm.",
          category: "уборка",
          price: 80,
          latitude: 52.530644,
          longitude: 13.383068,
          address: "Prenzlauer Allee 89, 10405 Berlin",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 180
        },
        {
          title: "IKEA Regal aufbauen",
          description: "Ein IKEA Billy Regal muss aufgebaut werden. Werkzeug ist vorhanden.",
          category: "ремонт",
          price: 25,
          latitude: 52.486243,
          longitude: 13.425679,
          address: "Karl-Marx-Straße 156, 12043 Berlin",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 60
        },
        {
          title: "Hund Gassi führen",
          description: "Mein Labrador braucht eine Runde im Park. Er ist sehr lieb und gut erzogen.",
          category: "животные",
          price: 18,
          latitude: 52.475226,
          longitude: 13.365853,
          address: "Mehringdamm 34, 10961 Berlin",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 45
        },

        // FRANKFURT - 5 Aufgaben
        {
          title: "Medikamente aus Apotheke abholen",
          description: "Rezept liegt bereit in der Apotheke. Einfach abholen und zu mir bringen.",
          category: "покупки",
          price: 10,
          latitude: 50.110924,
          longitude: 8.682127,
          address: "Zeil 112, 60313 Frankfurt",
          status: "open",
          owner_id: user.id,
          is_asap: true,
          asap_premium_percent: 15,
          estimated_duration_minutes: 15
        },
        {
          title: "Dokumente zum Amt bringen",
          description: "Wichtige Dokumente müssen heute noch zum Bürgeramt gebracht werden.",
          category: "доставка",
          price: 20,
          latitude: 50.115512,
          longitude: 8.680290,
          address: "Bockenheimer Anlage 5, 60322 Frankfurt",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 30
        },
        {
          title: "Balkon reinigen",
          description: "Balkon ca. 8qm muss gereinigt werden, inkl. Fenster putzen.",
          category: "уборка",
          price: 35,
          latitude: 50.099262,
          longitude: 8.672993,
          address: "Schweizer Straße 67, 60594 Frankfurt",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 90
        },
        {
          title: "Waschmaschine anschließen",
          description: "Neue Waschmaschine muss angeschlossen werden. Alle Anschlüsse sind da.",
          category: "ремонт",
          price: 40,
          latitude: 50.126765,
          longitude: 8.644556,
          address: "Eschersheimer Landstraße 234, 60320 Frankfurt",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 45
        },
        {
          title: "Englisch Nachhilfe für Schüler",
          description: "Mein Sohn (12 Jahre) braucht Nachhilfe in Englisch, 2x pro Woche.",
          category: "обучение",
          price: 25,
          latitude: 50.104046,
          longitude: 8.666593,
          address: "Leipziger Straße 45, 60487 Frankfurt",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 60
        },

        // HAMBURG - 5 Aufgaben
        {
          title: "Blumen für Geburtstag kaufen",
          description: "Schöner Blumenstrauß für Geburtstag kaufen und zu Adresse bringen.",
          category: "покупки",
          price: 30,
          latitude: 53.551086,
          longitude: 9.993682,
          address: "Mönckebergstraße 7, 20095 Hamburg",
          status: "open",
          owner_id: user.id,
          is_asap: true,
          asap_premium_percent: 10,
          estimated_duration_minutes: 25
        },
        {
          title: "Kurier für Geschäftsdokumente",
          description: "Dokumente müssen sicher von A nach B transportiert werden.",
          category: "доставка",
          price: 25,
          latitude: 53.557078,
          longitude: 10.006922,
          address: "Jungfernstieg 34, 20354 Hamburg",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 40
        },
        {
          title: "Treppenhaus reinigen",
          description: "Treppenhaus in Mehrfamilienhaus, 4 Etagen müssen gewischt werden.",
          category: "уборка",
          price: 45,
          latitude: 53.566667,
          longitude: 9.989722,
          address: "Eppendorfer Weg 123, 20259 Hamburg",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 120
        },
        {
          title: "Lampe montieren",
          description: "Deckenlampe muss im Wohnzimmer montiert werden. Leiter vorhanden.",
          category: "ремонт",
          price: 20,
          latitude: 53.543210,
          longitude: 9.977622,
          address: "Reeperbahn 67, 20359 Hamburg",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 30
        },
        {
          title: "Event Fotografie",
          description: "Geburtstagfeier fotografieren, ca. 3 Stunden.",
          category: "фото_видео",
          price: 120,
          latitude: 53.573284,
          longitude: 10.031789,
          address: "Winterhuder Weg 89, 22085 Hamburg",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 180
        },

        // MÜNCHEN - 5 Aufgaben
        {
          title: "Brezeln und Weißwurst holen",
          description: "Vom Viktualienmarkt für Frühstück abholen.",
          category: "покупки",
          price: 15,
          latitude: 48.135125,
          longitude: 11.581981,
          address: "Viktualienmarkt 3, 80331 München",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 20
        },
        {
          title: "Geschenk zum Flughafen bringen",
          description: "Ein Geschenk muss dringend zum Flughafen München gebracht werden.",
          category: "доставка",
          price: 35,
          latitude: 48.137154,
          longitude: 11.575490,
          address: "Karlsplatz 12, 80335 München",
          status: "open",
          owner_id: user.id,
          is_asap: true,
          asap_premium_percent: 15,
          estimated_duration_minutes: 60
        },
        {
          title: "Büro Grundreinigung",
          description: "Kleines Büro (30qm) benötigt Grundreinigung am Wochenende.",
          category: "уборка",
          price: 60,
          latitude: 48.144760,
          longitude: 11.558340,
          address: "Nymphenburger Straße 145, 80636 München",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 150
        },
        {
          title: "Fahrrad reparieren",
          description: "Mountainbike: Schaltung muss eingestellt und Bremsen gecheckt werden.",
          category: "ремонт",
          price: 35,
          latitude: 48.117928,
          longitude: 11.606045,
          address: "Rosenheimer Straße 234, 81669 München",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 60
        },
        {
          title: "Umzugshilfe für 1-Zimmer Wohnung",
          description: "Kleine Wohnung, hauptsächlich Möbel tragen. LKW ist vorhanden.",
          category: "переезд",
          price: 100,
          latitude: 48.142847,
          longitude: 11.549473,
          address: "Schwanthalerstraße 78, 80336 München",
          status: "open",
          owner_id: user.id,
          is_asap: false,
          estimated_duration_minutes: 240
        },
      ];

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
                    <p className="font-bold">{t("berlin5Tasks")}</p>
                    <p className="text-sm text-gray-600">{t("variousPlzCategories")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("frankfurt5Tasks")}</p>
                    <p className="text-sm text-gray-600">{t("variousPlzCategories")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("hamburg5Tasks")}</p>
                    <p className="text-sm text-gray-600">{t("variousPlzCategories")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{t("munich5Tasks")}</p>
                    <p className="text-sm text-gray-600">{t("variousPlzCategories")}</p>
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
                  t("create20TestTasks")
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
                  <span>{t("fiveTasks")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>🏙️ Frankfurt:</span>
                  <span>{t("fiveTasks")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>🏙️ Hamburg:</span>
                  <span>{t("fiveTasks")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>🏙️ Munich:</span>
                  <span>{t("fiveTasks")}</span>
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
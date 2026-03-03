import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/i18n/TranslationContext";

const GERMAN_CITIES = [
  { name: "Berlin", lat: 52.520008, lng: 13.404954, tasks: 245 },
  { name: "Hamburg", lat: 53.551086, lng: 9.993682, tasks: 189 },
  { name: "München", lat: 48.135125, lng: 11.581981, tasks: 203 },
  { name: "Köln", lat: 50.937531, lng: 6.960279, tasks: 156 },
  { name: "Frankfurt", lat: 50.110924, lng: 8.682127, tasks: 178 },
  { name: "Stuttgart", lat: 48.775846, lng: 9.182932, tasks: 142 },
  { name: "Düsseldorf", lat: 51.227741, lng: 6.773456, tasks: 134 },
  { name: "Dortmund", lat: 51.513587, lng: 7.465298, tasks: 98 },
  { name: "Essen", lat: 51.455643, lng: 7.011555, tasks: 87 },
  { name: "Leipzig", lat: 51.339695, lng: 12.373075, tasks: 112 },
  { name: "Bremen", lat: 53.079296, lng: 8.801694, tasks: 95 },
  { name: "Dresden", lat: 51.050409, lng: 13.737262, tasks: 89 },
  { name: "Hannover", lat: 52.370216, lng: 9.732010, tasks: 106 },
  { name: "Nürnberg", lat: 49.452030, lng: 11.076750, tasks: 93 },
  { name: "Duisburg", lat: 51.434391, lng: 6.762329, tasks: 67 },
];

export default function CitySelector({ onSelectCity, currentCity }) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = React.useState(false);
  
  const displayedCities = showAll ? GERMAN_CITIES : GERMAN_CITIES.slice(0, 3);

  return (
    <div className="space-y-3 md:space-y-4 overflow-hidden mb-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{t("selectCity")}</h2>
        <p className="text-xs md:text-base text-gray-600">{t("fastAccess")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
        {displayedCities.map((city, index) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                currentCity === city.name
                  ? "border-2 border-[#E45826] bg-orange-50"
                  : "border border-gray-200 hover:border-[#E45826]"
              }`}
              onClick={() => onSelectCity(city)}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between mb-2">
                  <MapPin className={`w-4 h-4 md:w-5 md:h-5 ${
                    currentCity === city.name ? "text-[#E45826]" : "text-gray-400"
                  }`} />
                  {city.tasks > 150 && (
                    <Badge variant="secondary" className="text-[10px] md:text-xs">
                      <TrendingUp className="w-2 h-2 md:w-3 md:h-3 mr-1" />
                      Top
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-sm md:text-lg mb-1 truncate">{city.name}</h3>
                <p className="text-[10px] md:text-sm text-gray-600">{city.tasks} {t("tasksCount")}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {GERMAN_CITIES.length > 3 && (
        <div className="text-center">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            className="border-2 border-black bg-white hover:bg-[#E45826] hover:text-white hover:border-[#E45826] transition-all font-bold text-xs md:text-base"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {t("showLess")}
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {t("showAllCities")} ({GERMAN_CITIES.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
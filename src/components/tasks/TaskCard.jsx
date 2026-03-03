
import { demoApi } from "@/api/demoClient";
import { useQuery } from "@tanstack/react-query";
import { Euro, MapPin, Clock, Zap, Shield, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/i18n/TranslationContext";

const CATEGORY_ICONS = {
  покупки: "🛒",
  доставка: "📦",
  уборка: "🧹",
  ремонт: "🔧",
  переезд: "🚚",
  животные: "🐾",
  обучение: "📚",
  фото_видео: "📷",
  другое: "⚡",
};

export default function TaskCard({ task, onClick, compact = false }) {
  const { t } = useTranslation();
  const finalPrice = task.is_asap
    ? task.price * (1 + task.asap_premium_percent / 100)
    : task.price;

  const { data: owner } = useQuery({
    queryKey: ["user", task.owner_id],
    queryFn: async () => {
      const users = await demoApi.entities.User.filter({ id: task.owner_id });
      return users[0];
    },
    enabled: !!task.owner_id,
    retry: false, // Do not retry on failure to fetch owner data
    onError: (err) => {
      console.log("Could not load owner data:", err);
      // Optionally, you could set a state here to show a placeholder or error message
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, x: -2, boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <div
        className={`h-full flex flex-col overflow-hidden cursor-pointer border-2 md:border-4 transition-all duration-300 ${
          task.is_asap ? "border-black bg-black" : "border-black bg-white"
        }`}
        onClick={() => onClick(task)}
      >
        {task.is_asap && (
          <div className="bg-black text-white px-2 md:px-4 py-1 md:py-2 flex items-center justify-between border-b border-white md:border-b-2 shrink-0">
            <div className="flex items-center gap-1 md:gap-2">
              <Zap className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
              <span className="font-bold text-[10px] md:text-sm tracking-wider">ASAP</span>
            </div>
            <span className="text-[8px] md:text-xs bg-white text-black px-1 md:px-2 py-0.5 font-bold">
              +{task.asap_premium_percent}%
            </span>
          </div>
        )}

        {/* Icon - FESTE HÖHE */}
        <div className={`h-24 md:h-32 flex items-center justify-center shrink-0 ${task.is_asap ? "bg-white border-b border-white md:border-b-2" : "bg-gray-100 border-b border-black md:border-b-2"}`}>
          <div className="text-3xl md:text-6xl">
            {CATEGORY_ICONS[task.category] || "⚡"}
          </div>
        </div>

        <div className={`flex-1 flex flex-col p-2 md:p-4 space-y-1.5 md:space-y-3 ${task.is_asap ? "bg-white" : ""}`}>
          {/* Owner Info - KOMPAKT - NUR WENN VORHANDEN */}
          {owner && (
            <div className="flex items-center gap-1.5 md:gap-2 pb-1.5 md:pb-2 border-b border-gray-200 md:border-b-2 shrink-0">
              {owner.avatar_url ? (
                <img
                  src={owner.avatar_url}
                  alt={owner.full_name}
                  className="w-5 h-5 md:w-8 md:h-8 rounded-full border border-black md:border-2 object-cover"
                />
              ) : (
                <div className="w-5 h-5 md:w-8 md:h-8 rounded-full bg-black text-white flex items-center justify-center text-[8px] md:text-xs font-black border border-black md:border-2">
                  {owner.full_name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-[10px] md:text-xs font-bold truncate">{owner.full_name}</p>
                  {owner.user_type === "organization" && (
                    <Building2 className="w-2 h-2 md:w-3 md:h-3 text-purple-600 fill-current shrink-0" />
                  )}
                  {owner.is_verified && (
                    <Shield className="w-2 h-2 md:w-3 md:h-3 text-blue-600 fill-current shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-gray-500">
                  <span>★ {owner.rating?.toFixed(1) || "0.0"}</span>
                  <span>•</span>
                  <span>{owner.total_tasks_created || 0} {t("tasksCount")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Title - FESTE 2 ZEILEN */}
          <div className="shrink-0">
            <h3 className="font-black text-xs md:text-lg line-clamp-2 tracking-tight min-h-[2.5em]">{task.title}</h3>
            <div className="text-[8px] md:text-xs font-bold tracking-wider mt-0.5 md:mt-1">
              {t(task.category).toUpperCase()}
            </div>
          </div>

          {/* Description - FLEX */}
          <p className="text-[10px] md:text-sm text-gray-600 line-clamp-2 font-medium flex-1">{task.description}</p>

          {/* Details - KOMPAKT */}
          <div className="space-y-1 md:space-y-2 shrink-0">
            <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm text-gray-600 font-bold">
              {/* Sonar effect for MapPin */}
              <div className="relative flex items-center justify-center">
                <MapPin className="w-2.5 h-2.5 md:w-4 md:h-4 shrink-0 relative z-10 text-black" />
                <span className="absolute inset-0 -m-0.5 rounded-full bg-gray-400 animate-ping opacity-75"></span>
              </div>
              <span className="truncate">{task.address}</span>
            </div>

            {task.estimated_duration_minutes && (
              <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-sm text-gray-600 font-bold">
                <Clock className="w-2.5 h-2.5 md:w-4 md:h-4 shrink-0" />
                <span>{task.estimated_duration_minutes} {t("duration").toLowerCase()}</span>
              </div>
            )}
          </div>

          {/* Price - FEST UNTEN */}
          <div className="flex items-center justify-between pt-1.5 md:pt-3 border-t border-black md:border-t-2 shrink-0">
            <div className="flex items-center gap-0.5 md:gap-1">
              <Euro className="w-3 h-3 md:w-6 md:h-6" />
              <span className="text-base md:text-2xl font-black">
                {finalPrice.toFixed(2)}
              </span>
              {task.is_asap && (
                <span className="text-[8px] md:text-xs text-gray-500 line-through ml-1">
                  {task.price.toFixed(2)}
                </span>
              )}
            </div>
            <button className="px-2 md:px-4 py-1 md:py-2 bg-black text-white hover:bg-white hover:text-black border border-black md:border-2 transition-all text-[8px] md:text-sm font-black">
              {t("readMore").toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

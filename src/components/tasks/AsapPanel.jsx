
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, MapPin, Euro, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function AsapPanel({ asapTasks, onTaskClick }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = React.useState({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = {};
      asapTasks.forEach((task) => {
        if (task.asap_expires_at) {
          const now = new Date();
          const expires = new Date(task.asap_expires_at);
          const seconds = Math.max(0, Math.floor((expires - now) / 1000));
          newTimeLeft[task.id] = seconds;
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [asapTasks]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (asapTasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 md:mb-4 overflow-hidden">
      <Card className="border-2 md:border-4 border-black bg-white overflow-hidden">
        <CardHeader className="pb-2 md:pb-3 border-b border-black md:border-b-2 p-3 md:p-4">
          <CardTitle className="flex items-center gap-2 text-xs md:text-base">
            <Zap className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
            <span className="font-black">{t("asapTasks").toUpperCase()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          {/* ОДНА КОЛОНКА НА МОБИЛЬНОМ! */}
          <div className="flex flex-col gap-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
            <AnimatePresence>
              {asapTasks.slice(0, 6).map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full"
                >
                  <Card className="border-2 border-black hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                    <CardContent className="p-3 space-y-2" onClick={() => onTaskClick(task)}>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs line-clamp-1 flex-1">{task.title}</h4>
                        <Badge className="bg-black text-white shrink-0 text-[10px] px-1.5 py-0.5">
                          +{task.asap_premium_percent}%
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{task.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-1 font-black text-base">
                          <Euro className="w-4 h-4" />
                          {(task.price * (1 + task.asap_premium_percent / 100)).toFixed(2)}
                        </div>

                        {timeLeft[task.id] !== undefined && (
                          <div className="flex items-center gap-1 text-[10px] font-mono bg-black text-white px-2 py-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(timeLeft[task.id])}
                          </div>
                        )}
                      </div>

                      <Button size="sm" className="w-full bg-black hover:bg-white hover:text-black border-2 border-black font-black text-xs h-8">
                        ASAP
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

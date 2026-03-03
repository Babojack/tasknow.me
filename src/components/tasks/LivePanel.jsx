import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, MapPin, Euro, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function LivePanel({ liveTasks, onTaskClick }) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = React.useState({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = {};
      liveTasks.forEach((task) => {
        if (task.live_expires_at) {
          const now = new Date();
          const expires = new Date(task.live_expires_at);
          const seconds = Math.max(0, Math.floor((expires - now) / 1000));
          newTimeLeft[task.id] = seconds;
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [liveTasks]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (liveTasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Zap className="w-5 h-5 animate-pulse" />
            {t("liveTasksNearYou")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {liveTasks.slice(0, 6).map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-red-200 hover:border-red-400 transition-colors cursor-pointer">
                    <CardContent className="p-4 space-y-2" onClick={() => onTaskClick(task)}>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-1">{task.title}</h4>
                        <Badge className="bg-red-600 text-white shrink-0">
                          +{task.live_premium_percent}%
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{task.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 text-green-600 font-bold">
                          <Euro className="w-4 h-4" />
                          {(task.price * (1 + task.live_premium_percent / 100)).toFixed(2)}
                        </div>

                        {timeLeft[task.id] !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-red-600 font-mono">
                            <Clock className="w-3 h-3" />
                            {formatTime(timeLeft[task.id])}
                          </div>
                        )}
                      </div>

                      <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 mt-2">
                        {t("acceptLive")}
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
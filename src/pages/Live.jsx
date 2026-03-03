import { useState, useEffect } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, MapPin, Euro, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import TaskCard from "../components/tasks/TaskCard";

export default function LivePage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({});

  const { data: liveTasks = [], isLoading } = useQuery({
    queryKey: ["live-tasks"],
    queryFn: () => demoApi.entities.Task.filter({ status: "open", is_live: true }, "-created_date"),
    refetchInterval: 10000,
  });

  useEffect(() => {
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

  const handleTaskClick = (task) => {
    navigate(createPageUrl("TaskDetail") + `?id=${task.id}`);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 border-4 border-black p-6 bg-white">
            <div className="w-16 h-16 bg-black flex items-center justify-center">
              <Zap className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-black tracking-tighter">LIVE TASKS</h1>
              <p className="text-gray-600 font-bold">Urgent tasks with premium pay</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border-4 border-black bg-white p-6">
              <div className="flex items-center gap-2 text-black mb-2">
                <Zap className="w-5 h-5" />
                <span className="text-xs font-black tracking-wider">ACTIVE</span>
              </div>
              <p className="text-4xl font-black">{liveTasks.length}</p>
            </div>

            <div className="border-4 border-black bg-white p-6">
              <div className="flex items-center gap-2 text-black mb-2">
                <Euro className="w-5 h-5" />
                <span className="text-xs font-black tracking-wider">AVG PREMIUM</span>
              </div>
              <p className="text-4xl font-black">
                +{liveTasks.length > 0
                  ? Math.round(
                      liveTasks.reduce((sum, t) => sum + t.live_premium_percent, 0) /
                        liveTasks.length
                    )
                  : 0}
                %
              </p>
            </div>

            <div className="border-4 border-black bg-white p-6">
              <div className="flex items-center gap-2 text-black mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs font-black tracking-wider">MAX PREMIUM</span>
              </div>
              <p className="text-4xl font-black">
                +{liveTasks.length > 0
                  ? Math.max(...liveTasks.map((t) => t.live_premium_percent))
                  : 0}
                %
              </p>
            </div>

            <div className="border-4 border-black bg-white p-6">
              <div className="flex items-center gap-2 text-black mb-2">
                <MapPin className="w-5 h-5" />
                <span className="text-xs font-black tracking-wider">IN RANGE</span>
              </div>
              <p className="text-4xl font-black">{liveTasks.length}</p>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 mt-4 font-bold">Loading LIVE tasks...</p>
          </div>
        ) : liveTasks.length === 0 ? (
          <div className="border-4 border-black bg-white p-12 text-center">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-black mb-2">
              NO LIVE TASKS RIGHT NOW
            </h3>
            <p className="text-gray-600 font-bold">
              Urgent tasks will appear here as soon as they're posted
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {liveTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskCard task={task} onClick={handleTaskClick} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
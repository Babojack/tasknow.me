import React, { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function ChatWidget({ taskId, otherUserId, taskTitle }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", taskId],
    queryFn: () => demoApi.entities.Message.filter({ task_id: taskId }, "created_date"),
    enabled: !!taskId && isOpen,
    refetchInterval: 2000,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages", taskId],
    queryFn: async () => {
      const msgs = await demoApi.entities.Message.filter({
        task_id: taskId,
        to_user_id: currentUser.id,
        is_read: false,
      });
      return msgs.length;
    },
    enabled: !!taskId && !!currentUser && !isOpen,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => demoApi.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", taskId] });
      setMessageText("");
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !currentUser) return;

    sendMessageMutation.mutate({
      task_id: taskId,
      from_user_id: currentUser.id,
      to_user_id: otherUserId,
      message_text: messageText,
      is_read: false,
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!taskId || !otherUserId) return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl relative"
            >
              <MessageSquare className="w-7 h-7" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[500px] shadow-2xl"
          >
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <div>
                    <h3 className="font-semibold text-sm">{taskTitle}</h3>
                    <p className="text-xs opacity-80">{t("chatWithDoer")}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-white hover:bg-blue-700"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {t("startConversation")}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMessage = msg.from_user_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            isMyMessage
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.message_text}
                          </p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMyMessage ? "text-blue-200" : "text-gray-500"
                            }`}
                          >
                            {format(new Date(msg.created_date), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("message") + "..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
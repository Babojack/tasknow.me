import React, { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function ChatWidget({ chats }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [hiddenChats, setHiddenChats] = useState([]);
  const messagesEndRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: totalUnread = 0 } = useQuery({
    queryKey: ["total-unread", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return 0;
      const msgs = await demoApi.entities.Message.filter({
        to_user_id: currentUser.id,
        is_read: false,
      });
      return msgs.length;
    },
    enabled: !!currentUser && !isOpen,
    refetchInterval: 3000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeChat?.taskId],
    queryFn: () => demoApi.entities.Message.filter({ task_id: activeChat.taskId }, "created_date"),
    enabled: !!activeChat?.taskId && isOpen,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const msg = await demoApi.entities.Message.create(messageData);
      
      if (messageData.to_user_id) {
        const recipientUsers = await demoApi.entities.User.filter({ id: messageData.to_user_id });
        const recipient = recipientUsers[0];
        
        if (recipient?.email && currentUser?.full_name) {
          demoApi.integrations.Core.SendEmail({
            to: recipient.email,
            subject: `💬 New message from ${currentUser.full_name}`,
            body: `Hello ${recipient.full_name},\n\nYou have received a new message:\n\n"${messageData.message_text}"\n\nReply now in the TaskNow app.\n\nTaskNow Team`
          }).catch(err => console.error("Email error:", err));
        }
      }
      
      return msg;
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ["messages", activeChat?.taskId] });
      const previousMessages = queryClient.getQueryData(["messages", activeChat?.taskId]);
      
      const tempMessage = {
        ...newMessage,
        id: `temp-${Date.now()}`,
        created_date: new Date().toISOString(),
      };
      
      queryClient.setQueryData(["messages", activeChat?.taskId], (old = []) => [...old, tempMessage]);
      return { previousMessages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeChat?.taskId] });
      queryClient.invalidateQueries({ queryKey: ["total-unread"] });
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", activeChat?.taskId], context.previousMessages);
      }
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !currentUser || !activeChat || sendMessageMutation.isPending) return;

    const messageData = {
      task_id: activeChat.taskId,
      from_user_id: currentUser.id,
      to_user_id: activeChat.otherUserId,
      message_text: messageText.trim(),
      is_read: false,
    };

    setMessageText("");
    sendMessageMutation.mutate(messageData);
  };

  React.useEffect(() => {
    if (isOpen && activeChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeChat]);

  React.useEffect(() => {
    if (isOpen && chats.length > 0 && !activeChat) {
      const visibleChats = chats.filter(c => !hiddenChats.includes(c.taskId));
      if (visibleChats.length > 0) {
        setActiveChat(visibleChats[0]);
      }
    }
  }, [isOpen, chats, activeChat, hiddenChats]);

  const handleCloseChat = (taskId) => {
    setHiddenChats([...hiddenChats, taskId]);
    if (activeChat?.taskId === taskId) {
      const visibleChats = chats.filter(c => !hiddenChats.includes(c.taskId) && c.taskId !== taskId);
      setActiveChat(visibleChats.length > 0 ? visibleChats[0] : null);
    }
  };

  const visibleChats = chats.filter(c => !hiddenChats.includes(c.taskId));
  
  if (!chats || chats.length === 0 || visibleChats.length === 0) return null;

  return (
    <>
      {/* Floating Button - KEIN SONAR EFFEKT! */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-6 z-[600]"
          >
            <Button
              onClick={() => {
                setIsOpen(true);
                const visibleChats = chats.filter(c => !hiddenChats.includes(c.taskId));
                if (visibleChats.length > 0 && !activeChat) {
                  setActiveChat(visibleChats[0]);
                }
              }}
              size="lg"
              className="w-16 h-16 rounded-full bg-[#E45826] hover:bg-white hover:text-black shadow-2xl relative border-4 border-black"
            >
              <MessageSquare className="w-7 h-7" />
              {totalUnread > 0 && (
                <Badge className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white p-0 flex items-center justify-center font-black border-2 border-white">
                  {totalUnread}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window - Z-INDEX 600! */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[600] w-[90vw] md:w-96 h-[70vh] md:h-[500px] shadow-2xl border-4 border-black bg-white flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b-4 border-black bg-blue-600 text-white shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="w-5 h-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  {activeChat ? (
                    <div className="relative">
                      <button
                        className="font-semibold text-sm truncate flex items-center gap-1 hover:opacity-80"
                      >
                        <span className="truncate">{activeChat.taskTitle}</span>
                        {chats.length > 1 && <ChevronDown className="w-4 h-4 shrink-0" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold">{t("messages")}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-blue-700 shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {visibleChats.length > 1 && (
              <div className="flex gap-2 p-2 border-b-2 border-black bg-gray-50 overflow-x-auto shrink-0">
                {visibleChats.map((chat) => (
                  <div key={chat.taskId} className="relative group">
                    <button
                      onClick={() => setActiveChat(chat)}
                      className={`px-3 py-1 pr-7 text-xs font-bold border-2 border-black whitespace-nowrap transition-all ${
                        activeChat?.taskId === chat.taskId
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {chat.taskTitle.substring(0, 20)}...
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseChat(chat.taskId);
                      }}
                      className={`absolute top-0 right-0 h-full px-1.5 border-l-2 border-black transition-all ${
                        activeChat?.taskId === chat.taskId
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-white hover:bg-gray-200"
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {!activeChat ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t("selectChat")}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t("noMessages")}
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
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm border-2 border-black ${
                          isMyMessage
                            ? "bg-blue-600 text-white"
                            : "bg-white"
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

            {activeChat && (
              <div className="p-3 border-t-4 border-black bg-white shrink-0">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("message") + "..."}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 text-sm border-2 border-black"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 shrink-0 border-2 border-black"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
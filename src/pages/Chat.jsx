
import React, { useState } from "react";
import { demoApi } from "@/api/demoClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/components/i18n/TranslationContext";

export default function ChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = React.useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get("taskId");
  const otherUserId = urlParams.get("userId");

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => demoApi.auth.me(),
  });

  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const tasks = await demoApi.entities.Task.filter({ id: taskId });
      return tasks[0];
    },
    enabled: !!taskId,
  });

  const { data: otherUser } = useQuery({
    queryKey: ["user", otherUserId],
    queryFn: async () => {
      const users = await demoApi.entities.User.filter({ id: otherUserId });
      return users[0];
    },
    enabled: !!otherUserId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", taskId],
    queryFn: () => demoApi.entities.Message.filter({ task_id: taskId }, "created_date"),
    enabled: !!taskId,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const msg = await demoApi.entities.Message.create(messageData);
      
      // EMAIL BENACHRICHTIGUNG (async - blockiert nicht)
      const recipientUsers = await demoApi.entities.User.filter({ id: messageData.to_user_id });
      const recipient = recipientUsers[0];
      
      if (recipient?.email) {
        demoApi.integrations.Core.SendEmail({
          to: recipient.email,
          subject: `💬 New message from ${currentUser?.full_name}`,
          body: `Hello ${recipient.full_name},\n\nYou have received a new message:\n\n"${messageData.message_text}"\n\nReply now: https://tasknow.app/chat?taskId=${messageData.task_id}&userId=${messageData.from_user_id}\n\nTaskNow Team`
        }).catch(err => console.error("Email error:", err));
      }
      
      return msg;
    },
    onMutate: async (newMessage) => {
      // OPTIMISTIC UPDATE für bessere Performance
      await queryClient.cancelQueries({ queryKey: ["messages", taskId] });
      
      const previousMessages = queryClient.getQueryData(["messages", taskId]);
      
      // Temporäre Message hinzufügen
      const tempMessage = {
        ...newMessage,
        id: `temp-${Date.now()}`,
        created_date: new Date().toISOString(),
      };
      
      queryClient.setQueryData(["messages", taskId], (old = []) => [...old, tempMessage]);
      
      return { previousMessages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", taskId] });
    },
    onError: (err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", taskId], context.previousMessages);
      }
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !currentUser || sendMessageMutation.isPending) return;

    const messageData = {
      task_id: taskId,
      from_user_id: currentUser.id,
      to_user_id: otherUserId,
      message_text: messageText.trim(),
      is_read: false,
    };

    // SOFORT Eingabefeld leeren!
    setMessageText("");
    
    // Dann senden
    sendMessageMutation.mutate(messageData);
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (messages.length > 0 && currentUser) {
      const unreadMessages = messages.filter(
        (m) => m.to_user_id === currentUser.id && !m.is_read
      );
      unreadMessages.forEach((msg) => {
        demoApi.entities.Message.update(msg.id, { is_read: true });
      });
    }
  }, [messages, currentUser]);

  if (!taskId || !otherUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-bold">Invalid chat parameters</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* HEADER - FIXED TOP */}
      <div className="flex-none border-b-2 md:border-b-4 border-black bg-white p-3 md:p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 md:w-12 md:h-12 border-2 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {otherUser && (
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {otherUser.avatar_url ? (
                <Avatar className="w-10 h-10 md:w-12 md:h-12 border-2 border-black shrink-0">
                  <AvatarImage src={otherUser.avatar_url} />
                  <AvatarFallback className="bg-black text-white font-black">
                    {otherUser.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white flex items-center justify-center font-black text-lg md:text-xl border-2 border-black shrink-0">
                  {otherUser.full_name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-black text-base md:text-lg truncate">{otherUser.full_name}</h2>
                {task && (
                  <p className="text-xs md:text-sm text-gray-600 font-bold truncate">{task.title}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES - SCROLLABLE MIDDLE */}
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-3 md:p-4 space-y-3 md:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-bold">{t("noMessages")}</p>
              <p className="text-sm text-gray-400 mt-2">{t("startConversation")}</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMyMessage = msg.from_user_id === currentUser?.id;
              const isTemp = msg.id?.startsWith('temp-');
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-3 md:px-4 py-2 md:py-3 border-2 border-black ${
                      isMyMessage
                        ? "bg-blue-600 text-white"
                        : "bg-white"
                    } ${isTemp ? "opacity-60" : ""}`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm md:text-base">
                      {msg.message_text}
                    </p>
                    <p
                      className={`text-[10px] md:text-xs mt-1 ${
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
      </div>

      {/* INPUT - FIXED BOTTOM (über Mobile Nav) */}
      <div className="flex-none border-t-2 md:border-t-4 border-black bg-white p-3 md:p-4 z-10 mb-16 md:mb-0">
        <div className="max-w-4xl mx-auto flex gap-2 md:gap-3">
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
            className="flex-1 border-2 border-black h-10 md:h-12 text-sm md:text-base"
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 border-2 border-black h-10 md:h-12 px-4 md:px-6 shrink-0"
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

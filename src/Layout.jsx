
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Zap, User, Plus, Briefcase, CheckSquare, MessageSquare, Menu, X, LogOut, Send } from "lucide-react";
import { demoApi } from "@/api/demoClient";
import { useQuery } from "@tanstack/react-query";
import { TranslationProvider, useTranslation } from "@/components/i18n/TranslationContext";
import ChatWidget from "@/components/ChatWidget";
import { useAuth } from "@/lib/AuthContext";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, logout: authLogout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // ÖFFENTLICHE SEITEN - KEINE AUTH ERFORDERLICH
  const publicPages = [
    "/",
    createPageUrl("Landing"),
    createPageUrl("blog"),
    createPageUrl("blogpost"),
    createPageUrl("ComingSoon")
  ];
  const isPublicPage = publicPages.includes(location.pathname) || location.pathname.startsWith(createPageUrl("blog"));

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
      const title = 'TaskNow – Micro-Task Platform';
      const desc = 'The fastest micro-task platform. Find help quickly or earn money with small tasks.';
      let description = document.querySelector('meta[name="description"]');
      if (!description) {
        description = document.createElement('meta');
        description.name = 'description';
        document.head.appendChild(description);
      }
      document.title = title;
      description.content = desc;
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = title;
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.content = desc;
      let ogLocale = document.querySelector('meta[property="og:locale"]');
      if (!ogLocale) {
        ogLocale = document.createElement('meta');
        ogLocale.setAttribute('property', 'og:locale');
        document.head.appendChild(ogLocale);
      }
      ogLocale.content = 'en_US';
    }
  }, []);

  // Redirect to landing when not logged in; redirect to onboarding when not completed
  React.useEffect(() => {
    if (!user && !isPublicPage) {
      navigate("/", { replace: true });
      return;
    }
    if (user && !user.onboarding_completed &&
        location.pathname !== createPageUrl("Onboarding") &&
        !isPublicPage) {
      navigate(createPageUrl("Onboarding"));
    }
  }, [user, location.pathname, navigate, isPublicPage]);

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const msgs = await demoApi.entities.Message.filter({
        to_user_id: user.id,
        is_read: false
      });
      return msgs.length;
    },
    enabled: !!user,
    refetchInterval: 5000,
    retry: false,
  });

  const { data: unreadApplications = 0 } = useQuery({
    queryKey: ["unread-applications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const myTasks = await demoApi.entities.Task.filter({ owner_id: user.id });
      const taskIds = myTasks.map(t => t.id);
      if (taskIds.length === 0) return 0;
      
      const applications = await demoApi.entities.TaskApplication.filter({ status: "pending" });
      return applications.filter(app => taskIds.includes(app.task_id)).length;
    },
    enabled: !!user && (user.user_type === "customer" || user.user_type === "organization"),
    refetchInterval: 5000,
    retry: false,
  });

  const { data: activeChats = [] } = useQuery({
    queryKey: ["active-chats", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const myTasks = await demoApi.entities.Task.filter({
        status: ["accepted", "in_progress"],
      });
      
      const chats = myTasks
        .filter(task => task.owner_id === user.id || task.executor_id === user.id)
        .map(task => ({
          taskId: task.id,
          taskTitle: task.title,
          otherUserId: user.id === task.owner_id ? task.executor_id : task.owner_id,
        }))
        .filter(chat => chat.otherUserId);
      
      return chats;
    },
    enabled: !!user,
    refetchInterval: 10000,
    retry: false,
  });

  const navItemsByType = {
    executor: [
      { nameKey: "tasks", path: "Map", icon: Map },
      { nameKey: "asap", path: "Asap", icon: Zap },
      { nameKey: "myTasks", path: "MyTasks", icon: CheckSquare, badge: unreadMessages },
      { nameKey: "profile", path: "Profile", icon: User },
    ],
    customer: [
      { nameKey: "myTasks", path: "CustomerTasks", icon: Briefcase },
      { nameKey: "create", path: "CreateTask", icon: Plus },
      { nameKey: "applications", path: "Applications", icon: MessageSquare, badge: unreadApplications },
      { nameKey: "profile", path: "Profile", icon: User },
    ],
    organization: [
      { nameKey: "tasks", path: "OrganizationTasks", icon: Briefcase },
      { nameKey: "create", path: "CreateTask", icon: Plus },
      { nameKey: "applications", path: "Applications", icon: MessageSquare, badge: unreadApplications },
      { nameKey: "profile", path: "Profile", icon: User },
    ],
  };

  const navItems = navItemsByType[user?.user_type] || navItemsByType.executor;
  const isActive = (path) => location.pathname === createPageUrl(path);

  React.useEffect(() => {
    if (user?.user_type === "executor" && location.pathname === createPageUrl("CustomerTasks")) {
      navigate(createPageUrl("Map"));
    }
    if ((user?.user_type === "customer" || user?.user_type === "organization") && 
        (location.pathname === createPageUrl("Map") || location.pathname === createPageUrl("Asap"))) {
      navigate(createPageUrl("CustomerTasks"));
    }
  }, [user, location.pathname, navigate]);

  const handleLogout = () => {
    authLogout();
    navigate("/", { replace: true });
  };

  if (!user && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  // ÖFFENTLICHE SEITEN - KEIN LAYOUT
  if (currentPageName === "Landing" || 
      currentPageName === "blog" || 
      currentPageName === "blogpost" || 
      currentPageName === "ComingSoon" || 
      location.pathname === "/") {
    return children;
  }

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        :root {
          --primary: 0 0 0;
          --accent-orange: #E45826;
        }
        
        button, .btn {
          background: black !important;
          color: white !important;
          border: 2px solid black !important;
          transition: all 0.3s ease !important;
        }
        
        button:hover, .btn:hover {
          background: white !important;
          color: black !important;
        }
        
        .card {
          background: white !important;
          border: 2px solid black !important;
          transition: all 0.3s ease !important;
        }
        
        .card:hover {
          box-shadow: 8px 8px 0px black !important;
          transform: translate(-4px, -4px) !important;
        }
      `}</style>

      {/* Telegram button (top-right) */}
      <a
        href="https://t.me/afadante"
        target="_blank"
        rel="noreferrer"
        className="fixed top-3 right-3 z-[120] w-10 h-10 rounded-full border-2 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center"
        aria-label="Telegram"
        title="Telegram"
      >
        <Send className="w-5 h-5" />
      </a>

      <header className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-white border-b-2 border-black">
        <div className="flex items-center justify-between gap-2 px-3 py-3 min-h-[56px]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 shrink-0 bg-black rounded-none flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-black tracking-tighter truncate">TASKNOW</h1>
              {user && (
                <p className="text-[10px] text-gray-600 font-bold tracking-wider truncate">
                  {user.user_type === "executor" && t("executor").toUpperCase()}
                  {user.user_type === "customer" && t("customer").toUpperCase()}
                  {user.user_type === "organization" && t("organization").toUpperCase()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 border-2 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center shrink-0"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t-2 border-black bg-white p-4">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 font-bold"
            >
              <LogOut className="w-5 h-5" />
              {t("logout")}
            </button>
          </div>
        )}
      </header>

      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r-2 border-black z-[100]">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b-2 border-black">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-black rounded-none flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-black tracking-tighter">TASKNOW</h1>
                {user && (
                  <p className="text-xs text-gray-600 font-bold tracking-wider">
                    {user.user_type === "executor" && t("executor").toUpperCase()}
                    {user.user_type === "customer" && t("customer").toUpperCase()}
                    {user.user_type === "organization" && t("organization").toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={createPageUrl(item.path)}
                      className={`flex items-center gap-3 px-4 py-3 border-2 border-black transition-all font-bold relative ${
                        active
                          ? "bg-[#E45826] text-white"
                          : "bg-white text-black hover:bg-[#E45826] hover:text-white"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="tracking-wider flex-1">{t(item.nameKey).toUpperCase()}</span>
                      {item.badge > 0 && (
                        <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-black border-2 border-white shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {user && (
            <div className="p-4 border-t-2 border-black space-y-3">
              <div className="flex items-center gap-3 p-3 border-2 border-black bg-white">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name}
                    className="w-10 h-10 object-cover border-2 border-black"
                  />
                ) : (
                  <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-lg border-2 border-black">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 font-bold"
              >
                <LogOut className="w-5 h-5" />
                {t("logout").toUpperCase()}
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className={`lg:ml-64 lg:pt-0 pb-20 lg:pb-0 ${mobileMenuOpen ? "pt-[7.5rem]" : "pt-16"}`}>
        {children}

        {currentPageName !== "Landing" && location.pathname !== "/" && activeChats.length > 0 && (
          <ChatWidget chats={activeChats} />
        )}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black z-[100] safe-area-inset-bottom">
        <ul className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <li key={item.path} className="flex-1">
                <Link
                  to={createPageUrl(item.path)}
                  className={`flex flex-col items-center gap-1 py-2 relative transition-colors ${
                    active ? "text-[#E45826]" : "text-gray-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-black tracking-wider">
                    {t(item.nameKey).toUpperCase()}
                  </span>
                  {item.badge > 0 && (
                    <span className="absolute top-0 right-1/4 w-5 h-5 rounded-full bg-[#E45826] text-white text-[10px] flex items-center justify-center font-black border-2 border-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <TranslationProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </TranslationProvider>
  );
}

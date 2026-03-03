import { useTranslation } from "./i18n/TranslationContext";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const languages = [
  { code: "de", name: "DE" },
  { code: "ru", name: "RU" },
  { code: "en", name: "EN" },
];

export default function LanguageSwitcher({ compact = false }) {
  const { language, changeLanguage } = useTranslation();
  const currentLang = languages.find((l) => l.code === language);

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-9 h-9 rounded-full text-xs font-black border-2 border-black bg-black text-white flex items-center justify-center gap-0.5 shrink-0"
            aria-label="Select language"
          >
            <span>{currentLang?.name ?? "DE"}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[4rem] border-2 border-black">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`font-black cursor-pointer ${language === lang.code ? "bg-black text-white" : ""}`}
            >
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {languages.map((lang) => (
        <motion.button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`w-10 h-10 rounded-full text-xs font-black transition-all border-2 border-black relative overflow-hidden shrink-0 ${
            language === lang.code
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {language === lang.code && (
            <motion.div
              layoutId="activeLanguage"
              className="absolute inset-0 bg-black"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">{lang.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
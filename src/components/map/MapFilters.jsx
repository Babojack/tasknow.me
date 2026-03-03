import React from "react";
import { useTranslation } from "@/components/i18n/TranslationContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/components/i18n/TranslationContext";

const CATEGORIES = [
  { value: "покупки", icon: "🛒" },
  { value: "доставка", icon: "📦" },
  { value: "уборка", icon: "🧹" },
  { value: "ремонт", icon: "🔧" },
  { value: "переезд", icon: "🚚" },
  { value: "животные", icon: "🐾" },
  { value: "обучение", icon: "📚" },
  { value: "фото_видео", icon: "📷" },
  { value: "другое", icon: "⚡" },
];

export default function MapFilters({ filters, onFiltersChange }) {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = React.useState(filters);
  const [isOpen, setIsOpen] = React.useState(false);

  // Synchronize localFilters with filters when opening the sheet
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleCategoryToggle = (category) => {
    const currentCategories = localFilters.categories || [];
    const updated = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    setLocalFilters({ ...localFilters, categories: updated });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="w-full px-4 py-2 border-2 border-black bg-[#E45826] text-white hover:bg-white hover:text-black transition-all font-bold flex items-center justify-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          FILTER
          {(filters.categories?.length > 0 || filters.asapOnly) && (
            <span className="ml-2 w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center font-black">
              {(filters.categories?.length || 0) + (filters.asapOnly ? 1 : 0)}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto bg-white border-l-4 border-black z-[9999]">
        <SheetHeader className="border-b-2 border-black pb-4">
          <SheetTitle className="font-black text-2xl tracking-tighter">FILTER</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* ASAP Toggle */}
          <div className="border-4 border-black p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#E45826]" />
                <div>
                  <Label className="text-sm font-black tracking-tighter">ASAP ONLY</Label>
                  <p className="text-xs text-gray-600 font-bold mt-1">
                    {t("urgentTasks")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setLocalFilters({ ...localFilters, asapOnly: !localFilters.asapOnly })
                }
                className={`relative w-14 h-8 border-2 border-black cursor-pointer transition-all ${
                  localFilters.asapOnly ? "bg-[#E45826]" : "bg-white"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 border-2 border-black bg-white transition-all ${
                    localFilters.asapOnly ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Categories - Icon Grid */}
          <div className="space-y-2">
            <Label className="font-black">{t("category").toUpperCase()}</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = (localFilters.categories || []).includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.value)}
                    className={`aspect-square border-4 border-black transition-all font-black flex flex-col items-center justify-center gap-2 p-3 ${
                      isSelected
                        ? "bg-[#E45826] text-white"
                        : "bg-white text-black hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="text-[10px] text-center leading-tight">
                      {(CATEGORY_LABELS[cat.value] || cat.value).toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
            {(localFilters.categories?.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocalFilters({ ...localFilters, categories: [] })}
                className="w-full text-xs border-2 border-black hover:bg-black hover:text-white"
              >
                {t("deselectAll")}
              </Button>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="font-black">{t("priceUpTo").toUpperCase()} {localFilters.maxPrice} EUR</Label>
            <Slider
              value={[localFilters.maxPrice]}
              onValueChange={([value]) =>
                setLocalFilters({ ...localFilters, maxPrice: value })
              }
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs font-bold">
              <span>0 EUR</span>
              <span>100 EUR</span>
              <span>200 EUR</span>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label className="font-black">{t("sorting").toUpperCase()}</Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, sortBy: value })
              }
            >
              <SelectTrigger className="border-2 border-black bg-white font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-black">
                <SelectItem value="distance" className="font-bold">{t("distance")}</SelectItem>
                <SelectItem value="price_asc" className="font-bold">{t("priceAsc")}</SelectItem>
                <SelectItem value="price_desc" className="font-bold">{t("priceDesc")}</SelectItem>
                <SelectItem value="created_desc" className="font-bold">{t("newest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleApply}
            className="w-full py-3 border-2 border-black bg-[#E45826] text-white hover:bg-white hover:text-black transition-all font-black tracking-wider"
          >
            {t("applyFilter").toUpperCase()}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
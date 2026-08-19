import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FolderCategory {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface CategoryFoldersProps {
  categories: FolderCategory[];
  active: string;
  onSelect: (value: string) => void;
  counts: Record<string, number>;
  total: number;
}

export function CategoryFolders({ categories, active, onSelect, counts, total }: CategoryFoldersProps) {
  const items = [{ value: "all", label: "All Projects", icon: categories[0]?.icon }, ...categories];
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {items.map((c, i) => {
        const Icon = c.icon;
        const isActive = active === c.value;
        const count = c.value === "all" ? total : (counts[c.value] ?? 0);
        return (
          <motion.button
            key={c.value}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(c.value)}
            className={cn(
              "flex shrink-0 flex-col gap-1.5 rounded-xl border px-3.5 py-2.5 min-w-[104px] text-left transition-all",
              isActive
                ? "border-primary/60 bg-primary/10 shadow-sm"
                : "border-border/60 bg-card/60 hover:border-primary/30 hover:bg-secondary/40"
            )}
          >
            <div className="flex items-center justify-between">
              {Icon && <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />}
              <span className={cn("text-[10px] font-semibold rounded-full px-1.5 py-0.5", isActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                {count}
              </span>
            </div>
            <span className={cn("text-xs font-medium truncate", isActive ? "text-foreground" : "text-muted-foreground")}>{c.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

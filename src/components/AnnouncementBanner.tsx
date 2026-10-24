import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const KEY = "inlivin-dismissed-announcements";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  const { data = [] } = useQuery({
    queryKey: ["live-announcements"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await (supabase as any).from("announcements").select("id,title,content,priority,cta_label,cta_url,scheduled_at,expires_at,is_active")
        .eq("is_active", true).lte("scheduled_at", now).order("scheduled_at", { ascending: false }).limit(5);
      return (data ?? []).filter((a: any) => !a.expires_at || a.expires_at > now);
    },
  });
  const current = data.find((a: any) => !dismissed.includes(a.id));
  const close = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(KEY, JSON.stringify(next.slice(-50)));
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div key={current.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className={`mx-4 mt-4 flex items-start gap-3 rounded-2xl border p-4 md:mx-6 ${current.priority === "important" ? "border-destructive/40 bg-destructive/5" : current.priority === "celebrate" ? "border-primary/40 bg-gradient-to-r from-primary/15 to-accent/15" : "border-border/50 bg-card"}`}>
          <div className="rounded-full bg-primary/15 p-2 text-primary"><Megaphone size={16} /></div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">{current.title}</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{current.content}</p>
            {current.cta_label && current.cta_url && (
              <Button size="sm" className="mt-2" asChild><a href={current.cta_url}>{current.cta_label}</a></Button>
            )}
          </div>
          <button onClick={() => close(current.id)} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss"><X size={16} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Megaphone, Send, CalendarClock, Pencil, Trash2, Copy, Eye, X } from "lucide-react";

const sb = supabase as any;

type Ann = {
  id: string; title: string; content: string; is_active: boolean; created_at: string;
  scheduled_at: string; expires_at: string | null; priority: string;
  cta_label: string | null; cta_url: string | null;
};

const empty = { title: "", content: "", priority: "normal", cta_label: "", cta_url: "", scheduled_at: "", expires_at: "", notify: true };

const toLocal = (iso?: string | null) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : "");

const statusOf = (a: Ann) => {
  const now = Date.now();
  if (!a.is_active) return "paused";
  if (a.expires_at && new Date(a.expires_at).getTime() <= now) return "ended";
  if (new Date(a.scheduled_at).getTime() > now) return "scheduled";
  return "live";
};

const statusStyle: Record<string, string> = {
  live: "bg-primary/15 text-primary",
  scheduled: "bg-accent/15 text-accent-foreground",
  paused: "bg-muted text-muted-foreground",
  ended: "bg-secondary text-muted-foreground",
};

export default function AdminBroadcastPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [saving, setSaving] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["admin", "broadcasts"],
    queryFn: async () => {
      const { data, error } = await sb.from("announcements").select("*").order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as Ann[];
    },
  });

  const { data: userCount = 0 } = useQuery({
    queryKey: ["admin", "user-count"],
    queryFn: async () => (await sb.from("profiles").select("id", { count: "exact", head: true })).count ?? 0,
  });

  const visible = useMemo(() => (tab === "all" ? items : items.filter((a) => statusOf(a) === tab)), [items, tab]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { live: 0, scheduled: 0, paused: 0, ended: 0 };
    items.forEach((a) => c[statusOf(a)]++);
    return c;
  }, [items]);

  const set = (k: keyof typeof empty, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setForm(empty); setEditingId(null); };
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "broadcasts"] });

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error("Add a title and message");
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      priority: form.priority,
      cta_label: form.cta_label.trim() || null,
      cta_url: form.cta_url.trim() || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: true,
    };
    try {
      if (editingId) {
        const { error } = await sb.from("announcements").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Broadcast updated");
      } else {
        const { data, error } = await sb.from("announcements").insert({ ...payload, created_by: user?.id }).select("id").single();
        if (error) throw error;
        const sendNow = new Date(payload.scheduled_at).getTime() <= Date.now() + 60_000;
        if (form.notify && sendNow) {
          const { data: ids } = await sb.from("profiles").select("user_id");
          const rows = (ids ?? []).map((p: any) => ({
            user_id: p.user_id, type: "announcement", title: payload.title,
            message: payload.content.slice(0, 200), reference_id: data.id, reference_type: "announcement",
          }));
          for (let i = 0; i < rows.length; i += 500) await sb.from("notifications").insert(rows.slice(i, i + 500));
        }
        toast.success(sendNow ? "Broadcast is live" : "Broadcast scheduled");
      }
      reset(); refresh();
    } catch (e: any) {
      toast.error(e.message || "Couldn't save");
    } finally { setSaving(false); }
  };

  const edit = (a: Ann) => {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, priority: a.priority, cta_label: a.cta_label ?? "", cta_url: a.cta_url ?? "",
      scheduled_at: toLocal(a.scheduled_at), expires_at: toLocal(a.expires_at), notify: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggle = async (a: Ann) => { await sb.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id); refresh(); };
  const remove = async (a: Ann) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    await sb.from("announcements").delete().eq("id", a.id);
    await sb.from("notifications").delete().eq("reference_id", a.id);
    toast.success("Deleted"); refresh();
  };
  const duplicate = (a: Ann) => { edit(a); setEditingId(null); set("title", `${a.title} (copy)`); set("scheduled_at", ""); };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/15 via-background to-accent/10 p-6 md:p-8">
        <motion.div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 6, repeat: Infinity }} />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Megaphone size={14} /> Broadcast
            </div>
            <h1 className="font-display text-3xl font-extrabold">Message every user</h1>
            <p className="text-sm text-muted-foreground">Shows in-app and in notifications.</p>
          </div>
          <div className="flex gap-3">
            {[["Audience", userCount], ["Live", counts.live], ["Scheduled", counts.scheduled]].map(([l, v]) => (
              <div key={l as string} className="rounded-2xl border border-border/50 bg-background/60 px-4 py-2 backdrop-blur">
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="font-display text-xl font-bold">{v as number}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/50">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{editingId ? "Edit broadcast" : "New broadcast"}</h2>
              {editingId && <Button size="sm" variant="ghost" onClick={reset}><X size={14} className="mr-1" />Cancel</Button>}
            </div>
            <Input placeholder="Title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} />
            <Textarea placeholder="Message" rows={5} value={form.content} onChange={(e) => set("content", e.target.value)} maxLength={2000} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Button text (optional)" value={form.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
              <Input placeholder="Button link (optional)" value={form.cta_url} onChange={(e) => set("cta_url", e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Style</p>
                <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="celebrate">Celebrate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Send at (blank = now)</p>
                <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">End at (optional)</p>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} />
              </div>
            </div>
            {!editingId && (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.notify} onCheckedChange={(v) => set("notify", v)} /> Also add to everyone's notifications
              </label>
            )}
            <Button onClick={save} disabled={saving} className="w-full gap-2">
              {form.scheduled_at && new Date(form.scheduled_at).getTime() > Date.now() ? <CalendarClock size={16} /> : <Send size={16} />}
              {saving ? "Saving…" : editingId ? "Save changes" : form.scheduled_at && new Date(form.scheduled_at).getTime() > Date.now() ? "Schedule" : "Send now"}
            </Button>
          </CardContent>
        </Card>

        <div>
          <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground"><Eye size={12} /> Preview</p>
          <motion.div layout className={`rounded-2xl border p-5 ${form.priority === "important" ? "border-destructive/40 bg-destructive/5" : form.priority === "celebrate" ? "border-primary/40 bg-gradient-to-br from-primary/15 to-accent/15" : "border-border/50 bg-card"}`}>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/15 p-2 text-primary"><Megaphone size={16} /></div>
              <div className="min-w-0">
                <p className="font-display font-bold">{form.title || "Your title"}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{form.content || "Your message appears here."}</p>
                {form.cta_label && <Button size="sm" className="mt-3">{form.cta_label}</Button>}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({counts.live})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({counts.scheduled})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({counts.paused})</TabsTrigger>
          <TabsTrigger value="ended">Ended ({counts.ended})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <AnimatePresence>
          {visible.map((a) => {
            const s = statusOf(a);
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="border-border/50">
                  <CardContent className="flex flex-wrap items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{a.title}</p>
                        <Badge className={statusStyle[s]} variant="secondary">{s}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{a.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s === "scheduled" ? `Sends ${formatDistanceToNow(new Date(a.scheduled_at), { addSuffix: true })}` : `Sent ${format(new Date(a.scheduled_at), "PP p")}`}
                        {a.expires_at && ` · ends ${format(new Date(a.expires_at), "PP p")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={a.is_active} onCheckedChange={() => toggle(a)} title="Active" />
                      <Button size="icon" variant="ghost" onClick={() => edit(a)} title="Edit"><Pencil size={15} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => duplicate(a)} title="Duplicate"><Copy size={15} /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(a)} title="Delete"><Trash2 size={15} /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {visible.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
      </div>
    </div>
  );
}

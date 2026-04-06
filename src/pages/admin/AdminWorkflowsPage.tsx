import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Workflow } from "lucide-react";
import { toast } from "sonner";

const states = ["pending", "review", "shipped"] as const;

export default function AdminWorkflowsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminDb = supabase as any;

  const { data: workflows = [] } = useQuery({
    queryKey: ["admin", "workflow-states"],
    queryFn: async () => (await adminDb.from("admin_workflow_states").select("*").order("updated_at", { ascending: false }).limit(100)).data ?? [],
  });
  const { data: contentItems = [] } = useQuery({
    queryKey: ["admin", "workflow-content"],
    queryFn: async () => {
      const [announcementsRes, promotionsRes, adsRes] = await Promise.all([
        supabase.from("announcements").select("id, title, is_active, created_at").limit(25),
        supabase.from("promotions").select("id, title, is_active, created_at").limit(25),
        supabase.from("ads").select("id, title, is_active, created_at").limit(25),
      ]);
      return [
        ...(announcementsRes.data ?? []).map((item) => ({ ...item, entity_type: "announcement" })),
        ...(promotionsRes.data ?? []).map((item) => ({ ...item, entity_type: "promotion" })),
        ...(adsRes.data ?? []).map((item) => ({ ...item, entity_type: "ad" })),
      ];
    },
  });

  const derivedRows = useMemo(() => {
    const existing = new Set((workflows as any[]).map((row) => `${row.entity_type}:${row.entity_id}`));
    return (contentItems as any[])
      .filter((item) => !existing.has(`${item.entity_type}:${item.id}`))
      .map((item) => ({
        entity_type: item.entity_type,
        entity_id: item.id,
        state: item.is_active ? "shipped" : "review",
        title: item.title,
      }));
  }, [contentItems, workflows]);

  const seedWorkflowRows = async () => {
    if (!user?.id || !derivedRows.length) return toast.success("Workflow board already seeded");
    const payload = derivedRows.map((row) => ({
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      state: row.state,
      updated_by: user.id,
    }));
    const { error } = await adminDb.from("admin_workflow_states").upsert(payload, { onConflict: "entity_type,entity_id" });
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "workflow-states"] });
    toast.success("Workflow board seeded");
  };

  const updateState = async (rowId: string, state: string) => {
    const { error } = await adminDb.from("admin_workflow_states").update({ state, updated_by: user?.id }).eq("id", rowId);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "workflow-states"] });
    toast.success(`Workflow moved to ${state}`);
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Workflow className="h-5 w-5 text-cyan-300" />
              Workflow states
            </CardTitle>
            <CardDescription className="text-slate-300 text-xs">Move content from pending to review to shipped with a real table.</CardDescription>
          </div>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={seedWorkflowRows}>
            Seed board
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {states.map((state) => (
          <div key={state} className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{state}</div>
            <div className="mt-2 text-3xl font-black text-white">{(workflows as any[]).filter((row) => row.state === state).length}</div>
          </div>
        ))}
      </div>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white text-lg">Workflow table</CardTitle>
          <CardDescription className="text-slate-300 text-xs">Update state row by row or seed the board from live content.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300 text-xs">Entity</TableHead>
                <TableHead className="text-slate-300 text-xs">State</TableHead>
                <TableHead className="text-slate-300 text-xs">Updated</TableHead>
                <TableHead className="text-slate-300 text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(workflows as any[]).map((row) => (
                <TableRow key={row.id} className="border-white/10">
                  <TableCell className="text-white text-xs">{row.entity_type} / {row.entity_id}</TableCell>
                  <TableCell>
                    <Badge className="border-white/10 bg-white/10 text-white text-[10px]">{row.state}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">{new Date(row.updated_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Select value={row.state} onValueChange={(value) => updateState(row.id, value)}>
                      <SelectTrigger className="w-28 h-8 border-white/10 bg-white/5 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {!workflows.length && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={4} className="py-8 text-center text-slate-400 text-xs">No workflow states yet. Seed the board to begin.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

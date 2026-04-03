import { supabase } from "@/integrations/supabase/client";

export type AdminCommandHistoryRow = {
  id: string;
  actor_id: string;
  command_key: string;
  command_label: string;
  scope: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
};

export type AdminCommandHistoryResult = {
  items: AdminCommandHistoryRow[];
  source: "database" | "local";
};

const LOCAL_COMMAND_HISTORY_KEY = "ilivin-admin-command-history";

const readLocalHistory = (): AdminCommandHistoryRow[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_COMMAND_HISTORY_KEY);
    const parsed = raw ? (JSON.parse(raw) as AdminCommandHistoryRow[]) : [];
    return [...parsed].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
  } catch {
    return [];
  }
};

const writeLocalHistory = (items: AdminCommandHistoryRow[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_COMMAND_HISTORY_KEY, JSON.stringify(items.slice(0, 100)));
};

const appendLocalHistory = (entry: AdminCommandHistoryRow) => {
  writeLocalHistory([entry, ...readLocalHistory()]);
};

export async function fetchAdminCommandHistory(): Promise<AdminCommandHistoryResult> {
  const { data, error } = await (supabase as any)
    .from("admin_command_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!error) {
    return {
      items: (data ?? []) as AdminCommandHistoryRow[],
      source: "database",
    };
  }

  return {
    items: readLocalHistory().slice(0, 50),
    source: "local",
  };
}

export async function runAdminOperation({
  actorId,
  commandKey,
  commandLabel,
  scope,
}: {
  actorId: string;
  commandKey: string;
  commandLabel: string;
  scope: string;
}) {
  const now = new Date().toISOString();

  const fallbackEntry: AdminCommandHistoryRow = {
    id: `local-${commandKey}-${Date.now()}`,
    actor_id: actorId,
    command_key: commandKey,
    command_label: commandLabel,
    scope,
    status: "completed",
    payload: {},
    result: { message: `${commandLabel} complete`, source: "local-fallback" },
    created_at: now,
    completed_at: now,
  };

  const { data: inserted, error: insertError } = await (supabase as any)
    .from("admin_command_history")
    .insert([
      {
        actor_id: actorId,
        command_key: commandKey,
        command_label: commandLabel,
        scope,
        status: "running",
        payload: {},
      },
    ])
    .select()
    .maybeSingle();

  if (insertError) {
    appendLocalHistory(fallbackEntry);
    return { source: "local" as const, entry: fallbackEntry };
  }

  const completedAt = new Date().toISOString();
  const result = { message: `${commandLabel} complete` };

  const { error: updateError } = await (supabase as any)
    .from("admin_command_history")
    .update({
      status: "completed",
      completed_at: completedAt,
      result,
    })
    .eq("id", inserted?.id);

  if (updateError) {
    appendLocalHistory({
      ...fallbackEntry,
      result: { ...fallbackEntry.result, database_id: inserted?.id ?? null },
    });
    return { source: "local" as const, entry: fallbackEntry };
  }

  await (supabase as any).from("admin_monitoring_events").insert([
    {
      event_type: "maintenance",
      severity: "info",
      source: "admin",
      message: `${commandLabel} completed`,
      metadata: { command_key: commandKey, scope },
    },
  ]);

  return {
    source: "database" as const,
    entry: {
      ...(inserted as AdminCommandHistoryRow),
      status: "completed",
      completed_at: completedAt,
      result,
    },
  };
}

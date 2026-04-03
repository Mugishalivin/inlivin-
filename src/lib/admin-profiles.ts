import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export type AdminProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  last_seen_at: string | null;
  created_at: string;
  status?: string | null;
  role: AppRole;
  user_roles: Array<{ role: AppRole }>;
};

const rolePriority: Record<AppRole, number> = {
  admin: 0,
  moderator: 1,
  user: 2,
};

const normalizeRole = (value: unknown): AppRole | null => {
  if (value === "admin" || value === "moderator" || value === "user") {
    return value;
  }

  return null;
};

const getPrimaryRole = (roles: AppRole[]) => {
  return [...roles].sort((left, right) => rolePriority[left] - rolePriority[right])[0] ?? "user";
};

const normalizeProfileRow = (profile: any, roles: AppRole[]): AdminProfileRow => ({
  id: profile.id,
  user_id: profile.user_id,
  display_name: profile.display_name ?? null,
  username: profile.username ?? null,
  bio: profile.bio ?? null,
  avatar_url: profile.avatar_url ?? null,
  location: profile.location ?? null,
  website: profile.website ?? null,
  last_seen_at: profile.last_seen_at ?? null,
  created_at: profile.created_at,
  status: profile.status ?? "active",
  role: normalizeRole(profile.role) ?? getPrimaryRole(roles),
  user_roles: roles.map((role) => ({ role })),
});

const buildRoleMap = (rows: Array<{ user_id: string; role: unknown }> | null | undefined) => {
  const roleMap = new Map<string, AppRole[]>();

  for (const row of rows ?? []) {
    const role = normalizeRole(row.role);
    if (!role) continue;
    const existing = roleMap.get(row.user_id) ?? [];
    roleMap.set(row.user_id, [...existing, role]);
  }

  return roleMap;
};

export async function fetchAdminProfiles(): Promise<AdminProfileRow[]> {
  const { data: profiles, error: profilesError } = await (supabase as any)
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!profilesError) {
    const { data: userRoles } = await (supabase as any)
      .from("user_roles")
      .select("user_id, role");

    const roleMap = buildRoleMap(userRoles);

    return (profiles ?? []).map((profile: any) =>
      normalizeProfileRow(profile, roleMap.get(profile.user_id) ?? []),
    );
  }

  const { data: rpcRows, error: rpcError } = await (supabase as any).rpc("admin_get_profiles");
  if (rpcError) {
    throw profilesError;
  }

  return (rpcRows ?? []).map((profile: any) => {
    const roles = Array.isArray(profile.user_roles)
      ? profile.user_roles
          .map((entry: any) => normalizeRole(entry?.role))
          .filter(Boolean) as AppRole[]
      : [];

    return normalizeProfileRow(profile, roles);
  });
}

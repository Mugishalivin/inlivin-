import { supabase } from "@/integrations/supabase/client";

export interface AdminBadgeMetrics {
  unreadReports: number;
  suspendedUsers: number;
  bannedUsers: number;
  flaggedContent: number;
  pendingApprovals: number;
  recentAuditLogs: number;
  securityAlerts: number;
  failedLoginAttempts: number;
  totalAdminActions: number;
}

/**
 * Fetch unread reports count
 */
export async function getUnreadReportsCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("admin_reports")
      .select("*", { count: "exact", head: true })
      .eq("is_resolved", false);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch unread reports count:", err);
    return 0;
  }
}

/**
 * Fetch suspended users count
 */
export async function getSuspendedUsersCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("is_suspended", true);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch suspended users count:", err);
    return 0;
  }
}

/**
 * Fetch banned users count
 */
export async function getBannedUsersCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("is_banned", true);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch banned users count:", err);
    return 0;
  }
}

/**
 * Fetch flagged content count
 */
export async function getFlaggedContentCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("admin_reports")
      .select("*", { count: "exact", head: true })
      .eq("report_type", "content")
      .eq("is_resolved", false);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch flagged content count:", err);
    return 0;
  }
}

/**
 * Fetch pending approvals count (requires approval workflow setup)
 */
export async function getPendingApprovalsCount(): Promise<number> {
  try {
    const { count, error } = await (supabase as any)
      .from("admin_approvals")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "relation does not exist", which is fine for now
      throw error;
    }
    return count ?? 0;
  } catch {
    return 0; // Return 0 if table doesn't exist
  }
}

/**
 * Fetch recent unreviewed audit logs count
 */
export async function getRecentAuditLogsCount(hoursSince: number = 24): Promise<number> {
  try {
    const cutoffTime = new Date(Date.now() - hoursSince * 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact", head: true })
      .gt("created_at", cutoffTime);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch recent audit logs count:", err);
    return 0;
  }
}

/**
 * Fetch security alerts count
 */
export async function getSecurityAlertsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact", head: true })
      .in("action", ["security_event", "user_banned", "impersonation_started"])
      .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch security alerts count:", err);
    return 0;
  }
}

/**
 * Fetch failed login attempts count (requires login_attempts table)
 */
export async function getFailedLoginAttemptsCount(): Promise<number> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count, error } = await (supabase as any)
      .from("admin_login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("success", false)
      .gt("created_at", oneDayAgo);

    if (error && error.code !== "PGRST116") {
      throw error;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch total admin actions count (recent)
 */
export async function getTotalAdminActionsCount(hoursSince: number = 24): Promise<number> {
  try {
    const cutoffTime = new Date(Date.now() - hoursSince * 60 * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from("admin_audit_logs")
      .select("*", { count: "exact", head: true })
      .gt("created_at", cutoffTime);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.error("Failed to fetch total admin actions count:", err);
    return 0;
  }
}

/**
 * Get all admin badge metrics at once
 */
export async function getAdminBadgeMetrics(): Promise<AdminBadgeMetrics> {
  const [
    unreadReports,
    suspendedUsers,
    bannedUsers,
    flaggedContent,
    pendingApprovals,
    recentAuditLogs,
    securityAlerts,
    failedLoginAttempts,
    totalAdminActions,
  ] = await Promise.all([
    getUnreadReportsCount(),
    getSuspendedUsersCount(),
    getBannedUsersCount(),
    getFlaggedContentCount(),
    getPendingApprovalsCount(),
    getRecentAuditLogsCount(),
    getSecurityAlertsCount(),
    getFailedLoginAttemptsCount(),
    getTotalAdminActionsCount(),
  ]);

  return {
    unreadReports,
    suspendedUsers,
    bannedUsers,
    flaggedContent,
    pendingApprovals,
    recentAuditLogs,
    securityAlerts,
    failedLoginAttempts,
    totalAdminActions,
  };
}

/**
 * Get badge count for a specific admin section
 */
export function getBadgeCountForSection(metrics: AdminBadgeMetrics, sectionKey: string): number {
  const sectionBadgeMap: Record<string, keyof AdminBadgeMetrics> = {
    "reports": "unreadReports",
    "users": "suspendedUsers",
    "content": "flaggedContent",
    "security": "securityAlerts",
    "monitoring": "recentAuditLogs",
    "audit": "totalAdminActions",
  };

  const metricKey = sectionBadgeMap[sectionKey];
  return metricKey ? metrics[metricKey] : 0;
}

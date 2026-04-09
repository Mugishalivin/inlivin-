import { supabase } from "@/integrations/supabase/client";

export type AuditAction = 
  | "user_banned" 
  | "user_unbanned" 
  | "user_suspended" 
  | "user_unsuspended"
  | "user_role_changed"
  | "content_removed"
  | "content_flagged"
  | "content_approved"
  | "report_created"
  | "report_resolved"
  | "report_rejected"
  | "impersonation_started"
  | "impersonation_ended"
  | "settings_updated"
  | "security_event"
  | "api_key_generated"
  | "api_key_revoked"
  | "webhook_created"
  | "webhook_deleted"
  | "email_sent"
  | "backup_created"
  | "data_exported"
  | "system_maintenance"
  | "bulk_operation"
  | "permissions_changed"
  | "feature_flag_toggled"
  | "other";

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, any>;
}

/**
 * Log an admin action to the audit trail
 */
export async function logAuditAction(
  actorId: string,
  entry: AuditLogEntry
): Promise<boolean> {
  if (!actorId) return false;

  try {
    const { error } = await supabase
      .from("admin_audit_logs")
      .insert([
        {
          actor_id: actorId,
          action: entry.action,
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          details: entry.details || {},
          severity: entry.severity || "low",
          metadata: entry.metadata || {},
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error("Failed to log audit action:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Audit logging error:", err);
    return false;
  }
}

/**
 * Log a user action (ban, suspend, role change, etc.)
 */
export async function logUserAction(
  actorId: string,
  action: "banned" | "unbanned" | "suspended" | "unsuspended" | "role_changed",
  targetUserId: string,
  details?: Record<string, any>
): Promise<boolean> {
  const actionMap: Record<string, AuditAction> = {
    banned: "user_banned",
    unbanned: "user_unbanned",
    suspended: "user_suspended",
    unsuspended: "user_unsuspended",
    role_changed: "user_role_changed",
  };

  return logAuditAction(actorId, {
    action: actionMap[action],
    entity_type: "user",
    entity_id: targetUserId,
    details: details || {},
    severity: action === "role_changed" ? "medium" : "high",
  });
}

/**
 * Log content moderation action
 */
export async function logContentAction(
  actorId: string,
  action: "removed" | "flagged" | "approved",
  contentId: string,
  contentType: string,
  details?: Record<string, any>
): Promise<boolean> {
  const actionMap: Record<string, AuditAction> = {
    removed: "content_removed",
    flagged: "content_flagged",
    approved: "content_approved",
  };

  return logAuditAction(actorId, {
    action: actionMap[action],
    entity_type: contentType,
    entity_id: contentId,
    details: details || {},
    severity: action === "removed" ? "high" : "medium",
  });
}

/**
 * Log report action
 */
export async function logReportAction(
  actorId: string,
  action: "created" | "resolved" | "rejected",
  reportId: string,
  details?: Record<string, any>
): Promise<boolean> {
  const actionMap: Record<string, AuditAction> = {
    created: "report_created",
    resolved: "report_resolved",
    rejected: "report_rejected",
  };

  return logAuditAction(actorId, {
    action: actionMap[action],
    entity_type: "report",
    entity_id: reportId,
    details: details || {},
    severity: "medium",
  });
}

/**
 * Log impersonation session
 */
export async function logImpersonationAction(
  actorId: string,
  action: "started" | "ended",
  targetUserId: string,
  reason?: string
): Promise<boolean> {
  const actionMap: Record<string, AuditAction> = {
    started: "impersonation_started",
    ended: "impersonation_ended",
  };

  return logAuditAction(actorId, {
    action: actionMap[action],
    entity_type: "user",
    entity_id: targetUserId,
    details: { reason },
    severity: "high",
  });
}

/**
 * Log settings update
 */
export async function logSettingsUpdate(
  actorId: string,
  section: string,
  changes: Record<string, any>
): Promise<boolean> {
  return logAuditAction(actorId, {
    action: "settings_updated",
    entity_type: "system_settings",
    entity_id: section,
    details: changes || {},
    severity: "medium",
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  actorId: string,
  event: string,
  details?: Record<string, any>
): Promise<boolean> {
  return logAuditAction(actorId, {
    action: "security_event",
    entity_type: "security",
    entity_id: event,
    details: details || {},
    severity: "high",
  });
}

/**
 * Log bulk operation
 */
export async function logBulkOperation(
  actorId: string,
  operationType: string,
  count: number,
  details?: Record<string, any>
): Promise<boolean> {
  return logAuditAction(actorId, {
    action: "bulk_operation",
    entity_type: "bulk",
    entity_id: operationType,
    details: { count, ...details },
    severity: "high",
  });
}

/**
 * Fetch recent audit logs
 */
export async function fetchRecentAuditLogs(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    return [];
  }
}

/**
 * Filter audit logs by action
 */
export async function getAuditLogsByAction(action: AuditAction, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to fetch audit logs by action:", err);
    return [];
  }
}

/**
 * Get admin activity summary for dashboard
 */
export async function getAdminActivitySummary(hours: number = 24) {
  try {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("action, count(*)")
      .gt("created_at", cutoffTime)
      .order("action");

    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error("Failed to fetch admin activity summary:", err);
    return [];
  }
}

/**
 * Export audit logs for compliance
 */
export async function exportAuditLogs(startDate: Date, endDate: Date) {
  try {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error("Failed to export audit logs:", err);
    return [];
  }
}

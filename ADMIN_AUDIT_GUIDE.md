# Admin Audit Logging System Guide

## Overview

The audit logging system provides comprehensive tracking of all admin actions in the platform. Every administrative operation is recorded with timestamps, actor information, action type, affected entities, and detailed context.

## Quick Start

### Basic Audit Logging

```typescript
import { logAuditAction } from "@/lib/audit-logger";

// Log a generic action
await logAuditAction(userId, {
  action: "user_banned",
  entity_type: "user",
  entity_id: targetUserId,
  details: { reason: "Violated terms of service" },
  severity: "high"
});
```

### Logging Specific Actions

#### User Actions (Ban, Suspend, Role Changes)
```typescript
import { logUserAction } from "@/lib/audit-logger";

await logUserAction(adminId, "banned", userId, {
  reason: "Spam abuse",
  banned_at: new Date().toISOString()
});

await logUserAction(adminId, "role_changed", userId, {
  old_role: "user",
  new_role: "moderator"
});
```

#### Content Moderation
```typescript
import { logContentAction } from "@/lib/audit-logger";

await logContentAction(adminId, "removed", contentId, "post", {
  reason: "Harmful content",
  removed_by_report: reportId
});
```

#### Report Management
```typescript
import { logReportAction } from "@/lib/audit-logger";

await logReportAction(adminId, "resolved", reportId, {
  resolution: "Content removed",
  action_taken: "user_banned"
});
```

#### Admin Impersonation
```typescript
import { logImpersonationAction } from "@/lib/audit-logger";

await logImpersonationAction(adminId, "started", targetUserId, "Testing user experience");
```

#### Settings Changes
```typescript
import { logSettingsUpdate } from "@/lib/audit-logger";

await logSettingsUpdate(adminId, "email_settings", {
  smtp_host_changed: true,
  new_value: "smtp.example.com"
});
```

#### Security Events
```typescript
import { logSecurityEvent } from "@/lib/audit-logger";

await logSecurityEvent(adminId, "suspicious_login_attempt", {
  user_id: userId,
  ip_address: "192.168.1.1",
  attempts: 5
});
```

#### Bulk Operations
```typescript
import { logBulkOperation } from "@/lib/audit-logger";

await logBulkOperation(adminId, "bulk_email_send", 1523, {
  template: "welcome",
  target_segment: "new_users"
});
```

## Audit Badge System

The admin sidebar automatically displays badges showing items requiring attention:

### Badge Metrics

| Section | Badge Shows | Updated |
|---------|-------------|---------|
| **Reports** | Unresolved reports | Every 30s |
| **Users** | Suspended users | Every 30s |
| **Content** | Flagged content items | Every 30s |
| **Security** | Recent security alerts | Every 30s |
| **Monitoring** | Audit logs in last 24h | Every 30s |
| **Audit** | Total admin actions (24h) | Every 30s |

### Using Badge Metrics in Your Code

```typescript
import { getAdminBadgeMetrics, getBadgeCountForSection } from "@/lib/admin-badge-metrics";

// Get all metrics
const metrics = await getAdminBadgeMetrics();
console.log(`Unread reports: ${metrics.unreadReports}`);
console.log(`Suspended users: ${metrics.suspendedUsers}`);

// Get specific section badge count
const reportBadgeCount = getBadgeCountForSection(metrics, "reports");
```

## Database Schema

### admin_audit_logs Table

```sql
Column          Type        Description
-------         -----       -----------
id              uuid        Unique identifier
actor_id        uuid        User who performed action (FK auth.users)
action          text        Action type (e.g., "user_banned", "content_removed")
entity_type     text        Type of entity affected (e.g., "user", "post", "report")
entity_id       text        ID of affected entity
details         jsonb       Additional context as JSON
severity        text        'low', 'medium', 'high', 'critical'
metadata        jsonb       Extra metadata/tags
created_at      timestamptz Timestamp of action
```

### admin_reports Table

```sql
Column              Type        Description
-------             -----       -----------
id                  uuid        Unique identifier
reporter_id         uuid        User who submitted report (FK auth.users)
report_type         text        'user', 'content', 'other'
target_user_id      uuid        User being reported (if applicable)
target_content_id   text        Content being reported (if applicable)
description         text        Report description
is_resolved         boolean     Resolution status
resolved_by         uuid        Admin who resolved (if applicable)
resolution_notes    text        How it was resolved
severity            text        'low', 'medium', 'high', 'critical'
created_at          timestamptz Report timestamp
resolved_at         timestamptz Resolution timestamp (if applicable)
```

### admin_approvals Table

```sql
Column          Type        Description
-------         -----       -----------
id              uuid        Unique identifier
requester_id    uuid        User requesting approval
request_type    text        Type of request
entity_type     text        Entity type involved
entity_id       text        Entity ID
description     text        Request description
status          text        'pending', 'approved', 'rejected'
approved_by     uuid        Approving admin
approval_notes  text        Approval notes
created_at      timestamptz Request timestamp
resolved_at     timestamptz Resolution timestamp
```

## Action Types

### User Actions
- `user_banned` - User account banned
- `user_unbanned` - User account restored
- `user_suspended` - User account suspended temporarily
- `user_unsuspended` - User suspension lifted
- `user_role_changed` - User role modified

### Content Actions
- `content_removed` - Content deleted
- `content_flagged` - Content marked for review
- `content_approved` - Content approved after review

### Report Actions
- `report_created` - New report submitted
- `report_resolved` - Report addressed
- `report_rejected` - Report dismissed

### Admin Actions
- `impersonation_started` - Admin started user impersonation
- `impersonation_ended` - Admin ended impersonation
- `settings_updated` - Admin settings changed
- `security_event` - Security-related event logged
- `api_key_generated` - New API key created
- `api_key_revoked` - API key revoked
- `webhook_created` - Webhook endpoint added
- `webhook_deleted` - Webhook removed
- `bulk_operation` - Bulk operation performed
- `permissions_changed` - Permission configuration changed
- `feature_flag_toggled` - Feature flag modified
- `email_sent` - Email message sent
- `backup_created` - System backup created
- `data_exported` - Data export completed
- `system_maintenance` - Maintenance operation
- `other` - Other unmapped action

## Severity Levels

- **low** - Informational actions (settings view, searches)
- **medium** - Content moderation, report handling, withdrawals
- **high** - User bans, role changes, direct impersonation, bulk ops
- **critical** - Security events, permission changes, system alerts

## Querying Audit Logs

### In AdminAuditPage

The audit log page automatically displays all logs with:
- Actor name (or "You" for current user)
- Action type (color-coded badge)
- Entity type / ID
- Detailed JSON of changes
- Human-readable timestamp

Search filters by: action, entity_type, entity_id, or details JSON

### Programmatically

```typescript
import { 
  fetchRecentAuditLogs, 
  getAuditLogsByAction,
  getAdminActivitySummary,
  exportAuditLogs 
} from "@/lib/audit-logger";

// Get recent actions
const recent = await fetchRecentAuditLogs(100);

// Get logs for specific action
const bans = await getAuditLogsByAction("user_banned");

// Get activity summary (last 24h)
const summary = await getAdminActivitySummary(24);

// Export for compliance
const exported = await exportAuditLogs(startDate, endDate);
```

## Integration Examples

### When Banning a User

```typescript
import { logUserAction } from "@/lib/audit-logger";

async function banUser(userId: string, reason: string) {
  // Perform ban...
  await supabase
    .from("user_roles")
    .update({ is_banned: true, ban_reason: reason })
    .eq("user_id", userId);

  // Log the action
  await logUserAction(currentUser.id, "banned", userId, {
    reason,
    ban_effective_at: new Date().toISOString()
  });

  // Invalidate cache so badges update
  queryClient.invalidateQueries({ queryKey: ["admin-badge-metrics"] });
}
```

### When Deleting Content

```typescript
import { logContentAction } from "@/lib/audit-logger";

async function removeContent(contentId: string, reason: string) {
  // Delete content...
  await supabase
    .from("posts")
    .delete()
    .eq("id", contentId);

  // Log the action
  await logContentAction(currentUser.id, "removed", contentId, "post", {
    reason,
    removed_at: new Date().toISOString()
  });

  // Update badge metrics
  queryClient.invalidateQueries({ queryKey: ["admin-badge-metrics"] });
}
```

## Best Practices

1. **Always Log Admin Actions** - Every administrative operation should be logged
2. **Include Context** - Add relevant details in the `details` field
3. **Use Appropriate Severity** - Mark security events as high/critical
4. **Invalidate Badges** - After operations, invalidate badge metric queries
5. **Document Changes** - Include before/after values in details when applicable
6. **Regular Reviews** - Admins should review audit logs regularly
7. **Export for Compliance** - Use exportAuditLogs for regulatory requirements

## Viewing Audit Logs

Navigate to **Admin** → **Audit** in the admin dashboard to:
- View complete audit trail
- Search by action type, entity, or details
- See actor name and timestamp
- Export logs for compliance
- Monitor admin activity over time

## Notes

- Audit logs are immutable - they cannot be edited or deleted
- Only admins can read audit logs
- Only the acting admin can insert their own logs (enforced by RLS)
- Logs include full JSON context in details field
- Large operations use `bulk_operation` action type
- All timestamps are in UTC (timestamptz)

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Handle view once message
export const markMessageAsViewed = async (messageId: string, userId: string) => {
  try {
    const { data: message } = await supabase
      .from("messages")
      .select("is_view_once")
      .eq("id", messageId)
      .single();

    if (!message?.is_view_once) return;

    // Record the view
    await supabase.from("message_views").insert({
      message_id: messageId,
      user_id: userId,
    });

    // Update message with viewer info
    await supabase
      .from("messages")
      .update({
        view_once_viewed_by: supabase.rpc('append_to_array', {
          arr: [],
          value: userId,
        }),
      })
      .eq("id", messageId);
  } catch (error) {
    console.error("Error marking message as viewed:", error);
  }
};

// Send view once message
export const sendViewOnceMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  attachmentUrl?: string
) => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        attachment_url: attachmentUrl || null,
        is_view_once: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    toast.error("Failed to send view once message");
    throw error;
  }
};

// Handle disappearing messages
export const createDisappearingMessage = async (
  messageId: string,
  userId: string,
  durationSeconds: number
) => {
  try {
    const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();
    const { error } = await supabase
      .from("disappearing_messages")
      .insert({
        message_id: messageId,
        user_id: userId,
        expires_at: expiresAt,
      });

    if (error) throw error;
  } catch (error) {
    console.error("Error creating disappearing message:", error);
  }
};

// Report message
export const reportMessage = async (
  messageId: string,
  reportedByUserId: string,
  reportedUserId: string,
  reason: string,
  description?: string
) => {
  try {
    const { error } = await supabase
      .from("message_reports")
      .insert({
        message_id: messageId,
        reported_by: reportedByUserId,
        reported_user: reportedUserId,
        reason,
        description: description || null,
        status: "pending",
      });

    if (error) throw error;
    toast.success("Message reported");
  } catch (error) {
    console.error("Error reporting message:", error);
    toast.error("Failed to report message");
  }
};

// Block user
export const blockUser = async (
  blockerId: string,
  blockedId: string,
  reason?: string
) => {
  try {
    const { error } = await supabase
      .from("user_blocks")
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId,
        reason: reason || null,
      });

    if (error) throw error;
    toast.success("User blocked");
  } catch (error) {
    console.error("Error blocking user:", error);
    toast.error("Failed to block user");
  }
};

// Unblock user
export const unblockUser = async (blockerId: string, blockedId: string) => {
  try {
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);

    if (error) throw error;
    toast.success("User unblocked");
  } catch (error) {
    console.error("Error unblocking user:", error);
    toast.error("Failed to unblock user");
  }
};

// Check if user is blocked
export const isUserBlocked = async (userId: string, otherUserId: string) => {
  try {
    const { data } = await supabase
      .from("user_blocks")
      .select("id")
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error("Error checking block status:", error);
    return false;
  }
};

// Update conversation settings
export const updateConversationSettings = async (
  conversationId: string,
  userId: string,
  settings: {
    notificationSetting?: "all" | "mentions" | "muted";
    disappearingMessagesDuration?: number | null;
    showReadReceipts?: boolean;
    blockAllMedia?: boolean;
  }
) => {
  try {
    const updateData: any = {};
    if (settings.notificationSetting !== undefined)
      updateData.notification_setting = settings.notificationSetting;
    if (settings.disappearingMessagesDuration !== undefined)
      updateData.disappearing_messages_duration = settings.disappearingMessagesDuration;
    if (settings.showReadReceipts !== undefined)
      updateData.show_read_receipts = settings.showReadReceipts;
    if (settings.blockAllMedia !== undefined)
      updateData.block_all_media = settings.blockAllMedia;

    const { error } = await supabase
      .from("conversation_participants")
      .update(updateData)
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) throw error;
    toast.success("Settings updated");
  } catch (error) {
    console.error("Error updating settings:", error);
    toast.error("Failed to update settings");
  }
};

// Create group chat
export const createGroupChat = async (
  creatorId: string,
  groupName: string,
  memberIds: string[],
  icon_url?: string
) => {
  try {
    const conversationId = crypto.randomUUID();

    // Create conversation
    const { error: convoError } = await supabase
      .from("conversations")
      .insert({
        id: conversationId,
        group_description: groupName,
        group_icon_url: icon_url || null,
      });

    if (convoError) throw convoError;

    // Add creator as admin
    await supabase.from("conversation_participants").insert({
      conversation_id: conversationId,
      user_id: creatorId,
      is_admin: true,
    });

    // Add group member role for creator
    await supabase.from("group_member_roles").insert({
      conversation_id: conversationId,
      user_id: creatorId,
      role: "admin",
      permissions: ["send_messages", "add_members", "remove_members", "change_settings"],
    });

    // Add members
    for (const memberId of memberIds) {
      await supabase.from("conversation_participants").insert({
        conversation_id: conversationId,
        user_id: memberId,
        is_admin: false,
      });

      await supabase.from("group_member_roles").insert({
        conversation_id: conversationId,
        user_id: memberId,
        role: "member",
        permissions: ["send_messages"],
      });
    }

    // Log the action
    await supabase.from("conversation_audit_log").insert({
      conversation_id: conversationId,
      actor_id: creatorId,
      action: "group_created",
      details: { group_name: groupName, initial_members: memberIds },
    });

    toast.success("Group created");
    return conversationId;
  } catch (error) {
    console.error("Error creating group:", error);
    toast.error("Failed to create group");
    throw error;
  }
};

// Leave group
export const leaveGroup = async (conversationId: string, userId: string) => {
  try {
    // Remove from participants
    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) throw error;

    // Log the action
    await supabase.from("conversation_audit_log").insert({
      conversation_id: conversationId,
      actor_id: userId,
      action: "member_left",
      target_user_id: userId,
    });

    toast.success("Left group");
  } catch (error) {
    console.error("Error leaving group:", error);
    toast.error("Failed to leave group");
  }
};

// Search messages
export const searchMessages = async (
  conversationId: string,
  searchTerm: string
): Promise<any[]> => {
  try {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .ilike("content", `%${searchTerm}%`)
      .order("created_at", { ascending: false });

    return data || [];
  } catch (error) {
    console.error("Error searching messages:", error);
    return [];
  }
};

// Format message time
export const formatMessageTime = (date: Date | string): string => {
  const messageDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return messageDate.toLocaleDateString();
};

// Check if message is viewed by user
export const isMessageViewedByUser = async (messageId: string, userId: string) => {
  try {
    const { data } = await supabase
      .from("message_views")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error("Error checking message view:", error);
    return false;
  }
};

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase as supabaseRaw } from "@/integrations/supabase/client";
const supabase: any = supabaseRaw;
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, UserPlus, Trash2, Crown, Shield, Search, Copy, Clock
} from "lucide-react";

interface GroupChatSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentUserId: string;
  groupName?: string;
  isAdmin?: boolean;
}

export function GroupChatSettingsDialog({
  isOpen,
  onOpenChange,
  conversationId,
  currentUserId,
  groupName = "Group Chat",
  isAdmin = false,
}: GroupChatSettingsDialogProps) {
  const [newGroupName, setNewGroupName] = useState(groupName);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["group-members", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversation_participants")
        .select(
          `
          user_id,
          is_admin,
          created_at,
          profiles:user_id(display_name, avatar_url, username)
        `
        )
        .eq("conversation_id", conversationId);
      return data || [];
    },
    enabled: isOpen && !!conversationId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["group-member-roles", conversationId],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_member_roles")
        .select("*")
        .eq("conversation_id", conversationId);
      return data || [];
    },
    enabled: isOpen && !!conversationId && isAdmin,
  });

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) {
      toast.error("Only admins can remove members");
      return;
    }

    try {
      await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", memberId);

      // Log the action
      await supabase.from("conversation_audit_log").insert({
        conversation_id: conversationId,
        actor_id: currentUserId,
        action: "member_removed",
        target_user_id: memberId,
      });

      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleMakeAdmin = async (memberId: string) => {
    if (!isAdmin) {
      toast.error("Only admins can change roles");
      return;
    }

    try {
      await supabase
        .from("conversation_participants")
        .update({ is_admin: true })
        .eq("conversation_id", conversationId)
        .eq("user_id", memberId);

      // Update group member role
      await supabase
        .from("group_member_roles")
        .upsert({
          conversation_id: conversationId,
          user_id: memberId,
          role: "admin",
          permissions: ["send_messages", "add_members", "remove_members", "change_settings"],
        });

      // Log the action
      await supabase.from("conversation_audit_log").insert({
        conversation_id: conversationId,
        actor_id: currentUserId,
        action: "admin_changed",
        target_user_id: memberId,
        details: { new_role: "admin" },
      });

      toast.success("Member made admin");
    } catch (error) {
      toast.error("Failed to make admin");
    }
  };

  const handleGenerateJoinLink = async () => {
    try {
      const code = Math.random().toString(36).substr(2, 9).toUpperCase();
      const { data } = await supabase
        .from("group_join_links")
        .insert({
          conversation_id: conversationId,
          code: code,
          created_by: currentUserId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      const joinLink = `${window.location.origin}/join-group/${code}`;
      navigator.clipboard.writeText(joinLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Join link copied to clipboard");
    } catch (error) {
      toast.error("Failed to generate join link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogDescription className="sr-only">Manage group members, roles, permissions, and invite links</DialogDescription>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Group Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Group Name */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Group Name</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </CardContent>
            </Card>
          )}

          {/* Group Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Members ({groupMembers.length})</span>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="text-xs"
                  >
                    <UserPlus className="w-3 h-3 mr-1" /> Add
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {groupMembers.map((member: any) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {member.profiles?.avatar_url && (
                        <img
                          src={member.profiles.avatar_url}
                          alt={member.profiles?.display_name || "Member"}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {member.profiles?.display_name || member.profiles?.username}
                        </p>
                        {member.is_admin && (
                          <span className="text-xs text-blue-600 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && member.user_id !== currentUserId && (
                      <div className="flex gap-1">
                        {!member.is_admin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMakeAdmin(member.user_id)}
                            className="text-xs"
                          >
                            <Shield className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Join Link */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Invite Link
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGenerateJoinLink} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedLink ? "Copied!" : "Generate Join Link"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

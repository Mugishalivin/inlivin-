import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bell, Volume2, Shield, Lock, Trash2, AlertTriangle, 
  Eye, EyeOff, Clock, Users, UserPlus, Ban, Flag
} from "lucide-react";

interface MessageSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  userId: string;
  isGroupChat?: boolean;
  isGroupAdmin?: boolean;
}

export function MessageSettingsDialog({
  isOpen,
  onOpenChange,
  conversationId,
  userId,
  isGroupChat = false,
  isGroupAdmin = false
}: MessageSettingsDialogProps) {
  const [notificationSetting, setNotificationSetting] = useState<"all" | "mentions" | "muted">("all");
  const [disappearingMessages, setDisappearingMessages] = useState<number | null>(null);
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [blockAllMedia, setBlockAllMedia] = useState(false);
  const [onlyAdminsSend, setOnlyAdminsSend] = useState(false);
  const [allowMembersAdd, setAllowMembersAdd] = useState(true);

  const handleSaveSettings = async () => {
    try {
      await supabase
        .from("conversation_participants")
        .update({
          notification_setting: notificationSetting,
          disappearing_messages_duration: disappearingMessages,
          show_read_receipts: showReadReceipts,
          block_all_media: blockAllMedia,
        })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (isGroupChat && isGroupAdmin) {
        await supabase
          .from("conversations")
          .update({
            only_admins_send: onlyAdminsSend,
            allow_members_add: allowMembersAdd,
          })
          .eq("id", conversationId);
      }

      toast.success("Settings saved successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogDescription className="sr-only">Configure conversation settings including notifications, disappearing messages, and privacy options</DialogDescription>
        <DialogHeader>
          <DialogTitle>Message Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={notificationSetting === "all"}
                  onChange={() => setNotificationSetting("all")}
                  className="w-4 h-4"
                />
                <span className="text-sm">All messages</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={notificationSetting === "mentions"}
                  onChange={() => setNotificationSetting("mentions")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Mentions only</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  checked={notificationSetting === "muted"}
                  onChange={() => setNotificationSetting("muted")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Muted</span>
              </label>
            </CardContent>
          </Card>

          {/* Disappearing Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Disappearing Messages
              </CardTitle>
              <CardDescription className="text-xs">Messages auto-delete after being viewed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[null, 3600, 86400, 604800].map((seconds) => (
                  <Button
                    key={seconds}
                    variant={disappearingMessages === seconds ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDisappearingMessages(seconds)}
                    className="text-xs"
                  >
                    {seconds === null ? "Off" : seconds === 3600 ? "1h" : seconds === 86400 ? "1d" : "1w"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Show read receipts
                </span>
                <input
                  type="checkbox"
                  checked={showReadReceipts}
                  onChange={(e) => setShowReadReceipts(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Block media
                </span>
                <input
                  type="checkbox"
                  checked={blockAllMedia}
                  onChange={(e) => setBlockAllMedia(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>
            </CardContent>
          </Card>

          {/* Group Settings (Admin Only) */}
          {isGroupChat && isGroupAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" /> Group Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Only admins send messages
                  </span>
                  <input
                    type="checkbox"
                    checked={onlyAdminsSend}
                    onChange={(e) => setOnlyAdminsSend(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Members can add users
                  </span>
                  <input
                    type="checkbox"
                    checked={allowMembersAdd}
                    onChange={(e) => setAllowMembersAdd(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="flex-1">
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

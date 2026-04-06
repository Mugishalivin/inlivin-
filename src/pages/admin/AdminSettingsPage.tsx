import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, Zap, Layout, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface AdminSettings {
  id: string;
  user_id: string;
  default_view: string;
  refresh_interval: number;
  compact_mode: boolean;
  show_empty_hints: boolean;
  confirm_delete: boolean;
  verbose_logging: boolean;
  always_show_icons: boolean;
  compact_sidebar: boolean;
  desktop_notifications: boolean;
  critical_alerts_only: boolean;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: adminSettings = null } = useQuery({
    queryKey: ["admin", "settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Error loading admin settings:", error);
        return null;
      }
      return data as AdminSettings | null;
    },
    enabled: !!user?.id,
  });

  const updateSetting = async (key: keyof AdminSettings, value: any) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      if (!adminSettings?.id) {
        // Create new settings entry
        const { error } = await supabase.from("admin_settings").insert({
          user_id: user.id,
          [key]: value,
        });
        if (error) throw error;
      } else {
        // Update existing settings
        const { error } = await supabase
          .from("admin_settings")
          .update({ [key]: value, updated_at: new Date().toISOString() })
          .eq("id", adminSettings.id);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Setting updated");
    } catch (err: any) {
      toast.error("Failed to update setting: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Admin Settings</h1>
      </div>

      {/* Admin Panel Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Admin Panel Settings
          </CardTitle>
          <CardDescription>Configure how the admin dashboard behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm mb-2 block">Default View</Label>
            <Select
              value={adminSettings?.default_view || "overview"}
              onValueChange={(value) => updateSetting("default_view", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview Dashboard</SelectItem>
                <SelectItem value="users">User Management</SelectItem>
                <SelectItem value="content">Content Board</SelectItem>
                <SelectItem value="monitoring">System Monitoring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm mb-2 block">Refresh Interval (seconds)</Label>
            <Select
              value={String(adminSettings?.refresh_interval || 60)}
              onValueChange={(value) => updateSetting("refresh_interval", parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="120">2 minutes</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Compact Mode</Label>
            <Switch
              checked={adminSettings?.compact_mode || false}
              onCheckedChange={(checked) => updateSetting("compact_mode", checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Show Empty Hints</Label>
            <Switch
              checked={adminSettings?.show_empty_hints !== false}
              onCheckedChange={(checked) => updateSetting("show_empty_hints", checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Confirm Before Delete</Label>
            <Switch
              checked={adminSettings?.confirm_delete !== false}
              onCheckedChange={(checked) => updateSetting("confirm_delete", checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Verbose Logging</Label>
            <Switch
              checked={adminSettings?.verbose_logging || false}
              onCheckedChange={(checked) => updateSetting("verbose_logging", checked)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Layout & Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Layout & Navigation
          </CardTitle>
          <CardDescription>Configure sidebar and layout behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Always Show Icons</Label>
            <Switch
              checked={adminSettings?.always_show_icons !== false}
              onCheckedChange={(checked) => updateSetting("always_show_icons", checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Compact Sidebar</Label>
            <Switch
              checked={adminSettings?.compact_sidebar || false}
              onCheckedChange={(checked) => updateSetting("compact_sidebar", checked)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Notifications & Alerts
          </CardTitle>
          <CardDescription>Control notification behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Desktop Notifications</Label>
            <Switch
              checked={adminSettings?.desktop_notifications !== false}
              onCheckedChange={(checked) => updateSetting("desktop_notifications", checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Critical Alerts Only</Label>
            <Switch
              checked={adminSettings?.critical_alerts_only || false}
              onCheckedChange={(checked) => updateSetting("critical_alerts_only", checked)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">About Admin Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>• All admin settings are stored securely in the database</p>
          <p>• Settings persist across all sessions and devices</p>
          <p>• Changes apply immediately to your admin dashboard</p>
          <p>• Only admin users can modify these settings</p>
        </CardContent>
      </Card>
    </div>
  );
}

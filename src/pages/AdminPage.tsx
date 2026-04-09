import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminCommandCenter } from "@/components/admin/AdminCommandCenter";
import { Settings } from "lucide-react";

export default function AdminPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  if (!user || role !== "admin") {
    return (
      <div className="min-h-screen bg-[#050816] px-6 py-10 text-slate-100">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <Card className="w-full border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <Badge className="w-fit border-white/10 bg-white/10 text-slate-200">Restricted Access</Badge>
              <CardTitle className="text-3xl text-white">Admin access required</CardTitle>
              <CardDescription className="text-slate-300">
                This control center is reserved for administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="hero" onClick={() => navigate("/")}>
                Go Home
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Control Center</h1>
          <p className="text-muted-foreground">Manage content, users, and system settings</p>
        </div>
        <Button onClick={() => navigate("/admin/settings")} className="gap-2">
          <Settings className="h-4 w-4" />
          System Settings
        </Button>
      </div>
      <AdminCommandCenter />
    </div>
  );
}

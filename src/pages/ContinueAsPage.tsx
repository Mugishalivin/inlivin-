import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Sparkles } from "lucide-react";

export default function ContinueAsPage() {
  const { user, role, loading, adminViewMode, setAdminViewMode, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (!loading && user && role === "admin" && adminViewMode) {
      navigate(adminViewMode === "admin" ? "/admin/overview" : "/dashboard", { replace: true });
    }
  }, [loading, user, role, adminViewMode, navigate]);

  if (loading || !user || role !== "admin") {
    return null;
  }

  const handleChoice = (mode: "user" | "admin") => {
    stopImpersonation();
    setAdminViewMode(mode);
    navigate(mode === "admin" ? "/admin/overview" : "/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#050816] px-6 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <Card className="w-full border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader className="space-y-3">
            <Badge className="w-fit border-cyan-400/20 bg-cyan-400/10 text-cyan-100">Admin login detected</Badge>
            <CardTitle className="text-4xl font-black text-white">How would you like to continue?</CardTitle>
            <CardDescription className="max-w-2xl text-slate-300">
              You can continue in normal user mode or open the admin command center. Your choice stays active for this session.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ChoiceCard
              icon={User}
              title="Continue as user"
              description="Use the app with the normal dashboard and hide admin tools."
              active={adminViewMode === "user"}
              onClick={() => handleChoice("user")}
            />
            <ChoiceCard
              icon={Shield}
              title="Continue as admin"
              description="Open the admin page and manage platform operations."
              active={adminViewMode === "admin"}
              onClick={() => handleChoice("admin")}
            />
          </CardContent>
          <div className="px-6 pb-6">
            <Button variant="ghost" className="gap-2 text-slate-300 hover:text-white" onClick={() => handleChoice("user")}>
              <Sparkles className="h-4 w-4" />
              Skip for now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 ${
        active ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]" : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
        <Icon className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="text-xl font-bold text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </button>
  );
}

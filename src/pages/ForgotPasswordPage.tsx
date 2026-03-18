import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl font-extrabold text-foreground">
            inlivin<span className="text-primary">.</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold mb-2">Check your email</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>
              </p>
              <Link to="/login">
                <Button variant="hero-outline" className="w-full">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold mb-1">Reset your password</h2>
              <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" required />
                  </div>
                </div>
                <Button variant="hero" className="w-full h-11" type="submit" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-6">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

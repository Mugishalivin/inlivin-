import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  genres: string[];
  location: string | null;
  website: string | null;
  last_seen_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: 'admin' | 'moderator' | 'user' | null;
  authUser: User | null;
  authRole: 'admin' | 'moderator' | 'user' | null;
  adminViewMode: 'user' | 'admin' | null;
  impersonationTarget: { userId: string; label: string } | null;
  readOnlyPreview: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAdminViewMode: (mode: 'user' | 'admin' | null) => void;
  startImpersonation: (target: { userId: string; label: string }) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authProfile, setAuthProfile] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authRole, setAuthRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [role, setRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [adminViewMode, setAdminViewModeState] = useState<'user' | 'admin' | null>(() => {
    const stored = sessionStorage.getItem("admin_view_mode");
    return stored === "user" || stored === "admin" ? stored : null;
  });
  const [impersonationTarget, setImpersonationTargetState] = useState<{ userId: string; label: string } | null>(() => {
    const raw = sessionStorage.getItem("impersonation_target");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { userId: string; label: string };
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setAuthProfile(data as Profile | null);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    setAuthRole(data?.role || 'user');
  };

  const refreshProfile = async () => {
    if (authUser) {
      await fetchProfile(authUser.id);
      await fetchRole(authUser.id);
    }
  };

  const touchLastSeen = async (userId: string) => {
    const now = new Date().toISOString();
    await supabase.from("profiles").update({ last_seen_at: now }).eq("user_id", userId);
  };

  const applyEffectiveView = async (
    sessionUser: User | null,
    sessionProfile: Profile | null,
    sessionRole: 'admin' | 'moderator' | 'user' | null,
    impersonation: { userId: string; label: string } | null,
  ) => {
    if (sessionUser && sessionRole === "admin" && impersonation) {
      const { data: previewProfile } = await supabase.from("profiles").select("*").eq("user_id", impersonation.userId).maybeSingle();
      const { data: previewRole } = await supabase.from("user_roles").select("role").eq("user_id", impersonation.userId).maybeSingle();
      setUser({ ...(sessionUser as any), id: impersonation.userId } as User);
      setProfile(previewProfile as Profile | null);
      setRole(previewRole?.role || "user");
      return;
    }

    setUser(sessionUser);
    setProfile(sessionProfile);
    setRole(sessionRole);
  };

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await applyEffectiveView(authUser, authProfile, authRole, impersonationTarget);
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [authUser, authProfile, authRole, impersonationTarget]);

  useEffect(() => {
    let alive = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!alive) return;
        setSession(nextSession);
        setAuthUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          const nextUserId = nextSession.user.id;
          setTimeout(() => {
            if (!alive) return;
            fetchProfile(nextUserId);
            fetchRole(nextUserId);
            touchLastSeen(nextUserId);
          }, 0);
        } else {
          setAuthProfile(null);
          setAuthRole(null);
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      if (!alive) return;
      setSession(nextSession);
      setAuthUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        fetchProfile(nextSession.user.id);
        fetchRole(nextSession.user.id);
        touchLastSeen(nextSession.user.id);
      }
      setLoading(false);
    });

    const onVisibilityChange = () => {
      const activeUserId = userIdRef.current;
      if (document.visibilityState === "visible" && activeUserId) {
        touchLastSeen(activeUserId);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      alive = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const heartbeat = window.setInterval(() => {
      touchLastSeen(user.id);
    }, 60000);
    return () => window.clearInterval(heartbeat);
  }, [user?.id]);

  const signOut = async () => {
    localStorage.setItem("logout_at", new Date().toISOString());
    sessionStorage.removeItem("admin_view_mode");
    sessionStorage.removeItem("impersonation_target");
    await supabase.auth.signOut();
    setAuthUser(null);
    setUser(null);
    setSession(null);
    setAuthProfile(null);
    setProfile(null);
    setAuthRole(null);
    setRole(null);
    setAdminViewModeState(null);
    setImpersonationTargetState(null);
  };

  const setAdminViewMode = (mode: 'user' | 'admin' | null) => {
    setAdminViewModeState(mode);
    if (mode) {
      sessionStorage.setItem("admin_view_mode", mode);
    } else {
      sessionStorage.removeItem("admin_view_mode");
    }
  };

  const startImpersonation = (target: { userId: string; label: string }) => {
    setImpersonationTargetState(target);
    sessionStorage.setItem("impersonation_target", JSON.stringify(target));
    if (authUser && authRole === "admin") {
      void supabase.from("admin_impersonation_sessions").insert([
        {
          admin_id: authUser.id,
          target_user_id: target.userId,
          reason: target.label,
          is_active: true,
        },
      ]);
    }
  };

  const stopImpersonation = () => {
    if (authUser && authRole === "admin" && impersonationTarget) {
      void supabase
        .from("admin_impersonation_sessions")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("admin_id", authUser.id)
        .eq("target_user_id", impersonationTarget.userId)
        .eq("is_active", true);
    }
    setImpersonationTargetState(null);
    sessionStorage.removeItem("impersonation_target");
  };
  const readOnlyPreview = !!impersonationTarget;

  return (
    <AuthContext.Provider value={{ user, session, profile, role, authUser, authRole, adminViewMode, impersonationTarget, readOnlyPreview, loading, signOut, refreshProfile, setAdminViewMode, startImpersonation, stopImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

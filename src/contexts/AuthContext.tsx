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
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data as Profile | null);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    setRole(data?.role || 'user');
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchRole(user.id);
    }
  };

  const touchLastSeen = async (userId: string) => {
    const now = new Date().toISOString();
    await supabase.from("profiles").update({ last_seen_at: now }).eq("user_id", userId);
  };

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    let alive = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!alive) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          const nextUserId = nextSession.user.id;
          setTimeout(() => {
            if (!alive) return;
            fetchProfile(nextUserId);
            fetchRole(nextUserId);
            touchLastSeen(nextUserId);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      if (!alive) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null; accepted: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .finally(() => setLoading(false));

    return () => data.subscription.unsubscribe();
  }, []);

  // Ensure a minimal profile exists for the user.
  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (selectError) return;

      if (!existing) {
        await supabase.from("profiles").insert({ user_id: user.id });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Bootstrap admin role for allowlisted emails (server-side, idempotent).
  React.useEffect(() => {
    if (!session?.access_token) return;
    // Avoid calling inside onAuthStateChange callback; defer.
    const t = setTimeout(() => {
      supabase.functions.invoke("bootstrap-admin-by-email").catch(() => {
        // Silently ignore; not critical for regular users.
      });
    }, 0);
    return () => clearTimeout(t);
  }, [session?.access_token]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: (error as unknown as Error) ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: (error as unknown as Error) ?? null };
  };

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.functions.invoke("send-password-reset", {
      body: { email, redirectTo },
    });

    // `accepted` indicates provider availability only (never whether the email exists).
    const accepted = Boolean((data as any)?.accepted ?? true);

    return { error: (error as unknown as Error) ?? null, accepted };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    session,
    user,
    loading,
    signIn,
    signUp,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

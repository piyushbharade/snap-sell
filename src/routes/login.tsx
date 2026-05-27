import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — DukaanGenie" },
      { name: "description", content: "Sign in to DukaanGenie to turn product photos into ready-to-sell listings." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={redirect || "/"} />;
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: shopName || null },
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your inbox to verify your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: redirect || "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error instanceof Error ? result.error.message : "Google sign-in failed");
        setBusy(false);
        return;
      }
      if (result.redirected) return; // browser is redirecting
      navigate({ to: redirect || "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Toaster richColors position="top-center" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-warm)" }} />
        <div className="absolute bottom-0 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-25" style={{ background: "var(--gradient-cool)" }} />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2">
        {/* Pitch */}
        <div className="hidden md:block">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--spice)" }} />
            For local shops, artisans & home kitchens
          </div>
          <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight">
            Snap a photo.<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-warm)" }}>
              Get a ready-to-sell listing.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            Sign in to save your catalog, revisit past listings, and share them with one tap.
            English & <span className="font-devanagari">हिन्दी</span> built-in.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {["Bilingual product names & descriptions", "Fair price brackets in ₹", "Ready WhatsApp / Instagram captions"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>✓</span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="grid h-4 w-4 place-items-center rounded-full text-[10px] text-primary-foreground" style={{ background: "var(--gradient-cool)" }}>✦</span>
            Powered by Google Gemini vision AI
          </div>
        </div>

        {/* Auth card */}
        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}>
              <span className="text-lg">✦</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight">DukaanGenie</span>
          </div>

          <h2 className="font-display text-2xl font-bold">
            {mode === "signin" ? "Welcome back" : "Create your shop account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your catalog." : "Start cataloguing your products in seconds."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-secondary disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.97v2.32A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.29-1.71V4.96H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.04l3-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .97 4.96l3 2.33C4.68 5.17 6.66 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or with email
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Your name or shop name"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-60"
              style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
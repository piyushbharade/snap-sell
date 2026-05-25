import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export function AppNav() {
  const { user, signOut } = useAuth();
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}>
          <span className="text-lg">✦</span>
        </div>
        <span className="font-display text-xl font-bold tracking-tight">DukaanGenie</span>
      </Link>
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "rounded-full px-3 py-1.5 bg-secondary text-foreground" }}>
          New listing
        </Link>
        <Link to="/my-listings" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "rounded-full px-3 py-1.5 bg-secondary text-foreground" }}>
          My listings
        </Link>
        <span className="hidden text-xs text-muted-foreground md:inline">{user?.email}</span>
        <button onClick={() => signOut()} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
          Sign out
        </button>
      </nav>
    </header>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyListings, deleteListing } from "@/lib/analyze.functions";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({ meta: [{ title: "My listings — DukaanGenie" }] }),
  component: MyListings,
});

function MyListings() {
  const fetchListings = useServerFn(listMyListings);
  const removeListing = useServerFn(deleteListing);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => fetchListings(),
  });

  async function onDelete(id: string) {
    if (!confirm("Delete this listing?")) return;
    const res = await removeListing({ data: { id } });
    if (!res.ok) { toast.error(res.error); return; }
    toast.success("Listing deleted");
    qc.invalidateQueries({ queryKey: ["my-listings"] });
  }

  const listings = data?.listings ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <AppNav />
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <h1 className="font-display text-3xl font-bold md:text-4xl">My catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">{listings.length} saved listing{listings.length === 1 ? "" : "s"}</p>

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0,1,2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <div className="text-4xl">📦</div>
            <div className="mt-3 font-display text-xl font-bold">No listings yet</div>
            <p className="mt-1 text-sm text-muted-foreground">Snap a product on the home page to create your first listing.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <article key={l.id} className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>{l.category}</span>
                  <button onClick={() => onDelete(l.id)} className="text-xs text-muted-foreground hover:text-destructive">Delete</button>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug">{l.product_name_en}</h3>
                <div className="font-devanagari text-sm text-muted-foreground">{l.product_name_hi}</div>
                <div className="mt-3 font-display text-lg font-black" style={{ color: "var(--spice)" }}>
                  ₹{Number(l.price_min_inr).toLocaleString("en-IN")} – ₹{Number(l.price_max_inr).toLocaleString("en-IN")}
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{l.description_en}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(l.tags ?? []).slice(0, 4).map((t: string) => (
                    <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">#{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
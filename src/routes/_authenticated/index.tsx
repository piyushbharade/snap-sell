import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeProduct } from "@/lib/analyze.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AppNav } from "@/components/app-nav";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

type Listing = {
  product_name_en: string;
  product_name_hi: string;
  category: string;
  tags: string[];
  description_en: string;
  description_hi: string;
  price_min_inr: number;
  price_max_inr: number;
  price_reasoning: string;
  social_caption: string;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Home() {
  const analyze = useServerFn(analyzeProduct);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);

  async function handleFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast.error("Image too large. Please use under 8MB."); return; }
    setImage(await readFileAsDataUrl(f));
    setListing(null);
  }

  async function run() {
    if (!image) { toast.error("Add a product photo first."); return; }
    setLoading(true); setListing(null);
    try {
      const res = await analyze({ data: { imageDataUrl: image, vendorHint: hint || undefined } });
      if (!res.ok) toast.error(res.error);
      else { setListing(res.listing as Listing); toast.success("Saved to your catalog"); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(false); }
  }

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-warm)" }} />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-25" style={{ background: "var(--gradient-cool)" }} />
      </div>

      <AppNav />

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="grid gap-10 pt-4 pb-12 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="grid h-4 w-4 place-items-center rounded-full text-[10px] text-primary-foreground" style={{ background: "var(--gradient-cool)" }}>✦</span>
              Powered by Google Gemini
            </div>
            <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Snap a photo.<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-warm)" }}>
                Get a ready-to-sell listing.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              One photo, one tap. Bilingual descriptions, fair price, and a social caption — saved to your catalog.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => cameraRef.current?.click()} className="rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}>📷 Snap a product</button>
              <button onClick={() => fileRef.current?.click()} className="rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-secondary">Upload from gallery</button>
            </div>
          </div>

          <UploadCard
            image={image}
            onPickGallery={() => fileRef.current?.click()}
            onPickCamera={() => cameraRef.current?.click()}
            onClear={() => { setImage(null); setListing(null); }}
          />
        </section>

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0])} />

        {image && (
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold">Tell the genie a tiny bit (optional)</label>
                <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="e.g. handwoven Banarasi silk dupatta" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={run} disabled={loading} className="rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}>
                {loading ? "Genie is thinking…" : "✨ Generate listing"}
              </button>
            </div>
          </section>
        )}

        {loading && (
          <section className="mt-10 grid gap-4 md:grid-cols-2">
            {[0,1,2,3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-secondary" />)}
          </section>
        )}

        {listing && !loading && <Result listing={listing} onCopy={copy} />}
      </main>
    </div>
  );
}

function UploadCard({ image, onPickGallery, onPickCamera, onClear }: { image: string | null; onPickGallery: () => void; onPickCamera: () => void; onClear: () => void; }) {
  return (
    <div className="relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-card" style={{ boxShadow: "var(--shadow-soft)" }}>
        {image ? (
          <>
            <img src={image} alt="Product preview" className="h-full w-full object-cover" />
            <button onClick={onClear} className="absolute top-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium backdrop-blur hover:bg-background">Change</button>
          </>
        ) : (
          <div onClick={onPickGallery} className="grid h-full w-full cursor-pointer place-items-center p-8 text-center" style={{ background: "var(--gradient-cool)" }}>
            <div className="text-primary-foreground">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-3xl backdrop-blur">📦</div>
              <div className="font-display text-2xl font-bold">Drop a product photo</div>
              <div className="mt-2 text-sm opacity-80">Handloom, hardware, sweets, spices — anything you sell</div>
              <div className="mt-6 flex justify-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); onPickCamera(); }} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-foreground">Use camera</button>
                <button onClick={(e) => { e.stopPropagation(); onPickGallery(); }} className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-primary-foreground backdrop-blur">Browse files</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Result({ listing, onCopy }: { listing: Listing; onCopy: (label: string, text: string) => void }) {
  const priceRange = `₹${listing.price_min_inr.toLocaleString("en-IN")} – ₹${listing.price_max_inr.toLocaleString("en-IN")}`;
  return (
    <section className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Your listing is ready ✨</h2>
        <span className="rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>{listing.category}</span>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Product name" onCopy={() => onCopy("Name", `${listing.product_name_en} / ${listing.product_name_hi}`)}>
          <div className="font-display text-2xl font-bold">{listing.product_name_en}</div>
          <div className="font-devanagari mt-1 text-lg text-muted-foreground">{listing.product_name_hi}</div>
        </Card>
        <Card title="Suggested price" onCopy={() => onCopy("Price", priceRange)}>
          <div className="font-display text-3xl font-black" style={{ color: "var(--spice)" }}>{priceRange}</div>
          <div className="mt-2 text-sm text-muted-foreground">{listing.price_reasoning}</div>
        </Card>
        <Card title="Description (English)" onCopy={() => onCopy("English description", listing.description_en)}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{listing.description_en}</p>
        </Card>
        <Card title="विवरण (हिन्दी)" onCopy={() => onCopy("Hindi description", listing.description_hi)}>
          <p className="font-devanagari whitespace-pre-wrap text-sm leading-relaxed">{listing.description_hi}</p>
        </Card>
        <Card title="Search tags" onCopy={() => onCopy("Tags", listing.tags.join(", "))}>
          <div className="flex flex-wrap gap-2">
            {listing.tags.map((t) => <span key={t} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium">#{t}</span>)}
          </div>
        </Card>
        <Card title="Social media post" onCopy={() => onCopy("Social caption", listing.social_caption)} accent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{listing.social_caption}</p>
        </Card>
      </div>
    </section>
  );
}

function Card({ title, children, onCopy, accent }: { title: string; children: React.ReactNode; onCopy: () => void; accent?: boolean; }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-soft)", background: accent ? "var(--gradient-cool)" : undefined, color: accent ? "var(--color-primary-foreground)" : undefined, borderColor: accent ? "transparent" : undefined }}>
      <div className="mb-3 flex items-center justify-between">
        <div className={`text-xs font-semibold uppercase tracking-wider ${accent ? "opacity-90" : "text-muted-foreground"}`}>{title}</div>
        <button onClick={onCopy} className={`rounded-full px-3 py-1 text-xs font-semibold ${accent ? "bg-white/20 text-primary-foreground hover:bg-white/30" : "bg-secondary text-secondary-foreground hover:bg-border"}`}>Copy</button>
      </div>
      {children}
    </div>
  );
}
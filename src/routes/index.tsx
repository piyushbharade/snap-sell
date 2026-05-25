import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeProduct } from "@/lib/analyze.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
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

function Index() {
  const analyze = useServerFn(analyzeProduct);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);

  async function handleFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image too large. Please use under 8MB.");
      return;
    }
    const url = await readFileAsDataUrl(f);
    setImage(url);
    setListing(null);
  }

  async function run() {
    if (!image) {
      toast.error("Add a product photo first.");
      return;
    }
    setLoading(true);
    setListing(null);
    try {
      const res = await analyze({ data: { imageDataUrl: image, vendorHint: hint || undefined } });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        setListing(res.listing as Listing);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copy(label: string, text: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-center" />

      {/* Decorative backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-warm)" }} />
        <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-25" style={{ background: "var(--gradient-cool)" }} />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground" style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}>
            <span className="text-lg">✦</span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight">DukaanGenie</span>
        </div>
        <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero */}
        <section className="grid gap-10 pt-8 pb-16 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--spice)" }} />
              For local shops, artisans & home kitchens
            </div>
            <h1 className="font-display text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
              Snap a photo.<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-warm)" }}>
                Get a ready-to-sell listing.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              DukaanGenie turns a single product picture into a full catalog entry —
              English & <span className="font-devanagari">हिन्दी</span> descriptions,
              category tags, a fair price bracket, and a ready social post.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => cameraRef.current?.click()}
                className="rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}
              >
                📷 Snap a product
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-secondary"
              >
                Upload from gallery
              </button>
            </div>
            <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
              <span>✓ No login</span>
              <span>✓ Works on phone</span>
              <span>✓ Bilingual output</span>
            </div>
          </div>

          <UploadCard
            image={image}
            onPickGallery={() => fileRef.current?.click()}
            onPickCamera={() => cameraRef.current?.click()}
            onClear={() => { setImage(null); setListing(null); }}
          />
        </section>

        {/* Hidden file inputs */}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0])} />

        {/* Action panel */}
        {image && (
          <section className="rounded-3xl border border-border bg-card p-6 md:p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-semibold">Tell the genie a tiny bit (optional)</label>
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="e.g. handwoven Banarasi silk dupatta, made by my mother"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={run}
                disabled={loading}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-60"
                style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-warm)" }}
              >
                {loading ? "Genie is thinking…" : "✨ Generate listing"}
              </button>
            </div>
          </section>
        )}

        {/* Loading skeleton */}
        {loading && <Skeleton />}

        {/* Result */}
        {listing && !loading && <Result listing={listing} onCopy={copy} />}

        {/* How it works */}
        <section id="how" className="mt-24">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Three taps to a storefront.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { n: "01", t: "Snap or upload", d: "One clear photo of the product — phone camera is enough." },
              { n: "02", t: "AI reads the image", d: "Gemini vision recognises material, craft, cuisine or tool." },
              { n: "03", t: "Publish anywhere", d: "Copy the listing or the WhatsApp post and start selling." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-3xl font-black text-primary">{s.n}</div>
                <div className="mt-2 text-lg font-semibold">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          Made for vendors, artisans & home businesses across Bharat.
        </footer>
      </main>
    </div>
  );
}

function UploadCard({
  image,
  onPickGallery,
  onPickCamera,
  onClear,
}: {
  image: string | null;
  onPickGallery: () => void;
  onPickCamera: () => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-card"
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        {image ? (
          <>
            <img src={image} alt="Product preview" className="h-full w-full object-cover" />
            <button
              onClick={onClear}
              className="absolute top-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium backdrop-blur hover:bg-background"
            >
              Change
            </button>
          </>
        ) : (
          <div
            onClick={onPickGallery}
            className="grid h-full w-full cursor-pointer place-items-center p-8 text-center"
            style={{ background: "var(--gradient-cool)" }}
          >
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
      <div className="absolute -bottom-3 -left-3 hidden rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium md:block">
        🪔 Powered by Gemini vision
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <section className="mt-10 grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl bg-secondary" />
      ))}
    </section>
  );
}

function Result({ listing, onCopy }: { listing: Listing; onCopy: (label: string, text: string) => void }) {
  const priceRange = `₹${listing.price_min_inr.toLocaleString("en-IN")} – ₹${listing.price_max_inr.toLocaleString("en-IN")}`;
  return (
    <section className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Your listing is ready ✨</h2>
        <span className="rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>
          {listing.category}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Names + price */}
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
            {listing.tags.map((t) => (
              <span key={t} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium">#{t}</span>
            ))}
          </div>
        </Card>

        <Card
          title="Social media post"
          onCopy={() => onCopy("Social caption", listing.social_caption)}
          accent
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{listing.social_caption}</p>
        </Card>
      </div>
    </section>
  );
}

function Card({
  title,
  children,
  onCopy,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  onCopy: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-border bg-card p-6"
      style={{
        boxShadow: "var(--shadow-soft)",
        background: accent ? "var(--gradient-cool)" : undefined,
        color: accent ? "var(--color-primary-foreground)" : undefined,
        borderColor: accent ? "transparent" : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={`text-xs font-semibold uppercase tracking-wider ${accent ? "opacity-90" : "text-muted-foreground"}`}>{title}</div>
        <button
          onClick={onCopy}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            accent ? "bg-white/20 text-primary-foreground hover:bg-white/30" : "bg-secondary text-secondary-foreground hover:bg-border"
          }`}
        >
          Copy
        </button>
      </div>
      {children}
    </div>
  );
}

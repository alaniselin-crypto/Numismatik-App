import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Coins,
  PlusCircle,
  ChartPie,
  Download,
  Search,
  Plus,
  TrendingUp,
  FolderOpen,
  Store,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INUMIS – Dashboard deiner Münzsammlung" },
      {
        name: "description",
        content:
          "Dashboard mit Gesamtwert, Wertentwicklung, Ordner und Verkaufsplattformen für deine Münzsammlung.",
      },
      { property: "og:title", content: "INUMIS – Dashboard deiner Münzsammlung" },
      {
        property: "og:description",
        content:
          "Dashboard mit Gesamtwert, Wertentwicklung, Ordner und Verkaufsplattformen für deine Münzsammlung.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Coins, label: "Sammlung", active: false },
  { icon: PlusCircle, label: "Hinzufügen", active: false },
  { icon: ChartPie, label: "Analysen", active: false },
  { icon: Download, label: "Export & Backup", active: false },
];

const stats = [
  { label: "Gesamtwert", value: "CHF 12'480.50", delta: "+8.2% dieses Jahr" },
  { label: "Münzen", value: "238", delta: "6 Ordner" },
  { label: "Im Verkauf", value: "12", delta: "3 Plattformen" },
  { label: "Letzter Zukauf", value: "CHF 340.–", delta: "Helvetia Set, 12. Sep" },
];

const points = [22, 26, 24, 30, 34, 31, 38, 42, 40, 47, 52, 58];
const width = 600;
const height = 160;
const max = Math.max(...points);
const min = Math.min(...points);
const coords = points.map((p, i) => {
  const x = (i / (points.length - 1)) * width;
  const y = height - ((p - min) / (max - min)) * (height - 24) - 12;
  return `${x},${y}`;
});
const line = coords.join(" ");
const area = `0,${height} ${line} ${width},${height}`;

const coins = [
  {
    name: "20 Franken Vreneli",
    year: "1935",
    folder: "Tresor Fach B",
    value: "CHF 685.–",
    metal: "gold" as const,
    platform: null,
  },
  {
    name: "5 Franken Tellkopf",
    year: "1922",
    folder: "Schweiz",
    value: "CHF 240.–",
    metal: "silver" as const,
    platform: "Ricardo",
  },
  {
    name: "1 Dollar Morgan",
    year: "1889",
    folder: "Ausland",
    value: "CHF 410.–",
    metal: "silver" as const,
    platform: "eBay",
  },
  {
    name: "10 Rappen Helvetia",
    year: "1948",
    folder: "Schweiz",
    value: "CHF 18.–",
    metal: "copper" as const,
    platform: null,
  },
];

const metalStyle: Record<string, React.CSSProperties> = {
  gold: {
    background:
      "radial-gradient(circle at 32% 28%, var(--color-coin-gold), var(--color-coin-gold-deep) 72%)",
  },
  silver: {
    background:
      "radial-gradient(circle at 32% 28%, var(--color-coin-silver), var(--color-coin-silver-deep) 72%)",
  },
  copper: {
    background:
      "radial-gradient(circle at 32% 28%, var(--color-coin-copper), var(--color-coin-copper-deep) 72%)",
  },
};

function Index() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-2xl font-semibold tracking-wide text-primary">
            INUMIS
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={
                item.active
                  ? "flex items-center gap-3 rounded-lg bg-primary/12 px-3 py-2.5 text-sm font-medium text-primary"
                  : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Nächster Meilenstein</p>
          <p className="mt-1 font-display text-lg text-foreground">
            CHF 15'000 Sammlungswert
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[83%] rounded-full bg-primary" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Guten Abend, Alan
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Deine Sammlung ist heute um CHF 32.– gestiegen.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Münze suchen…"
                className="w-56 rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              <Plus className="h-4 w-4" />
              Münze hinzufügen
            </button>
          </div>
        </header>

        {/* Stat cards */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                {s.value}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-value-up">
                <TrendingUp className="h-3 w-3" />
                {s.delta}
              </p>
            </div>
          ))}
        </section>

        {/* Chart + folders */}
        <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-foreground">
                Wertentwicklung
              </h2>
              <span className="rounded-full bg-primary/12 px-3 py-1 text-xs text-primary">
                12 Monate
              </span>
            </div>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="mt-4 h-40 w-full"
              preserveAspectRatio="none"
              role="img"
              aria-label="Wertentwicklung der Sammlung über 12 Monate, steigend"
            >
              <defs>
                <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#goldFill)" />
              <polyline
                points={line}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-xl text-foreground">Ordner</h2>
            <ul className="mt-4 space-y-3">
              {[
                ["Tresor Fach B", 64],
                ["Schweiz", 87],
                ["Ausland", 51],
                ["Verkaufs-Kandidaten", 36],
              ].map(([name, pct]) => (
                <li key={name as string} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <FolderOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{name}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Recent coins */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-foreground">
              Zuletzt hinzugefügt
            </h2>
            <a href="#" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Alle ansehen
            </a>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {coins.map((coin) => (
              <article
                key={coin.name}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-[inset_0_2px_6px_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-105"
                  style={metalStyle[coin.metal]}
                >
                  <span className="font-display text-lg font-semibold text-black/70">
                    {coin.year}
                  </span>
                </div>
                <h3 className="mt-4 text-center text-sm font-medium text-foreground">
                  {coin.name}
                </h3>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <FolderOpen className="h-3 w-3" /> {coin.folder}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-lg text-primary">
                    {coin.value}
                  </span>
                  {coin.platform ? (
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                      <Store className="h-3 w-3" /> {coin.platform}
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs text-primary">
                      im Tresor
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-6 py-6 text-sm text-muted-foreground md:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p>NumismatikApp · Alan Iselin</p>
          <nav className="flex gap-4">
            <Link to="/support" className="text-primary hover:underline">
              Support
            </Link>
            <Link to="/datenschutz" className="text-primary hover:underline">
              Datenschutz
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

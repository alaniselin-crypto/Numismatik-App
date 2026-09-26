import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, LifeBuoy, Mail, Smartphone, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support – NumismatikApp" },
      {
        name: "description",
        content:
          "Hilfe und Kontakt für NumismatikApp auf iPhone und Mac: Anleitung, Konto, Sammlung und E-Mail-Support.",
      },
      { property: "og:title", content: "Support – NumismatikApp" },
      {
        property: "og:description",
        content:
          "Hilfe und Kontakt für NumismatikApp auf iPhone und Mac.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const topics = [
  {
    icon: Smartphone,
    title: "App bedienen",
    text: "Münzen und Banknoten fügen Sie über «Hinzufügen» hinzu. Fotos nehmen Sie mit «Makro-Foto» auf oder wählen sie aus der Mediathek. Ordner, Verkaufsplattformen und eigene Felder liegen unter Einstellungen.",
  },
  {
    icon: LifeBuoy,
    title: "Konto, Backup, Löschen",
    text: "Die Sammlung lässt sich unter «Export & Backup» als Datei oder CSV sichern und wieder einlesen. Das Cloud-Konto melden Sie oben rechts ab. «Konto löschen» entfernt das Benutzerkonto und die Cloud-Daten nach der Eingabe von LÖSCHEN.",
  },
  {
    icon: Mail,
    title: "Kontakt",
    text: "Wenn etwas nicht funktioniert oder Sie eine Frage zur App, zum Abo oder zum Datenschutz haben, schreiben Sie uns. Wir antworten in der Regel innerhalb von zwei Werktagen.",
  },
];

function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3 text-foreground transition-colors hover:text-primary">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
              <Coins className="h-5 w-5 text-primary" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-wide">NumismatikApp</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <div className="pt-14 pb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Support</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Hilfe für NumismatikApp
          </h1>
          <p className="mt-4 text-muted-foreground">
            Diese Seite ist die Support-Adresse für die Apps auf iPhone und Mac.
          </p>
        </div>

        <div className="space-y-6">
          {topics.map((topic) => (
            <section key={topic.title} className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <topic.icon className="h-5 w-5 text-primary" />
                </span>
                <h2 className="font-display text-2xl font-semibold text-foreground">{topic.title}</h2>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{topic.text}</p>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-border/60 pt-8 text-sm text-muted-foreground">
          <p>
            Alan Iselin ·{" "}
            <a
              href="mailto:kontakt@numismatik.app"
              className="text-primary underline-offset-4 hover:underline"
            >
              kontakt@numismatik.app
            </a>
          </p>
          <p className="mt-3">
            <Link to="/datenschutz" className="text-primary underline-offset-4 hover:underline">
              Datenschutzerklärung
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

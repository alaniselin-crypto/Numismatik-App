import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, ShieldCheck, Database, Camera, Sparkles, CreditCard, Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutz – NumismatikApp" },
      {
        name: "description",
        content:
          "Datenschutzerklärung der App NumismatikApp: Welche Daten gespeichert werden, wie sie geschützt werden und welche Rechte du hast.",
      },
      { property: "og:title", content: "Datenschutz – NumismatikApp" },
      {
        property: "og:description",
        content:
          "Datenschutzerklärung der App NumismatikApp: Welche Daten gespeichert werden, wie sie geschützt werden und welche Rechte du hast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DatenschutzPage,
});

const sections = [
  {
    icon: Database,
    title: "Welche Daten wir speichern",
    content: [
      "Deine Sammlungsdaten (Münzen und Banknoten mit Details wie Titel, Jahr, Erhaltungsgrad, Kaufpreis und Wert) werden in einer geschützten Datenbank gespeichert, damit sie auf allen deinen Geräten verfügbar sind.",
      "Dein Konto: Wenn du dich anmeldest, speichern wir deinen Namen und deine E-Mail-Adresse. Du kannst dich mit Google oder Apple anmelden – dabei erhalten wir nur die Angaben, die du dort freigibst.",
      "Bilder: Fotos deiner Münzen und Banknoten werden gespeichert, damit du sie in der App sehen und verwalten kannst.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Wie wir deine Daten schützen",
    content: [
      "Alle Verbindungen zwischen der App und unseren Servern sind verschlüsselt.",
      "Nur du kannst auf deine Sammlung zugreifen. Niemand sonst – auch nicht wir – kann deine Münzen einsehen.",
      "Deine Daten werden bei Google Firebase (Google LLC) in der Europäischen Union bzw. gemäss den EU-Datenschutzstandards gespeichert.",
    ],
  },
  {
    icon: Sparkles,
    title: "KI-Funktion",
    content: [
      "Die App bietet eine optionale KI-Funktion, die dir bei der Beschreibung deiner Münzen hilft. Wenn du sie nutzt, werden die von dir eingegebenen Informationen (z. B. Titel oder Prägung) an einen KI-Dienst (OpenAI) übermittelt, um einen Vorschlag zu erzeugen.",
      "Die KI-Funktion wird nur benutzt, wenn du sie selbst auslöst. Deine Fotos und Sammlungsdaten werden nicht automatisch weitergegeben.",
    ],
  },
  {
    icon: CreditCard,
    title: "Abonnement und Bezahlung",
    content: [
      "Die Pro-Version wird über den App Store von Apple abgerechnet. Wir erhalten von Apple keine Zahlungsdaten – nur eine Bestätigung, ob dein Abonnement aktiv ist.",
      "Wenn du dein Abonnement kündigst, bleiben deine Daten in der App bestehen.",
    ],
  },
  {
    icon: Camera,
    title: "Kamera und Fotomediathek",
    content: [
      "Die App darf auf deine Kamera und deine Fotos zugreifen – ausschliesslich, damit du Münz- und Banknotenbilder aufnehmen oder auswählen kannst. Dieser Zugriff passiert nur, wenn du es in der App auslöst.",
    ],
  },
  {
    icon: Mail,
    title: "Deine Rechte und Kontakt",
    content: [
      "Du kannst deine Daten jederzeit exportieren (CSV) oder löschen, indem du Exemplare in der App entfernst. Wenn du dein Konto und alle Daten vollständig löschen möchtest, schreib uns einfach.",
      "Bei Fragen zum Datenschutz erreichst du uns per E-Mail.",
    ],
  },
];

function DatenschutzPage() {
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
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Datenschutzerklärung</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Deine Sammlung gehört dir – auch deine Daten.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Stand: 17. September 2026 · Geltungsbereich: die Apps «NumismatikApp» für iOS und macOS
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <section.icon className="h-5 w-5 text-primary" />
                </span>
                <h2 className="font-display text-2xl font-semibold text-foreground">{section.title}</h2>
              </div>
              <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                {section.content.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-border/60 pt-8 text-sm text-muted-foreground">
          <p>
            Verantwortlich für den Datenschutz: Alan Iselin ·{" "}
            <a
              href="mailto:kontakt@numismatik.app"
              className="text-primary underline-offset-4 hover:underline"
            >
              kontakt@numismatik.app
            </a>
          </p>
          <p className="mt-2">
            <Link to="/support" className="text-primary underline-offset-4 hover:underline">
              Support
            </Link>
          </p>
          <p className="mt-2 text-xs">© {new Date().getFullYear()} NumismatikApp. Alle Rechte vorbehalten.</p>
        </footer>
      </main>
    </div>
  );
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--surface-border)] mt-auto">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-sm text-muted-foreground">
        <p>Made with 🐻‍❄️ by Isbjorn · supported by Team1 · on Avalanche</p>
        <div className="flex flex-wrap gap-x-7 gap-y-2">
          <Link href="/rules" className="hover:text-foreground transition-colors">World rules v0.1</Link>
          <Link href="/elders" className="hover:text-foreground transition-colors">Elders</Link>
          <a href="https://build.avax.network" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Builder&apos;s Hub</a>
        </div>
      </div>
    </footer>
  );
}

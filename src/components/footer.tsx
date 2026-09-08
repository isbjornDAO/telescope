import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm border-t-4 border-zinc-200 dark:border-zinc-700 mt-16">
      <div className="w-full max-w-screen-lg mx-auto px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>Made with 🐻‍❄️ by Isbjorn · supported by Team1 · on Avalanche</p>
        <div className="flex gap-4">
          <Link href="/rules" className="hover:underline">World rules v0.1</Link>
          <Link href="/elders" className="hover:underline">Elders</Link>
          <a href="https://build.avax.network" target="_blank" rel="noreferrer" className="hover:underline">Builder&apos;s Hub</a>
        </div>
      </div>
    </footer>
  );
}

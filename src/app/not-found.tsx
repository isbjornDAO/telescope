import Link from "next/link";
import { BearWalk } from "@/components/bear-walk";

export default function NotFound() {
  return (
    <>
      <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
          404
        </h1>
        <p className="mt-2 text-base sm:text-xl font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
          Page not found
        </p>
        <Link
          href="/"
          className="retro-btn retro-btn-blue mt-8 px-5 py-2.5 text-sm font-bold"
        >
          Home
        </Link>
      </div>

      <BearWalk immersive screenWalk defaultSize={120} />
    </>
  );
}

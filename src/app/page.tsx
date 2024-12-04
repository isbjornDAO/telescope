import { ConnectButton } from "@/components/connect-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-dvh">
      <div className="flex items-center justify-center gap-16">
        <h1 className="text-4xl font-bold">Start3r</h1>

        <div className="flex flex-row items-center justify-center gap-4">
          <ThemeSwitcher />
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}

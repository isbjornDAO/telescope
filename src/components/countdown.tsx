import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { RetroBox } from "@/components/world/primitives";

/** Discord invite — matches other home sidebar widgets. */
export function Countdown() {
  return (
    <RetroBox
      title="Discord"
      icon={<MessageCircle className="h-4 w-4" />}
      iconColor="blue"
      contentClassName="!p-0"
    >
      <div className="p-3.5 sm:p-4 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Builders, research drops, and season rewards — live in the server.
        </p>
        <a
          href="https://discord.gg/K4z7xxFVGc"
          target="_blank"
          rel="noreferrer"
          className="retro-btn-blue w-full inline-flex items-center justify-center"
        >
          Join Discord
        </a>
      </div>
    </RetroBox>
  );
}

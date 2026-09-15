"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Server, ExternalLink, Copy, CheckCircle, ShieldCheck, Sparkles } from "lucide-react";

interface AddDiscordServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDiscordServerDialog({
  open,
  onOpenChange,
}: AddDiscordServerDialogProps) {
  const [botInviteUrl, setBotInviteUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !botInviteUrl) {
      setLoading(true);
      fetch("/api/discord/bot-info")
        .then((res) => res.json())
        .then((data) => {
          if (data.clientId) {
            const permissions = "68608"; // View Channels + Read Messages
            const url = `https://discord.com/api/oauth2/authorize?client_id=${data.clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
            setBotInviteUrl(url);
          }
        })
        .catch((err) => console.error("Error fetching bot info:", err))
        .finally(() => setLoading(false));
    }
  }, [open, botInviteUrl]);

  const copyToClipboard = () => {
    if (!botInviteUrl) return;
    navigator.clipboard.writeText(botInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md retro-box p-0 border-0 overflow-hidden shadow-2xl">
        <DialogHeader className="retro-box-title justify-between px-4 py-3 bg-gradient-to-r from-[#2495D4] to-[#126391] text-white">
          <DialogTitle className="flex items-center gap-2 text-white font-bold text-sm">
            <Server className="h-4 w-4 shrink-0" />
            <span>Add Discord Server</span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 bg-background text-xs">
          {/* Header introduction */}
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#2689BF] dark:text-[#52aae0]" />
              Sync Events with Telescope
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Invite the Telescope Bot to your Discord server so scheduled community events appear automatically on the community calendar.
            </p>
          </div>

          {/* Features checkmarks */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Reads Discord scheduled events automatically</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Features your server in the community directory</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Read-only permissions — no admin access required</span>
            </div>
          </div>

          {/* How to invite */}
          <div className="space-y-2">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200">
              Simple 3-step setup:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click the button below to authorize the bot</li>
              <li>Select your server from the Discord prompt</li>
              <li>Your scheduled events will now sync to Telescope</li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            {loading ? (
              <div className="py-4 text-center text-muted-foreground">
                <span className="inline-block animate-spin mr-2">⏳</span>
                Generating bot authorization link...
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={!botInviteUrl}
                  onClick={() => {
                    if (botInviteUrl) {
                      window.open(botInviteUrl, "_blank");
                    }
                  }}
                  className="retro-btn retro-btn-blue w-full py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Authorize & Invite Bot to Discord</span>
                </button>

                <button
                  type="button"
                  disabled={!botInviteUrl}
                  onClick={copyToClipboard}
                  className="retro-btn retro-btn-gray w-full py-2 px-4 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Bot Invite Link</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-muted-foreground">
            Not a server admin? Copy the invite link and ask a server moderator to add the bot.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, ChevronUp, ChevronDown, Globe, Lock } from "lucide-react";
import { AudiencePicker, type AudienceOptions } from "@/components/forum/audience-picker";
import { EVERYONE, serializeAudience, describeAudience, type Audience } from "@/lib/world/audience";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * The box you type in.
 *
 * It is the first thing on the forum, above trending and above the board
 * list, because the point of the page is to talk rather than to browse.
 * Everything optional is out of the way: a subject line appears only when
 * there is something to title, and the audience line already says "Anyone".
 *
 * Sized for a thumb — a 44px send button, 16px text in the textarea so iOS
 * does not zoom the page on focus, and nothing that needs two hands.
 *
 * When scrolled past the top of the viewport, it smoothly morphs into a
 * compact, non-intrusive floating bottom bar so the user can compose and
 * post from anywhere on the page without losing context or scroll position.
 */
export function Composer({
  boardName,
  boards,
  onBoardChange,
  onPosted,
  placeholder = "Say something",
  audienceOptions,
  compact,
  enableFloatingBar = true,
  className,
}: {
  boardName: string;
  /** When present, the composer offers a board to post into. Omitted inside a board. */
  boards?: { name: string; title: string }[];
  onBoardChange?: (name: string) => void;
  onPosted?: (threadId: string) => void;
  placeholder?: string;
  audienceOptions?: AudienceOptions;
  compact?: boolean;
  enableFloatingBar?: boolean;
  className?: string;
}) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [comment, setComment] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState<Audience>(EVERYONE);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bottom bar visibility & expansion states
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOutOfView, setIsOutOfView] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTitleOpen, setIsTitleOpen] = useState(false);

  const selectedBoard = boards?.find((b) => b.name === boardName);

  useEffect(() => {
    if (!enableFloatingBar) return;

    const checkVisibility = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // It has scrolled past the top of the viewport when rect.bottom <= 0
      setIsOutOfView(rect.bottom <= 0);
    };

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      () => {
        checkVisibility();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    observer.observe(el);
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });
    checkVisibility();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, [enableFloatingBar]);

  const ready = comment.trim().length > 0 && isConnected && !sending;

  async function send() {
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/forum/boards/${boardName}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment.trim(),
          subject: subject.trim() || null,
          walletAddress: address,
          anonymous: true,
          // The server re-parses this. Sending it is a request, not a decision.
          audience: serializeAudience(audience),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That did not go through.");
      setComment("");
      setSubject("");
      setAudience(EVERYONE);
      setIsPrivacyOpen(false);
      setIsTitleOpen(false);
      onPosted?.(data.threadId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That did not go through.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Primary In-Page Composer */}
      <div ref={containerRef} className={cn("retro-box", className)}>
        <div className="retro-box-title">
          <div className="retro-box-icon green">
            <Send className="w-5 h-5 drop-shadow-sm" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 px-3 uppercase tracking-wider">
            New Thread
          </span>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          // text-base is 16px. Anything smaller and iOS Safari zooms on focus.
          className="w-full resize-none bg-transparent px-3 py-3 text-base outline-none placeholder:text-muted-foreground"
        />

        {comment.trim().length > 0 && (
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Give it a title (optional)"
            className="min-h-11 w-full border-t border-zinc-100 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground dark:border-zinc-800"
          />
        )}

        <div className="border-t border-zinc-100 px-1 py-1 dark:border-zinc-800">
          <AudiencePicker value={audience} onChange={setAudience} options={audienceOptions} />
        </div>

        {error && <p className="px-3 pb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-2 border-t border-zinc-100 p-2 dark:border-zinc-800">
          {boards && boards.length > 0 && (
            <select
              value={boardName}
              onChange={(e) => onBoardChange?.(e.target.value)}
              aria-label="Board"
              className="min-h-10 flex-1 rounded-md bg-zinc-100 px-3 text-sm dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium"
            >
              {boards.map((b) => (
                <option key={b.name} value={b.name}>
                  /{b.name}/ {b.title}
                </option>
              ))}
            </select>
          )}

          {isConnected ? (
            <button
              type="button"
              onClick={send}
              disabled={!ready}
              className="ml-auto retro-btn retro-btn-green px-5 min-h-10 text-sm disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
              Post
            </button>
          ) : (
            <span className="ml-auto flex min-h-10 items-center px-2 text-xs sm:text-sm text-muted-foreground font-medium">
              Connect wallet to post
            </span>
          )}
        </div>
      </div>

      {/* Contained Bottom Composer Bar when scrolled out of view */}
      {enableFloatingBar && (
        <AnimatePresence>
          {isOutOfView && (
            <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
              <div className="w-full max-w-screen-lg mx-auto px-2.5 sm:px-4 pointer-events-auto">
                <motion.div
                  key="contained-bottom-composer"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="retro-bottom-bar w-full overflow-hidden"
                >
                  {/* Expandable Privacy Drawer */}
                  <AnimatePresence>
                    {isPrivacyOpen && (
                      <motion.div
                        key="bottom-bar-privacy"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="border-b border-zinc-300 dark:border-zinc-700 py-3 px-3 space-y-2 overflow-hidden bg-white/40 dark:bg-zinc-800/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            Audience Privacy
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsPrivacyOpen(false)}
                            className="text-xs text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 px-1 py-0.5 font-medium"
                          >
                            Done
                          </button>
                        </div>

                        <div className="pt-0.5">
                          <AudiencePicker value={audience} onChange={setAudience} options={audienceOptions} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expandable Title Drawer */}
                  <AnimatePresence>
                    {isTitleOpen && (
                      <motion.div
                        key="bottom-bar-title"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="border-b border-zinc-300 dark:border-zinc-700 py-2.5 px-3 space-y-1.5 overflow-hidden bg-white/40 dark:bg-zinc-800/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            Thread Title (Optional)
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsTitleOpen(false)}
                            className="text-xs text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 px-1 py-0.5 font-medium"
                          >
                            Done
                          </button>
                        </div>

                        <input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Give it a title (optional)"
                          className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Banner */}
                  {error && (
                    <div className="py-1.5 px-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
                      <span className="truncate">{error}</span>
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        className="ml-2 font-bold hover:underline"
                      >
                        &times;
                      </button>
                    </div>
                  )}

                  {/* Compact Attached Bar Row (50px height like top ticker) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 h-[50px] px-2 sm:px-3">
                    {/* Shadcn Board Selector (Fixed size for all cases) */}
                    {boards && boards.length > 0 && (
                      <Select value={boardName} onValueChange={(val) => onBoardChange?.(val)}>
                        <SelectTrigger
                          className="h-8 sm:h-9 w-[130px] bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 px-2 sm:px-2.5 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 shrink-0 gap-1 sm:gap-1.5 focus:ring-0 focus:border-sky-500 shadow-none"
                          aria-label="Select Board"
                        >
                          <span className="truncate">
                            /{selectedBoard?.name || boardName}/ {selectedBoard?.title}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="z-[60] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
                          {boards.map((b) => (
                            <SelectItem key={b.name} value={b.name} className="text-xs sm:text-sm font-medium">
                              /{b.name}/ {b.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Compact Input Field Box */}
                    <div className="flex-1 min-w-0 flex items-center h-8 sm:h-9 bg-white dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 px-2.5 focus-within:border-sky-500 dark:focus-within:border-sky-400 transition-colors">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && ready) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        placeholder={placeholder}
                        className="w-full bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    {/* Privacy Button: Globe for "anyone" by default, Lock when restricted */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsPrivacyOpen((prev) => !prev);
                        setIsTitleOpen(false);
                      }}
                      aria-label="Audience privacy"
                      title={audience.kind === "everyone" ? "Audience: Anyone can read" : `Audience: ${describeAudience(audience)}`}
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0",
                        (isPrivacyOpen || audience.kind !== "everyone") &&
                          "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50"
                      )}
                    >
                      {audience.kind === "everyone" ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </button>

                    {/* Thread Title Arrow Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsTitleOpen((prev) => !prev);
                        setIsPrivacyOpen(false);
                      }}
                      aria-label={isTitleOpen ? "Collapse thread title" : "Add thread title"}
                      title="Add title (optional)"
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0",
                        (isTitleOpen || subject.trim().length > 0) &&
                          "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50"
                      )}
                    >
                      {isTitleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>

                    {/* Submit Button or Connect Wallet */}
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={send}
                        disabled={!ready}
                        className="retro-btn retro-btn-green px-3.5 sm:px-4 h-8 sm:h-9 text-xs sm:text-sm font-bold disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Post</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openConnectModal?.()}
                        className="retro-btn retro-btn-gray px-2.5 sm:px-3 h-8 sm:h-9 text-xs font-semibold shrink-0"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

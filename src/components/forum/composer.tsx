/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Send,
  ChevronUp,
  ChevronDown,
  Globe,
  Lock,
  Image as ImageIcon,
  X,
  Type,
} from "lucide-react";
import {
  AudienceDropdown,
  AudiencePicker,
  type AudienceOptions,
} from "@/components/forum/audience-picker";
import { EVERYONE, serializeAudience, describeAudience, type Audience } from "@/lib/world/audience";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * The box you type in.
 *
 * Sized for quick posting without unnecessary clutter:
 * - Header: Retro title bar.
 * - Textarea: Compact writing area with clipboard paste image support.
 * - Footer: Single row with Board, Audience pill, quick tool icons (Image, Title), and Post.
 *
 * When scrolled past the top of the viewport, it morphs into a compact
 * floating bottom bar.
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
  const [showTitle, setShowTitle] = useState(false);
  const [audience, setAudience] = useState<Audience>(EVERYONE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomFileInputRef = useRef<HTMLInputElement>(null);

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

  function handleImageSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageSelect(file);
          break;
        }
      }
    }
  }

  async function send() {
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.url) {
          throw new Error(uploadData.error || "Image upload failed");
        }
        uploadedImageUrl = uploadData.url;
      }

      const res = await fetch(`/api/forum/boards/${boardName}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment.trim(),
          subject: subject.trim() || null,
          walletAddress: address,
          anonymous: true,
          audience: serializeAudience(audience),
          imageHash: uploadedImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That did not go through.");
      setComment("");
      setSubject("");
      setShowTitle(false);
      setImageFile(null);
      setImagePreview(null);
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
        {/* Header */}
        <div className="retro-box-title px-3.5 sm:px-4 gap-2">
          <Send className="w-4 h-4 text-[#2689BF] dark:text-[#52aae0] shrink-0" />
          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">
            New Thread
          </span>
        </div>

        {/* Optional Title Input (clean, un-bloated) */}
        {(showTitle || subject.length > 0) && (
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-3 py-1 bg-white/40 dark:bg-zinc-900/30">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Title (optional)"
              autoFocus
              className="w-full bg-transparent text-sm font-semibold outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-muted-foreground/60 placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => {
                setShowTitle(false);
                setSubject("");
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              title="Remove title"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && ready) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-base sm:text-sm outline-none placeholder:text-muted-foreground text-zinc-900 dark:text-zinc-100 leading-relaxed"
        />

        {/* Compact Image Preview Chip */}
        {imagePreview && (
          <div className="px-3 pb-2 flex items-center gap-2">
            <div className="relative inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-xs">
              <img src={imagePreview} alt="Preview" className="h-5 w-5 object-cover rounded" />
              <span className="truncate max-w-[160px] text-zinc-700 dark:text-zinc-300 font-medium">
                {imageFile?.name || "image"}
              </span>
              <button
                type="button"
                onClick={removeImage}
                className="text-zinc-400 hover:text-red-500 ml-1 font-bold text-sm leading-none"
                title="Remove image"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,image/gif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageSelect(file);
            e.target.value = "";
          }}
          className="hidden"
        />

        {error && <p className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

        {/* Compact Single Footer Action Row */}
        <div className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 p-2 bg-zinc-50/50 dark:bg-zinc-900/30">
          {/* Board Selector */}
          {boards && boards.length > 0 && (
            <Select value={boardName} onValueChange={(val) => onBoardChange?.(val)}>
              <SelectTrigger
                className="h-8 min-w-[110px] max-w-[160px] bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-none focus:ring-0 px-2.5 gap-1 shrink-0"
                aria-label="Board"
              >
                <span className="truncate">
                  /{selectedBoard?.name || boardName}/ {selectedBoard?.title}
                </span>
              </SelectTrigger>
              <SelectContent className="z-[60] bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
                {boards.map((b) => (
                  <SelectItem key={b.name} value={b.name} className="text-xs font-medium cursor-pointer">
                    /{b.name}/ {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Compact Audience Dropdown Pill */}
          <AudienceDropdown
            value={audience}
            onChange={setAudience}
            options={audienceOptions}
            className="h-8 px-2 py-0 text-xs shrink-0"
          />

          {/* Image Attach Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={imageFile ? imageFile.name : "Attach image"}
            aria-label="Attach image"
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0",
              imagePreview && "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
            )}
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Title Toggle Button */}
          {!showTitle && subject.length === 0 && (
            <button
              type="button"
              onClick={() => setShowTitle(true)}
              title="Add title"
              aria-label="Add title"
              className="h-8 px-2 flex items-center gap-1 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors text-xs font-medium shrink-0"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Title</span>
            </button>
          )}

          {/* Right: Submit Button or Connect Wallet */}
          <div className="ml-auto flex items-center shrink-0">
            {isConnected ? (
              <button
                type="button"
                onClick={send}
                disabled={!ready}
                className="retro-btn retro-btn-green px-4 h-8 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
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
                className="retro-btn retro-btn-gray px-3 h-8 text-xs font-semibold"
              >
                Connect
              </button>
            )}
          </div>
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

                  {/* Image Attachment Chip in Bottom Bar if attached */}
                  {imagePreview && (
                    <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <img src={imagePreview} alt="Attached" className="h-5 w-5 object-cover rounded border" />
                        <span className="truncate text-zinc-700 dark:text-zinc-300">{imageFile?.name || "Image attached"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-muted-foreground hover:text-red-500 font-bold px-1"
                      >
                        &times;
                      </button>
                    </div>
                  )}

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
                    {/* Shadcn Board Selector */}
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

                    {/* Image Attachment Button in bottom bar */}
                    <input
                      ref={bottomFileInputRef}
                      type="file"
                      accept="image/*,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bottomFileInputRef.current?.click()}
                      aria-label="Attach image"
                      title={imageFile ? imageFile.name : "Attach image"}
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0",
                        imagePreview && "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50"
                      )}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    {/* Privacy Button */}
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

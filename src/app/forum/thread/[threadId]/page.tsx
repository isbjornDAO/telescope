"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  RefreshCw,
  Clock,
  MessageSquare,
  ArrowLeft,
  ArrowDown,
  ShieldCheck,
  Send,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccount } from "wagmi";
import { AudienceTag, WithheldPost } from "@/components/forum/audience-picker";
import { useQueryClient } from "@tanstack/react-query";

interface Board {
  id: string;
  name: string;
  title: string;
}

interface Post {
  id: string;
  comment: string;
  posterId: string;
  createdAt: string;
  isOp: boolean;
  walletAddress: string | null;
  imageHash: string | null;
  anonymous: boolean;
  audienceLabel?: string;
  restricted?: boolean;
  user?: {
    createdAt: string;
    postCount?: number;
    discordId?: string;
    username?: string;
    discordAvatar?: string | null;
  };
}

interface Withheld {
  id: string;
  withheld: true;
  requirement: string;
}

function isWithheld(p: Post | Withheld): p is Withheld {
  return "withheld" in p;
}

interface Thread {
  id: string;
  subject: string | null;
  createdAt: string;
  replyCount: number;
  board: Board;
  posts: (Post | Withheld)[];
  posterCount?: number;
  audienceLabel?: string;
  restricted?: boolean;
}

export default function ThreadPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const threadId = params.threadId as string;
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stayAnonymous, setStayAnonymous] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stayAnonymous");
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const handleAnonymousChange = (checked: boolean) => {
    setStayAnonymous(checked);
    localStorage.setItem("stayAnonymous", JSON.stringify(checked));
  };

  const fetchThread = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/forum/threads/${threadId}`);
      const data = await response.json();
      setThread(data);
    } catch (error) {
      console.error("Error fetching thread:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      fetchThread();
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoUpdate, threadId]);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const insertQuote = (index: number) => {
    const quoteText = `>>${index}\n`;
    setComment((prev) => (prev ? `${prev}\n${quoteText}` : quoteText));
    replyInputRef.current?.focus();
  };

  const createReply = async () => {
    if (!address || !comment.trim() || !thread) return;

    setReplying(true);
    try {
      let uploadedImageUrl = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.url) {
          uploadedImageUrl = uploadData.url;
        }
      }

      const response = await fetch(`/api/forum/threads/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment,
          walletAddress: address,
          boardName: thread.board.name,
          imageHash: uploadedImageUrl || null,
          anonymous: stayAnonymous,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.xpAwarded) {
          queryClient.invalidateQueries({ queryKey: ["userStats", address] });
          alert(
            `Reply posted! You earned 1 XP. Total XP: ${data.newXp} (Level ${data.newLevel})`
          );
        }
        setComment("");
        setImageFile(null);
        setImagePreview("");
        fetchThread();
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 py-12">
        <div className="h-12 w-64 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-md mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-zinc-100 dark:bg-zinc-800/60 animate-pulse rounded-md border border-zinc-200 dark:border-zinc-700"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 py-16">
        <div className="retro-box p-8 text-center max-w-md mx-auto">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Thread Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The discussion topic you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/forum"
            className="retro-btn retro-btn-blue inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  const imagesCount = thread.posts.filter((p) => !isWithheld(p) && p.imageHash).length;

  return (
    <div className="w-full">
      {/* Retro Topic Info Header Bar */}
      <div className="retro-topic-header mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        {/* Left: Navigation & Board context */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/forum/${thread.board.name}`}
            className="retro-btn retro-btn-gray px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>/{thread.board.name}/</span>
          </Link>

          <span className="font-bold text-zinc-700 dark:text-zinc-300">
            {thread.board.title || thread.board.name}
          </span>

          {thread.restricted && thread.audienceLabel && (
            <AudienceTag label={thread.audienceLabel} />
          )}
        </div>

        {/* Right: Controls and Thread stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded bg-white/70 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px] text-muted-foreground">
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{thread.posts.length}</span> posts ·{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{imagesCount}</span> imgs ·{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{thread.posterCount ?? 0}</span> nodes
          </div>

          <button
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`retro-btn px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1 ${
              autoUpdate ? "retro-btn-green" : "retro-btn-gray"
            }`}
            title="Auto-refresh thread every 10 seconds"
          >
            <span>Auto</span>
            {autoUpdate && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
          </button>

          <button
            onClick={() => fetchThread()}
            className="retro-btn retro-btn-gray px-2.5 py-1 text-xs inline-flex items-center gap-1"
            title="Refresh thread"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={scrollToBottom}
            className="retro-btn retro-btn-gray px-2.5 py-1 text-xs inline-flex items-center gap-1"
            title="Scroll to reply composer"
          >
            <ArrowDown className="w-3 h-3" />
            <span>Bottom</span>
          </button>
        </div>
      </div>

      {/* Main Topic Subject Title Card */}
      <div className="retro-box mb-5 overflow-hidden">
        <div className="retro-box-title bg-gradient-to-r from-[#2B83B7] to-[#1E6B99] flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-bold text-sm sm:text-base tracking-wide text-white drop-shadow-sm">
              {thread.subject || `Discussion #${thread.id.slice(0, 8)}`}
            </h1>
          </div>
          <span className="text-[11px] text-white/80 font-normal hidden sm:inline-block">
            Created {new Date(thread.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Posts Stream: Retro 2-Column Format */}
      <div className="space-y-4 mb-8">
        {thread.posts.map((post, index) => {
          if (isWithheld(post)) {
            return (
              <div key={post.id} className="retro-box p-4">
                <WithheldPost requirement={post.requirement} />
              </div>
            );
          }

          const isOp = post.isOp;
          const authorName = post.anonymous
            ? "Anonymous"
            : post.user?.username ||
              post.user?.discordId ||
              (post.walletAddress
                ? `${post.walletAddress.slice(0, 6)}...${post.walletAddress.slice(-4)}`
                : "Anonymous");

          const userAvatar = post.user?.discordAvatar;
          const avatarInitials = post.walletAddress
            ? post.walletAddress.slice(2, 4).toUpperCase()
            : "AN";

          return (
            <div key={post.id} id={`post-${post.id}`} className="retro-post-card">
              {/* Left Column: Author Card (Retro style) */}
              <div className={`retro-post-author ${isOp ? "op" : "reply"}`}>
                {/* Username Plate */}
                <div className="retro-author-nameplate" title={authorName}>
                  {authorName}
                </div>

                {/* Avatar Frame Box */}
                <div className="retro-author-avatar-box">
                  {post.anonymous ? (
                    <div className="flex flex-col items-center justify-center text-white/80">
                      <User className="w-10 h-10 drop-shadow" />
                    </div>
                  ) : userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white text-xl bg-black/20">
                      {avatarInitials}
                    </div>
                  )}
                </div>

                {/* Role / Status Badge */}
                <div className="retro-author-badge">
                  {isOp ? (
                    <span>OP</span>
                  ) : post.anonymous ? (
                    <span>ANON</span>
                  ) : (
                    <span>MEMBER</span>
                  )}
                </div>

                {/* Author Metadata Stats */}
                <div className="retro-author-stats">
                  <span className="font-mono text-[10px]">
                    ID: {post.posterId.slice(0, 6)}
                  </span>
                  {post.user?.postCount !== undefined && (
                    <span className="text-[10px]">
                      Posts: {post.user.postCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Post Body Content */}
              <div className="retro-post-content">
                {/* Top Metallic Info Bar */}
                <div className="retro-post-infobar">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>
                      {new Date(post.createdAt).toLocaleDateString()} at{" "}
                      {new Date(post.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {post.walletAddress && !post.anonymous && (
                      <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        {post.walletAddress.slice(0, 6)}...{post.walletAddress.slice(-4)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => insertQuote(index + 1)}
                      className="retro-post-num hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      title="Click to quote this post"
                    >
                      #{index + 1}
                    </button>
                  </div>
                </div>

                {/* Post Message Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Attached Image Preview with Expand toggle */}
                    {post.imageHash && (
                      <div className="mt-1 mb-3">
                        <div
                          className={`rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden inline-block transition-all ${
                            expandedImages.has(post.id)
                              ? "w-full max-w-full"
                              : "max-w-[260px]"
                          }`}
                        >
                          <img
                            src={post.imageHash}
                            alt="Post attachment"
                            className="w-full h-auto object-contain cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => {
                              setExpandedImages((prev) => {
                                const next = new Set(prev);
                                if (next.has(post.id)) {
                                  next.delete(post.id);
                                } else {
                                  next.add(post.id);
                                }
                                return next;
                              });
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Click image to {expandedImages.has(post.id) ? "collapse" : "expand"}
                        </p>
                      </div>
                    )}

                    {/* Post Text with Greentext quote support */}
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                      {post.comment.split("\n").map((line, lineIdx) => {
                        const isQuote = line.trim().startsWith(">");
                        return (
                          <p
                            key={lineIdx}
                            className={
                              isQuote
                                ? "text-[#2B8C08] dark:text-[#4ADE80] font-medium"
                                : ""
                            }
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* Retro Post Signature Divider */}
                  <div className="retro-post-signature">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Telescope Signal #{post.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {post.anonymous
                        ? "Anonymous Broadcast"
                        : post.walletAddress
                        ? "C-Chain Cryptographic Key"
                        : "Verified Member"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Refresh */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => fetchThread()}
          className="retro-btn retro-btn-gray px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Update Thread</span>
        </button>

        <span className="text-xs text-muted-foreground">
          {thread.posts.length} {thread.posts.length === 1 ? "response" : "responses"} recorded
        </span>
      </div>

      {/* Reply Composer Box: Retro Styled */}
      {address ? (
        <div className="retro-box mb-12">
          <div className="retro-box-title bg-gradient-to-r from-[#54C301] to-[#3B8F00] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                <Send className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-white drop-shadow-sm">
                Post a Reply
              </span>
            </div>
            <span className="text-[11px] text-white/80 font-normal">
              Earn 1 XP per verified post
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Your Message
              </label>
              <Textarea
                ref={replyInputRef}
                placeholder="Write your contribution... (use > to quote text)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="text-sm bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:ring-1 focus-visible:ring-sky-500 rounded-md"
              />
            </div>

            {/* Attachment & Anonymous Options */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="cursor-pointer w-full sm:w-auto text-xs h-8 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-200"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700">
                  <Checkbox
                    id="anonymous-reply"
                    checked={stayAnonymous}
                    onCheckedChange={(checked) =>
                      handleAnonymousChange(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="anonymous-reply"
                    className="text-xs font-semibold cursor-pointer text-zinc-700 dark:text-zinc-300 select-none"
                  >
                    Post Anonymously
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={createReply}
                disabled={replying || !comment.trim()}
                className="retro-btn retro-btn-green px-6 py-2 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto shadow-sm"
              >
                {replying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Reply</span>
                  </>
                )}
              </button>
            </div>

            {/* Selected Image Preview */}
            {imagePreview && (
              <div className="mt-3 p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-dashed border-zinc-300 dark:border-zinc-700 inline-block">
                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Image preview ready to upload
                </p>
                <img
                  src={imagePreview}
                  alt="Attachment Preview"
                  className="max-w-xs max-h-36 rounded object-contain border"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="retro-box p-6 text-center mb-12">
          <Sparkles className="w-8 h-8 text-sky-500 mx-auto mb-2" />
          <h3 className="font-bold text-sm mb-1">Connect Wallet to Participate</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-3">
            Sign in with your Web3 wallet to post replies, earn XP, and contribute to the
            Telescope network.
          </p>
        </div>
      )}
    </div>
  );
}

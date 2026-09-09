"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { User, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccount } from "wagmi";
import { PageNavigation } from "@/components/page-navigation";
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
  // Null whenever the author posted anonymously. The API withholds it now
  // rather than sending it and trusting the client to look away.
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

/** What comes back in place of a post this reader may not open. */
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
  /** Counted server-side, so the page never needs everyone's wallet to count them. */
  posterCount?: number;
  audienceLabel?: string;
  restricted?: boolean;
}

export default function ThreadPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const threadId = params.threadId as string;

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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stayAnonymous');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const handleAnonymousChange = (checked: boolean) => {
    setStayAnonymous(checked);
    localStorage.setItem('stayAnonymous', JSON.stringify(checked));
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

  // Auto update functionality
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      fetchThread();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoUpdate, threadId]);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const createReply = async () => {
    if (!address || !comment.trim() || !thread) return;

    setReplying(true);
    try {
      let uploadedImageUrl = null;
      
      // Upload image if one is selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
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
          anonymous: stayAnonymous
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.xpAwarded) {
          queryClient.invalidateQueries({ queryKey: ["userStats", address] });
          alert(`Reply posted! You earned 1 XP. Total XP: ${data.newXp} (Level ${data.newLevel})`);
        }
        setComment("");
        setImageFile(null);
        setImagePreview("");
        fetchThread(); // Refresh thread to show new reply
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 py-16">
        <div className="h-12 w-48 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 py-16">
        <Card className="p-6 md:p-12 text-center">
          <p className="text-muted-foreground">Thread not found.</p>
          <Link href="/forum" className="text-primary hover:underline mt-4 inline-block">
            Back to forum
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto pt-5 px-4 md:px-8 relative z-10 mb-4">
        <PageNavigation />
      </div>
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 pb-8 md:pb-16">
        {/* 4chan-style navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 text-xs sm:text-sm gap-2">
          <div className="flex items-center gap-2">
            <Link href={`/forum/${thread.board.name}`} className="text-primary hover:underline">
              &gt;&gt;Back to /{thread.board.name}/
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-muted-foreground text-xs">
              {thread.posts.length} / {thread.posts.filter(p => !isWithheld(p) && p.imageHash).length} / {thread.posterCount ?? 0}
            </span>
            <button onClick={scrollToBottom} className="text-primary hover:underline">
              [Bottom]
            </button>
            <button
              onClick={() => setAutoUpdate(!autoUpdate)}
              className={`hover:underline ${autoUpdate ? 'text-green-600 font-semibold' : 'text-primary'}`}
            >
              [Auto]
            </button>
          </div>
        </div>

      {(thread.subject || thread.restricted) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {thread.subject && <h1 className="text-2xl md:text-3xl font-bold">{thread.subject}</h1>}
          {thread.restricted && thread.audienceLabel && <AudienceTag label={thread.audienceLabel} />}
        </div>
      )}

      <div className="space-y-4 mb-8">
        {thread.posts.map((post, index) => isWithheld(post) ? (
          // A gap in the conversation, labelled with what would open it and
          // nothing about who is already inside.
          <div key={post.id} className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <WithheldPost requirement={post.requirement} />
          </div>
        ) : (
          <div key={post.id} className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className={`p-4 rounded ${post.isOp ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              {/* User Info Bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 text-sm">
                  {/* Profile Picture */}
                  {post.anonymous ? (
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  ) : post.user?.discordAvatar ? (
                    <img
                      src={post.user.discordAvatar}
                      alt="Profile"
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="font-semibold text-green-700 dark:text-green-500">
                    {post.anonymous
                      ? 'Anonymous'
                      : (post.user?.username || post.user?.discordId || (post.walletAddress ? post.walletAddress.slice(0, 6) + '...' + post.walletAddress.slice(-4) : 'Anonymous'))
                    }
                  </span>
                  <span className="text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</span>
                  <span className="text-muted-foreground">ID: {post.posterId}</span>
                  {post.isOp && <Badge variant="secondary" className="text-xs">OP</Badge>}
                  <button className="text-primary hover:underline text-xs">&gt;&gt;{index + 1}</button>
                </div>
              </div>

              {/* Post content with image on left */}
              <div className="flex flex-col gap-3">
                {/* Post Image */}
                {post.imageHash && (
                  <div className={expandedImages.has(post.id) ? "w-full" : "flex-shrink-0 max-w-[200px]"}>
                    <img
                      src={post.imageHash}
                      alt="Post image"
                      className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-all"
                      onClick={() => {
                        setExpandedImages(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(post.id)) {
                            newSet.delete(post.id);
                          } else {
                            newSet.add(post.id);
                          }
                          return newSet;
                        });
                      }}
                    />
                  </div>
                )}

                {/* Post Text */}
                <div className="flex-1 min-w-0 whitespace-pre-wrap break-words text-sm">
                  {post.comment.split('\n').map((line, i) => (
                    <p key={i} className={line.startsWith('>') ? 'text-green-600 dark:text-green-400' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Update button above reply */}
      <div className="mb-4">
        <button
          onClick={() => fetchThread()}
          className="text-primary hover:underline text-sm flex items-center gap-1"
        >
          [Update]
          {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin" />}
        </button>
      </div>

      {address ? (
        <Card className="p-4">
          <h2 className="text-sm font-semibold mb-3">Reply</h2>
          <div className="space-y-3">
            <Textarea
              placeholder="Write your reply..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="text-base"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
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
                  className="cursor-pointer w-full sm:w-auto text-xs"
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous-reply"
                    checked={stayAnonymous}
                    onCheckedChange={(checked) => handleAnonymousChange(checked as boolean)}
                  />
                  <label
                    htmlFor="anonymous-reply"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Anonymous
                  </label>
                </div>
              </div>
              <Button
                onClick={createReply}
                disabled={replying || !comment.trim()}
                size="sm"
                className="w-full sm:w-auto"
              >
                {replying ? "Posting..." : "Post"}
              </Button>
            </div>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-32 rounded border"
                />
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to post a reply.
          </p>
        </Card>
      )}
      </div>
    </div>
  );
}

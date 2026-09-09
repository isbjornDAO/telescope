"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccount } from "wagmi";
import { PageNavigation } from "@/components/page-navigation";
import { useQueryClient } from "@tanstack/react-query";

interface Thread {
  id: string;
  subject: string | null;
  bumpedAt: string;
  createdAt: string;
  replyCount: number;
  posts: Post[];
}

interface Post {
  id: string;
  comment: string;
  posterId: string;
  createdAt: string;
  walletAddress: string;
  imageHash: string | null;
  anonymous: boolean;
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const boardName = params.boardName as string;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [subject, setSubject] = useState("");
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
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

  useEffect(() => {
    fetchThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardName]);

  const fetchThreads = async () => {
    try {
      const response = await fetch(`/api/forum/boards/${boardName}/threads`);
      const data = await response.json();
      setThreads(data);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const createThread = async () => {
    if (!address || !comment.trim() || !imageFile) return;

    setCreating(true);
    try {
      // Upload image first
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const uploadData = await uploadResponse.json();
      
      if (!uploadData.url) {
        throw new Error('Image upload failed');
      }

      const response = await fetch(`/api/forum/boards/${boardName}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim() || null,
          comment,
          walletAddress: address,
          imageHash: uploadData.url,
          anonymous: stayAnonymous
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.xpAwarded) {
          // Invalidate user stats to refresh XP display
          queryClient.invalidateQueries({ queryKey: ["userStats", address] });
          alert(`Thread created! You earned 1 XP. Total XP: ${data.newXp} (Level ${data.newLevel})`);
        }
        router.push(`/forum/thread/${data.threadId}`);
      }
    } catch (error) {
      console.error("Error creating thread:", error);
      alert('Failed to create thread. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 py-16">
        <div className="h-12 w-48 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-screen-lg mx-auto -mt-6 px-4 md:px-8 relative z-10 mb-4">
        <PageNavigation />
      </div>
      <div className="w-full max-w-screen-lg mx-auto px-4 md:px-8 pb-16">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>›</span>
          <Link href="/forum" className="hover:text-primary">Forum</Link>
          <span>›</span>
          <span className="text-foreground font-medium">/{boardName}/</span>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold" style={{ color: "var(--telescope-blue)" }}>/{boardName}/</h1>
          </div>
        {isConnected && (
          <Button onClick={() => setShowNewThread(!showNewThread)} className="w-full sm:w-auto">
            {showNewThread ? "Cancel" : "New Thread"}
          </Button>
        )}
        {!isConnected && (
          <p className="text-sm text-muted-foreground">
            Connect wallet to post
          </p>
        )}
      </div>

      {showNewThread && (
        <Card className="p-4 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-4">Create New Thread</h2>
          <div className="space-y-4">
            <Input
              placeholder="Subject (optional)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              className="text-base"
            />
            <Textarea
              placeholder="Write your post..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="text-base"
            />
            <div>
              <label className="block text-sm font-medium mb-2">
                Image (required) *
              </label>
              <Input
                type="file"
                accept="image/*,image/gif"
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
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-64 rounded border"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={stayAnonymous}
                onCheckedChange={(checked) => handleAnonymousChange(checked as boolean)}
              />
              <label
                htmlFor="anonymous"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Stay Anonymous
              </label>
            </div>
            <Button
              onClick={createThread}
              disabled={creating || !comment.trim() || !imageFile}
              className="w-full"
            >
              {creating ? "Creating..." : "Create Thread"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {threads.map((thread) => (
          <Link key={thread.id} href={`/forum/thread/${thread.id}`}>
            <div className="hover:opacity-80 transition-opacity cursor-pointer h-full">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded h-full flex flex-col">
                {/* Thread Image */}
                {thread.posts[0]?.imageHash && (
                  <div className="w-full aspect-square overflow-hidden rounded bg-zinc-100 mb-2">
                    <img
                      src={thread.posts[0].imageHash}
                      alt={thread.subject || 'Thread image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Thread Info */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-xs line-clamp-2 min-h-[2rem]">
                    {thread.subject || 'No Subject'}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {thread.posts[0]?.comment}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="truncate text-white">{thread.replyCount} replies</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {threads.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No threads yet. Be the first to post!</p>
          {!address && (
            <p className="text-sm text-muted-foreground">
              Connect your wallet to create a thread.
            </p>
          )}
        </Card>
      )}
      </div>
    </div>
  );
}

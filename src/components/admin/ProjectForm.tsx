"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/components/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { ArrowLeft } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  tags: string[];
  social: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    website?: string;
    dexscreener?: string;
    contractAddress?: string;
  } | null;
}

interface ProjectFormProps {
  initialData?: Project;
  mode: "create" | "edit";
}

export function ProjectForm({ initialData, mode }: ProjectFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    avatar: initialData?.avatar || "",
    tags: initialData?.tags || [],
    social: {
      twitter: initialData?.social?.twitter || "",
      discord: initialData?.social?.discord || "",
      telegram: initialData?.social?.telegram || "",
      website: initialData?.social?.website || "",
      dexscreener: initialData?.social?.dexscreener || "",
      contractAddress: initialData?.social?.contractAddress || "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = mode === "create" ? "/api/projects" : `/api/projects/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${mode} project`);
      }

      router.push("/admin");
    } catch (error) {
      console.error(`Error ${mode}ing project:`, error);
      alert(`Failed to ${mode} project. Please try again.`);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-screen-lg">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-3xl font-bold">
          {mode === "create" ? "Create New Project" : "Edit Project"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input
            id="avatar"
            value={formData.avatar}
            onChange={(e) =>
              setFormData({ ...formData, avatar: e.target.value })
            }
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <MultiSelect
            options={categories.map((cat) => ({ label: cat, value: cat }))}
            value={formData.tags.map((tag) => ({ label: tag, value: tag }))}
            onChange={(selected: Option[]) =>
              setFormData({
                ...formData,
                tags: selected.map((item) => item.value),
              })
            }
            placeholder="Select categories..."
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.social.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social: { ...formData.social, twitter: e.target.value },
                  })
                }
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discord">Discord</Label>
              <Input
                id="discord"
                value={formData.social.discord}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social: { ...formData.social, discord: e.target.value },
                  })
                }
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                value={formData.social.telegram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social: { ...formData.social, telegram: e.target.value },
                  })
                }
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.social.website}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social: { ...formData.social, website: e.target.value },
                  })
                }
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dexscreener">DexScreener</Label>
              <Input
                id="dexscreener"
                value={formData.social.dexscreener}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social: { ...formData.social, dexscreener: e.target.value },
                  })
                }
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                value={formData.social.contractAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social: {
                      ...formData.social,
                      contractAddress: e.target.value,
                    },
                  })
                }
                className="bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === "create" ? "Create Project" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
} 
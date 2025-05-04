"use client";

import { useState } from "react";
import { categories } from "@/components/categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Option {
  label: string;
  value: string;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    avatar: "",
    tags: [] as string[],
    social: {
      twitter: "",
      discord: "",
      telegram: "",
      website: "",
      dexscreener: "",
      contractAddress: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      onClose();
      // Reset form
      setFormData({
        name: "",
        description: "",
        avatar: "",
        tags: [],
        social: {
          twitter: "",
          discord: "",
          telegram: "",
          website: "",
          dexscreener: "",
          contractAddress: "",
        },
      });
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
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
            <h3 className="font-semibold">Social Links</h3>
            <div className="grid grid-cols-2 gap-4">
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
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
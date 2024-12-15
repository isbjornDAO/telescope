"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAvatarForProject } from '@/lib/avatar-mapping';

export default function ImportPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateAvatars = async () => {
    setIsLoading(true);
    try {
      // First fetch all projects
      const projects = await fetch("/api/projects").then(res => res.json());
      
      // Update each project with its matching avatar
      const updatedProjects = projects.map((project: { id: string; name: string }) => ({
        ...project,
        avatar: getAvatarForProject(project.name)
      }));

      // Send the updates to the API
      const response = await fetch("/api/update-avatars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projects: updatedProjects }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Successfully updated ${data.count} project avatars`,
          variant: "default",
          className: "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50",
        });
      } else {
        throw new Error(data.error || "Failed to update avatars");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update avatars",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Project Management</h1>
      <div className="space-y-4">
        <Button
          onClick={handleUpdateAvatars}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Updating Avatars..." : "Update Project Avatars"}
        </Button>
      </div>
    </div>
  );
} 
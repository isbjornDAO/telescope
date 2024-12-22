"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface FormData {
  projectId: string;
  tags: string[];
}

interface Project {
  id: string;
  name: string;
  tags: string[];
}

export default function TagsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { register, handleSubmit, reset, watch } = useForm<FormData>();
  
  // Reference the categories array from your existing Categories component
  const availableTags = ["DEX", "Good Tech", "Alpha", "Gaming", "Finance", "NFT", "Yield", "404s"];
  
  const selectedProjectId = watch("projectId");

  useEffect(() => {
    // Fetch projects when component mounts
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        // Add validation to ensure data is an array
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error("Invalid projects data format:", data);
          toast({
            title: "Error",
            description: "Invalid data format received from server",
            variant: "destructive",
          });
          setProjects([]); // Ensure projects is always an array
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
        setProjects([]); // Ensure projects is always an array
      }
    };

    fetchProjects();
  }, []);

  // Update selected tags when project changes
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      setSelectedTags(project?.tags || []);
    }
  }, [selectedProjectId, projects]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(`/api/projects/${data.projectId}/tags`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: selectedTags }),
      });

      if (!response.ok) throw new Error("Failed to update tags");

      toast({
        title: "Success",
        description: "Project tags updated successfully",
      });
      
      // Refresh projects list
      const updatedProjects = projects.map(project => 
        project.id === data.projectId 
          ? { ...project, tags: selectedTags }
          : project
      );
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Failed to update tags:", error);
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive",
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(current => 
      current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag]
    );
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Project Tags</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Project
          </label>
          <select
            {...register("projectId")}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProjectId && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    onClick={() => toggleTag(tag)}
                    className="text-sm"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <Button type="submit">
              Update Tags
            </Button>
          </>
        )}
      </form>
    </div>
  );
} 
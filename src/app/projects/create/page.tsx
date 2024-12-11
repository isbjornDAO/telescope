"use client";

import { useState } from "react";
import { projects } from "@/lib/projects";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ProjectForm {
  name: string;
  description?: string;
  avatar?: string;
  twitter?: string;
  discord?: string;
  website?: string;
}

export default function CreateProject() {
  const { handleSubmit, control, setValue, watch } = useForm<ProjectForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameValue = watch("name");

  const onSubmit = async (data: ProjectForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Project Created",
          description: "Your project has been added to the leaderboard.",
        });
        // Optionally reset the form or redirect the user
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create project.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = event.target.value;
    const selectedProject = projects.find((p) => p.id === projectId);
    if (selectedProject) {
      setValue("name", selectedProject.name);
      setValue("description", selectedProject.description || "");
      setValue("avatar", selectedProject.avatar || "");
      setValue("twitter", selectedProject.social?.twitter || "");
      setValue("discord", selectedProject.social?.discord || "");
      setValue("website", selectedProject.social?.website || "");
    } else {
      // Reset fields if no project is selected
      setValue("name", "");
      setValue("description", "");
      setValue("avatar", "");
      setValue("twitter", "");
      setValue("discord", "");
      setValue("website", "");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Project</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="project-select">
            Select Project
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <select
                id="project-select"
                className="block w-full border border-gray-300 rounded-md p-2"
                onChange={(e) => {
                  field.onChange(e.target.value);
                  handleSelectChange(e);
                }}
                value={field.value}
              >
                <option value="">-- Select a Project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                id="description"
                {...field}
                placeholder="Project description"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="avatar">
            Avatar URL
          </label>
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => (
              <Input
                id="avatar"
                {...field}
                placeholder="https://example.com/avatar.png"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="twitter">
            Twitter URL
          </label>
          <Controller
            name="twitter"
            control={control}
            render={({ field }) => (
              <Input
                id="twitter"
                {...field}
                placeholder="https://twitter.com/yourproject"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="discord">
            Discord URL
          </label>
          <Controller
            name="discord"
            control={control}
            render={({ field }) => (
              <Input
                id="discord"
                {...field}
                placeholder="https://discord.gg/yourproject"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="website">
            Website URL
          </label>
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <Input
                id="website"
                {...field}
                placeholder="https://yourproject.com"
              />
            )}
          />
        </div>

        <Button type="submit" disabled={isSubmitting || !nameValue}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
} 
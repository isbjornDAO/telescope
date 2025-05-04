"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";

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

export default function EditProjectPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error("Error fetching project:", error);
        setError("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.projectId]);

  if (loading) {
    return <div>Loading project data...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <ProjectForm initialData={project} mode="edit" />
    </div>
  );
}

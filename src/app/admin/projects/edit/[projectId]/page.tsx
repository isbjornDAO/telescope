"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { AdminWrapper } from "@/components/admin/AdminWrapper";

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
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project data");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.projectId]);

  return (
    <AdminWrapper>
      <div className="w-full space-y-4 pb-12">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading project data...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-red-500">
            {error}
          </div>
        ) : !project ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Project not found.
          </div>
        ) : (
          <ProjectForm initialData={project} mode="edit" />
        )}
      </div>
    </AdminWrapper>
  );
}

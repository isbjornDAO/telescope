"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { isAdmin } from "@/lib/auth";

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
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.discordUser || !isAdmin(session.discordUser.id)) {
      router.push("/");
    }
  }, [session, status, router]);

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

  // Show loading state while checking session
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  // Redirect if not admin
  if (!session?.discordUser || !isAdmin(session.discordUser.id)) {
    return null;
  }

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

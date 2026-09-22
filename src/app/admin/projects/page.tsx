import { prisma } from "@/lib/prisma";
import { ArrowLeftIcon, PlusIcon, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { RetroBox } from "@/components/world/primitives";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  voteCount: number;
}

async function getProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: {
      deleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get vote counts for each project
  const projectsWithVotes = await Promise.all(
    projects.map(async (project) => {
      const voteCount = await prisma.vote.count({
        where: {
          projectId: project.id,
        },
      });

      return {
        ...project,
        voteCount,
      };
    })
  );

  return projectsWithVotes;
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <AdminWrapper>
      <div className="w-full space-y-4 pb-12">
        {/* Retro Topic Header Breadcrumb */}
        <div className="retro-topic-header flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="retro-btn retro-btn-gray px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1"
            >
              <ArrowLeftIcon className="h-3 w-3" />
              Admin
            </Link>
            <span className="text-zinc-400 dark:text-zinc-600">/</span>
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <FolderGit2 className="h-4 w-4 text-sky-500" />
              Project Directory
            </span>
          </div>
          <Link
            href="/admin/projects/new"
            className="snow-button text-xs h-7 px-2.5 gap-1 inline-flex"
          >
            <PlusIcon className="h-3 w-3" />
            Create Project
          </Link>
        </div>

        <RetroBox
          title={`All Registered Projects (${projects.length})`}
          icon={<FolderGit2 className="h-4 w-4" />}
          iconColor="blue"
          actions={
            <Link
              href="/admin/projects/new"
              className="snow-button-secondary text-xs h-7 px-2.5 gap-1 inline-flex"
            >
              <PlusIcon className="h-3 w-3" />
              New Project
            </Link>
          }
        >
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No projects found. Create your first project to get started!
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700/60">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-bold text-xs min-w-[2rem] text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-bold text-zinc-900 dark:text-zinc-100 hover:text-sky-500 hover:underline text-sm truncate block"
                      >
                        {project.name}
                      </Link>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-lg mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center self-end sm:self-auto gap-3 shrink-0">
                    <span className="font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                      {project.voteCount} votes
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/projects/edit/${project.id}`}
                        className="snow-button-secondary text-[11px] h-7 px-2.5 inline-flex"
                      >
                        Edit
                      </Link>
                      <DeleteProjectButton projectId={project.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RetroBox>
      </div>
    </AdminWrapper>
  );
}

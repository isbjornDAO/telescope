import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { DeleteProjectButton } from "./DeleteProjectButton";
import { getTextColorClass } from "@/lib/utils";

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
      <div className="container mx-auto p-4 space-y-4 max-w-screen-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeftIcon className="h-4 w-4" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Projects</h1>
          </div>
          <Button asChild>
            <Link href="/admin/projects/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Project
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className={`flex flex-col md:flex-row items-center gap-4 rounded-lg dark:bg-zinc-800 pl-4 pr-4 md:pr-8 py-4 shadow transition-all hover:shadow-md border ${
                index === 0
                  ? "border-yellow-400"
                  : index === 1
                  ? "border-gray-300"
                  : index === 2
                  ? "border-amber-600"
                  : "border-zinc-200 dark:border-zinc-700"
              }
              ${
                index === 0
                  ? "bg-[#fff0c3]"
                  : index === 1
                  ? "bg-[#f0f0f0]"
                  : index === 2
                  ? "bg-[#f8e1c4]"
                  : "bg-white dark:bg-zinc-800"
              }`}
            >
              <div className="flex flex-row items-center justify-between gap-4 w-full md:w-auto">
                <div className="flex items-center gap-4">
                  <div className="flex flex-row items-center gap-4">
                    <div
                      className={`text-sm font-medium ${
                        [0, 1, 2].includes(index)
                          ? getTextColorClass(index + 1)
                          : "text-zinc-500 dark:text-zinc-200"
                      }`}
                    >
                      #{index + 1}
                    </div>
                  </div>

                  <div className="flex md:min-w-[300px] md:max-w-[300px] flex-col">
                    <div
                      className={`font-bold ${
                        [0, 1, 2].includes(index)
                          ? "text-zinc-800"
                          : "text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      <Link
                        href={`/projects/${project.id}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </div>
                    {project.description && (
                      <div
                        className={`text-sm truncate dark:text-zinc-400 hidden md:flex ${
                          [0, 1, 2].includes(index)
                            ? "text-zinc-700"
                            : "text-zinc-500"
                        }`}
                      >
                        {project.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex md:hidden">
                  <div className="text-sm text-muted-foreground">
                    {project.voteCount} votes
                  </div>
                </div>
              </div>
              <div className="flex-1 items-center justify-end gap-4 hidden md:flex">
                <div className="text-sm text-muted-foreground">
                  {project.voteCount} votes
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" asChild>
                    <Link href={`/admin/projects/edit/${project.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              </div>
              {project.description && (
                <div
                  className={`text-sm truncate dark:text-zinc-400 flex md:hidden w-full text-wrap ${
                    [0, 1, 2].includes(index)
                      ? "text-zinc-700"
                      : "text-zinc-500"
                  }`}
                >
                  {project.description}
                </div>
              )}
              <div className="flex w-full md:hidden">
                <div className="flex space-x-2">
                  <Button variant="outline" asChild>
                    <Link href={`/admin/projects/edit/${project.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <DeleteProjectButton projectId={project.id} />
                </div>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No projects found. Create your first project to get started!
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminWrapper>
  );
}

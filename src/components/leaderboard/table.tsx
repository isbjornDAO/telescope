"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Twitter, MessageCircle, Globe, Users } from "lucide-react";

interface Project {
  id: number;
  rank: number;
  avatar: string;
  name: string;
  description: string;
  score: number;
  rating: number;
  achievements: number;
  level: number;
  votes: number;
  voters: number;
  social: {
    twitter: string;
    discord: string;
    website: string;
  };
}



export const LeaderboardTable = () => {
  const [projects, setProjects] = useState(initialProjects);

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center gap-4 rounded-lg bg-white p-4 shadow transition-all hover:shadow-md"
        >
          <div className="text-sm font-medium text-gray-500">
            #{project.rank}
          </div>
          <Avatar className="h-10 w-10 border-2 border-gray-200">
            <AvatarImage src={project.avatar} alt={project.name} />
            <AvatarFallback>{project.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-[300px] max-w-[300px] flex-col">
            <div className="text-sm font-bold text-gray-800">
              {project.name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {project.description}
            </div>
            <div className="mt-1 flex space-x-2">
              <a
                href={project.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href={project.social.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-indigo-400"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href={project.social.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-4 text-sm text-gray-600">
            <div className="flex flex-col items-end">
              <div className="text-base font-medium text-gray-700">
                {project.votes.toLocaleString()} votes
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="h-3 w-3" />
                <span>{project.voters.toLocaleString()} voters</span>
              </div>
            </div>
            <Button size="sm">Vote</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

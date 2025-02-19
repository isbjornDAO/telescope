'use client';

import { useState } from 'react';
import { IncubatorProject } from '@/types';
import { ClipboardCopy, Calendar } from 'lucide-react';
import Image from 'next/image';
import { XIcon } from "./icons/x";
import { TelegramIcon } from "./icons/telegram";
import { DiscordIcon } from "./icons/discord";
import { Globe } from "lucide-react";

interface ProjectCardProps {
    project: IncubatorProject;
}

export const INCUBATOR_IMAGE_WIDTH = 120;  // px
export const INCUBATOR_IMAGE_HEIGHT = 120; // px

export function ProjectCard({ project }: ProjectCardProps) {
    const [copied, setCopied] = useState(false);

    const copyContractAddress = () => {
        if (project.social?.contractAddress) {
            navigator.clipboard.writeText(project.social.contractAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'live':
                return 'bg-green-500/50 text-green-900 border border-green-800';
            case 'upcoming':
                return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
            case 'presale':
                return 'bg-yellow-500/50 text-yellow-900 border border-yellow-800';
            default:
                return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 mb-4">
            <div className="relative aspect-square">
                <Image
                    src={project.logo}
                    alt={`${project.title} logo`}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover rounded-t-lg"
                    priority={false}
                />
                <span
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                        project.status
                    )}`}
                >
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
            </div>

            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{project.description}</p>

                <div className="mt-1 flex space-x-2">
                    {project.social?.website && (
                        <a
                            href={project.social.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-green-400 transition-colors"
                        >
                            <Globe className="h-4 w-4" />
                        </a>
                    )}
                    {project.social?.twitter && (
                        <a
                            href={project.social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-blue-400 transition-colors"
                        >
                            <XIcon className="w-[0.85rem] h-4" />
                        </a>
                    )}
                    {project.social?.telegram && (
                        <a
                            href={project.social.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-blue-400 transition-colors"
                        >
                            <TelegramIcon className="h-4 w-4" />
                        </a>
                    )}
                    {project.social?.discord && (
                        <a
                            href={project.social.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-indigo-400 transition-colors"
                        >
                            <DiscordIcon className="h-4 w-4" />
                        </a>
                    )}
                </div>

                {project.social?.contractAddress && (
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Contract:</span>
                            <code className="text-sm font-mono text-blue-600 dark:text-blue-400 flex-1 truncate">
                                {project.social.contractAddress.slice(0, 6)}...{project.social.contractAddress.slice(-4)}
                            </code>
                            <button
                                onClick={copyContractAddress}
                                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
                            >
                                <ClipboardCopy size={16} />
                                {copied && <span className="ml-2 text-sm text-green-600">Copied!</span>}
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {project.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    {project.launchDate && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar size={16} />
                            <span className="text-sm">
                                {new Date(project.launchDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

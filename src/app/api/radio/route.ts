import { NextResponse } from "next/server";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export interface RadioEpisode {
  id: number;
  title: string;
  episode: string;
  date: string;
  audioUrl: string;
  hosts: Array<{
    name: string;
    image: string;
  }>;
  guests?: Array<{
    name: string;
    image: string;
  }>;
  status: "available" | "coming-soon";
  twitterUrl?: string;
  spaceUrl?: string;
}

const radioEpisodes: RadioEpisode[] = [
  {
    id: 1,
    title: "Avalore Show",
    episode: "Episode 1",
    date: "October 2025",
    audioUrl: "/radio/episode-1.mp3",
    hosts: [
      {
        name: "Smitty",
        image: "/images/radio/smitty.jpg"
      },
      {
        name: "Kieks",
        image: "/images/radio/kieks.jpg"
      },
      {
        name: "Smudge",
        image: "/images/radio/smudge.jpg"
      }
    ],
    status: "available",
    spaceUrl: "https://x.com/i/spaces/1zqJVdVBmDmKB"
  }
];

export async function GET() {
  return NextResponse.json(radioEpisodes);
}

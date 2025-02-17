import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Handles GET requests to fetch incubator projects based on optional tag filtering.
 *
 * @param {Request} request - The incoming request object.
 * @returns {Promise<NextResponse>} - A JSON response containing the list of incubator projects.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    const projects = await prisma.incubatorProject.findMany({
      where: tag ? { tags: { has: tag } } : undefined,
      orderBy: {
        launchDate: 'asc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch incubator projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incubator projects' },
      { status: 500 }
    );
  }
}

/**
 * Handles POST requests to create a new incubator project.
 *
 * @param {Request} req - The incoming request object containing project data.
 * @returns {Promise<NextResponse>} - A JSON response containing the created incubator project.
 */
// export async function POST(req: Request) {
//   try {
//     const data = await req.json();

//     const projectData = {
//       title: data.title,
//       description: data.description,
//       logo: data.logo,
//       tags: data.tags,
//       status: data.status,
//       launchDate: new Date(data.launchDate),
//       social: data.social,
//     } satisfies Prisma.IncubatorProjectCreateInput;

//     const project = await prisma.incubatorProject.create({
//       data: projectData,
//     });

//     return NextResponse.json(project);
//   } catch (error) {
//     console.error('Failed to create incubator project:', error);
//     return NextResponse.json(
//       { error: 'Failed to create incubator project' },
//       { status: 500 }
//     );
//   }
// }

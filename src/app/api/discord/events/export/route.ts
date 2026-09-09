import { NextRequest, NextResponse } from "next/server";

// Never executed at build time: this route touches the database.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const eventId = searchParams.get("eventId");
  const name = searchParams.get("name") || "Discord Event";
  const description = searchParams.get("description") || "";
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const location = searchParams.get("location") || "Discord";

  if (!startTime) {
    return NextResponse.json(
      { error: "Missing start time" },
      { status: 400 }
    );
  }

  // Convert to ICS format date (YYYYMMDDTHHMMSSZ)
  const formatDateForICS = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const startDate = formatDateForICS(startTime);
  const endDate = endTime
    ? formatDateForICS(endTime)
    : formatDateForICS(new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString()); // Default 1 hour

  // Generate ICS file content
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Telescope//Discord Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${eventId}@telescope.discord.events
DTSTAMP:${formatDateForICS(new Date().toISOString())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${name}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

  // Return as downloadable .ics file
  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="discord-event-${eventId}.ics"`,
    },
  });
}

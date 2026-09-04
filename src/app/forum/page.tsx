import { redirect } from "next/navigation";

/** The forum moved to the root; keep older links and bookmarks working. */
export default function ForumIndexRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  redirect(query ? `/?${query}` : "/");
}

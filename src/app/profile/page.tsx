import { redirect } from "next/navigation";

import { currentUser } from "@/lib/session";

/** Profiles live at /u/[handle]; this just points you at your own. */
export default async function ProfileRedirect() {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/profile");
  redirect(user.handle ? `/u/${user.handle}` : "/forum");
}

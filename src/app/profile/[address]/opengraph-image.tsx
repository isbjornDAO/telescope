import { siteConfig } from "@/lib/site";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;

  if (!address) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to right bottom, rgb(75, 85, 99), rgb(17, 24, 39))",
          }}
        >
          <h1 style={{ fontSize: "5rem", color: "white" }}>
            No Address Provided
          </h1>
        </div>
      ),
      { width: size.width, height: size.height }
    );
  }

  // Fetch user stats
  const statsResponse = await fetch(
    `/api/users/${address}/stats`
  );
  const voteResponse = await fetch(
    `/api/users/${address}/votes`
  );

  if (!statsResponse.ok || !voteResponse.ok) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to right bottom, rgb(75, 85, 99), rgb(17, 24, 39))",
          }}
        >
          <h1 style={{ fontSize: "5rem", color: "white" }}>
            Error Fetching Data
          </h1>
        </div>
      ),
      { width: size.width, height: size.height }
    );
  }

  const userStats = await statsResponse.json();
  const { votes } = await voteResponse.json();

  // Fetch Discord user data if Discord ID is available
  let discordUser = null;
  if (userStats.discordId) {
    const discordResponse = await fetch(
      `/api/discord/user/${userStats.discordId}`
    );
    if (discordResponse.ok) {
      discordUser = await discordResponse.json();
    }
  }

  // Format address for display
  const displayAddress = `${address.substring(0, 6)}...${address.substring(
    38
  )}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "40px",
          background:
            "linear-gradient(to right bottom, rgb(17, 24, 39), rgb(75, 85, 99))",
          color: "white",
        }}
      >
        {/* Avatar */}
        {discordUser?.avatar_url ? (
          <img
            src={discordUser.avatar_url}
            alt={discordUser.username}
            style={{
              width: "128px",
              height: "128px",
              borderRadius: "9999px",
              marginBottom: "16px",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "128px",
              height: "128px",
              borderRadius: "9999px",
              marginBottom: "16px",
              background: "rgb(39, 39, 42)",
              fontSize: "2.25rem",
              fontWeight: "bold",
            }}
          >
            {address.substring(2, 4).toUpperCase()}
          </div>
        )}

        {/* Name */}
        <h1
          style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "8px" }}
        >
          {discordUser?.global_name || displayAddress}
        </h1>

        {/* Discord Username or Wallet Address */}
        <p
          style={{
            fontSize: "1.25rem",
            color: "rgb(209, 213, 219)",
            marginBottom: "24px",
          }}
        >
          {discordUser?.username &&
            `@${discordUser.username} • ${displayAddress}`}
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: "32px", marginTop: "24px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.875rem", fontWeight: "600" }}>
              {userStats.xp}
            </span>
            <span style={{ fontSize: "1.125rem", color: "rgb(209, 213, 219)" }}>
              XP
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.875rem", fontWeight: "600" }}>
              Level {userStats.level}
            </span>
            <span style={{ fontSize: "1.125rem", color: "rgb(209, 213, 219)" }}>
              Level
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.875rem", fontWeight: "600" }}>
              {votes.length}
            </span>
            <span style={{ fontSize: "1.125rem", color: "rgb(209, 213, 219)" }}>
              Votes
            </span>
          </div>
        </div>

        {/* XP Progress */}
        {/* <p style={{ color: "rgb(209, 213, 219)", marginTop: "16px" }}>
          {userStats.xpForNextLevel} XP until next level
        </p> */}
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      headers: { "Cache-Control": "public, max-age=3600, immutable" },
    }
  );
}

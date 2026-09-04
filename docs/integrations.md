# Partner integrations

Two integrations would materially improve Telescope, and both need something
small from a partner team. This is the ask for each, written so it can be
forwarded as-is.

---

## 1. Builders Hub — SSO (Ava Labs)

**What we want:** a "Continue with Builders Hub" button on Telescope, so a
builder reading docs on build.avax.network and asking a question here is one
account, with one profile.

**Current state:** Builders Hub signs users in with GitHub, Google and an email
code, but is an OAuth *consumer* — there is no authorization or token endpoint
another site can call. Telescope mirrors those same three providers and matches
accounts on verified email, which already gets the same person to the same
profile. SSO would make that explicit rather than incidental, and would carry
Hub profile data with it.

**What we need from you:** a standard OIDC authorization server at any origin
that serves `/.well-known/openid-configuration`, supporting:

| Item | Value |
| --- | --- |
| Flow | Authorization code + PKCE |
| Scopes | `openid email profile` |
| Claims | `sub`, `email`, `email_verified`, `name`, `picture`, and `preferred_username` if you have one |
| Redirect URI to register | `https://<telescope-host>/api/auth/callback/builders-hub` |
| Credentials | `client_id` and `client_secret` |

`preferred_username` is the only non-obvious one: we seed the Telescope handle
from it so handles line up across both sites.

**Effort estimate on your side:** you are already Next.js + NextAuth + Prisma.
Adding an issuer is roughly a day with [`oidc-provider`](https://github.com/panva/node-oidc-provider)
backed by your existing user table — no change to how your users sign in.

**Effort on ours:** zero. The provider is implemented and configures itself from
your discovery document. Send us the three values and we set environment
variables.

### A cheaper alternative, if an issuer is too much

A read-only profile endpoint would deliver most of the value without an auth
flow: given a verified email we already hold, return the builder's Hub handle,
avatar, and any completed courses or badges. We would show that on Telescope
profiles — "completed the Avalanche L1 course" next to someone's answer is
strong signal about whether to trust it, and it drives traffic back to your
courses. A bearer-token endpoint returning JSON is enough.

---

## 2. Cascade — ecosystem data (Team1)

**What we want:** `/discover` to render the ecosystem natively — searchable,
filterable, linked to Telescope discussion — rather than being a link out.

**Current state:** Cascade holds 500+ projects and exposes no API we could find,
so Telescope links to cascade.team1.network and stops there. We are deliberately
not rebuilding the directory or scraping it; it should stay canonical in Cascade.

**What we need from you:** any read-only JSON feed. A static file regenerated on
publish is completely fine — this does not need to be a real API.

```jsonc
// GET /api/projects.json
[
  {
    "id": "stable-slug",              // stable across regenerations
    "name": "Project Name",
    "description": "One line.",
    "url": "https://cascade.team1.network/p/stable-slug",
    "website": "https://project.xyz",
    "logo": "https://.../logo.png",
    "categories": ["defi", "infra"],
    "updatedAt": "2026-09-01T00:00:00Z"
  }
]
```

**What it unlocks:**

- A real Discover page: search and filter 500+ projects without leaving Telescope.
- Showcase posts that attach to a canonical project record, so a project's
  questions, answers and discussion collect in one place.
- Hackathon submissions that reference a real project rather than a free-text
  name — which matters once judging starts.

Every project card links back to its Cascade page. Cascade stays the source of
truth; Telescope becomes the place people talk about what is in it.

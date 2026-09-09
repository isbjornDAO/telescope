# Who can read what

The forum follows Pötzsch & Borcea-Pfitzmann, *Privacy-Respecting Access
Control in Collaborative Workspaces* (IFIP AICT 320, 2010). Four rules from
that paper, and what each one means here.

**The author decides, not an admin.** A policy is set by whoever wrote the
thing. There is no administrator bypass anywhere in `evaluate` — an admin
who wants to read a withheld post has to hold the attribute like everyone
else. Admins keep the platform running; that is a different job from
reading it.

**Policies name attributes, never people.** You cannot pick a reader. The
`Requirement` type has four shapes — node type, faction, region, crew — and
none of them can carry an address or a handle. That is deliberate: the
author of a post is usually looking for readers they have never met, so
they could not list them even if we let them, and readers have their own
privacy to keep.

**Every level has a policy, and they AND downward.** Board, then thread,
then post. A child can narrow what its parent allows and can never widen
it. This is the paper's Table 1 walked from the top.

**Refusal says what to prove.** Not who is inside, not how many. A withheld
post shows one line — "Open to Anchors and above." — and nothing else.

## The exception the paper asks for

The paper says plainly that it would be inappropriate to use this on every
contribution, because it costs the user effort. Telescope's own rule is
stronger: nothing stands between arriving and talking. So the default is
open, the control is a single line that already reads "Anyone can read
this", and posting without touching it is the same one tap it always was.

## Where it lives

- `src/lib/world/audience.ts` — policy types and evaluation. Pure, tested.
- `src/lib/world/forum-access.ts` — applying it to rows. Pure, tested.
- `src/lib/world/viewer.ts` — what a reader can prove, read from the session.
- `src/app/api/forum/**` — the only place anything is actually withheld.

A thread you may not read is dropped from listings rather than shown
locked; a post you may not read inside a thread you can is kept as a
marker. Listings are discovery surfaces and "eleven threads you cannot
read" is metadata about private conversations; a gap mid-thread is already
visible, so there the honest thing is to label it.

## Two things this fixed on the way

`anonymous` was enforced in the browser. The API sent every wallet address,
every Discord id, username and avatar, and the client chose not to draw
them. It is enforced server-side now.

The thread page counted distinct posters by de-duplicating the wallet
addresses it had been sent. It gets a count instead.

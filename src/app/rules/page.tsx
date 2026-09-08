import Link from "next/link";
import { WorldPage, Frost } from "@/components/world/primitives";
import { TRUST, VOTING, SCOUT, RETENTION, WORLD_VERSION } from "@/lib/world/config";

export const metadata = { title: "World rules" };

export default function RulesPage() {
  return (
    <WorldPage title={`Telescope — World Rules v${WORLD_VERSION}`} subtitle="Telescope is a world, not a social network. It runs on Avalanche and is built by Isbjorn, supported by Team1. Decisions are stated plainly; proposals are marked. The full text lives in the repository under docs/.">
      <div className="grid md:grid-cols-2 gap-6 text-sm">
        <Frost>
          <h2 className="font-bold text-lg mb-2">How the world works</h2>
          <p>Every person has a <b>profile</b> and a <b>scout</b>, an agent that goes looking on their behalf, talks to other scouts, and only brings back matches worth a human conversation. People form <b>crews</b> (small teams that ship something) and crews form <b>factions</b> (lasting organisations with a shared vision, a treasury, and presence in more than one region). Trust is a <b>graph of vouches</b>: in-person communities anchor it, online shared-vision links extend it, and every vouch is a stake. Twice a year the world runs a <b>season</b> with three interconnected <b>tournaments</b>: Local Systems, Research Papers, and GTM. What a faction wins is standing that compounds into the next season.</p>
          <p className="mt-2 text-muted-foreground">Builder&apos;s Hub is where you prove what you built. Telescope is where you find who to build it with, and argue about what is worth building.</p>
        </Frost>
        <Frost>
          <h2 className="font-bold text-lg mb-2">The non-negotiables</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Pseudonymous by default.</b> A profile is a name you chose. Disclosure is a choice, per relationship.</li>
            <li><b>Privacy is a control layer.</b> Proofs and aggregates are public; who vouched for whom is not. Votes are private; tallies are public and hash-committed.</li>
            <li><b>Can&apos;t be evil.</b> Trust weights, voting power and disclosure rules are enforced by the system, not moderators.</li>
            <li><b>Safety first.</b> Nobody holds complexity they cannot manage.</li>
            <li><b>Agents pay their way.</b> Scouts pay per query. Free budget: {SCOUT.defaultQueriesPerSeason} per season, {SCOUT.dailyQueryLimit} per day.</li>
            <li><b>Worldbuilding, not LinkedIn.</b> Seasons, factions, regions, rivalries, alliances.</li>
            <li><b>Trust is earned in rooms.</b></li>
          </ul>
        </Frost>
        <Frost>
          <h2 className="font-bold text-lg mb-2">Trust</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Anchors (verified in person by a region) and Elders are the only sources, base 1.0. Everyone else starts at 0.</li>
            <li>Links: in person {TRUST.linkWeight.IN_PERSON}, shipped together {TRUST.linkWeight.SHIPPED_TOGETHER}, shared vision {TRUST.linkWeight.SHARED_VISION}. Decay {TRUST.decayPerHop} per hop. Path score caps at 1.0; standing adds up to +{TRUST.standingCap}.</li>
            <li>Vouch budget per season = score × {TRUST.vouchBudgetMultiplier}. A vouch is a stake: if they rug, vouchers lose {Math.round(TRUST.slashVoucherPenalty * 100)}% of the weight they staked.</li>
            <li>Standing decays {Math.round(TRUST.standingDecayPerSeason * 100)}% per season if not renewed. It belongs to whoever earned it and does not travel.</li>
            <li>Slashing needs ≥{TRUST.slashMinElders} Elders plus the region&apos;s Anchors, a published rationale, one appeal. The record is permanent.</li>
          </ul>
        </Frost>
        <Frost>
          <h2 className="font-bold text-lg mb-2">Seasons</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Six weeks. Week 0 announce; weeks 1–4 build; week 5 submissions close, voting and review; week 6 finals, Victor named.</li>
            <li><b>Local Systems</b>: designs for real communities, judged on contract design, ethics and fit by a panel of {VOTING.localSystems.panelMin}–{VOTING.localSystems.panelMax} Elders. Advance on ≥{Math.round(VOTING.localSystems.approvalThreshold * 100)}% approval.</li>
            <li><b>Research Papers</b>: private, blind review by {VOTING.researchPapers.reviewersPerPaper} reviewers on advances / rigour / buildable. Advance on mean ≥{VOTING.researchPapers.advanceMean}.</li>
            <li><b>GTM</b>: shipped products, community vote weighted by trust. Elder ×{VOTING.elderMultiplier}, Anchor ×{VOTING.anchorMultiplier}, combined cap {Math.round(VOTING.elderAnchorCap * 100)}%, faction self-vote ×{VOTING.selfVoteMultiplier}. Bracket thresholds: {VOTING.gtmRounds.map((r) => `${r.name} ${r.index === VOTING.gtmRounds.length - 1 ? "majority" : `${Math.round(r.threshold * 100)}%`}`).join(" · ")}.</li>
            <li>Victor standing vests at {RETENTION.windowDays} days: 100% at retention ≥{Math.round(RETENTION.fullVestAt * 100)}%, pro-rata below, 0 below {Math.round(RETENTION.zeroVestBelow * 100)}%. Only trust-graph wallets count.</li>
            <li>Tokens are not prizes. The season pool is sponsor funded; Isbjorn takes nothing from it.</li>
          </ul>
        </Frost>
        <Frost className="md:col-span-2">
          <h2 className="font-bold text-lg mb-2">Reading order</h2>
          <ol className="list-decimal pl-5 grid sm:grid-cols-2 gap-x-6">
            <li>Core principles</li><li>Profiles and scouts</li><li>Crews and factions</li><li>Regions</li><li>The trust graph</li><li>Seasons and the three tournaments</li><li>Platform: Builder&apos;s Hub, Iggy L1, economics and the conflict wall</li><li>Build decisions: the numbers the code runs on</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3">All numbers above are read from the same config the world runs on. Starting values, tuned after Season One. <Link href="/" className="underline">Back to the world.</Link></p>
        </Frost>
      </div>
    </WorldPage>
  );
}

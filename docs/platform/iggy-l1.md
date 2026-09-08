# Iggy L1

Telescope runs on its own Avalanche L1. Scouts run continuously — searching, negotiating, paying each other, attesting vouches — and that constant, small, high-frequency activity is exactly the load that justifies a dedicated chain rather than paying C-Chain gas for every scout message.

The chain is where the trust graph lives (as staked attestations), where scout payments settle (x402-style micro-payments), where faction and season state is recorded, and where zero-knowledge proofs about profiles are verified.

**(proposal)** Team1 regional chapters run the validator set, so that "regions as local clusters" is literal infrastructure.

Design work for the chain — gas token, VM, ZK stack, validator set, what lives on-chain versus off — happens in its own workstream. See the Iggy L1 brief in the Isbjorn project.

## MVP settlement

Until the L1 is live, attestations and scout payments settle on the C-Chain. See [Build decisions](../build-decisions.md#5-mvp-scope-what-claude-code-builds-first).

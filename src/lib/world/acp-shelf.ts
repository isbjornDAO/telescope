/**
 * Curated Avalanche Community Proposal (ACP) links for the Research shelf.
 * Manual list — no scrape of the ACP repo in v1.
 */
export const ACP_SHELF = [
  {
    id: "ACP-23",
    title: "P-Chain Native Transfers on C-Chain",
    url: "https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/23-p-chain-native-transfers",
    summary: "Enable native AVAX transfers between P-Chain and C-Chain.",
  },
  {
    id: "ACP-77",
    title: "Validator Manager",
    url: "https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/77-validating-with-sovereignty",
    summary: "Sovereign L1 validator set management without P-Chain stake.",
  },
  {
    id: "ACP-99",
    title: "ACP Editor Role",
    url: "https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/99-acp-editor",
    summary: "Formalise the ACP editor process for community proposals.",
  },
  {
    id: "ACP-108",
    title: "EVM Event Exports",
    url: "https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/108-evm-event-exports",
    summary: "Export EVM logs as ICM messages for cross-chain reactivity.",
  },
] as const;

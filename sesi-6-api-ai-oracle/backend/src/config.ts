export const RPC_URLS = [
  process.env.RPC_URL,
  "https://bsc-testnet-rpc.publicnode.com",
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  "https://bnb-testnet.api.onfinality.io/public",
].filter(Boolean) as string[];

export const CONTRACTS = {
  rewardToken: "0x17a9f5ba4B6E0c7307a55DC796151055cB0e25Be",
  bountyFactory: "0xEEead8E6F44eBEDa98F8e90413b2031A88089006",
} as const;

export const DEPLOY_BLOCK = 124211385n;
export const CHUNK = 9000n;
export const PORT = Number(process.env.PORT ?? 3000);

// dua wallet, dua peran
export const RELAYER_PK = process.env.RELAYER_PK as `0x${string}` | undefined; // panitia
export const ORACLE_PK = process.env.ORACLE_PK as `0x${string}` | undefined;   // juri

export const LLM = {
  baseUrl: (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
  apiKey: process.env.LLM_API_KEY,
  model: process.env.LLM_MODEL ?? "gpt-4o-mini",
} as const;

export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_SECONDS ?? 15) * 1000;
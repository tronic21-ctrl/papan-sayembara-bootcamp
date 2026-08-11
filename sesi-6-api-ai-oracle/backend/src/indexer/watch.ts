// indexer/watch.ts = pantau event baru real-time, polling getLogs manual
// (RPC publik load-balanced → eth_newFilter/getFilterChanges gak reliable, jadi dihindari total)

import type { Address, Log } from "viem";
import { CONTRACTS } from "../config";
import { bountyCreatedEvent, escrowEvents } from "../contracts";
import { client } from "../lib/chain";
import { knownEscrows } from "../lib/db";
import { handleBountyCreated, handleEscrowLog } from "./handlers";

const POLL_MS = 5_000;

const pollLogs = async (
  address: Address,
  events: any,
  lastBlock: { value: bigint },
  onLogs: (logs: Log[]) => void,
) => {
  try {
    const latest = await client.getBlockNumber();
    if (latest <= lastBlock.value) return;
    const eventList = Array.isArray(events) ? events : [events];
    const logs = await client.getLogs({ address, events: eventList, fromBlock: lastBlock.value + 1n, toBlock: latest });
    lastBlock.value = latest;
    if (logs.length) onLogs(logs);
  } catch (err) {
    console.error("⚠️ watch error:", (err as Error).message);
  }
};

export const watch = async () => {
  const startBlock = await client.getBlockNumber();

  const watchEscrow = (address: Address, delayMs = 0) => {
    const last = { value: startBlock };
    setTimeout(() => {
      setInterval(() => pollLogs(address, escrowEvents, last, (logs) => logs.forEach(handleEscrowLog)), POLL_MS);
    }, delayMs);
  };

  knownEscrows().forEach((address, i) => watchEscrow(address, i * 200));

  const factoryLast = { value: startBlock };
  setInterval(
    () =>
      pollLogs(CONTRACTS.bountyFactory, bountyCreatedEvent, factoryLast, (logs) =>
        logs.forEach((log: any) => {
          handleBountyCreated(log);
          watchEscrow(log.args.escrow);
        }),
      ),
    POLL_MS,
  );

  console.log("👀 watchEvent jalan (polling manual): factory + %d escrow", knownEscrows().length);
};

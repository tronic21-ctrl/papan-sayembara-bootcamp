import { maxUint256, parseEther, parseEventLogs, type Address } from "viem";
import { CONTRACTS } from "../config";
import { bountyCreatedEvent, bountyEscrowAbi, bountyFactoryAbi, rewardTokenAbi } from "../contracts";
import { client } from "../lib/chain";
import { relayerWallet } from "../lib/wallet";

const wallet = () => {
  if (!relayerWallet) throw new Error("RELAYER_PK belum diisi");
  return relayerWallet;
};

// gasPrice eksplisit = tx legacy (BSC testnet nolak EIP-1559)
const gasPrice = () => client.getGasPrice();

export const relayerAddress = () => relayerWallet?.account.address;

// factory narik RWD lewat transferFrom → butuh approve dulu (sekali seumur wallet)
const ensureApproval = async (amount: bigint) => {
  const allowance = await client.readContract({
    address: CONTRACTS.rewardToken, abi: rewardTokenAbi, functionName: "allowance",
    args: [wallet().account.address, CONTRACTS.bountyFactory],
  });
  if (allowance >= amount) return;
  const hash = await wallet().writeContract({
    address: CONTRACTS.rewardToken, abi: rewardTokenAbi, functionName: "approve",
    args: [CONTRACTS.bountyFactory, maxUint256], gasPrice: await gasPrice(),
  });
  await client.waitForTransactionReceipt({ hash });
};

export const createBounty = async (reward: string, rulesURI: string, deadlineJam: number) => {
  const amount = parseEther(reward);
  await ensureApproval(amount);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineJam * 3600);
  const hash = await wallet().writeContract({
    address: CONTRACTS.bountyFactory, abi: bountyFactoryAbi, functionName: "createBounty",
    args: [amount, rulesURI, deadline], gasPrice: await gasPrice(),
  });
  const receipt = await client.waitForTransactionReceipt({ hash });

  // escrow lahir di dalam tx → alamatnya cuma ada di event
  const [log] = parseEventLogs({ abi: [bountyCreatedEvent], logs: receipt.logs });
  return { hash, escrow: log?.args.escrow, bountyId: Number(log?.args.bountyId ?? -1) };
};

export const submitWork = async (escrow: Address, proofURI: string) => {
  const hash = await wallet().writeContract({
    address: escrow, abi: bountyEscrowAbi, functionName: "submitWork",
    args: [proofURI], gasPrice: await gasPrice(),
  });
  const receipt = await client.waitForTransactionReceipt({ hash });
  return { hash, sukses: receipt.status === "success" };
};
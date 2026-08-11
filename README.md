# Papan Sayembara — DevWeb3 Jogja Bootcamp

Progression dari **DevWeb3 Jogja Bootcamp** (Sesi 2–6): membangun sistem *on-chain bounty board* dari nol — mulai dari dasar Solidity, ERC-20 token, escrow pattern, factory pattern, custom indexer, sampai backend API dengan **AI Oracle** yang otomatis memverifikasi bukti kerja dan mencairkan reward secara on-chain.

Repo ini disusun per-sesi biar progression-nya kebaca jelas: tiap folder adalah checkpoint yang membangun di atas folder sebelumnya.

## Tech Stack

- **Smart Contract:** Solidity, Foundry (forge/cast/anvil), OpenZeppelin
- **Chain:** BSC Testnet (chainId 97)
- **Backend:** Bun, Hono, viem, SQLite
- **Indexing:** Custom indexer (manual polling) + Ponder
- **AI Oracle:** LLM (OpenAI-compatible endpoint) sebagai juri otomatis verifikasi bukti kerja

## Struktur Repo

| Folder | Sesi | Isi |
|---|---|---|
| [`sesi-2-3-bounty-escrow/`](./sesi-2-3-bounty-escrow) | 2–3 | Setup Foundry + OpenZeppelin, dasar Solidity, `RewardToken.sol` (ERC-20 dengan minter role & max supply), `BountyEscrow.sol` (escrow pattern per-bounty) |
| [`sesi-4-factory-oracle/`](./sesi-4-factory-oracle) | 4 | `BountyFactory.sol` — factory pattern buat deploy banyak escrow, oracle awal (wallet manual) |
| [`sesi-5-indexing/`](./sesi-5-indexing) | 5 | Backend custom baca event on-chain (viem + SQLite), plus eksperimen indexer Ponder |
| [`sesi-6-api-ai-oracle/`](./sesi-6-api-ai-oracle) | 6 | REST API (Hono), endpoint relayer, **AI Oracle** yang baca bukti kerja, bandingkan ke aturan bounty, kirim verdict on-chain, dan auto-release reward |

## Alur Sistem (Sesi 6, versi lengkap)

```
User submit bukti kerja (proof_uri)
        ↓
Backend API (relay endpoint) → simpan submission
        ↓
AI Oracle (bun oracle, polling tiap N detik)
        ↓
LLM baca proof_uri vs rules_uri bounty → verdict ELIGIBLE / NOT ELIGIBLE
        ↓
Oracle kirim verdict on-chain (fulfillVerification)
        ↓
Kalau ELIGIBLE → smart contract auto-release reward token ke worker
        ↓
Leaderboard & verdict history ke-update otomatis
```

## Konsep Solidity yang Dipakai

Dari Sesi 2 (dasar) sampai Sesi 4 (factory pattern):

- Inheritance & import OpenZeppelin (`ERC20`, `Ownable`)
- Custom error (`revert CustomError()`) — lebih hemat gas dibanding `require(string)`
- Modifier untuk access control (`onlyOwner`, `hanyaMinter`, `onlyOracle`)
- Events + indexed params buat kebutuhan indexing
- Checks-Effects-Interactions pattern (mencegah reentrancy)
- Factory pattern — 1 kontrak men-deploy banyak instance kontrak lain

## Bug & Pembelajaran Teknis

Beberapa masalah nyata yang ditemukan dan cara mengatasinya selama proses ini:

- **`watchEvent` (filter-based) gagal di RPC publik load-balanced** — `eth_newFilter`/`eth_getFilterChanges` sering timeout atau "filter not found" di RPC gratisan. Fix: ganti total ke polling manual pakai `getLogs()` + `setInterval`, hindari state berbasis filter di server.
- **RPC pruned vs archive node** — RPC publik gratis kebanyakan cuma nyimpen histori block terbaru (pruned), bukan full archive. Query `eth_getLogs` ke block lama (>2 minggu) bisa gagal dengan error `History has been pruned`. Solusi praktis: pastikan `DEPLOY_BLOCK` di config nunjuk ke block yang masih dalam retensi RPC yang dipakai.
- **EIP-55 checksum validation** — library seperti `viem` strict soal kapitalisasi address (checksum). Salah 1 huruf kapital = "invalid address" walau hex-nya benar. Selalu copy address langsung dari sumber (block explorer/API response), jangan retype manual.
- **Backfill checkpoint bisa nyangkut ke config lama** — kalau ganti kontrak target tapi database lokal belum di-reset, checkpoint block lama bisa bikin backfill "lompat" ngelewatin data baru.

## Menjalankan Ulang (Sesi 6)

```bash
cd sesi-6-api-ai-oracle/backend
cp .env.example .env   # isi RPC_URL, RELAYER_PK, ORACLE_PK, LLM_*
bun install
bun dev                # jalankan API + indexer
bun oracle              # jalankan AI Oracle (terminal terpisah)
```

Detail lengkap per-langkah ada di README masing-masing subfolder sesi.

## Catatan

Ini repo dokumentasi proses belajar dari bootcamp DevWeb3 Jogja, bukan produk final/audited. Semua kontrak dan wallet yang dipakai berjalan di **BSC Testnet**, tidak ada dana/aset asli yang terlibat.

---

**Author:** Riko Tronic ([@tronic21-ctrl](https://github.com/tronic21-ctrl))

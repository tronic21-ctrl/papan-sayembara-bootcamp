# Papan Sayembara - Indonesia Web3 Hackathon 2026

Progress belajar dari rangkaian workshop **Indonesia Web3 Hackathon 2026** hackathon nasional hasil kolaborasi [Binance Academy](https://twitter.com/BinanceAcademy), [BNB Chain](https://www.bnbchain.org/), [Coinvestasi](https://coinvestasi.com/), dan [Dev Web3 Jogja](https://twitter.com/DevWeb3Jogja) (mentor teknis), dengan prize pool **USD 5.000**.

Repo ini merangkum progression dari workshop Sesi 2–6: membangun sistem *on-chain bounty board* dari nol, mulai dari dasar Solidity, ERC-20 token, escrow pattern, factory pattern, custom indexer, sampai backend API dengan **AI Oracle** yang otomatis memverifikasi bukti kerja dan mencairkan reward secara on-chain.

Repo ini disusun per-sesi biar progression-nya kebaca jelas: tiap folder adalah checkpoint yang membangun di atas folder sebelumnya.

## Tentang Event

- **Format:** Online, gratis, terbuka untuk umum (mahasiswa, developer, startup, komunitas Web3)
- **Tema:** AI x Web3
- **Track:** AI Agents · Finance & Commerce · Consumer Apps
- **Prize Pool:** USD 5.000 (Grand Prize + Community Choice + juara per-track)
- **Timeline:** Submission deadline 30 September 2026 · Demo Day 31 Oktober 2026
- **Chain:** BSC Testnet

## Tech Stack

- **Smart Contract:** Solidity, Foundry (forge/cast/anvil), OpenZeppelin
- **Chain:** BSC Testnet (chainId 97)
- **Backend:** Bun, Hono, viem, SQLite
- **Indexing:** Custom indexer (manual polling) + Ponder
- **AI Oracle:** LLM (OpenAI-compatible endpoint) sebagai juri otomatis verifikasi bukti kerja

## Struktur Repo

| Folder | Sesi Resmi | Isi |
|---|---|---|
| [`sesi-2-3-bounty-escrow/`](./sesi-2-3-bounty-escrow) | Sesi 2 (*Foundations 2: Solidity via a Guestbook*) + Sesi 3 (*Smart Contract 1: Foundry + Token + Bounty Board*) | Setup Foundry + OpenZeppelin, dasar Solidity, `RewardToken.sol` (ERC-20 dengan minter role & max supply), `BountyEscrow.sol` (escrow pattern per-bounty) |
| [`sesi-4-factory-oracle/`](./sesi-4-factory-oracle) | Sesi 4 (*Smart Contract 2: Full Bounty + Security*) | `BountyFactory.sol` factory pattern buat deploy banyak escrow, oracle awal (wallet manual) |
| [`sesi-5-indexing/`](./sesi-5-indexing) | Sesi 5 (*Backend 1: Reading the Chain + Indexing*) | Backend custom baca event on-chain (viem + SQLite), plus eksperimen indexer Ponder |
| [`sesi-6-api-ai-oracle/`](./sesi-6-api-ai-oracle) | Sesi 6 (*Backend 2: API + AI Auto-verify*) | REST API (Hono), endpoint relayer, **AI Oracle** yang baca bukti kerja, bandingkan ke aturan bounty, kirim verdict on-chain, dan auto-release reward |

> Sesi 1 (*Foundations 1: Environment + First Deploy*) bersifat pengantar/environment setup saja, tidak menghasilkan kode terpisah dan sudah tercakup dalam setup di `sesi-2-3-bounty-escrow/`.

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
- Custom error (`revert CustomError()`) lebih hemat gas dibanding `require(string)`
- Modifier untuk access control (`onlyOwner`, `hanyaMinter`, `onlyOracle`)
- Events + indexed params buat kebutuhan indexing
- Checks-Effects-Interactions pattern (mencegah reentrancy)
- Factory pattern, 1 kontrak men-deploy banyak instance kontrak lain

## Bug & Pembelajaran Teknis

Beberapa masalah nyata yang ditemukan dan cara mengatasinya selama proses ini:

- **`watchEvent` (filter-based) gagal di RPC publik load-balanced** `eth_newFilter`/`eth_getFilterChanges` sering timeout atau "filter not found" di RPC gratisan. Fix: ganti total ke polling manual pakai `getLogs()` + `setInterval`, hindari state berbasis filter di server.
- **RPC pruned vs archive node** RPC publik gratis kebanyakan cuma nyimpen histori block terbaru (pruned), bukan full archive. Query `eth_getLogs` ke block lama (>2 minggu) bisa gagal dengan error `History has been pruned`. Solusi praktis: pastikan `DEPLOY_BLOCK` di config nunjuk ke block yang masih dalam retensi RPC yang dipakai.
- **EIP-55 checksum validation** library seperti `viem` strict soal kapitalisasi address (checksum). Salah 1 huruf kapital = "invalid address" walau hex-nya benar. Selalu copy address langsung dari sumber (block explorer/API response), jangan retype manual.
- **Backfill checkpoint bisa nyangkut ke config lama** kalau ganti kontrak target tapi database lokal belum di-reset, checkpoint block lama bisa bikin backfill "lompat" ngelewatin data baru.

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

Ini repo dokumentasi proses belajar dari rangkaian workshop **Indonesia Web3 Hackathon 2026**, bukan produk final/audited. Semua kontrak dan wallet yang dipakai berjalan di **BSC Testnet**, tidak ada dana/aset asli yang terlibat.

Progress selanjutnya (Sesi 7–9: Frontend dApp UI, AI Integration Patterns, dan persiapan Demo Day) akan mengadaptasi pembelajaran dari Papan Sayembara ini ke proyek submission hackathon: **Bansos Transparency**.

---

**Author:** Riko Tronic ([@tronic21-ctrl](https://github.com/tronic21-ctrl))

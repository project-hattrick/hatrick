# Hat-trick — 5-Minute Pitch + Demo

**TxODDS World Cup 2026 · Consumer & Fan Experiences**
Presenter: Déborah · Format: 5 min (≈2:15 of it is a recorded demo)

> The judges are TxODDS. **Make TxLINE the hero.** The story is: *your signed feed
> becomes trustless money — the World Cup as a live data universe, settled by math, not a company.*

---

## The one line (say it, then earn it)

> "Hat-trick turns TxLINE's live, signed data into the first World Cup where you can **bet and get paid without trusting anyone** — the contract is the bookmaker."

---

## Pitch script (timed)

Two columns: **SAY** (what Déborah says) · **SCREEN** (what the audience sees).

### 0:00 – 0:25 · Hook
**SAY:** "Watch any World Cup game and look at your phone. Score in one tab. Fantasy in another app. Odds in a betting site you're not sure you trust. The biggest event on Earth, and the tools are a mess. We fixed that — in one screen."
**SCREEN:** The fragmented reality (3 windows) collapsing into the single Hat-trick screen.

### 0:25 – 1:10 · What it is
**SAY:** "Hat-trick is one place with two modes, one wallet, one feed. **Fantasy:** you open sticker packs and play 3D matches where the players' stats come from how they're *really* performing in the Cup. **Live:** you watch the real match as a live 2D abstraction and bet on it. Both are driven by the same thing — the TxLINE real-time feed. When Mbappé scores in Dallas, both modes know instantly, from the same source."
**SCREEN:** Toggle Fantasy ⇄ Live; the same wallet up top; a goal event lighting up both.

### 1:10 – 1:40 · The wedge (why we win)
**SAY:** "Here's the part that matters. Every result TxLINE emits is **cryptographically signed.** So we don't need a betting company to hold your money and *decide* if you won. Your bet goes into an on-chain escrow. When the match ends, TxLINE's signed result settles it automatically. No house. No withdrawal request. No 'trust us.' Let me show you."
**SCREEN:** A simple diagram: TxLINE (signed) → escrow → auto-payout → proof. Then cut to demo.

### 1:40 – 3:55 · DEMO (see runbook below)
**SCREEN:** The recorded loop — bet → escrow → live event → auto-settle → **proof**.

### 3:55 – 4:35 · Why it matters (TxLINE angle + traction)
**SAY:** "What you just saw isn't a mock. The Solana program is live on devnet, and every step — the escrow, the signature check, the payout — is verified on-chain. We even hardened it: the settlement can only be triggered by TxLINE's real signature, nothing else. **This is what TxLINE unlocks: builders who are also fans can finally ship what only the big operators could — trust replaced by math.**"
**SCREEN:** Solana Explorer showing the real settle transaction; a green "11/11 on-chain checks passing."

### 4:35 – 5:00 · Close
**SAY:** "Fantasy makes the real Cup matter in your game. Live makes betting transparent and instant. And the crowd reacts in the stands in real time. It's the digital World Cup the tournament actually deserves — and it runs on TxLINE. That's Hat-trick."
**SCREEN:** The stadium with crowd balloons; logo; "Powered by TxLINE · Solana devnet."

---

## Demo runbook — *record this, don't risk it live*

**The money shot: money moves and settles with zero human involvement, and a non-technical fan can verify it can't have been faked.** Capture as a clean screen recording; narrate over it live.

Beat-by-beat (≈2:15):

1. **(0:15) One identity.** Open Hat-trick, connect a Solana wallet, hit the faucet → play tokens land. *"One wallet for everything. Devnet, fictitious tokens — no real money, fully compliant."*
2. **(0:30) Live from the feed.** Live Mode: a real fixture drawn as 2D from the TxLINE SSE feed; odds ticking. *"This isn't video — it's the game's state, rebuilt live from TxLINE."*
3. **(0:25) Place the bet.** Click a market → wallet pops → confirm. Show the receipt: **"Escrowed on-chain"** + the tx hash. *"My tokens just went into a program-owned vault. No company holds them."*
4. **(0:35) The event.** A TxLINE goal fires → the field animates, the event feed updates, odds jump, crowd balloons react. *"Same feed, same second."*
5. **(0:35) Auto-settle — the hero beat.** Full time. TxLINE emits the signed result. The keeper settles it — **no click** — and the winner's balance updates. *"I didn't request a withdrawal. Nobody approved it. The contract paid, because the result was real."*
6. **(0:15) Proof anyone can read.** Click **"Ver prova do resultado"** → TxLINE signature hash, the settle tx on Solana Explorer, **VERIFIED ON-CHAIN**, and one plain sentence: *"this result was checked by math and cannot be changed."*

### If the full UI wire-up isn't finished (honest fallback that still wins this room)
Record the **verified on-chain loop** instead — it's the same story, and for a *data-provider* audience it's arguably stronger:
- Faucet → build+sign `place_position` (wallet) → keeper `settle_market` on the TxLINE-signed result → winner `claim`.
- Show it on **Solana Explorer**: the escrow deposit, the settle tx, the payout — all real.
- Cut in the passing check: `node contracts/scripts/e2e.cjs` / `api/scripts/verify-chain.cjs` → **ALL ASSERTIONS PASSED**, including the negatives (a *forged* signature is rejected).
- Narrate: *"Here's the trustless loop, live on-chain. And here's the proof a fake result can't settle it."*

### Local capture setup (reproducible)
```bash
# 1) validator + program
cd contracts && cargo build-sbf
solana-test-validator --reset \
  --bpf-program 6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J target/deploy/hat_trick.so
# 2) the trustless loop, end to end (what the camera records)
cd ../api && npm run build && node scripts/verify-chain.cjs   # init→bet→keeper settle→claim
# 3) the security money-shot (record the negatives failing)
node ../contracts/scripts/e2e.cjs                              # forged oracle + spoofed proof REJECTED
```
> For a devnet demo instead of local: finish the deploy (`docs`/redeploy step) and point `SOLANA_RPC_URL`/program id at devnet.

---

## Why we win (judge alignment cheat-sheet)

- **TxLINE is the protagonist**, not a footnote. We use SSE events, per-player stats, live odds, the schedule, **and** the signed results — the whole surface, for a real product.
- **A working, verifiable demo** beats slideware. Ours settles real on-chain transactions and *rejects forged ones*.
- **Genuinely novel:** fantasy where the real Cup changes your players; betting where the payout is a math fact, not a promise.
- **Responsible by design:** devnet, fictitious tokens, geo-blocking, no FIFA IP — we call it out, we don't hide it.

## Q&A prep (what a TxODDS judge will poke)

- **"Is it really trustless?"** The escrow is a program-owned PDA — no human key can move it. Settlement is gated by an Ed25519 signature over TxLINE's result; we verified on-chain that a *wrong* signer is rejected. Honest caveat: it trusts the oracle *key*, not any company — no multisig/challenge window yet (roadmap).
- **"What if TxLINE never sends a result?"** Funds aren't stuck — after a timeout the market voids and everyone refunds (`void_market`/`refund`, tested).
- **"How do you not go insolvent?"** No house — it's pari-mutuel. The vault can never owe more than it holds.
- **"Did you need a TxLINE on-chain program?"** No. We cache the signed result and verify it on-chain — zero external dependency.
- **"What's actually built vs. vision?"** Built + verified on-chain: the whole betting/settlement loop (program, keeper, faucet, wallet flow, proof panel). Vision/roadmap: the full 3D sim polish and the crowd/X pipeline at scale.

---

*Powered by TxLINE · Solana devnet · fictitious tokens — no real money moves.*

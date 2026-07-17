# Hatrick — Roteiro do vídeo (≤ 5:00)

> Alinhado ao deck **`project/docs/deck.html`** (as telas de título/divisória são as cartelas de transição entre os trechos de screen-capture; o placeholder de vídeo de cada demo é substituído pela gravação real).
> **VO gravada em inglês** (jurados internacionais). Notas/checklists em PT.
> Alvo: **4:40–4:55**. Regra de ouro: **nunca descreva o que está na tela — diga o que aquilo significa** (cada fala carrega, discretamente, um critério de julgamento).

---

## 0. O que o desafio exige (e onde o vídeo entrega)

Track **Consumer & Fan Experiences** — TxODDS World Cup Hackathon 2026. Deadline **19/07 23:59 UTC**.

**Obrigatório (regras):**
- ✅ **TxLINE como input ao vivo** — mostrar o jogo se movendo sozinho (segmentos Live/Fantasy) e dizer que é o feed real.
- ✅ **Signup via Solana** — login por e-mail (Privy) cria wallet embarcada; aposta/duelo/pack on-chain em devnet.
- ✅ **Produto funcional (NÃO mockup)** — a prova mais forte = corte no **Solscan** (escrow/payout/mint reais).
- ✅ **Repo público + vídeo demo ≤5min** — o vídeo cobre **problema + walkthrough ao vivo + como o TxLINE alimenta o backend**.
- ✅ **Devnet, tokens fictícios** — nenhum dinheiro real. Sem marcas FIFA. Geo-block em superfícies de aposta.

**Critérios de julgamento → onde aparecem no vídeo:**
| Critério | Segmento que carrega |
|---|---|
| Fan Accessibility & UX | Onboarding (e-mail, sem fricção de wallet) + Solução (uma tela só) |
| Real-Time Responsiveness | **Live** — o split do gol (feed cru \| desktop \| celular reagindo juntos) |
| Originality & Value | **Fantasy 1v1** — não é dashboard sobre o dado, é um jogo feito do dado |
| Commercial & Monetization | **Store & Market** — primário (packs) + secundário (troca) + rake da aposta |
| Completeness & Execution | Cortes no **Solscan** + tudo se movendo ao vivo |

---

## 1. Roteiro por segmento

> Formato: **[deck]** cartela → **VO** (falar assim, em inglês) → **Pontos obrigatórios** (o que TEM que ser dito/mostrado).

### 1 · Capa — 0:00–0:06
**[deck]** slide Capa (HAT**RICK** · "Live Sports. Fantasy. Compete." · Powered by TxLINE). Ambiência de estádio.
> **VO:** "This is Hatrick — the 2026 World Cup, live and playable."

**Pontos obrigatórios:** nome + "Powered by TxLINE" na tela. Nada de explicar ainda.

---

### 2 · O Gap — 0:06–0:28
**[deck]** slide Problema (5 apps: Watch · Odds · Fantasy · Wallet · Social). Abrir no momento quebrado, depois a linha que DEFINE o produto. Corte seco pro onboarding em "one place".
> **VO:** "A goal just went in — and your fantasy team has no idea. Neither does your bet. Fans live the match in pieces: watching in one app, betting in another, fantasy in a third, cards in a fourth — and none of them knows the game is happening right now. Hatrick puts it in one feed: watch, bet, and play the real World Cup — live, in one place."

**Pontos obrigatórios:**
- Dramatizar o "gol saiu e nada reagiu" (a dor concreta).
- Dizer explicitamente que hoje são **apps desconectados** (5 coisas que o fã já faz).
- Fechar com a DEFINIÇÃO: **um feed → assistir + apostar + jogar, ao vivo, num lugar só.**

---

### 3 · Solução — 0:28–0:45
**[deck]** slide Solução (phone + lista: Live watch · Fantasy · One app · Real-time data).
> **VO:** "One profile, one wallet, one TxLINE feed. The real match, live and playable — reacting the moment the pitch does."

**Pontos obrigatórios:** **um perfil / uma wallet / um feed**. O gancho "reage no instante em que o campo reage" (prepara o Real-Time).

---

### 4 · DEMO 01 · Get in — 0:45–1:35
**[deck]** cartela "01. Get in" (2–3s) → **screen-capture** do onboarding. Speed-ramp no form; desacelera no foil do pack; segura na tela final com as duas opções.
> **VO:** "One account — sign in with just an email; a wallet is created for you, invisible. Test funds, one tap. Your starter pack..." *(pausa — deixa o foil abrir; clica uma carta → corte de 1s pro Solscan)* "...and every card is a real, limited-edition Metaplex Core NFT — serial-numbered, capped supply, and the draw itself is provably fair. Here it is on-chain. Then you choose: watch the real game live, or build your team and play. Let's do both."

**Pontos obrigatórios:**
- **E-mail → wallet invisível** (Fan Accessibility: zero fricção de wallet).
- **Carta = Metaplex Core NFT** (serial, supply capado) + **provably-fair** → **corte Solscan** (prova "não é mockup").
- A **bifurcação Live/Fantasy** (mesmo perfil, mesma wallet).
- **Falar "Metaplex Core"**, não "cNFT". Não dizer que atributo evolui ao vivo.

**💬 Banco de falas simples — as cartas (escolha 1–2 pra complementar, em inglês):**
> A ideia é traduzir "NFT/Metaplex" pra quem NÃO é cripto, sem soar técnico. Cada frase carrega um significado (posse real, escassez, justiça).
- **Posse/real:** *"These aren't points in a database — each card is a real NFT, minted on Solana."*
- **Via Metaplex (plain):** *"Minted through Metaplex — the standard for NFTs on Solana — so the card is truly yours: keep it, trade it, or sell it."*
- **Analogia física:** *"Think of it like a numbered trading card: limited print run, your own serial, and it belongs to you — not to us."*
- **Provably-fair (a justiça do pack):** *"And the draw runs on-chain — provably fair. We can't rig which card you get; the blockchain decides."*
- **Amarra pro Solscan:** *"Don't take our word for it — here's that exact card, live on-chain."*

> ⚠️ **Termo correto = "Metaplex Core NFT" (ou só "NFT on Solana"). NÃO dizer "cNFT"/"compressed NFT":** o `hattrick_packs` minta via `mpl_core` (`CreateV1CpiBuilder`), que é **Metaplex Core** — não é NFT comprimido (cNFT = mpl-bubblegum + state compression, que o projeto não usa). Dizer "cNFT" é factualmente errado e um jurado de Solana pega.

---

### 5 · DEMO 02 · Live — 1:35–2:45 *(herói do vídeo)*
**[deck]** cartela "02. Live" (2–3s) → **screen-capture contínua** (sem cortes até o gol). No gol, split ~5s: **SSE cru \| desktop \| celular**.
> **VO:** "Path one: the live match. Everything moves on its own — the score, the play-by-play with real player names, the odds board — all arriving through TxLINE's real-time streams." *(faz a aposta → corte 1s Solscan: escrow)* "One tap, a stake — and it's real: the stake locks into an escrow on Solana devnet. Here's the transaction. Now watch what the real world does—" *(GOAL → split, meio segundo de silêncio)* "—one goal. The raw feed event on the left, our interface and a phone reacting in the same second. No refresh anywhere." *(volta ao desktop, settle → corte Solscan: payout)* "And when the result is confirmed by the feed, the bet settles itself. Nobody approved this payout — the contract did. Real Solana, not a mockup."

**Pontos obrigatórios:**
- Tudo se move sozinho **pelo TxLINE** (é o requisito #1 — "live input").
- **Aposta → escrow on-chain** → **corte Solscan** (a credibilidade).
- **O split do gol** = a prova de Real-Time (feed cru + 2 telas reagindo no mesmo segundo, sem refresh).
- **Settle automático** pelo programa → **corte Solscan payout**.
- Se on-chain instável no dia: usar Solscan B-roll (tx real filmada antes) OU cair pra "settled automatically from the authoritative TxLINE result" (ainda verdade).

**💬 Banco de falas simples — aposta on-chain (escolha 1–2):**
> Traduz "escrow/smart contract" pra confiança em linguagem de fã. Cada uma carrega Completeness/credibilidade.
- **Escrow (plain):** *"Your stake doesn't come to us — it locks into a smart contract on Solana. Neither side can touch it."*
- **É real, não mockup:** *"One tap, and it's a real on-chain transaction — here it is on Solscan."*
- **Settle automático:** *"When TxLINE confirms the result, the contract pays the winner by itself — no operator, no approval."*
- **A âncora de confiança:** *"You're not trusting us to pay out — you're trusting the blockchain."*
- **Fallback honesto (se on-chain cair no dia):** *"the bet settles itself the moment the authoritative TxLINE result lands."*

---

### 6 · DEMO 03 · Fantasy 1v1 — 2:45–3:35
**[deck]** cartela "03. Fantasy 1v1" (2–3s) → **screen-capture split PC × celular** o segmento inteiro. Dois jogadores reais. Deixa o duelo rodar ~12s sem VO.
> **VO:** "Path two: play the data. Two real players — one on PC, one on a phone. The challenge goes out... accepted. The same duel runs on both screens, simulated server-side — weighted by the players' real World Cup numbers." *(silêncio enquanto joga)* "Full time — the result lands on both devices at once, and the stake pays out. This is the part nobody else has: not a dashboard about the data — a game made of it."

**Pontos obrigatórios:**
- **Dois jogadores reais, 2 devices** (multiplayer de verdade).
- Simulação **server-authoritative**, ponderada por **dados reais** do torneio.
- **Resultado simultâneo** + payout do stake.
- A frase-âncora: **"not a dashboard about the data — a game made of it"** (Originality/wedge).

**💬 Banco de falas simples — o duelo (escolha 1–2):**
> Vende Originality (é jogo, não gráfico) + fairness (server-side) sem jargão.
- **Anti-cheat (server-side):** *"The duel runs on our server, not on either phone — so no one can rig it."*
- **Dado vira jogo:** *"Every player's real World Cup numbers drive the outcome — the data literally plays the match."*
- **Stake on-chain:** *"Both stakes sit in escrow on Solana, and the winner is paid automatically."*
- **O wedge (a mais forte):** *"This is the part nobody else has — not a chart about the match, a match you actually play."*

#### 6b · Matchday form — ~8–12s (dentro do segmento Fantasy, antes do FT ou logo após)
**[tela]** B-roll curto do painel **"Matchday form"** no `/fantasy` (nações com ▲/▼ + os player overlays "#22 · ST · 🇦🇷") e os chips ▲+2 nas cartas da coleção.
> **VO:** "And the cards live on the feed too. When Argentina wins, every Argentine card gains form — and the number 22 who scored the winner reacts twice."

**Pontos obrigatórios:**
- **Nation form**: resultado confirmado → todas as cartas daquele país movem (o ARG×ENG do demo é o exemplo pronto).
- **Player overlay**: quem marcou reage em dobro — o painel aponta pelo trio camisa/posição/país ("#22 · ST · 🇦🇷"), que funciona sem resolver nome.
- **Nomes**: manter como está no app (nomes vêm do feed; retratos são estilizados e NÃO batem com o jogador real → sem risco de likeness). Não fazer disso um ponto do VO.
- ⚠️ **Honestidade**: falar da MECÂNICA no presente (o painel mostra o resultado real ARG 2–1 ENG gravado do feed), mas **NÃO** dizer "settles automatically on every match" — o form engine automático é roadmap; a fala acima não promete automação.

---

### 7 · DEMO 04 · Store & Market — 3:35–4:05
**[deck]** cartela "04. Store & Market" (2–3s) → **B-roll** passeando pela **store** (packs Starter/Pro/Elite) e pelo **marketplace** (cartas com preço, buy/sell entre jogadores).

**🎬 Shot-list (ordem que conta a história primário → prova on-chain → secundário):**
1. **`/store` parado 2–3s no grid de packs** — os contadores "N left" caem sozinhos com o pulso (escassez VIVA; nunca filmar a store estática).
2. **"View all players"** → modal do roster, 2s de scroll (profundidade do que você pode tirar).
3. **Compra do Limited Bundle** (produto premium; o Starter já apareceu no onboarding) → confirm → **toast "payment confirmed on-chain" → clicar "View on Solscan"** = o corte Solscan deste segmento (tx de pagamento REAL em devnet) → volta pro reveal, deixa 2 cartas virarem.
4. **"Open market"** (botão no heading de Market picks) → market: 1 clique num filtro (LEGENDARY) → **Sell** de uma carta — fecha o ciclo: acabou de sair do pack, já tem preço no secundário.
5. Rake + expansão ficam na VO (não precisam de tela).
> **VO:** "Most event products die when the event ends — this one doesn't. The economy has both sides: a primary store selling packs, and a marketplace where players buy and sell each other's cards — plus the rake on every bet. And none of it is football-specific: TxODDS covers 350+ leagues across 30+ sports, so the same engine runs basketball, tennis, esports."

**Pontos obrigatórios:**
- **Dois lados**: store (primário) + **marketplace** (troca de cartas entre jogadores) + **rake** da aposta.
- **Retenção**: fantasy mantém o fã jogando o ano todo, não só 90 min.
- **Expansão TxODDS** (350+ ligas / 30+ esportes) — a história que o sponsor quer ouvir.

**💬 Banco de falas simples — economia (escolha 1–2):**
> Vende Commercial/Monetization + retenção. ⚠️ o marketplace é **off-chain** (ledger DB) — NÃO dizer "trade on-chain".
- **Dois lados (plain):** *"Two ways value moves: buy packs from us, or trade cards with other players — and we take a small cut of every bet."*
- **Retenção:** *"Fantasy keeps fans playing all year — not just for ninety minutes."*
- **Expansão (a fala que o sponsor quer):** *"And none of this is football-only — TxODDS covers 350+ leagues across 30+ sports, so the same engine runs basketball, tennis, esports."*

---

### 8 · How TxLINE powers it — 4:05–4:35 *(beat técnico obrigatório)*
**[deck]** slide "How TxLINE powers it" (fluxo: feed SSE → NestJS → Clients+Solana · estados `*.during`/`*.after` · replay). **Não ler endpoints** — eles vão na doc técnica.
> **VO:** "Under everything you've seen: one feed. TxLINE's streams hit our backend, become a WebSocket, and update both screens live; when the result is confirmed, the bet settles on Solana. Every event fires twice — an optimistic 'during' for instant UI, and an authoritative 'after' that settles. Same pipeline for both modes. And since the 104 games end before judging, this demo replays real recorded TxLINE history through that exact pipeline — that's why everything reacts in real time with no match on air."

**Pontos obrigatórios:**
- **Um feed** alimenta assistir E jogar (mesmo pipeline).
- **SSE → backend → WebSocket → tela**; no fim, **settle na Solana**.
- Os **dois estados** `*.during` (otimista/UI) e `*.after` (autoritativo/settlement).
- **Replay do histórico real pelo mesmo pipeline** = por isso reage ao vivo sem jogo no ar.
- **Não ler paths de endpoint** (estão na doc técnica).

---

### 9 · Fecho — 4:35–4:48
**[deck]** slide Fecho ("Play the Cup, live." + links deploy/repo + Powered by TxLINE).
> **VO:** "Hatrick. Live sports. Fantasy. Compete. Built on TxLINE, live on Solana devnet — link and repo below. Thanks for watching."

**Pontos obrigatórios:** repetir tagline + **link do deploy e do repo** na tela + "Powered by TxLINE".

---

## 2. Do / Don't

- **Do** manter o jogo visivelmente se movendo em todo shot de produto — "live input" é o requisito #1.
- **Do** mostrar **uma aposta liquidando ponta-a-ponta** (Live) — o momento de credibilidade.
- **Do** dizer "replaying a real finished match through the live pipeline" se aparecer/for perguntado — honesto e demonstra melhor o feed.
- **Do** mostrar o painel **Matchday form** (6b) falando da mecânica — cartas = posição+camisa+país, form move com resultado confirmado; os dados na tela espelham o ARG×ENG real gravado.
- **Don't** ler paths de endpoint (estão na tela + na doc técnica).
- **Don't** dizer "cNFT" (é **Metaplex Core**, não comprimido), nem que o form engine **já settla sozinho a cada jogo** (é roadmap — a fala do 6b descreve a mecânica sem prometer automação).
- **Don't** usar **foto/rosto real, escudo de clube ou marca FIFA** — nomes reais são ok (vêm do feed, e os retratos estilizados não batem com o jogador real = sem likeness); imagem licenciada não.
- **Don't** dizer que o **marketplace é on-chain** — a troca de cartas roda **off-chain** (ledger DB); só o mint da carta (pack) é on-chain. Falar só "buy and sell each other's cards".
- **Don't** prometer "zero-delay odds", mostrar marcas FIFA, ou abrir `/sandbox`.

---

## 3. Checklist de submissão (o vídeo cobre 3, o resto é à parte)

- [x] Vídeo cobre: **problema ✓ · walkthrough ao vivo ✓ · como o TxLINE alimenta o backend ✓**
- [ ] **Link deployado** (frontend Vercel · backend com SSE persistente) — preencher no fecho
- [ ] **Repo público** — link no fecho
- [ ] **Doc técnica + lista de endpoints TxLINE** — [`../../docs/txline-provider.md`](../../docs/txline-provider.md) / README
- [ ] **Feedback do TxLINE** — [`../../docs/txline-feedback.md`](../../docs/txline-feedback.md)
- [ ] Gravar as 4 demos e encaixar nos placeholders do `deck.html`
- [ ] **Validar bet+settle on-chain no browser ANTES do dia** (flip delegação Privy) OU preparar Solscan B-roll (tx real filmada antes)

# Hatrick — Pitch/Deck Handoff

> Estado do trabalho de **slides/pitch** para a submissão do TxODDS World Cup Hackathon 2026 (track Consumer & Fan Experiences). Este doc existe pra **continuar em outro chat** sem perder contexto. Tudo vive em `project/docs/`.

---

## 0. Contexto rápido (o que estamos fazendo)

Montando o material visual da submissão:
1. **Deck do vídeo** (storyboard das cartelas do demo de 5 min) — `pitch-deck-v2.html`.
2. **Deck profissional** (formato investor/landing, badge + headline + grid de features) — `pitch-pro.html`.
3. **Telas single-page 1920×1008** pra importar no **Figma** e montar o deck final lá — arquivos `*-1920.html`.
4. **Script de narração** do vídeo — `docs/demo-video-script.md`.

O vídeo é o entregável obrigatório da submissão (não o deck). Requisitos do edital: **problema + walkthrough do app ao vivo + como a TxLINE alimenta o backend**. Submissão só de deck/mockup = DQ automático → o vídeo tem que ser majoritariamente o app real; as cartelas são cola entre os micro-vídeos.

---

## 1. Inventário de arquivos (`project/docs/`)

### Slides single-page 1920×1008 (para Figma) — **os principais agora**
| Arquivo | O que é | Status |
|---|---|---|
| `gap-alive-2x2-1920.html` | **Gap** — 2×2 de "apps desconectados" com system cards + mini-widgets vivos (placar/odds/fantasy/chat) | ✅ pronto, conteúdo escalado |
| `solution-2x2-1920.html` | **Solução** — 2×2 (Live/Fantasy/On-chain/Real-time) com mini-widgets (bet placed ✓, duelo, hash settled ✓, GOAL) | ✅ pronto |
| `solution-column-1920.html` | **Solução em COLUNA** — phone à esquerda (placeholder) + 4 features empilhadas à direita, header "SOLUTION"+logo | ✅ pronto |
| `divider-live-1920.html` | Divisória de seção "**01. Live**" (mark neon + número + subtítulo) | ✅ pronto |
| `divider-fantasy-1920.html` | Divisória de seção "**02. Fantasy**" | ✅ pronto |

### Decks navegáveis (comparação de variações / storyboard)
| Arquivo | O que é |
|---|---|
| `pitch-deck-v2.html` | Storyboard do vídeo — 9 slides com frames de vídeo + **notas de apresentador (tecla N)** + tempos |
| `pitch-pro.html` | Deck profissional 7 slides (cover, problem, solution, how-txline, on-chain proof, business, close) |
| `gap-variations.html` | Gap estilo ilustrado (personagem central + widgets orbitando + setas) — 4 headlines. **Precisa do mascote `assets/fan.png`** |
| `gap-2x2.html` | Gap 2×2 — variações A (borda fina), B (mercado), C (chrome de modal) |
| `gap-alive.html` | Gap 2×2 system cards (Phosphor neon + widgets vivos) — 3 variações |
| `problem-variations.html` | Problema em formato pro (EN) — 4 ângulos, ilustração split |

### Assets (`project/docs/assets/`)
`logo.png` (brandmark branco), `stadium-hero.png`, `arena-stage.png`, `talero.otf`, `txline.svg`, `txodds.svg`, `solana.svg`, `worldcup26.svg`.
**Falta:** `fan.png` (mascote hoodie "H" pro `gap-variations.html`).

### Docs de texto (submissão)
| Arquivo | Status |
|---|---|
| `docs/demo-video-script.md` | ✅ reescrito — narração completa fala-a-fala (EN) |
| `docs/submission.md` | ⚠️ **DEFASADO** — ainda diz "hat-trick", login wallet-nonce, "on-chain Phase 2". Precisa atualizar |
| `docs/txline-feedback.md` | 🟡 base existe, precisa enriquecer |

---

## 2. Design System (Neon Turf — espelha `frontend/src/app/globals.css`)

### Tokens
```
--background:#0b0c0f  --surface-1:#141519  --surface-2:#1b1c21  --surface-3:#26272e
--foreground:#f2f3f5  --muted:#8b8d94
--neon:#aef019 (accent)  --neon-hover:#c2ff3d
--live:#ff5a5f  --gold:#f5c451  --info:#5b9bff
--border:rgba(255,255,255,.08)  --border-2:rgba(255,255,255,.12)
--e4: 0 24px 56px -14px rgb(0 0 0 /.58), 0 6px 16px -8px rgb(0 0 0 /.42)  (sombra dos modais)
```

### Fontes
- **Inter** — corpo/UI (é a `--font-sans`/`font-heading` do app)
- **Geist Mono** — mono (labels, chips, timestamps)
- **Saira Condensed 900 italic** — wordmark da capa ("LIVE SPORTS. FANTASY. COMPETE.")
- **Talero** (`assets/talero.otf`) — display local do produto (números/ratings)

### Padrões de card (IMPORTANTES — usar sempre)
**System card** (o que o usuário aprovou — igual ao modal `ui/dialog` do produto):
```css
/* card */
background:#16171c; border:6px solid #22232a; border-radius:22px; box-shadow:var(--e4);
/* glow neon sutil no topo */
::before { radial-gradient(60% 100% at 50% 0%, rgba(174,240,25,.10), transparent 72%) }
/* ícone: quadradinho neon-tinted + glifo neon */
.ic { width:66px; border-radius:16px; background:#1c2410; border:1px solid rgba(174,240,25,.24); }
.ic svg { color:var(--neon); }
/* label mono maiúsculo + título + descrição */
.lbl { font-family:mono; text-transform:uppercase; color:muted; }
.t { font-weight:700; color:foreground; }
.d { color:muted; }
```
**Mini-widgets de "vida"** dentro dos cards: placar com flags CSS + chip `LIVE` (pulso), odds chips, fantasy `124 PTS` + barra, balão de chat, chips `✓ Settled`/`Bet placed` (neon), hash mono. Ver `gap-alive-2x2-1920.html` / `solution-2x2-1920.html`.

**Ícones:** Phosphor. Nos decks navegáveis usei a fonte Phosphor duotone via CDN; **nos arquivos 1920 (Figma) uso SVG inline** (vetor limpo). Icons usados: broadcast, chart-line-up, cards, chat-circle-dots, game-controller, link/chain, bolt, eye, link-break, clock, dice.

**Powered by TxLINE** (1:1 com `common/powered-by-txline.tsx`): ícone Broadcast neon + "Powered by" + "TxLINE↗" neon bold. **Não** usar os billboards `txline.svg` (são placeholders de gradiente azul do jogo).

---

## 3. Convenções dos slides 1920×1008 (para continuar o deck no Figma)

Regras que TÊM que ser seguidas pra importar limpo no Figma (plugin **html.to.design**):
1. **Frame fixo**: `.frame { width:1920px; height:1008px; }` — **px puro, zero vh/vw/clamp**.
2. **Ícones em SVG inline** (não fonte de ícone) → viram vetores editáveis.
3. **Cores em hex direto** nos elementos-chave (não depender só de `color-mix`).
4. **Single file, self-contained** (só Google Fonts via `<link>`).
5. Sem navegação/JS de slides — **uma tela por arquivo** (o usuário pediu isso explicitamente).
6. Conteúdo interno **proporcional ao frame** (num deck 1920, ícone ~66px, título ~29px, desc ~19px — cuidado pra não deixar conteúdo pequeno demais nos cards grandes).

### Workflow pra ver/validar
```
cd project/docs && python -m http.server 8000
# abrir http://localhost:8000/<arquivo>.html
```
No Figma: plugin html.to.design → import from URL (localhost) ou cola o HTML.

---

## 4. Narrativa travada (decisões — NÃO reabrir sem motivo)

- **Nome:** **Hatrick** (um T, sem hífen). Não usar "Hat-trick".
- **Enquadramento do problema = OPORTUNIDADE/GAP de mercado**, não dor. Mercados provados (fantasy/apostas/figurinhas/games) mas desconectados do jogo real. O dado ao vivo **sempre existiu** (caro/fechado, de operador) → a TxLINE **democratizou o acesso** ("abriu pra builders"). NÃO dizer que era "impossível".
- **Copy = valor concreto, zero slogan de efeito.** Cada headline diz algo concreto ou entrega valor. Headline campeã do Gap: **"O gol saiu. Seu fantasy nem soube."** (EN: "The goal went in. Your fantasy has no idea.") ou o 2×2 "Four apps. One match. Zero glue."
- **Dois lados do produto = Live e Fantasy** (mapeiam "Provider/Consumer Side" da referência). As divisórias usam isso.
- **Tese do ecossistema:** um feed alimenta assistir E jogar → plataforma viva mesmo sem jogo no ar (retenção + responde à nota do sponsor de que os 104 jogos acabam antes da revisão → usamos **replay** do histórico real pelo mesmo pipeline).
- **Idioma:** os arquivos 1920/pro estão em **inglês** (casa com o script). Fácil virar PT se decidir.

### Verdades on-chain (usar termos EXATOS — verificado no código `backend/`)
- Cartas = **Metaplex Core NFT** (mpl-core 0.11.2, programa `CoREE…`), únicas, com número de série, **supply capado on-chain** (CategoryVault `initial_supply/remaining`).
- Packs = **Metaplex SFT**, queimado ao abrir.
- **Provably-fair** real (commit-reveal via programa `hattrick_provably_fair`).
- **NÃO dizer "cNFT"** (compressão é roadmap, não shipado). **NÃO dizer que atributo evolui ao vivo** (é visão, não shipado — dizer "attributes built from real data").
- Estado: on-chain **validado no devnet e codado**, mas o loop completo bet→escrow→settle→payout no browser (delegação Privy) **ainda não foi exercido ponta-a-ponta** → pré-requisito de gravação (ver §6).

---

## 5. Estrutura do VÍDEO (5 min) — `pitch-deck-v2.html`

Wow primeiro, login nunca abre o vídeo. Onboarding dissolvido no fluxo. Cada dor do Gap é "paga" por um segmento.

| # | Slide | Tempo | Conteúdo |
|---|---|---|---|
| 1 | Capa | 0:00 | "Live Sports. Fantasy. Compete." + Powered by TxLINE |
| 2 | Gap | 0:05 | o problema como gap → define o produto |
| 3 | Onboarding → o garfo | 0:20 | login e-mail → faucet → pack (carta = **Solscan** Core NFT) → XI → 2 CTAs |
| 4 | O hub (home scroll) | 1:00 | scroll da home: ao vivo em cima, My Fantasy Team + stats + My Bets embaixo |
| 5 | **Caminho 1 — Ao Vivo** | 1:20 | placar/Events/odds → aposta → **gol em 3 telas** (SSE\|desktop\|celular) → liquida → **Solscan payout** |
| 6 | **Caminho 2 — Fantasy 1v1** | 2:35 | split **PC × celular**, 2 jogadores reais, resultado simultâneo |
| 7 | TxLINE → backend | 3:40 | flow SSE→NestJS→WS→Solana + endpoints agrupados + replay (endpoints NÃO são falados) |
| 8 | Negócio + futuro | 4:20 | store + marketplace + 350+ ligas/30+ esportes + retenção |
| 9 | Fecho | 4:45 | capa + links deploy/repo |

Micro-falas TxLINE espalhadas nos segmentos 5 e 6 (não parar a demo pra explicar). Endpoints reais vão na doc técnica, não no vídeo.

**Endpoints TxLINE usados** (de `docs/txline-provider.md`): `POST /auth/guest/start`, `POST /api/token/activate`, `GET /api/scores/stream` (SSE), `GET /api/odds/stream` (SSE), `GET /api/fixtures/snapshot`, snapshots scores/odds, `GET /api/{scores,odds}/updates/…` (replay). Fase 2: `/api/scores/stat-validation` + `validate_stat` CPI + Merkle proofs.

---

## 6. TODO / próximos passos

**Slides 1920 que faltam (mesmo formato/system cards):**
- [ ] Capa (hero stadium + wordmark) 1920
- [ ] Problema — versão 2×2 já existe (`gap-alive-2x2-1920`); fazer também **versão coluna** (phone/visual esquerda + coluna direita) se quiser deck consistente com `solution-column`
- [ ] How TxLINE powers it — 1920 (flow + 4 features + chips endpoints)
- [ ] On-chain "Real, not a mockup" — 1920 (settle / provably-fair / Metaplex Core NFT / Solscan)
- [ ] Negócio "The Cup ends. Hatrick doesn't." — 1920
- [ ] Fecho — 1920
- [ ] Divisórias extras: "00. Get in" (onboarding), "03. On-chain"

**Decisões pendentes do usuário:**
- [ ] Qual variação/headline do Gap travar (recomendado: "The goal went in. Your fantasy has no idea." / 2×2 "Four apps. One match. Zero glue.")
- [ ] PT ou EN no deck final
- [ ] Mascote `assets/fan.png` (se for usar o `gap-variations.html` ilustrado)
- [ ] Cor: neon lime da DS (atual) vs esmeralda da referência

**Submissão (texto):**
- [ ] Atualizar `docs/submission.md` (nome Hatrick, Privy e-mail login, on-chain integrado not Phase 2, endpoints)
- [ ] Enriquecer `docs/txline-feedback.md`
- [ ] Preencher links reais (deploy + repo) na capa/fecho

**Gravação (crítico):**
- [ ] **Validar bet+settle on-chain no browser ANTES da gravação** (flip `CHAIN_ENABLED` + delegação Privy) pra provar no Solscan. Plano B: fazer 1 tx real no devnet à parte e usar a página do Solscan como B-roll (é tx real, só filmada antes). NUNCA forjar tela de explorer.
- [ ] Take do duelo PC×celular (2 contas) e take do terminal SSE pro split do gol — testar antes do dia.

---

## 7. Como retomar em outro chat (prompt sugerido)

> "Continuar o deck do Hatrick. Ler `project/docs/DECK-HANDOFF.md`. Os slides 1920×1008 pro Figma seguem o padrão de `gap-alive-2x2-1920.html` / `solution-2x2-1920.html` (system cards Neon Turf, SVG inline, px puro, single-page). Quero fazer [PRÓXIMA TELA] no mesmo formato."

Referências de estilo aprovadas pelo usuário: system card = igual ao modal `ui/dialog` (ícone Phosphor neon em quadradinho `#1c2410`, label mono + título + desc + mini-widget vivo). Divisória de seção = mark neon + "0X. Título" + subtítulo com frase neon (estilo "1. Provider Side").

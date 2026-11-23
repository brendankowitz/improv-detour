# Detour: web game design (v1)

Working title **Detour** ("yes, and the long way"). This is project 1 of 3. The order is: (1) a polished, playable
web game; (2) a printable deck that plays well on its own; (3) a spec for a native iOS single-player mode
with speech. This document covers (1) and the card schema that (2) will share.

Source material: `docs/sources/detour-grok.md` (Detour: the loop and voice), `docs/sources/scene-snacks-claude.md` (Scene Snacks: traits,
safety tools, research), `docs/sources/yes-and-away-gemini.html` (Gemini: session arc,
Half-Life). Where this doc conflicts with them, this doc wins.

## Intent

A fast, cooperative improv game a family plays out loud with one phone, wherever they happen to be. It should
be genuinely fun first and quietly teach real improv habits: listening, accepting, building, specificity and
commitment. Quality matters more than breadth.

## Who

- A family of 4, all aged **10+**. One of the kids is a teen. Plays with 2–6 people.
- One phone, held by whoever is free. Everyone else plays by voice.
- No accounts, no network once loaded, nothing collected.

## Fit the space: trait filters, not modes

Every card declares plain traits. The player switches on the filters that fit where they are, and only cards
that pass every active filter are dealt.

| Card trait | Values | Filter that uses it |
|---|---|---|
| `volume` | `quiet` / `normal` / `loud` | **Quiet** keeps only `quiet` (and `normal` when set to "low") |
| `handsFree` | bool: playable by someone who can't use eyes or hands | **Hands-free** (a driver, someone holding a baby) |
| `seated` | bool: playable without standing or moving around | **Seated** |
| `minPlayers` | 2–4 | the player count |

**Shortcuts** (one tap each, then editable): Car = Seated + Hands-free; Plane/Train = Seated + Quiet;
Table = Seated + Quiet; Home = nothing. Shortcuts are just presets of the filters.

Paper parity: the same traits print as small icons on each card.

## The deck (target 108 cards)

| Suit | Count | Job |
|---|---|---|
| **Where** | 24 | A place you can stand in. Ordinary-strange. No plot and no character baked in. |
| **Who** | 24 | The opener's character **plus a want** ("…who needs one more vote"). Character and objective on one card. |
| **How** | 24 | The rule for the scene: a real workshop constraint (yes-and, last word first, questions only, three words, genre…). |
| **Twist** | 12 | A mid-scene change, fired once at about the halfway point. |
| **Warm-up** | 18 | A stand-alone game of at most 2 minutes (one-word story, fortunately/unfortunately, Half-Life, expert…). |
| **Reference** | 6 | Rules, safety tools and the trait-icon key (print only). |

Card fields: `id` (stable, e.g. `W-01`), `suit`, `title` (≤ 24 chars), `prompt` (≤ 16 words, readable in one
breath), `tip` (optional, ≤ 14 words, shown on request and not read aloud), `skill` (one of a fixed set of 8:
listening, accepting, building, specificity, emotion, status, character, storytelling), `level`
(`easy` / `stretch`), traits above, and optional machine fields (`cue` for How cards whose per-line prompt
the app can show, `warmup` config for warm-ups). Content lives in one JSON file, validated by tests.

Level replaces "spice". Everyone is 10+, so there is no age tier. `stretch` means harder and drier (status,
subtext, Half-Life), not stranger.

## A round: two minutes at most

1. **Deal and read (≈15 s).** Where + Who + How (How can be switched off). The app reads the three prompts
   aloud once (TTS can be toggled). One-tap swap of any card, no confirmation.
2. **Scene (45 / 60 / 90 s, default 60).** The opener speaks first, in character. Lines go round the group in
   seating order. **No tap per line.** The phone shows the timer, the opener and, when the How has one, the
   per-line cue. An optional "call the turns" setting brings back a Pass button that names the next player.
3. **Twist.** In about one in three scenes, the app announces a Twist card at about the halfway point
   (chime + voice). Players accept it immediately.
4. **Button (≈10 s).** When time runs out (or someone taps **Land it**), a chime sounds and whoever has the turn
   says one last line that ends the scene.
5. **Bank (≈5 s).** One tap banks a mile, and the next hand deals straight away. Shout-outs and a one-line journal
   note are optional and skipped by default.

Warm-ups are an alternative to a scene at any point: same two-minute cap, same one-tap bank.

## Scoring and session

- Cooperative. Each completed scene or warm-up is one mile for the group. Nothing is ever lost, and nobody is
  ranked or singled out.
- A session is open-ended: any number of rounds, stopping anywhere, resuming later. **End trip** shows a short
  summary (miles, the scenes played, any journal lines).
- *Open question for reviewers:* does the session need a stronger arc (a destination, a warm-up → scenes →
  closer shape) to feel like it went somewhere?

## Safety and inclusion (printed on a reference card too)

- **Pass is free.** Anyone can pass a line with no explanation.
- **Rewind.** Anyone can say "rewind" to undo a line that felt unkind; the speaker makes a new choice.
- **Swap / scrap.** Any card can be swapped before the scene. A scene can be scrapped with no mile and no fuss.
- Conflict stays sideways: blame the weather, the soup or the map, never each other. No romance, scares or
  humiliation. Real people present are never the joke.
- Hands-free safety: a card marked `handsFree` must never ask anyone to look, point, mime or hold anything.

## The app

- **Screens:** Home (start or continue), Setup (names, filters, length, How on/off, voice on/off), Play (deal →
  scene → button → bank), Warm-up, Deck (browse every card with filters), Rules, Trips (journal).
- **Phone-down play:** large type, a dark screen, one primary action. Screen Wake Lock while a trip is open.
  Space bar = primary action on a keyboard.
- **Voice:** `speechSynthesis` behind a small speech interface, so a native Capacitor implementation can drop in
  later.
- **Offline:** a service worker caches the whole app. Fully playable in airplane mode after the first load.
- **Persistence:** localStorage, versioned with explicit migrations. Unknown card IDs in a saved trip are
  dropped gracefully, never a blank screen.
- **Determinism:** the game engine is pure TypeScript with a seeded RNG and no browser globals, enforced by
  lint as in the reference repo. The UI drives it.

## Stack and delivery (mirrors brendankowitz/towerdefense-body-game)

Ionic React 8 (iOS mode) + React 19 + react-router 5, Vite, strict TypeScript, ESLint strictTypeChecked,
Vitest + Testing Library, Playwright e2e on a phone viewport against the production build, an `npm run verify`
gate, a GitHub Actions CI workflow, and a Pages deploy workflow with a 404.html SPA fallback. Capacitor is
added in project 3, not now.

## Quality process

- Rules and gameplay: Fable and Opus each review this doc independently. Disagreements go to the owner.
- Content: once the cards are written, Fable and Opus each review every card for quality, fit, traits and
  hands-free safety.
- A written simulated playthrough of a four-person session in the car is used to catch rules that break in
  practice.

## Non-goals (v1)

Print pipeline (project 2). Native iOS, speech recognition, AI scene partner (project 3). Accounts, sync,
multiplayer across phones, analytics. Competitive scoring.

## Anti-goals

A quiz or a chatbot that writes scenes for you. Anything that requires the driver to look at the screen. Rounds
that drag past two minutes. Copy that is cute instead of clear.

# Detour: web game design (v2)

Working title **Detour** ("yes, and the long way"). This is project 1 of 3. The order is: (1) a polished, playable
web game; (2) a printable deck that plays well on its own; (3) a spec for a native iOS single-player mode with
speech. This document covers (1) and the card schema that (2) will share.

v2 folds in two independent rules reviews (Fable and Opus), each with simulated playthroughs at a restaurant table
and in a car, and the owner's decisions on the points where they split. Source material is in `docs/sources/`.

## Intent

A fast, cooperative improv game a family plays out loud with one phone, wherever they are. It should be genuinely
fun first and quietly teach real improv habits: listening, accepting, building, specificity, commitment and
callbacks. Quality matters more than breadth.

## Who

- A family of 4, all aged **10+**, one of them a teen. Plays with 2–6 people.
- One phone, held by whoever is free. Everyone else plays by voice.
- No accounts, no network once loaded, nothing collected.

## Fit the space: card traits and presets

Every card declares three plain traits:

| Trait | Meaning |
|---|---|
| `voiceOnly` | Playable entirely by ear. Nobody needs to see, point, mime, hold, read or look at anyone. |
| `quiet` | Works at an indoor-table voice. |
| `physical` | Needs someone to stand or move. Rare. |

Filters: **Voice only**, **Quiet**, **Moving allowed** (physical cards are excluded unless this is on), and **Stretch**
(include harder cards). Presets are one-tap starting points: **Car** = Voice only (and asks who is driving);
**Out and about** = Quiet; **Home** = Moving allowed. The traits apply to every suit, Twists and Warm-ups included.

## The driver is a seat, not a filter

In setup, any player can be marked **Driver**. The Driver is never cast as Opener and never lands a scene. They may be
cast as Partner, and may say "driving" at any time to drop out; the nearest on-deck player takes over the role with no
gap. The driver never holds the phone.

## The deck (108 cards)

| Suit | Count | Job |
|---|---|---|
| **Where** | 26 | A place you can stand in, with one sensory hook. Ordinary-strange. No plot, no character baked in. |
| **Who** | 30 | The Opener's character **and a want aimed at the Partner** ("…who needs *you* to sign the permission slip"). |
| **How** | 16 | The rule for the scene, as a ladder: 8 easy, 8 stretch. Holdable in your head after hearing it once. |
| **Twist** | 12 | Adds a fact to the world ("it starts raining indoors"). Never adds a second speaking rule. |
| **Warm-up** | 12 | A stand-alone game of at most 2 minutes, with 6+ seeds each so formats are replayed, not exhausted. |
| **Destination** | 6 | Where the trip is going; the setting of the final Arrival scene. |
| **Reference** | 6 | Rules, casting, safety, the trait-icon key (print only). |

Card fields: `id` (stable; `W-`, `C-`, `H-`, `T-`, `U-`, `D-` + two digits), `suit`, `title` (≤ 24 chars), `prompt`
(≤ 14 words; Who ≤ 16), `tip` (optional, ≤ 12 words, shown on request, never read aloud), `skill` (one of 8),
`level` (`easy` / `stretch`), the three traits, optional `cue` (a static reminder phrase for How cards), optional
`warmup` config. Content lives in `src/content/cards.json` and is validated by tests, including a guarantee that the
Car and Out-and-about presets each leave at least 12 How, 8 Twist and 8 Warm-up cards and every Where, Who and
Destination.

Content rules: Who prompts are noun phrases ("A tour guide who…") so they can be read as "Ana, you're a tour guide
who…". Every want is something the Partner can give, refuse or complicate within ten seconds. Tone is dry, not cute.

## A trip

A trip has a **length**: Short (4 stops), Standard (6 stops) or Open road (no end until you choose to arrive).

1. **Deal the destination** ("the World's Largest Spoon"). Read aloud at the start.
2. **Stop 1 is a warm-up.**
3. **Middle stops are scenes.** A warm-up can replace any scene.
4. **After each scene, keep a souvenir** (optional): tap one card, or type a few words ("grandma pie lady").
5. **The last stop is the Arrival:** a scene set at the destination, in which the Opener must bring back one souvenir.
   Open road trips get an "Head for the destination" button instead.
6. **Postcard:** the destination, the cast and the souvenirs. Every completed stop counts as a mile toward a lifetime
   total, but the trip ends on the postcard, not on a number.

## A scene: two cast, the rest on deck

1. **Deal and read (≈20 s).** Where, then How (if any), then Who last, addressed by name: "Ana, you're a tour guide who
   needs you to…". One tap to hear it again. Any card can be swapped before the scene starts.
2. **Cast.** The app names the **Opener** (gets the Who) and the **Partner**. They alternate lines; no taps. Everyone
   else is **on deck**: at any moment they may walk on as a new character (one line saying who they are), or say
   "tag" and take over a role. Casting rotates: nobody sits out more than two scenes running, the Opener role is
   shared evenly, and partnerships vary. The Driver is never the Opener.
3. **Partner's first line says who they are to the Opener** ("Mum, the bus is leaving!").
4. **The want holds.** Nobody grants the Opener's want before the last line. Make it harder, stranger or more expensive
   instead.
5. **Landing.** A soft chime sounds 10 s before time. The Opener's next line is the last one: they get or lose the want
   in one sentence. Then everyone says "Scene!" together.
6. **Bank.** One tap. A scene that has started always banks; there is no scrap.

Scene lengths: 45 / 60 / 75 seconds, default 60.

### How staging

The first scene of every trip has no How. After that, only `easy` How cards are dealt until two scenes with a How
have been banked; then `stretch` Hows join if the Stretch filter is on.

### Twists

From the second scene on, every other scene carries a Twist, and never alongside a `stretch` How. The deal announces it
("a twist is coming"). It fires at 60% of the scene: chime, a one-second gap, then the voice reads only its title and
prompt. With the Director on, the Director can throw it earlier.

### Director (optional, off by default)

One on-deck player per scene (never the Driver; rotates) may swap one card before the scene, throw the Twist when they
choose, and call "Scene!" early. It exists to give a teen ownership.

## Safety and inclusion

- **Tag, don't freeze.** In a scene, say "tag" and someone takes over your role. "Pass" belongs to warm-ups.
- **Rewind.** Anyone can say "rewind" to redo a line, any line, including their own, for any reason. No explanation.
- Conflict stays sideways: blame the weather, the soup or the map, never each other. No romance, scares or
  humiliation. Real people present are never the joke.
- `voiceOnly` cards must never ask anyone to look, point, mime or hold anything.

## The app

- **Screens:** Play (setup → trip → postcard), Cards, Rules, Trips.
- **Phone-down play:** large type, dark screen, one primary action. Screen Wake Lock during a trip. Space bar = primary
  action.
- **Voice:** `speechSynthesis` behind a `Voice` interface, so a Capacitor implementation can drop in later. The voice
  never talks over a player: chime first, then a short gap.
- **Offline:** service worker. **Persistence:** localStorage, versioned; old saves that can't be migrated are dropped
  with a console note, never a crash.
- **Determinism:** pure, seeded engine in `src/game`, lint-enforced.

## Stack and delivery

Mirrors brendankowitz/towerdefense-body-game: Ionic React (iOS mode), React 19, react-router 5, Vite, strict
TypeScript, ESLint strictTypeChecked, Vitest, Playwright on a phone viewport, `npm run verify`, CI and a GitHub Pages
deploy workflow.

## Quality process

- Rules: Fable and Opus review independently; disagreements go to the owner (done for v2).
- Content: a writer drafts the deck; Fable and Opus each review every card for quality, fit, traits and voice-only
  safety; findings are merged and disagreements go to the owner.

## Later (not v1)

"Run it back" (replay the scene just played in 30 then 15 seconds), print pipeline (project 2), native iOS speech
(project 3).

## Anti-goals

A quiz or a chatbot that writes scenes for you. Anything that makes the driver look at the screen. Rounds that drag
past two minutes. Copy that is cute instead of clear. The phone-holder turned into a clerk.

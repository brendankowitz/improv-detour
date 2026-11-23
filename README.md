<div align="center">

<img src="public/favicon.svg" width="72" alt="" />

# Detour

**A family improv game you play out loud, wherever you are.**
Yes, and the long way.

[**▶ Play it**](https://brendankowitz.github.io/improv-detour/) · Ionic React · Vite · TypeScript

</div>

---

## The game

One phone deals a scene. Someone opens in character, everyone else says yes to it and adds one thing, and when the
timer runs out the last line lands it. Every finished scene is a mile for the whole group. Nobody wins, nobody
loses, and a round takes about a minute.

| Card | Colour | Job |
|---|---|---|
| **Where** | Guide green | A place you can stand in. Ordinary-strange, no plot attached. |
| **Who** | Recreation brown | The opener's character, and what they want. |
| **How** | Service blue | The rule for the scene: yes-and, questions only, last word first… |
| **Twist** | Detour orange | Lands halfway through a scene. Accept it and keep going. |
| **Warm-up** | Warning yellow | A quick stand-alone game, two minutes at most. |

The colours come from road signs, which already tell you a sign's job before you read it.

**Fit the space.** Tell the phone where you are and it only deals cards that work there. **Hands-free** keeps every
card playable by voice alone, so a driver can join without ever looking at the screen. **Seated** leaves out anything
that needs you to stand. **Quiet** leaves out cards that get loud.

**Phone-down play.** The phone reads each hand aloud, keeps the screen awake, chimes for twists and the final line,
and works offline once it has loaded.

## Running it

```bash
npm ci
npm run dev          # http://localhost:5173
```

```bash
npm run verify       # lint, typecheck, unit tests, production build
npm run test:e2e     # Playwright on a phone viewport, against the built app
```

Pushing to `main` deploys to GitHub Pages, after the same checks pass.

## How it's built

```
improv-detour/
├── src/
│   ├── game/          the rules: a pure, seeded engine (no React, no browser, no clock)
│   ├── content/       cards.json, the single source for the app and the printed deck
│   ├── app/
│   │   ├── pages/     Play, Cards, Rules, Trips
│   │   ├── play/      the round itself: setup, the hand, the timer, the read-aloud script
│   │   ├── components/ sign cards, toggles, the mile post
│   │   ├── platform/  browser edges: speech, chimes, screen wake lock
│   │   └── state/     the trip store, saved to this device only
│   ├── theme/         design tokens and styles
│   └── main.tsx
├── tests/e2e/         Playwright journeys
├── public/            icons
├── scripts/           build helpers (app icons)
└── docs/
    ├── superpowers/specs/   design documents
    └── sources/             the three original specs this game was distilled from
```

- **The engine is pure.** `src/game` is plain TypeScript that never reads the clock, the browser or `Math.random`;
  ESLint enforces this. Every deal is reproducible from a saved trip.
- **Content is data.** Cards live in `src/content/cards.json` and are validated on load and in tests: word budgets,
  ID format, one meaning per title, and no eyes-or-hands words on hands-free cards.
- **Nothing leaves the device.** No accounts, no analytics, no network once loaded. Trips are kept in local storage.

## Roadmap

1. **Polished web game.** In progress: [design](docs/superpowers/specs/2026-11-22-web-game-design.md).
2. **Printable deck** that plays as a card game on its own, generated from the same `cards.json`.
3. **Native iOS solo mode** with on-device speech: a spec first.

## Credits

Built on classic improv exercises: yes-and, one-word story, fortunately/unfortunately, questions only, Half-Life.
The Story Spine is Kenn Adams's; status work comes from Keith Johnstone's *Impro*. All card text is original.

## License

[MIT](LICENSE)

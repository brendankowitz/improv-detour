<div align="center">

<img src="public/favicon.svg" width="72" alt="" />

# Detour

**A family improv game you play out loud, wherever you are.**
Yes, and the long way.

[**▶ Play it**](https://brendankowitz.github.io/improv-detour/) · Ionic React (iOS) · Vite · TypeScript

</div>

---

## The game

A trip heads for a destination ("the World's Largest Spoon"). It opens with a warm-up, then plays one-minute
scenes. In each scene the phone casts two players: the **Opener** gets a character and a want, and the **Partner**
says who they are to them. Everyone else is on deck and can walk on or tag in. Nobody gives the Opener what they
want until the last line, and then everyone says "Scene!" After each scene you can keep a souvenir, and the final
stop is a scene at the destination where the Opener has to bring a souvenir back. It ends on a postcard.

| Card | Colour | Job |
|---|---|---|
| **Where** | Guide green | A place you can stand in, with one sound, smell or texture. |
| **Who** | Recreation brown | The Opener's character, and a want aimed at the Partner. |
| **How** | Service blue | The rule for the scene: yes-and, questions only, nature documentary… |
| **Twist** | Detour orange | A new fact that lands 60% of the way through. |
| **Warm-up** | Warning yellow | A quick stand-alone game, two minutes at most. |
| **Destination** | Interstate blue | Where the trip is going, and where it ends. |

The colours come from road signs, which already tell you a sign's job before you read it.

**Fit the space.** **Voice only** keeps every card playable by ear, and you can mark who's driving: the driver never
opens or lands a scene and can drop out by saying "driving". **Quiet** keeps it to a table voice. **Moving allowed**
adds cards where someone stands up.

**Phone-down play.** The phone reads each hand aloud, keeps the screen awake, chimes ten seconds before the end and
for twists, never talks over a player, and works offline once it has loaded.

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
│   ├── game/          the rules: a pure, seeded engine (trips, casting, dealing, the clock)
│   ├── content/       cards.json, the single source for the app and the printed deck
│   ├── app/
│   │   ├── pages/     Play, Cards, Rules, Trips
│   │   ├── play/      setup, the scene and warm-up views, the postcard, the read-aloud script
│   │   ├── components/ sign cards, settings lists
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
  ID format, unique titles, no eyes-or-hands words on voice-only cards, and a full game left under every preset.
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

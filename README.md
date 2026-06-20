# Meow Meow — Grandma's Cat Kitchen 🐱

A cozy-but-chaotic arcade game. Stray cats show up around the house, each one
hungry. **Grandma** — small, brown hair, glasses, and a comfy cardigan — bustles
across the kitchen to fix each one a bowl of food and carry it over. Feed them in
time, or the hungry little gremlin **explodes** 💥 (a small halo floats up;
they're in a better place now). It's a mobile-first, tap-to-play web game that
gets faster and harder the longer you survive. The catch: Grandma is in no hurry,
so her walking time is the whole challenge.

Built as a birthday gift. 🎂

## Play

It's just three taps:

1. **Tap the Cat Food** stack — Grandma walks over and pops open a can.
2. **Tap the Bowls** stack — she grabs a bowl. (Either order works: bowl first or
   food first, you still end up with a full bowl of cat food.)
3. **Tap a hungry cat** — she carries the bowl over and feeds it.

Watch the ring around each cat (its patience). Feed faster for a bigger speed
bonus, chain feeds for a combo multiplier — and don't let three cats go BOOM!
The pulsing highlight always points at what's useful to tap next.

Everything is drawn with code (no image assets) and all sound is synthesized,
so the whole game is tiny and works offline.

## Run locally

It's plain static files using ES modules, so it needs to be *served* (opening
`index.html` directly via `file://` won't load the modules). Any static server
works:

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/
```

To test the mobile experience, open your browser dev tools and switch to a
phone viewport with touch emulation.

## Deploy to GitHub Pages (so Mom can add it to her home screen)

A workflow at `.github/workflows/pages.yml` deploys the site automatically.

1. Merge this branch into `main`.
2. In the repo: **Settings → Pages → Source: “GitHub Actions”** (one-time).
3. The workflow runs on push to `main` and publishes to:
   **https://gam32bit.github.io/meowmeow/**
4. On her phone, open that link → browser menu → **Add to Home Screen**. It
   installs as a standalone, portrait app (a PWA) and works offline.

## Make it personal / change the difficulty

Almost everything lives in [`src/config.js`](src/config.js):

- `TITLE` / `SUBTITLE` — e.g. set `TITLE = "Mom's Cat Kitchen"`.
- `LIVES` — how many explosions you can survive (default 3).
- `GRANDMA` — how fast she walks (`speedFrac`) and how long each action takes
  (`actionTime`). Slower walking = harder; this is the main difficulty dial.
- `DIFFICULTY` — the spawn rate, patience, and max cats per level. Lower the
  numbers to make it gentler, raise them to make it brutal.
- `SCORE` — points, combo multiplier, speed bonus.
- `FEEL` — explosion screen-shake and flash intensity.

## Regenerate the app icons

The PWA icons are generated (no design tools needed):

```bash
node tools/make-icons.mjs   # writes assets/icon-192.png and icon-512.png
```

## Project layout

```
index.html              app shell
manifest.webmanifest    PWA manifest (installable)
sw.js                   service worker (offline cache)
css/style.css           full-bleed, no-scroll, touch-friendly
src/
  main.js               canvas + DPR setup, game loop, input, hooks, SW register
  config.js             ALL balance + personalization
  state.js              the game world + run reset
  spawner.js            cat spawning + difficulty ramp
  art.js                custom vector art (cats, Grandma, cans, bowls, explosions)
  entities/
    cat.js              cat patience / feed payoff / explosion
    grandma.js          the avatar: walking + carry/assemble/feed state machine
  systems/
    layout.js           responsive pixel layout (shared by render + input)
    render.js           draws the whole scene
    input.js            tap → Grandma command hit-testing
    audio.js            WebAudio SFX (synthesized)
    storage.js          high-score persistence
tools/make-icons.mjs    dependency-free PNG icon generator
```

No dependencies, no build step. Have fun, and may your cats stay un-exploded. 🐾

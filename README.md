# Meow Meow — Stray Cat Kitchen 🐱

A cozy-but-chaotic cooking arcade game. Stray cats show up around the house,
each wanting a dish. Cook it, serve it in time — or the hungry little gremlin
**explodes** 💥 (a small halo floats up; they're in a better place now). It's a
mobile-first, tap-to-play web game that gets faster and harder the longer you
survive. Feed cats, build combos, chase the high score.

Built as a birthday gift. 🎂

## Play

- **Tap a Bowl** to start a dish, then **tap ingredients** to fill it.
- Watch each cat's order bubble and the ring around it (its patience).
- When a plate matches a cat's order, **tap that cat** to serve it.
- Use the **two plating slots** to pre-make dishes — tap a slot to make it active.
- Tap **Trash** to dump a wrong dish. Don't let three cats explode!

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

- `TITLE` / `SUBTITLE` — e.g. set `TITLE = "Mom's Stray Cat Kitchen"`.
- `LIVES` — how many explosions you can survive (default 3).
- `PLATING_SLOTS` — how many dishes you can juggle at once (default 2).
- `RECIPES` / `INGREDIENTS` — add or change dishes and what goes in them.
- `DIFFICULTY` — the spawn rate, patience, max cats, and recipe unlocks per
  level. Lower the numbers to make it gentler, raise them to make it brutal.
- `SCORE` — points, combo multiplier, speed bonus.

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
  art.js                custom vector art (cats, dishes, icons, explosions)
  entities/
    cat.js              cat order/patience/feed/explosion
    station.js          cooking actions + recipe matching
  systems/
    layout.js           responsive pixel layout (shared by render + input)
    render.js           draws the whole scene
    input.js            tap → action hit-testing
    audio.js            WebAudio SFX (synthesized)
    storage.js          high-score persistence
tools/make-icons.mjs    dependency-free PNG icon generator
```

No dependencies, no build step. Have fun, and may your cats stay un-exploded. 🐾

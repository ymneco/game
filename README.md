# DEATH RUN - Time Attack Action

A hardcore 2D/3D platformer with unfair traps, instant deaths, and time attack scoring. Inspired by classic troll platformers.

## How to Play

**URL**: After deploying, visit `https://<username>.github.io/<repo-name>/`

### Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | WASD / Arrow Keys | Left Stick |
| Jump | Space / Z | A Button (Cross) |
| Camera (3D only) | Mouse | Right Stick |

### Stages

| Stage | Theme | Difficulty |
|---|---|---|
| Stage 1 | Grassland | Easy |
| Stage 2 | Ruins / Dungeon | Normal |
| Stage 3 | Desert Ruins (3D) | Normal |
| Stage 4 | Lava Castle | Hard |
| Stage 5 | Space Station (3D) | Hard |

### Gameplay
- Timer starts when you enter a stage and never stops (even on death)
- Deaths are expected - learn the traps and find safe routes
- Clear time + death count determine your rank (S/A/B/C)
- Best times are saved to local storage

## Tech Stack
- **TypeScript** + **Vite**
- **Phaser 3** (2D stages)
- **Three.js** (3D stages)
- Keyboard + Gamepad API

## Development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Push to a GitHub repository
2. In repo Settings > Pages > Source, select `gh-pages` branch
3. The GitHub Action will auto-deploy on push to `main`
4. Update `base` in `vite.config.ts` if needed: `base: '/<repo-name>/'`

## Build

```bash
npm run build
```

Output goes to `dist/`.

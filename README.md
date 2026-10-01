# 🌞 Three.js Solar System Demo

A web-based interactive 3D solar system built with **Three.js**.

## Features

- ☀️ Glowing sun with procedural surface texture
- 🪐 All 8 planets with procedural textures and axial tilts
- 🌙 Moons orbiting Earth, Mars, Jupiter and Saturn
- 💍 Saturn & Uranus rings
- ⭕ Orbit path lines
- ☄️ Asteroid belt
- 🌌 6,000-star background
- 🏷️ Screen-space planet labels
- 🎯 Click a planet (or use the chip list) to focus the camera on it
- ⏸ Pause/play, simulation speed and camera distance sliders
- 📐 Optional "relative planet sizes" toggle
- 🌙 Light / dark UI theme
- 📱 Responsive: control panel becomes a bottom sheet with mobile nav

## Running

It's a static site — but because it uses ES modules + an import map, you need
to serve it over HTTP (opening `index.html` via `file://` won't work).

```bash
# Option 1: Python
python -m http.server 8080

# Option 2: Node
npx serve .
```

Then open <http://localhost:8080>.

## Controls

| Action | Input |
| --- | --- |
| Orbit camera | Left-drag |
| Zoom | Scroll wheel / pinch |
| Pan | Right-drag |
| Pause / resume | `Space` or ⏸ button |
| Toggle labels | `L` or 🏷 button |
| Toggle orbits | `O` or ⭁ button |
| Focus planet | Click a planet or a chip |

## Structure

```
/
├── index.html        # markup, import map
├── css/style.css     # UI styling, light/dark themes, responsive
└── js/main.js        # Three.js scene, bodies, textures, UI wiring
```

## Notes

- Distances and sizes are artistically compressed so everything is visible at once.
- Planet textures are generated at runtime with `<canvas>` — no external image assets.
- Three.js is loaded from the unpkg CDN via an import map (no build step needed).

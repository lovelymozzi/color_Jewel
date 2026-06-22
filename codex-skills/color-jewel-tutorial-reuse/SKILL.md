---
name: color-jewel-tutorial-reuse
description: Reuse the Color Jewel pinch and pan onboarding flow in future browser games. Use when Codex needs to extract, adapt, or recreate a reusable gesture tutorial layer from this project, especially pinch or zoom guidance, wheel-zoom onboarding, and pan guidance for draggable boards or cameras. Trigger on requests to add pinch guidance, zoom tutorial UI, pan tutorial UI, or carry the Color Jewel gesture tutorial into another project.
---

# Color Jewel Tutorial Reuse

Use this skill as the reusable starter for the gesture tutorial flow currently implemented in Color Jewel. Start from the template assets in `assets/web-overlay-template/`, then read the references for the adaptation rules and original source map.

## Workflow

1. Copy the gesture tutorial assets from `assets/web-overlay-template/`.
2. Rename the template hooks to match the target game's state model instead of forcing the game to adopt Color Jewel names.
3. Keep tutorial rendering inside one overlay surface mounted in the board or stage container.
4. Rewire the tutorial to the target game's own render loop plus zoom or pan hooks.
5. Reset gesture-tutorial state whenever the target game loads a fresh tutorial scene or stage.

## Resource Order

- Read `references/reuse-playbook.md` first for the gesture-only integration checklist.
- Read `references/color-jewel-source-map.md` when you need exact origin points in this repo.
- Copy the starter files from `assets/web-overlay-template/` when implementing pinch and pan onboarding in a new game.

## Component Guide

### Gesture Guide

Use `tutorial-overlay-controller.template.js` and `tutorial-overlay.css` when the target game needs zoom, pinch, wheel, or pan onboarding. The template preserves the current Color Jewel flow: zoom in, zoom out, then pan.

## Integration Notes

- If the target project uses SceneRenderer contracts, mount the tutorial overlay next to the scene host and treat the contracts as read-only.
- If the target project has no scene system, keep the overlay outside the board DOM that gets zoomed or panned so the tutorial UI remains stable.
- Preserve the separation between gesture-tutorial progression and the main move rules. The tutorial should observe camera or board movement, not fork the whole game loop.

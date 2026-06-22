# Color Jewel Gesture Tutorial Source Map

Use this file when you need exact source locations from the current project.

## HTML mount

- `index.html:20-23`: tutorial overlay host inside `.board-stage`

## CSS

- `game.css:1478-1591`: tutorial overlay classes, gesture guide, and gesture toast
- `game.css:1913-1923`: compact viewport overrides for gesture guide and toast

## Runtime constants and state

- `game.js:552-568`: gesture-guide asset paths and ordered tutorial steps
- `game.js:3542-3544`: scale and pan thresholds
- `game.js:3644-3673`: tutorial overlay frame handle and runtime state objects

## Gesture progression

- `game.js:3702-3796`: reset tutorial guide state, switch steps, track zoom completion, track pan completion

## Overlay lifecycle

- `game.js:8650-8845`: overlay cleanup, gesture-guide rendering, and frame scheduling

## Source assets

- `src/assets/hand_ani.png`: zoom gesture art
- `src/assets/hand1.png`: pan gesture art

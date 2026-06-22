# Gesture Tutorial Reuse Playbook

## Contents

1. Scope the gesture tutorial
2. Mount the overlay host
3. Wire the runtime hooks
4. Adapt the gesture flow
5. Reuse with SceneRenderer-based games
6. Copy checklist

## 1. Scope the gesture tutorial

This trimmed skill only keeps the Color Jewel gesture onboarding:

- Gesture guide: teach zoom and pan before the player moves pieces.

Do not add board hints, item locks, or reward intros from the older broader skill shape. This version is only for pinch, wheel-zoom, and pan onboarding.

## 2. Mount the overlay host

Color Jewel keeps the tutorial UI in a dedicated overlay layer inside the board stage. Reuse that pattern.

Checklist:

1. Mount `<div class="tutorial-layer" id="tutorialLayer">` inside the visual stage container.
2. Keep the overlay outside the board element that scales or pans.
3. Keep `pointer-events: none` by default.
4. Use a single cleanup path that clears gesture guides and toasts.

Starter files:

- `assets/web-overlay-template/index-snippet.html`
- `assets/web-overlay-template/tutorial-overlay.css`

## 3. Wire the runtime hooks

The templates assume the target game can provide:

- `isTutorialStageActive()`
- `isSolved()`
- `isAnimating()`
- `getBoardInteraction()`
- `scheduleRender()` or an equivalent frame hook

Adapt the template names if the game already has better local names.

Integration order:

1. Reset tutorial state when a tutorial stage loads.
2. Call the gesture-scale hook immediately after every zoom update.
3. Call the gesture-pan hook immediately after every pan update.
4. Re-render the tutorial overlay after layout changes or tutorial-state changes.
5. Clear the overlay when the stage is solved, no gesture slice is active, or the session changes.

## 4. Adapt the gesture flow

### Gesture guide

Color Jewel uses a three-step flow:

1. Show pinch or wheel guidance.
2. Wait for a positive scale delta.
3. Wait for a negative scale delta.
4. Switch to the pan guide.
5. End the guide after the player pans far enough.

The template preserves these thresholds:

- scale delta: `0.08`
- pan distance: `28px`

Adjust them only if the target game's camera sensitivity is very different.

## 5. Reuse with SceneRenderer-based games

If the target game uses ui-editor scenes and `SceneRenderer`:

1. Keep scene contracts read-only.
2. Mount the tutorial overlay beside the scene host, not inside contract-managed layers.
3. Use `renderer.getElement()` only when the tutorial guide needs to align with an existing scene image or button.
4. Push scene bindings with `renderer.update()` before `show()` if the tutorial state changes visible scene text or counts.

Do not rebuild a published scene in ad hoc HTML or CSS.

## 6. Copy checklist

Copy these files first:

- `assets/web-overlay-template/index-snippet.html`
- `assets/web-overlay-template/tutorial-overlay.css`
- `assets/web-overlay-template/tutorial-overlay-controller.template.js`
- `assets/web-overlay-template/hand_ani.png`
- `assets/web-overlay-template/hand1.png`

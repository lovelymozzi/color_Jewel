export const TUTORIAL_GESTURE_SCALE_DELTA_THRESHOLD = 0.08;
export const TUTORIAL_GESTURE_PAN_THRESHOLD_PX = 28;

export const TUTORIAL_GESTURE_GUIDE_STEPS = Object.freeze([
    { id: "pinch_ani", assetPath: "./hand_ani.png" },
    { id: "tuto_pan", assetPath: "./hand1.png" }
]);

export function createTutorialOverlayState() {
    return {
        overlayFrame: null,
        gestureGuideState: {
            stepId: TUTORIAL_GESTURE_GUIDE_STEPS[0].id,
            pinchPhase: "zoom_in",
            pinchReferenceScale: 1,
            panOriginX: 0,
            panOriginY: 0
        }
    };
}

export function resetTutorialGestureGuideState(ctx, state) {
    const interaction = ctx.getBoardInteraction();
    state.gestureGuideState = {
        stepId: ctx.isTutorialStageActive() ? TUTORIAL_GESTURE_GUIDE_STEPS[0].id : null,
        pinchPhase: "zoom_in",
        pinchReferenceScale: interaction.scale,
        panOriginX: interaction.panX,
        panOriginY: interaction.panY
    };
}

export function setTutorialGestureGuideStep(ctx, state, nextStepId) {
    if (state.gestureGuideState.stepId === nextStepId) {
        return;
    }
    const interaction = ctx.getBoardInteraction();
    state.gestureGuideState.stepId = nextStepId;
    state.gestureGuideState.pinchPhase = nextStepId === "pinch_ani" ? "zoom_in" : state.gestureGuideState.pinchPhase;
    state.gestureGuideState.pinchReferenceScale = interaction.scale;
    state.gestureGuideState.panOriginX = interaction.panX;
    state.gestureGuideState.panOriginY = interaction.panY;
    scheduleTutorialOverlayRender(ctx, state);
}

export function isTutorialGestureGuideActive(ctx, state) {
    return (
        ctx.isTutorialStageActive() &&
        !ctx.isSolved() &&
        !ctx.isAnimating() &&
        typeof state.gestureGuideState.stepId === "string" &&
        state.gestureGuideState.stepId.length > 0
    );
}

export function advanceTutorialGestureGuideScale(ctx, state, previousScale, nextScale) {
    if (!isTutorialGestureGuideActive(ctx, state)) {
        return;
    }

    if (
        state.gestureGuideState.stepId === "pinch_ani" &&
        state.gestureGuideState.pinchPhase === "zoom_in" &&
        nextScale > previousScale &&
        nextScale - state.gestureGuideState.pinchReferenceScale >= TUTORIAL_GESTURE_SCALE_DELTA_THRESHOLD
    ) {
        ctx.playConfirmSound?.();
        state.gestureGuideState.pinchPhase = "zoom_out";
        state.gestureGuideState.pinchReferenceScale = nextScale;
        return;
    }

    if (
        state.gestureGuideState.stepId === "pinch_ani" &&
        state.gestureGuideState.pinchPhase === "zoom_out" &&
        nextScale < previousScale &&
        state.gestureGuideState.pinchReferenceScale - nextScale >= TUTORIAL_GESTURE_SCALE_DELTA_THRESHOLD
    ) {
        ctx.playConfirmSound?.();
        setTutorialGestureGuideStep(ctx, state, "tuto_pan");
    }
}

export function advanceTutorialGestureGuidePan(ctx, state) {
    if (state.gestureGuideState.stepId !== "tuto_pan") {
        return;
    }

    const interaction = ctx.getBoardInteraction();
    if (
        Math.hypot(
            interaction.panX - state.gestureGuideState.panOriginX,
            interaction.panY - state.gestureGuideState.panOriginY
        ) >= TUTORIAL_GESTURE_PAN_THRESHOLD_PX
    ) {
        ctx.playConfirmSound?.();
        setTutorialGestureGuideStep(ctx, state, null);
    }
}

export function clearTutorialOverlay(ctx, state) {
    if (state.overlayFrame) {
        window.cancelAnimationFrame(state.overlayFrame);
        state.overlayFrame = null;
    }
    const overlay = ctx.getTutorialLayerElement();
    overlay.style.pointerEvents = "none";
    overlay.innerHTML = "";
}

export function renderTutorialOverlay(ctx, state) {
    const overlay = ctx.getTutorialLayerElement();
    overlay.innerHTML = "";

    if (!isTutorialGestureGuideActive(ctx, state)) {
        return;
    }

    const stepMeta = TUTORIAL_GESTURE_GUIDE_STEPS.find(
        (entry) => entry.id === state.gestureGuideState.stepId
    );
    if (!stepMeta) {
        return;
    }

    const guide = document.createElement("div");
    guide.className = `tutorial-gesture-guide tutorial-gesture-guide--${stepMeta.id.replaceAll("_", "-")}`;

    const image = document.createElement("img");
    image.className = "tutorial-gesture-guide-image";
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.decoding = "sync";
    image.loading = "eager";
    image.src = stepMeta.assetPath;
    guide.append(image);

    const toast = document.createElement("div");
    toast.className = "tutorial-gesture-toast";

    const copy = document.createElement("div");
    copy.className = "tutorial-gesture-toast-copy";
    copy.textContent =
        stepMeta.id === "pinch_ani"
            ? ctx.getZoomGuideMessage?.() || "Zoom in and out to inspect the board."
            : ctx.getPanGuideMessage?.() || "Drag the board to move it into view.";
    toast.append(copy);

    const stageRect = ctx.getStageElement().getBoundingClientRect();
    const stageCenterX = Math.round(stageRect.width / 2);
    const stageCenterY = Math.round(stageRect.height / 2);
    toast.style.left = `${stageCenterX}px`;
    toast.style.top = `${Math.round(stageCenterY + 82)}px`;

    if (stepMeta.id === "pinch_ani") {
        guide.style.left = `${stageCenterX}px`;
        guide.style.top = `${Math.round(stageCenterY - 162)}px`;
    }

    overlay.append(guide, toast);
}

export function scheduleTutorialOverlayRender(ctx, state) {
    if (!ctx.isTutorialStageActive()) {
        clearTutorialOverlay(ctx, state);
        return;
    }

    if (state.overlayFrame) {
        window.cancelAnimationFrame(state.overlayFrame);
    }

    state.overlayFrame = window.requestAnimationFrame(() => {
        state.overlayFrame = null;
        renderTutorialOverlay(ctx, state);
    });
}

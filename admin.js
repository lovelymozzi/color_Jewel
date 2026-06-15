const pixelAdminMarkup = `
<button class="pixel-admin-toggle" id="pixelAdminToggle" type="button" aria-controls="pixelAdmin" aria-expanded="false">
        픽셀 어드민
    </button>

    <aside class="pixel-admin" id="pixelAdmin" aria-hidden="true">
        <div class="pixel-admin-resize-handle" id="pixelAdminResizeHandle" aria-hidden="true"></div>
        <div class="pixel-admin-header">
            <div>
                <p class="pixel-admin-eyebrow">어드민</p>
                <h2 class="pixel-admin-title">픽셀 맵 에디터</h2>
                <p class="pixel-admin-stage" id="pixelAdminStage">현재 스테이지 픽셀 맵</p>
            </div>
            <button class="pixel-admin-close" id="pixelAdminClose" type="button" aria-label="픽셀 어드민 닫기">닫기</button>
        </div>

        <label class="pixel-admin-field pixel-admin-stage-editor" for="pixelAdminTitleInput">
            <span class="pixel-admin-field-label">제목</span>
            <input class="pixel-admin-input" id="pixelAdminTitleInput" type="text" maxlength="24" placeholder="스테이지 제목" />
        </label>

        <p class="pixel-admin-help" id="pixelAdminHelp">최대 30x30 캔버스를 편집할 수 있습니다. 색을 골라 칠하고, 오른쪽 클릭으로 지울 수 있어요. \`#\`는 자동으로 붙습니다.</p>
        <p class="pixel-admin-selection" id="pixelAdminSelection">선택된 색상</p>
        <div class="pixel-admin-palette-tools">
            <button class="pixel-admin-action" id="pixelAdminAddColor" type="button" aria-label="색상 추가">+</button>
            <button class="pixel-admin-action" id="pixelAdminErase" type="button" aria-label="지우개">E</button>
        </div>
        <div class="pixel-admin-color-editor">
            <label class="pixel-admin-field" for="pixelAdminColorHexText">
                <span class="pixel-admin-field-label">HEX 코드</span>
                <input class="pixel-admin-input" id="pixelAdminColorHexText" type="text" maxlength="6" placeholder="FFFFFF" inputmode="text" />
            </label>
            <label class="pixel-admin-field" for="pixelAdminColorHexPicker">
                <span class="pixel-admin-field-label">선택</span>
                <input class="pixel-admin-color-input" id="pixelAdminColorHexPicker" type="color" value="#ffffff" />
            </label>
        </div>
        <div class="pixel-admin-palette" id="pixelAdminPalette"></div>

        <div class="pixel-admin-grid-shell">
            <div class="pixel-admin-axis-corner" aria-hidden="true"></div>
            <div class="pixel-admin-axis pixel-admin-axis-horizontal" aria-hidden="true">
                <div class="pixel-admin-axis-track" id="pixelAdminAxisTop"></div>
            </div>
            <div class="pixel-admin-axis-corner" aria-hidden="true"></div>
            <div class="pixel-admin-axis pixel-admin-axis-vertical" aria-hidden="true">
                <div class="pixel-admin-axis-track" id="pixelAdminAxisLeft"></div>
            </div>
            <div class="pixel-admin-grid-wrap" id="pixelAdminGridWrap">
                <div class="pixel-admin-grid" id="pixelAdminGrid"></div>
            </div>
            <div class="pixel-admin-axis pixel-admin-axis-vertical" aria-hidden="true">
                <div class="pixel-admin-axis-track" id="pixelAdminAxisRight"></div>
            </div>
            <div class="pixel-admin-axis-corner" aria-hidden="true"></div>
            <div class="pixel-admin-axis pixel-admin-axis-horizontal" aria-hidden="true">
                <div class="pixel-admin-axis-track" id="pixelAdminAxisBottom"></div>
            </div>
            <div class="pixel-admin-axis-corner" aria-hidden="true"></div>
            <div class="pixel-admin-grid-resize-bar" id="pixelAdminGridResizeBar" aria-hidden="true"></div>
        </div>

        <div class="pixel-admin-actions">
            <button class="pixel-admin-action" id="pixelAdminApply" type="button">스테이지 적용</button>
            <button class="pixel-admin-action" id="pixelAdminStageClear" type="button">스테이지 클리어</button>
            <button class="pixel-admin-action" id="pixelAdminReload" type="button">현재값 다시 불러오기</button>
            <button class="pixel-admin-action" id="pixelAdminRestore" type="button">기본값 복원</button>
            <button class="pixel-admin-action" id="pixelAdminCopy" type="button">매트릭스 복사</button>
            <button class="pixel-admin-action" id="pixelAdminPreviousLevel" type="button">이전 레벨</button>
            <button class="pixel-admin-action" id="pixelAdminNextLevel" type="button">다음 레벨</button>
        </div>

        <div class="pixel-admin-export-toolbar">
            <p class="pixel-admin-export-label">코드값</p>
            <button class="pixel-admin-action pixel-admin-copy-mini" id="pixelAdminCopyMini" type="button">복사</button>
        </div>
        <textarea class="pixel-admin-export" id="pixelAdminExport" spellcheck="false"></textarea>
        <p class="pixel-admin-note" id="pixelAdminMessage">\`Shift + A\`로 어드민을 열고 닫을 수 있습니다.</p>
    </aside>
`;

if (!document.getElementById("pixelAdminToggle")) {
    document.body.insertAdjacentHTML("beforeend", pixelAdminMarkup);
}

const PIXEL_ADMIN_UNDO_LIMIT = 60;

const PIXEL_ADMIN_STAGE_STORAGE_KEY = "color_jewel_pixel_admin_stage_overrides_v1";

const PIXEL_ADMIN_AUTO_SAVE_DELAY_MS = 500;

function buildStageCanvasMapFromBase(definition) {
            const rawScaledMap = scaleMap(definition.baseImageMap, definition.scale ?? 1);
            const scaledTargetMap = definition.balancedColors
                ? balanceShapeColors(rawScaledMap, definition.colorSeed ?? 0)
                : rawScaledMap;
            return padMapToGrid(scaledTargetMap).map;
        }

        function getNonZeroMapBounds(...maps) {
            let minRow = Number.POSITIVE_INFINITY;
            let maxRow = Number.NEGATIVE_INFINITY;
            let minCol = Number.POSITIVE_INFINITY;
            let maxCol = Number.NEGATIVE_INFINITY;
            let rowCount = 0;
            let colCount = 0;

            maps.forEach((sourceMap) => {
                if (!Array.isArray(sourceMap) || !sourceMap.length || !Array.isArray(sourceMap[0])) {
                    return;
                }

                rowCount = Math.max(rowCount, sourceMap.length);
                colCount = Math.max(colCount, sourceMap[0].length || 0);

                sourceMap.forEach((row, rowIndex) => {
                    row.forEach((cell, colIndex) => {
                        if (!cell) {
                            return;
                        }

                        minRow = Math.min(minRow, rowIndex);
                        maxRow = Math.max(maxRow, rowIndex);
                        minCol = Math.min(minCol, colIndex);
                        maxCol = Math.max(maxCol, colIndex);
                    });
                });
            });

            if (!Number.isFinite(minRow) || !Number.isFinite(minCol)) {
                return {
                    minRow: 0,
                    maxRow: Math.max(0, rowCount - 1),
                    minCol: 0,
                    maxCol: Math.max(0, colCount - 1)
                };
            }

            return {
                minRow,
                maxRow,
                minCol,
                maxCol
            };
        }

        function cropMapToBounds(sourceMap, bounds) {
            if (!Array.isArray(sourceMap) || !sourceMap.length) {
                return [];
            }

            return sourceMap
                .slice(bounds.minRow, bounds.maxRow + 1)
                .map((row) => row.slice(bounds.minCol, bounds.maxCol + 1));
        }

        function getStageEditorCanvasMap(definition) {
            if (!definition) {
                return [];
            }

            const sourceMapRef = definition.adminTargetMap || definition.baseImageMap || null;
            const cachedSignature = definition.__cachedStageEditorCanvasMapSignature;
            const cachedMap = definition.__cachedStageEditorCanvasMap;
            if (
                cachedMap &&
                cachedSignature &&
                cachedSignature.sourceMapRef === sourceMapRef &&
                cachedSignature.scale === definition.scale &&
                cachedSignature.balancedColors === definition.balancedColors &&
                cachedSignature.colorSeed === definition.colorSeed &&
                cachedSignature.overrideVersion === definition.overrideVersion
            ) {
                return clonePixelMap(cachedMap);
            }

            const nextMap = definition.adminTargetMap
                ? clonePixelMap(definition.adminTargetMap)
                : buildStageCanvasMapFromBase(definition);
            definition.__cachedStageEditorCanvasMap = nextMap;
            definition.__cachedStageEditorCanvasMapSignature = {
                sourceMapRef,
                scale: definition.scale,
                balancedColors: definition.balancedColors,
                colorSeed: definition.colorSeed,
                overrideVersion: definition.overrideVersion
            };
            return clonePixelMap(nextMap);
        }

        function getMapDefinitionById(mapId) {
            return MAP_DEFINITIONS.find((definition) => definition.id === mapId) || null;
        }

        function normalizeStageDisplayName(value) {
            return String(value || "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 24);
        }

        function getStageOverrideVersion(definitionOrMapId) {
            const definition =
                typeof definitionOrMapId === "string"
                    ? getMapDefinitionById(definitionOrMapId)
                    : definitionOrMapId;
            return Math.max(1, Number(definition?.overrideVersion) || 1);
        }

        function getStageResolvedDisplayName(definition) {
            return (
                normalizeStageDisplayName(definition?.adminDisplayName) ||
                normalizeStageDisplayName(definition?.displayName) ||
                String(definition?.id || "").toUpperCase()
            );
        }

        function getStageStartMessage(definition) {
            const title = getStageResolvedDisplayName(definition);
            const template =
                (typeof definition?.startMessageTemplate === "string" && definition.startMessageTemplate.trim()) ||
                definition?.startMessage ||
                "배경색을 보면서 보석을 제자리로 정리해 보세요.";
            return template.includes("{title}") ? template.replaceAll("{title}", title) : template;
        }

        function normalizeStoredPixelAdminMap(rawMap) {
            if (!Array.isArray(rawMap) || !rawMap.length) {
                return null;
            }

            const rows = rawMap.map((row) => {
                if (!Array.isArray(row) || !row.length) {
                    return null;
                }

                return row.map((cell) => {
                    const normalized = Number(cell);
                    return Number.isInteger(normalized) && normalized >= 0 ? normalized : null;
                });
            });

            if (rows.some((row) => !row)) {
                return null;
            }

            const columnCount = rows[0].length;
            if (
                !columnCount ||
                rows.length > MAX_GRID_ROWS ||
                columnCount > MAX_GRID_COLS ||
                rows.some((row) => row.length !== columnCount || row.some((cell) => cell == null))
            ) {
                return null;
            }

            return rows;
        }

        function normalizeStoredPixelAdminPalette(rawPalette) {
            if (!rawPalette || typeof rawPalette !== "object" || Array.isArray(rawPalette)) {
                return {};
            }

            return Object.fromEntries(
                Object.entries(rawPalette)
                    .map(([colorId, colorMeta]) => {
                        const normalizedColorId = Number(colorId);
                        const normalizedColor = normalizeHexColor(
                            typeof colorMeta === "string" ? colorMeta : colorMeta?.color
                        );

                        if (!Number.isInteger(normalizedColorId) || normalizedColorId <= 0 || !normalizedColor) {
                            return null;
                        }

                        return [normalizedColorId, { color: normalizedColor }];
                    })
                    .filter(Boolean)
            );
        }

function readPixelAdminStageStorage() {
            if (pixelAdminStageStorageCache) {
                return pixelAdminStageStorageCache;
            }

            try {
                const rawValue = window.localStorage.getItem(PIXEL_ADMIN_STAGE_STORAGE_KEY);
                if (!rawValue) {
                    pixelAdminStageStorageCache = {};
                    return pixelAdminStageStorageCache;
                }

                const parsed = JSON.parse(rawValue);
                pixelAdminStageStorageCache =
                    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
                return pixelAdminStageStorageCache;
            } catch (error) {
                pixelAdminStageStorageCache = {};
                return pixelAdminStageStorageCache;
            }
        }

        function writePixelAdminStageStorage(storagePayload) {
            try {
                if (!storagePayload || !Object.keys(storagePayload).length) {
                    window.localStorage.removeItem(PIXEL_ADMIN_STAGE_STORAGE_KEY);
                    pixelAdminStageStorageCache = {};
                    return true;
                }

                window.localStorage.setItem(
                    PIXEL_ADMIN_STAGE_STORAGE_KEY,
                    JSON.stringify(storagePayload)
                );
                pixelAdminStageStorageCache = storagePayload;
                return true;
            } catch (error) {
                return false;
            }
        }

function persistPixelAdminStageOverride(definition) {
            if (!definition?.id) {
                return false;
            }

            const storagePayload = readPixelAdminStageStorage();
            storagePayload[definition.id] = {
                sourceSignature: definition.sourceSignature || null,
                overrideVersion: getStageOverrideVersion(definition),
                displayName: normalizeStageDisplayName(definition.adminDisplayName) || null,
                map: clonePixelMap(definition.adminTargetMap || buildStageCanvasMapFromBase(definition)),
                palette: clonePaletteMeta(definition.adminPalette || {})
            };

            pixelAdminStageStorageNeedsFlush = true;
            if (pixelAdminStageStorageFlushTimer) {
                window.clearTimeout(pixelAdminStageStorageFlushTimer);
            }
            pixelAdminStageStorageFlushTimer = window.setTimeout(() => {
                pixelAdminStageStorageFlushTimer = null;
                if (!pixelAdminStageStorageNeedsFlush) {
                    return;
                }
                if (writePixelAdminStageStorage(readPixelAdminStageStorage())) {
                    pixelAdminStageStorageNeedsFlush = false;
                }
            }, 220);
            return true;
        }

        function clearPersistedPixelAdminStageOverride(mapId) {
            if (!mapId) {
                return false;
            }

            const storagePayload = readPixelAdminStageStorage();
            if (!(mapId in storagePayload)) {
                return true;
            }

            delete storagePayload[mapId];
            pixelAdminStageStorageNeedsFlush = true;
            if (pixelAdminStageStorageFlushTimer) {
                window.clearTimeout(pixelAdminStageStorageFlushTimer);
            }
            pixelAdminStageStorageFlushTimer = window.setTimeout(() => {
                pixelAdminStageStorageFlushTimer = null;
                if (!pixelAdminStageStorageNeedsFlush) {
                    return;
                }
                if (writePixelAdminStageStorage(readPixelAdminStageStorage())) {
                    pixelAdminStageStorageNeedsFlush = false;
                }
            }, 220);
            return true;
        }

        function loadPersistedPixelAdminStageOverrides() {
            const storagePayload = readPixelAdminStageStorage();
            let didMutateStorage = false;

            Object.entries(storagePayload).forEach(([mapId, override]) => {
                const definition = getMapDefinitionById(mapId);
                if (!definition || !override || typeof override !== "object") {
                    delete storagePayload[mapId];
                    didMutateStorage = true;
                    return;
                }

                if ((Number(override.overrideVersion) || 1) !== getStageOverrideVersion(definition)) {
                    delete storagePayload[mapId];
                    didMutateStorage = true;
                    return;
                }

                if ((override.sourceSignature || null) !== (definition.sourceSignature || null)) {
                    delete storagePayload[mapId];
                    didMutateStorage = true;
                    return;
                }

                const normalizedMap = normalizeStoredPixelAdminMap(override.map);
                if (!normalizedMap) {
                    delete storagePayload[mapId];
                    didMutateStorage = true;
                    return;
                }

                const normalizedPalette = normalizeStoredPixelAdminPalette(override.palette);
                const stagePalette = clonePaletteMeta(
                    Object.keys(definition.themeOverridePalette || {}).length
                        ? definition.themeOverridePalette
                        : definition.palette || {}
                );
                const normalizedPaletteEntries = Object.entries(normalizedPalette);
                const normalizedPaletteLooksLegacyDefault =
                    normalizedPaletteEntries.length > 0 &&
                    normalizedPaletteEntries.every(([colorId, colorMeta]) => {
                        const overrideColor = normalizeHexColor(
                            typeof colorMeta === "string" ? colorMeta : colorMeta?.color
                        );
                        const defaultColor = normalizeHexColor(DEFAULT_COLOR_PALETTE[colorId]?.color);
                        return overrideColor && defaultColor && overrideColor === defaultColor;
                    });
                const stagePaletteDiffersFromDefault = Object.entries(stagePalette).some(([colorId, colorMeta]) => {
                    const stageColor = normalizeHexColor(typeof colorMeta === "string" ? colorMeta : colorMeta?.color);
                    const defaultColor = normalizeHexColor(DEFAULT_COLOR_PALETTE[colorId]?.color);
                    return stageColor && stageColor !== defaultColor;
                });

                definition.adminTargetMap = clonePixelMap(normalizedMap);
                definition.adminPalette =
                    stagePaletteDiffersFromDefault && normalizedPaletteLooksLegacyDefault
                        ? clonePaletteMeta(stagePalette)
                        : normalizedPalette;
                definition.adminDisplayName = normalizeStageDisplayName(override.displayName) || null;

                if (stagePaletteDiffersFromDefault && normalizedPaletteLooksLegacyDefault) {
                    storagePayload[mapId] = {
                        ...override,
                        palette: clonePaletteMeta(stagePalette)
                    };
                    didMutateStorage = true;
                }
            });

            if (didMutateStorage) {
                writePixelAdminStageStorage(storagePayload);
            }
        }

        function clearPixelAdminAutoSaveTimer() {
            if (!pixelAdminAutoSaveTimer) {
                return;
            }

            window.clearTimeout(pixelAdminAutoSaveTimer);
            pixelAdminAutoSaveTimer = null;
        }

        function persistPixelAdminDraftState(options = {}) {
            const { showFailureMessage = false, shouldRender = true } = options;
            const definition = getMapDefinitionById(pixelAdminState.currentMapId) || getCurrentMapDefinition();

            clearPixelAdminAutoSaveTimer();

            if (!definition || !pixelAdminState.draftMap) {
                return false;
            }

            if (!pixelAdminState.isDirty && !pixelAdminState.exportIsDirty) {
                return true;
            }

            try {
                syncPixelAdminDraftFromExportInput();
            } catch (error) {
                if (showFailureMessage) {
                    pixelAdminState.message = error.message || "자동 저장에 실패했어요.";
                    renderPixelAdmin();
                }
                return false;
            }

            definition.adminTargetMap = clonePixelMap(pixelAdminState.draftMap);
            definition.adminPalette = clonePaletteMeta(pixelAdminState.draftPalette);
            definition.adminDisplayName =
                normalizeStageDisplayName(pixelAdminState.draftDisplayName) ||
                normalizeStageDisplayName(definition.displayName) ||
                null;

            const didPersist = persistPixelAdminStageOverride(definition);
            if (didPersist) {
                pixelAdminState.isDirty = false;
                if (shouldRender) {
                    renderPixelAdmin();
                }
                return true;
            }

            if (showFailureMessage) {
                pixelAdminState.message = "자동 저장에 실패했어요.";
                renderPixelAdmin();
            }

            return false;
        }

        function schedulePixelAdminAutoSave(delayMs = PIXEL_ADMIN_AUTO_SAVE_DELAY_MS) {
            clearPixelAdminAutoSaveTimer();

            if (!pixelAdminState.currentMapId || !pixelAdminState.draftMap) {
                return;
            }

            pixelAdminAutoSaveTimer = window.setTimeout(() => {
                pixelAdminAutoSaveTimer = null;
                persistPixelAdminDraftState();
            }, delayMs);
        }

function getMapDisplayName(mapId) {
            const definition = getMapDefinitionById(mapId);
            return definition ? getStageResolvedDisplayName(definition) : String(mapId || "").toUpperCase();
        }

        function getDefaultPixelAdminColorLabel(mapId, colorId) {
            return `C${colorId}`;
        }

        function getStagePaletteMeta(definition, sourceMap = getStageEditorCanvasMap(definition), paletteOverride = null) {
            const adminPalette = definition.adminPalette || {};
            const stagePalette =
                Object.keys(definition.themeOverridePalette || {}).length
                    ? definition.themeOverridePalette
                    : definition.palette || {};
            const colorIds = new Set();

            sourceMap.forEach((row) => {
                row.forEach((colorId) => {
                    if (colorId) colorIds.add(colorId);
                });
            });

            Object.keys(stagePalette).forEach((colorId) => {
                if (Number(colorId)) {
                    colorIds.add(Number(colorId));
                }
            });

            Object.keys(adminPalette).forEach((colorId) => {
                if (Number(colorId)) {
                    colorIds.add(Number(colorId));
                }
            });

            Object.keys(paletteOverride || {}).forEach((colorId) => {
                if (Number(colorId)) {
                    colorIds.add(Number(colorId));
                }
            });

            return Object.fromEntries(
                [...colorIds]
                    .sort((left, right) => left - right)
                    .map((colorId) => [
                        colorId,
                        {
                            color:
                                normalizeHexColor(
                                    typeof paletteOverride?.[colorId] === "string"
                                        ? paletteOverride[colorId]
                                        : paletteOverride?.[colorId]?.color
                                ) ||
                                normalizeHexColor(
                                    typeof adminPalette[colorId] === "string"
                                        ? adminPalette[colorId]
                                        : adminPalette[colorId]?.color
                                ) ||
                                normalizeHexColor(
                                    typeof stagePalette[colorId] === "string"
                                        ? stagePalette[colorId]
                                        : stagePalette[colorId]?.color
                                ) ||
                                normalizeHexColor(MAP_THEME_OVERRIDES[definition.id]?.palette?.[colorId]) ||
                                normalizeHexColor(DEFAULT_COLOR_PALETTE[colorId]?.color) ||
                                "#CCCCCC"
                        }
                    ])
            );
        }

const PIXEL_ADMIN_CHEAT_HOLD_MS = 650;

const pixelAdminElement = document.getElementById("pixelAdmin");
        const pixelAdminToggleElement = document.getElementById("pixelAdminToggle");
        const pixelAdminCloseElement = document.getElementById("pixelAdminClose");
        const pixelAdminStageElement = document.getElementById("pixelAdminStage");
        const pixelAdminTitleInputElement = document.getElementById("pixelAdminTitleInput");
        const pixelAdminHelpElement = document.getElementById("pixelAdminHelp");
        const pixelAdminSelectionElement = document.getElementById("pixelAdminSelection");
        const pixelAdminAddColorElement = document.getElementById("pixelAdminAddColor");
        const pixelAdminEraseElement = document.getElementById("pixelAdminErase");
        const pixelAdminColorHexTextElement = document.getElementById("pixelAdminColorHexText");
        const pixelAdminColorHexPickerElement = document.getElementById("pixelAdminColorHexPicker");
        const pixelAdminPaletteElement = document.getElementById("pixelAdminPalette");
        const pixelAdminGridWrapElement = document.getElementById("pixelAdminGridWrap");
        const pixelAdminGridShellElement = pixelAdminGridWrapElement?.parentElement || null;
        const pixelAdminGridResizeBarElement = document.getElementById("pixelAdminGridResizeBar");
        const pixelAdminAxisTopElement = document.getElementById("pixelAdminAxisTop");
        const pixelAdminAxisBottomElement = document.getElementById("pixelAdminAxisBottom");
        const pixelAdminAxisLeftElement = document.getElementById("pixelAdminAxisLeft");
        const pixelAdminAxisRightElement = document.getElementById("pixelAdminAxisRight");
        const pixelAdminGridElement = document.getElementById("pixelAdminGrid");
        const pixelAdminApplyElement = document.getElementById("pixelAdminApply");
        const pixelAdminStageClearElement = document.getElementById("pixelAdminStageClear");
        const pixelAdminReloadElement = document.getElementById("pixelAdminReload");
        const pixelAdminRestoreElement = document.getElementById("pixelAdminRestore");
        const pixelAdminCopyElement = document.getElementById("pixelAdminCopy");
        const pixelAdminCopyMiniElement = document.getElementById("pixelAdminCopyMini");
        const pixelAdminPreviousLevelElement = document.getElementById("pixelAdminPreviousLevel");
        const pixelAdminNextLevelElement = document.getElementById("pixelAdminNextLevel");
        const pixelAdminResizeHandleElement = document.getElementById("pixelAdminResizeHandle");
        const pixelAdminExportElement = document.getElementById("pixelAdminExport");
        const pixelAdminMessageElement = document.getElementById("pixelAdminMessage");

let pixelAdminToggleHoldTimer = null;
let suppressPixelAdminToggleClick = false;
let pixelAdminAutoSaveTimer = null;
let pixelAdminStageStorageCache = null;
let pixelAdminStageStorageFlushTimer = null;
let pixelAdminStageStorageNeedsFlush = false;

const pixelAdminState = {
            isOpen: false,
            currentMapId: null,
            draftMap: null,
            draftPalette: {},
            draftDisplayName: "",
            selectedColorId: 0,
            canvasZoom: 1,
            canvasMetrics: null,
            gridShellMinHeight: 220,
            panelWidth: null,
            undoStack: [],
            isDirty: false,
            exportIsDirty: false,
            exportNeedsRefresh: true,
            renderedPaletteKey: "",
            renderedGridMapId: "",
            renderedGridSizeKey: "",
            renderedGridMapRef: null,
            renderedGridPaletteKey: "",
            pendingGameReset: null,
            deferHeavyRender: false,
            deferredHeavyRenderTimer: null,
            message: "`Shift + A`로 어드민을 열고 닫을 수 있습니다."
        };
        const pixelAdminInteraction = {
            isDrawing: false,
            drawColorId: null,
            strokeSnapshot: null,
            lastPaintedCellKey: null,
            pendingMessage: "",
            didPaint: false
        };
        const pixelAdminResize = {
            isActive: false,
            startX: 0,
            startWidth: 0
        };
        const pixelAdminGridResize = {
            isActive: false,
            startY: 0,
            startHeight: 220
        };

function getPixelAdminPaletteIds(mapId, sourceMap, paletteMeta = {}) {
            const colorIds = new Set(
                Object.keys(paletteMeta)
                    .map((colorId) => Number(colorId))
                    .filter((colorId) => Number.isInteger(colorId) && colorId > 0)
            );

            sourceMap.forEach((row) => {
                row.forEach((colorId) => {
                    if (colorId) colorIds.add(colorId);
                });
            });

            return [...colorIds].sort((left, right) => left - right);
        }

        function getPixelAdminBaseColorIds(mapId) {
            const definition = getMapDefinitionById(mapId);
            if (!definition) {
                return [];
            }

            const colorIds = new Set();
            buildStageCanvasMapFromBase(definition).forEach((row) => {
                row.forEach((colorId) => {
                    if (colorId) {
                        colorIds.add(colorId);
                    }
                });
            });

            return [...colorIds].sort((left, right) => left - right);
        }

        function canRemovePixelAdminColor(mapId, colorId) {
            if (colorId === 0) {
                return false;
            }

            return true;
        }

        function getPixelAdminColorHex(mapId, colorId, paletteMeta = null) {
            if (colorId === 0) {
                return "#FFFFFF";
            }

            const definition = getMapDefinitionById(mapId);
            const stagePalette =
                definition && Object.keys(definition.themeOverridePalette || {}).length
                    ? definition.themeOverridePalette
                    : definition?.palette || {};

            return (
                normalizeHexColor(typeof paletteMeta?.[colorId] === "string" ? paletteMeta[colorId] : paletteMeta?.[colorId]?.color) ||
                normalizeHexColor(
                    typeof definition?.adminPalette?.[colorId] === "string"
                        ? definition.adminPalette[colorId]
                        : definition?.adminPalette?.[colorId]?.color
                ) ||
                normalizeHexColor(typeof stagePalette?.[colorId] === "string" ? stagePalette[colorId] : stagePalette?.[colorId]?.color) ||
                MAP_THEME_OVERRIDES[mapId]?.palette?.[colorId] ||
                COLOR_PALETTE[colorId]?.color ||
                DEFAULT_COLOR_PALETTE[colorId]?.color ||
                "#FFFFFF"
            );
        }

        function getPixelAdminColorLabel(mapId, colorId, paletteMeta = null) {
            if (colorId === 0) {
                return "지우개";
            }

            return getDefaultPixelAdminColorLabel(mapId, colorId);
        }

        function getPixelAdminDefaultExportBaseName(mapId) {
            return mapId.toUpperCase();
        }

        function normalizePixelAdminExportBaseName(value) {
            return String(value || "")
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .replace(/_+/g, "_")
                .slice(0, 48);
        }

        function getPixelAdminTitleFromExportBaseName(value) {
            const normalized = normalizePixelAdminExportBaseName(value)
                .replace(/^EDITABLE_/, "")
                .replace(/_(?:IMAGE_MAP|MATRIX|PALETTE)$/, "");
            return normalizeStageDisplayName(normalized.replace(/_/g, " "));
        }

        function getPixelAdminExportBaseName(mapId, displayName = "") {
            const normalizedFromTitle = normalizePixelAdminExportBaseName(displayName);
            if (normalizedFromTitle) {
                return normalizedFromTitle;
            }

            return getPixelAdminDefaultExportBaseName(mapId);
        }

        function getPixelAdminExportName(mapId, displayName = "") {
            if (mapId === "apple") {
                return "EDITABLE_APPLE_MATRIX";
            }

            return `${getPixelAdminExportBaseName(mapId, displayName)}_IMAGE_MAP`;
        }

        function getResolvedPixelAdminSelection(mapId, currentSelection, sourceMap, paletteMeta = {}) {
            const paletteIds = getPixelAdminPaletteIds(mapId, sourceMap, paletteMeta);
            if (paletteIds.includes(currentSelection)) {
                return currentSelection;
            }

            return paletteIds[0] ?? 0;
        }

        function serializePixelAdminMap(mapId, sourceMap, paletteMeta = {}, displayName = "") {
            if (!sourceMap.length) {
                return "";
            }

            const paletteIds = getPixelAdminPaletteIds(mapId, sourceMap, paletteMeta);
            const exportBaseName = getPixelAdminExportBaseName(mapId, displayName);
            const paletteRows = paletteIds
                .map((colorId) => {
                    const colorHex = getPixelAdminColorHex(mapId, colorId, paletteMeta);
                    return `    ${colorId}: "${escapeJsString(colorHex)}"`;
                })
                .join(",\n");

            const rows = sourceMap.map((row) => `    [${row.join(", ")}]`).join(",\n");
            const paletteBlock = paletteRows
                ? `const ${exportBaseName}_PALETTE = {\n${paletteRows}\n};\n\n`
                : "";
            return `${paletteBlock}const ${getPixelAdminExportName(mapId, displayName)} = [\n${rows}\n];`;
        }

        function extractPixelAdminExportBaseName(source, mapId) {
            const paletteNameMatch = source.match(/const\s+([A-Z0-9_]+)_PALETTE\s*=\s*\{/);
            const preferredMatrixName = getPixelAdminExportName(mapId);
            const matrixNameMatch =
                source.match(new RegExp(`const\\s+(${preferredMatrixName}|[A-Z0-9_]+)\\s*=\\s*\\[`)) ||
                source.match(/const\s+([A-Z0-9_]+)\s*=\s*\[/);
            const rawName = matrixNameMatch?.[1] || paletteNameMatch?.[1] || "";
            return normalizePixelAdminExportBaseName(rawName)
                .replace(/^EDITABLE_/, "")
                .replace(/_(?:IMAGE_MAP|MATRIX|PALETTE)$/, "");
        }

        function parsePixelAdminPaletteBlock(block) {
            const palette = {};
            const entryMatches = [...block.matchAll(/(\d+)\s*:\s*["']([^"']+)["']/g)];

            if (!entryMatches.length && block.trim()) {
                throw new Error("팔레트 코드 형식을 이해하지 못했어요.");
            }

            entryMatches.forEach((match) => {
                const colorId = Number(match[1]);
                if (colorId === 0) {
                    throw new Error("C0은 빈칸 전용이에요. 밝은 영역도 C1 이상의 색상으로 넣어 주세요.");
                }
                const normalized = normalizeHexColor(match[2]);
                if (!normalized) {
                    throw new Error(`C${colorId} 색상은 6자리 HEX여야 해요.`);
                }
                palette[colorId] = { color: normalized };
            });

            return palette;
        }

        function parsePixelAdminMatrixBlock(block) {
            const rowMatches = [...block.matchAll(/\[([^\[\]]*?)\]/g)];

            if (!rowMatches.length) {
                throw new Error("매트릭스 행을 찾지 못했어요.");
            }

            const rows = rowMatches.map((match) => {
                const row = match[1]
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                    .map((value) => {
                        if (!/^-?\d+$/.test(value)) {
                            throw new Error(`숫자가 아닌 셀이 있어요: ${value}`);
                        }
                        return Number(value);
                    });

                if (!row.length) {
                    throw new Error("비어 있는 행이 있어요.");
                }

                return row;
            });

            const columnCount = rows[0].length;
            if (rows.some((row) => row.length !== columnCount)) {
                throw new Error("모든 행의 칸 수가 같아야 해요.");
            }

            if (rows.length > MAX_GRID_ROWS || columnCount > MAX_GRID_COLS) {
                throw new Error(`매트릭스가 너무 커요. 최대 ${MAX_GRID_ROWS}x${MAX_GRID_COLS}까지 가능해요.`);
            }

            return rows;
        }

        function parsePixelAdminExport(text, mapId) {
            const source = String(text || "").trim();
            if (!source) {
                throw new Error("코드 창이 비어 있어요.");
            }

            const paletteMatch = source.match(/const\s+[A-Z0-9_]+_PALETTE\s*=\s*\{([\s\S]*?)\};/);
            const matrixName = getPixelAdminExportName(mapId);
            const matrixMatch =
                source.match(new RegExp(`const\\s+${matrixName}\\s*=\\s*\\[([\\s\\S]*?)\\];`)) ||
                source.match(/const\s+[A-Z0-9_]+\s*=\s*\[([\s\S]*?)\];/);

            if (!matrixMatch) {
                throw new Error("매트릭스 const 블록을 찾지 못했어요.");
            }

            const draftPalette = paletteMatch ? parsePixelAdminPaletteBlock(paletteMatch[1]) : {};
            const draftMap = parsePixelAdminMatrixBlock(matrixMatch[1]);
            const exportBaseName = extractPixelAdminExportBaseName(source, mapId);

            return {
                draftPalette,
                draftMap,
                draftDisplayName: getPixelAdminTitleFromExportBaseName(exportBaseName)
            };
        }

function syncPixelAdminDraftFromExportInput() {
            if (!pixelAdminExportElement || !pixelAdminState.exportIsDirty) {
                return true;
            }

            const parsed = parsePixelAdminExport(pixelAdminExportElement.value, pixelAdminState.currentMapId);
            pixelAdminState.draftMap = clonePixelMap(parsed.draftMap);
            pixelAdminState.draftPalette = clonePaletteMeta(parsed.draftPalette);
            pixelAdminState.undoStack = [];
            pixelAdminInteraction.strokeSnapshot = null;
            if (parsed.draftDisplayName) {
                pixelAdminState.draftDisplayName = parsed.draftDisplayName;
            }
            pixelAdminState.selectedColorId = getResolvedPixelAdminSelection(
                pixelAdminState.currentMapId,
                pixelAdminState.selectedColorId,
                pixelAdminState.draftMap,
                pixelAdminState.draftPalette
            );
            pixelAdminState.isDirty = true;
            pixelAdminState.exportIsDirty = false;
            pixelAdminState.exportNeedsRefresh = false;
            return true;
        }

        function getSuggestedPixelAdminHex(nextColorId) {
            const presets = ["#E58585", "#E4C681", "#40B697", "#66A8DE", "#B9A7EC", "#E793B0", "#DFA86D", "#8ABDE6"];
            return normalizeHexColor(presets[(nextColorId - 1) % presets.length]) || "#CCCCCC";
        }

        function getNextPixelAdminColorId(sourceMap, paletteMeta = {}) {
            const colorIds = getPixelAdminPaletteIds("", sourceMap, paletteMeta);
            return (colorIds[colorIds.length - 1] || 0) + 1;
        }

        function updateSelectedPixelAdminColorDraft(patch) {
            if (pixelAdminState.selectedColorId === 0) {
                return;
            }

            const colorId = pixelAdminState.selectedColorId;
            const currentColor = pixelAdminState.draftPalette[colorId] || {
                color: getSuggestedPixelAdminHex(colorId)
            };
            const nextColor =
                patch.color !== undefined
                    ? normalizeHexColor(patch.color) || currentColor.color
                    : currentColor.color;

            pixelAdminState.draftPalette[colorId] = {
                color: nextColor
            };
            pixelAdminState.isDirty = true;
            pixelAdminState.exportNeedsRefresh = true;
            pixelAdminState.message = `${getDefaultPixelAdminColorLabel(pixelAdminState.currentMapId, colorId)} 색상을 수정했어요.`;
            schedulePixelAdminAutoSave();
            renderPixelAdmin();
        }

        function updatePixelAdminStageTitleDraft(nextValue) {
            const definition = getMapDefinitionById(pixelAdminState.currentMapId);
            if (!definition) {
                return;
            }

            pixelAdminState.draftDisplayName = String(nextValue || "").slice(0, 24);
            pixelAdminState.isDirty = true;
            pixelAdminState.exportNeedsRefresh = true;
            pixelAdminState.message = "스테이지 제목을 수정했어요. 잠시 후 자동 저장됩니다.";
            schedulePixelAdminAutoSave(700);
            renderPixelAdmin();
        }

        function addPixelAdminColor() {
            const nextColorId = getNextPixelAdminColorId(pixelAdminState.draftMap || [], pixelAdminState.draftPalette);
            pixelAdminState.draftPalette[nextColorId] = {
                color: getSuggestedPixelAdminHex(nextColorId)
            };
            pixelAdminState.selectedColorId = nextColorId;
            pixelAdminState.isDirty = true;
            pixelAdminState.exportNeedsRefresh = true;
            pixelAdminState.message = `C${nextColorId} 색상을 팔레트에 추가했어요.`;
            schedulePixelAdminAutoSave();
            renderPixelAdmin();
        }

        function removePixelAdminColor(colorId) {
            const mapId = pixelAdminState.currentMapId;
            if (!pixelAdminState.draftMap || !canRemovePixelAdminColor(mapId, colorId)) {
                return;
            }

            let erasedCellCount = 0;
            pixelAdminState.draftMap = pixelAdminState.draftMap.map((row) =>
                row.map((cellColorId) => {
                    if (cellColorId !== colorId) {
                        return cellColorId;
                    }

                    erasedCellCount += 1;
                    return 0;
                })
            );
            delete pixelAdminState.draftPalette[colorId];
            pixelAdminState.undoStack = [];
            pixelAdminInteraction.strokeSnapshot = null;
            pixelAdminState.selectedColorId = getResolvedPixelAdminSelection(
                mapId,
                pixelAdminState.selectedColorId === colorId ? 0 : pixelAdminState.selectedColorId,
                pixelAdminState.draftMap,
                pixelAdminState.draftPalette
            );
            pixelAdminState.isDirty = true;
            pixelAdminState.exportNeedsRefresh = true;
            pixelAdminState.message = erasedCellCount
                ? `C${colorId} 색상을 삭제하고 ${erasedCellCount}개 셀을 비웠어요.`
                : `C${colorId} 색상을 팔레트에서 삭제했어요.`;
            schedulePixelAdminAutoSave();
            renderPixelAdmin();
        }

        function syncPixelAdminWithActiveMap(force = false, shouldRender = true) {
            if (!pixelAdminElement) {
                return;
            }

            clearPixelAdminAutoSaveTimer();

            const definition = getCurrentMapDefinition();
            if (!definition) {
                return;
            }

            if (!force && pixelAdminState.currentMapId === definition.id && pixelAdminState.draftMap) {
                if (shouldRender) {
                    renderPixelAdmin();
                }
                return;
            }

            pixelAdminState.currentMapId = definition.id;
            pixelAdminState.draftMap = getStageEditorCanvasMap(definition);
            pixelAdminState.draftPalette = clonePaletteMeta(getStagePaletteMeta(definition, pixelAdminState.draftMap));
            pixelAdminState.draftDisplayName = getStageResolvedDisplayName(definition);
            pixelAdminState.canvasZoom = 1;
            pixelAdminState.canvasMetrics = null;
            pixelAdminState.undoStack = [];
            pixelAdminState.selectedColorId = getResolvedPixelAdminSelection(
                definition.id,
                pixelAdminState.selectedColorId,
                pixelAdminState.draftMap,
                pixelAdminState.draftPalette
            );
            pixelAdminState.isDirty = false;
            pixelAdminState.exportIsDirty = false;
            pixelAdminState.exportNeedsRefresh = true;
            pixelAdminState.message = "`Shift + A`로 어드민을 열고 닫을 수 있습니다.";
            pixelAdminInteraction.strokeSnapshot = null;
            if (shouldRender) {
                renderPixelAdmin();
            }
        }

        function setPixelAdminOpen(nextOpen) {
            pixelAdminState.isOpen = nextOpen;
            if (nextOpen) {
                syncPixelAdminWithActiveMap();
                syncActiveMap(currentMapIndex, {
                    syncPixelAdmin: false,
                    renderPixelAdmin: false,
                    prepareUpcomingMap: false
                });
                return;
            }
            if (pixelAdminState.deferredHeavyRenderTimer) {
                window.clearTimeout(pixelAdminState.deferredHeavyRenderTimer);
                pixelAdminState.deferredHeavyRenderTimer = null;
            }
            pixelAdminState.deferHeavyRender = false;
            stopPixelAdminGridResize();
            if (pixelAdminState.pendingGameReset) {
                const pendingGameReset = pixelAdminState.pendingGameReset;
                pixelAdminState.pendingGameReset = null;
                resetGame({
                    ...pendingGameReset,
                    skipRender: false
                });
            } else {
                render();
                persistRuntimeSnapshot();
            }
            renderPixelAdmin();
        }

        function isCompactPixelAdminLayout() {
            return window.matchMedia("(max-width: 540px)").matches;
        }

        function getPixelAdminWidthRange() {
            const minWidth = 340;
            const maxWidth = Math.max(minWidth, window.innerWidth - 24);
            return { minWidth, maxWidth };
        }

        function applyPixelAdminPanelWidth() {
            if (!pixelAdminElement) {
                return;
            }

            if (isCompactPixelAdminLayout()) {
                pixelAdminElement.style.removeProperty("--pixel-admin-width");
                pixelAdminElement.classList.toggle("resizing", false);
                return;
            }

            const { minWidth, maxWidth } = getPixelAdminWidthRange();
            const fallbackWidth = Math.min(390, maxWidth);
            const resolvedWidth = Math.max(
                minWidth,
                Math.min(maxWidth, pixelAdminState.panelWidth ?? fallbackWidth)
            );

            pixelAdminState.panelWidth = resolvedWidth;
            pixelAdminElement.style.setProperty("--pixel-admin-width", `${resolvedWidth}px`);
            pixelAdminElement.classList.toggle("resizing", pixelAdminResize.isActive);
        }

        function applyPixelAdminGridShellSize() {
            if (!pixelAdminGridShellElement) {
                return;
            }

            const minHeight = 220;
            const maxHeight = Math.max(minHeight, Math.round(window.innerHeight * 1.35));
            const resolvedHeight = clampNumber(pixelAdminState.gridShellMinHeight || minHeight, minHeight, maxHeight);
            pixelAdminState.gridShellMinHeight = resolvedHeight;
            pixelAdminGridShellElement.style.setProperty("--pixel-admin-grid-shell-min-height", `${resolvedHeight}px`);
            pixelAdminElement?.classList.toggle("grid-resizing", pixelAdminGridResize.isActive);
        }

        function startPixelAdminResize(event) {
            if (!pixelAdminElement || isCompactPixelAdminLayout()) {
                return;
            }

            event.preventDefault();
            pixelAdminResize.isActive = true;
            pixelAdminResize.startX = event.clientX;
            pixelAdminResize.startWidth = pixelAdminElement.getBoundingClientRect().width;
            pixelAdminElement.classList.add("resizing");
        }

        function updatePixelAdminResize(event) {
            if (!pixelAdminResize.isActive) {
                return;
            }

            const dragOffset = pixelAdminResize.startX - event.clientX;
            pixelAdminState.panelWidth = pixelAdminResize.startWidth + dragOffset;
            applyPixelAdminPanelWidth();
            if (pixelAdminState.isOpen && pixelAdminState.draftMap?.[0]?.length) {
                syncPixelAdminGridMetrics(pixelAdminState.draftMap[0].length, pixelAdminState.draftMap.length);
            }
        }

        function startPixelAdminGridResize(event) {
            if (!pixelAdminGridShellElement || isCompactPixelAdminLayout()) {
                return;
            }

            event.preventDefault();
            pixelAdminGridResize.isActive = true;
            pixelAdminGridResize.startY = event.clientY;
            pixelAdminGridResize.startHeight = pixelAdminGridShellElement.getBoundingClientRect().height;
            pixelAdminElement?.classList.add("grid-resizing");
        }

        function updatePixelAdminGridResize(event) {
            if (!pixelAdminGridResize.isActive) {
                return;
            }

            const dragOffset = event.clientY - pixelAdminGridResize.startY;
            pixelAdminState.gridShellMinHeight = pixelAdminGridResize.startHeight + dragOffset;
            applyPixelAdminGridShellSize();
        }

        function stopPixelAdminResize(event) {
            if (!pixelAdminResize.isActive) {
                return;
            }

            pixelAdminResize.isActive = false;
            pixelAdminElement?.classList.remove("resizing");
            applyPixelAdminPanelWidth();
        }

        function stopPixelAdminGridResize() {
            if (!pixelAdminGridResize.isActive) {
                pixelAdminElement?.classList.remove("grid-resizing");
                return;
            }

            pixelAdminGridResize.isActive = false;
            pixelAdminElement?.classList.remove("grid-resizing");
            applyPixelAdminGridShellSize();
        }

        function syncPixelAdminGridMetrics(columnCount, rowCount = pixelAdminState.draftMap?.length || 0) {
            if (!pixelAdminGridElement || !pixelAdminGridWrapElement || !columnCount || !rowCount) {
                return null;
            }

            const wrapStyles = window.getComputedStyle(pixelAdminGridWrapElement);
            const horizontalPadding =
                Number.parseFloat(wrapStyles.paddingLeft || "0") +
                Number.parseFloat(wrapStyles.paddingRight || "0");
            const paddingLeft = Number.parseFloat(wrapStyles.paddingLeft || "0");
            const paddingTop = Number.parseFloat(wrapStyles.paddingTop || "0");
            const availableWidth = Math.max(0, pixelAdminGridWrapElement.clientWidth - horizontalPadding);
            const gap = 1;
            const gridChrome = 4;
            const gridInset = 2;
            const baseCellSize = Math.max(2, (availableWidth - gridChrome - gap * (columnCount - 1)) / columnCount);
            const effectiveZoom = pixelAdminState.canvasZoom || 1;
            const cellSize = Math.max(2, baseCellSize * effectiveZoom);
            const contentWidth = columnCount * cellSize + gap * (columnCount - 1);
            const contentHeight = rowCount * cellSize + gap * (rowCount - 1);
            const gridWidth = contentWidth + gridChrome;
            const gridHeight = contentHeight + gridChrome;
            const centeredOffsetX = Math.max(0, (availableWidth - gridWidth) / 2);
            const axisOffsetX = paddingLeft + centeredOffsetX + gridInset;
            const axisOffsetY = paddingTop + gridInset;

            pixelAdminGridElement.style.setProperty("--pixel-admin-cols", columnCount);
            pixelAdminGridElement.style.setProperty("--pixel-admin-rows", rowCount);
            pixelAdminGridElement.style.setProperty("--pixel-admin-cell-size", `${cellSize}px`);
            pixelAdminGridElement.style.width = `${gridWidth}px`;
            pixelAdminGridElement.style.height = `${gridHeight}px`;

            [
                pixelAdminAxisTopElement,
                pixelAdminAxisBottomElement,
                pixelAdminAxisLeftElement,
                pixelAdminAxisRightElement
            ].forEach((axisElement) => {
                if (!axisElement) return;
                axisElement.style.setProperty("--pixel-admin-cols", columnCount);
                axisElement.style.setProperty("--pixel-admin-rows", rowCount);
                axisElement.style.setProperty("--pixel-admin-cell-size", `${cellSize}px`);
            });

            if (pixelAdminAxisTopElement) pixelAdminAxisTopElement.style.width = `${contentWidth}px`;
            if (pixelAdminAxisBottomElement) pixelAdminAxisBottomElement.style.width = `${contentWidth}px`;
            if (pixelAdminAxisLeftElement) pixelAdminAxisLeftElement.style.height = `${contentHeight}px`;
            if (pixelAdminAxisRightElement) pixelAdminAxisRightElement.style.height = `${contentHeight}px`;

            pixelAdminState.canvasMetrics = {
                baseCellSize,
                cellSize,
                gridWidth,
                gridHeight,
                contentWidth,
                contentHeight,
                axisOffsetX,
                axisOffsetY
            };
            syncPixelAdminAxisScroll();
            return pixelAdminState.canvasMetrics;
        }

        function renderPixelAdminAxes(rowCount, columnCount) {
            if (
                !pixelAdminAxisTopElement ||
                !pixelAdminAxisBottomElement ||
                !pixelAdminAxisLeftElement ||
                !pixelAdminAxisRightElement
            ) {
                return;
            }

            const axisKey = `${rowCount}x${columnCount}`;
            if (pixelAdminAxisTopElement.dataset.axisKey === axisKey) {
                syncPixelAdminAxisScroll();
                return;
            }

            const buildCells = (count) =>
                Array.from({ length: count }, (_, index) => `<span class="pixel-admin-axis-cell">${index + 1}</span>`).join("");

            const horizontalMarkup = buildCells(columnCount);
            const verticalMarkup = buildCells(rowCount);

            pixelAdminAxisTopElement.innerHTML = horizontalMarkup;
            pixelAdminAxisBottomElement.innerHTML = horizontalMarkup;
            pixelAdminAxisLeftElement.innerHTML = verticalMarkup;
            pixelAdminAxisRightElement.innerHTML = verticalMarkup;
            pixelAdminAxisTopElement.dataset.axisKey = axisKey;
            pixelAdminAxisBottomElement.dataset.axisKey = axisKey;
            pixelAdminAxisLeftElement.dataset.axisKey = axisKey;
            pixelAdminAxisRightElement.dataset.axisKey = axisKey;
            syncPixelAdminAxisScroll();
        }

        function syncPixelAdminAxisScroll() {
            if (!pixelAdminGridWrapElement) {
                return;
            }

            const canvasMetrics = pixelAdminState.canvasMetrics;
            const offsetX = (canvasMetrics?.axisOffsetX || 0) - pixelAdminGridWrapElement.scrollLeft;
            const offsetY = (canvasMetrics?.axisOffsetY || 0) - pixelAdminGridWrapElement.scrollTop;

            if (pixelAdminAxisTopElement) {
                pixelAdminAxisTopElement.style.transform = `translateX(${offsetX}px)`;
            }
            if (pixelAdminAxisBottomElement) {
                pixelAdminAxisBottomElement.style.transform = `translateX(${offsetX}px)`;
            }
            if (pixelAdminAxisLeftElement) {
                pixelAdminAxisLeftElement.style.transform = `translateY(${offsetY}px)`;
            }
            if (pixelAdminAxisRightElement) {
                pixelAdminAxisRightElement.style.transform = `translateY(${offsetY}px)`;
            }
        }

        function getPixelAdminWheelZoomIntent(event) {
            if (event.ctrlKey) {
                return true;
            }

            return Math.abs(event.deltaY) >= 30;
        }

        function setPixelAdminCanvasZoom(nextZoom, options = {}) {
            if (!pixelAdminGridWrapElement || !pixelAdminState.draftMap?.[0]?.length) {
                return;
            }

            const { anchorClientX = null, anchorClientY = null } = options;
            const previousMetrics = syncPixelAdminGridMetrics(
                pixelAdminState.draftMap[0].length,
                pixelAdminState.draftMap.length
            );
            const wrapRect = pixelAdminGridWrapElement.getBoundingClientRect();
            const anchorX = anchorClientX == null ? wrapRect.left + wrapRect.width / 2 : anchorClientX;
            const anchorY = anchorClientY == null ? wrapRect.top + wrapRect.height / 2 : anchorClientY;
            const localX = anchorX - wrapRect.left;
            const localY = anchorY - wrapRect.top;
            const previousGridWidth = previousMetrics?.gridWidth || pixelAdminGridElement.scrollWidth || 1;
            const previousGridHeight = previousMetrics?.gridHeight || pixelAdminGridElement.scrollHeight || 1;
            const anchorRatioX = (pixelAdminGridWrapElement.scrollLeft + localX) / previousGridWidth;
            const anchorRatioY = (pixelAdminGridWrapElement.scrollTop + localY) / previousGridHeight;

            pixelAdminState.canvasZoom = Math.max(0.2, Math.min(10, nextZoom));
            const nextMetrics = syncPixelAdminGridMetrics(
                pixelAdminState.draftMap[0].length,
                pixelAdminState.draftMap.length
            );

            if (!nextMetrics) {
                return;
            }

            pixelAdminGridWrapElement.scrollLeft = Math.max(0, anchorRatioX * nextMetrics.gridWidth - localX);
            pixelAdminGridWrapElement.scrollTop = Math.max(0, anchorRatioY * nextMetrics.gridHeight - localY);
        }

        function zoomPixelAdminCanvasByWheel(event) {
            if (!getPixelAdminWheelZoomIntent(event)) {
                return;
            }

            event.preventDefault();
            const zoomDelta = event.ctrlKey ? event.deltaY * 0.0025 : event.deltaY * 0.0016;
            const scaleFactor = Math.exp(-zoomDelta);
            setPixelAdminCanvasZoom((pixelAdminState.canvasZoom || 1) * scaleFactor, {
                anchorClientX: event.clientX,
                anchorClientY: event.clientY
            });
        }

        function togglePixelAdmin() {
            setPixelAdminOpen(!pixelAdminState.isOpen);
        }

        function clearPixelAdminToggleHoldTimer() {
            if (!pixelAdminToggleHoldTimer) {
                return;
            }

            window.clearTimeout(pixelAdminToggleHoldTimer);
            pixelAdminToggleHoldTimer = null;
        }

        function startPixelAdminToggleHold(event) {
            if (event.button != null && event.button !== 0) {
                return;
            }

            suppressPixelAdminToggleClick = false;
            clearPixelAdminToggleHoldTimer();
            pixelAdminToggleHoldTimer = window.setTimeout(() => {
                pixelAdminToggleHoldTimer = null;
                suppressPixelAdminToggleClick = true;
                goToFirstPlayableLevelCheat();
            }, PIXEL_ADMIN_CHEAT_HOLD_MS);
        }

        function cancelPixelAdminToggleHold() {
            clearPixelAdminToggleHoldTimer();
        }

        function paintPixelAdminCell(rowIndex, colIndex, colorId) {
            return paintPixelAdminCellWithOptions(rowIndex, colIndex, colorId);
        }

        function setPixelAdminCellPresentation(cell, rowIndex, colIndex, colorId, mapId, paletteMeta = {}) {
            const colorHex = getPixelAdminColorHex(mapId, colorId, paletteMeta);
            const presentationKey = `${mapId}|${rowIndex}|${colIndex}|${colorId}|${colorHex}`;

            if (cell.dataset.presentationKey === presentationKey) {
                return;
            }

            cell.dataset.row = String(rowIndex);
            cell.dataset.col = String(colIndex);
            cell.dataset.presentationKey = presentationKey;
            cell.classList.toggle("empty", colorId === 0);
            if (colorId === 0) {
                cell.style.removeProperty("--cell-color");
            } else {
                cell.style.setProperty("--cell-color", colorHex);
            }
            cell.setAttribute(
                "aria-label",
                `${rowIndex + 1}행 ${colIndex + 1}열 ${getPixelAdminColorLabel(mapId, colorId, paletteMeta)} 픽셀`
            );
            cell.title = `${rowIndex + 1}, ${colIndex + 1} - ${getPixelAdminColorLabel(mapId, colorId, paletteMeta)}`;
        }

        function paintPixelAdminCellWithOptions(rowIndex, colIndex, colorId, options = {}) {
            const {
                cellElement = null,
                render = true,
                updateMessage = true
            } = options;

            if (!pixelAdminState.draftMap?.[rowIndex]) {
                return false;
            }

            if (pixelAdminState.draftMap[rowIndex][colIndex] === colorId) {
                return false;
            }

            pixelAdminState.draftMap[rowIndex][colIndex] = colorId;
            pixelAdminState.isDirty = true;
            pixelAdminState.exportNeedsRefresh = true;
            const nextMessage = `${rowIndex + 1}행 ${colIndex + 1}열을 ${getPixelAdminColorLabel(
                pixelAdminState.currentMapId,
                colorId,
                pixelAdminState.draftPalette
            )}로 칠했어요.`;
            schedulePixelAdminAutoSave();
            if (updateMessage) {
                pixelAdminState.message = nextMessage;
            } else {
                pixelAdminInteraction.pendingMessage = nextMessage;
            }

            if (cellElement) {
                setPixelAdminCellPresentation(
                    cellElement,
                    rowIndex,
                    colIndex,
                    colorId,
                    pixelAdminState.currentMapId,
                    pixelAdminState.draftPalette
                );
            }

            if (render) {
                renderPixelAdmin();
            }

            return true;
        }

        function startPixelAdminDrawing(colorId) {
            pixelAdminInteraction.isDrawing = true;
            pixelAdminInteraction.drawColorId = colorId;
            pixelAdminInteraction.strokeSnapshot = pixelAdminState.draftMap ? clonePixelMap(pixelAdminState.draftMap) : null;
            pixelAdminInteraction.lastPaintedCellKey = null;
            pixelAdminInteraction.pendingMessage = "";
            pixelAdminInteraction.didPaint = false;
        }

        function stopPixelAdminDrawing() {
            if (!pixelAdminInteraction.isDrawing) {
                return;
            }

            pixelAdminInteraction.isDrawing = false;
            pixelAdminInteraction.drawColorId = null;
            pixelAdminInteraction.lastPaintedCellKey = null;

            if (pixelAdminInteraction.pendingMessage) {
                pixelAdminState.message = pixelAdminInteraction.pendingMessage;
            }

            const shouldRender = pixelAdminInteraction.didPaint;
            if (shouldRender && pixelAdminInteraction.strokeSnapshot) {
                pixelAdminState.undoStack.push(pixelAdminInteraction.strokeSnapshot);
                if (pixelAdminState.undoStack.length > PIXEL_ADMIN_UNDO_LIMIT) {
                    pixelAdminState.undoStack.splice(0, pixelAdminState.undoStack.length - PIXEL_ADMIN_UNDO_LIMIT);
                }
            }

            pixelAdminInteraction.strokeSnapshot = null;
            pixelAdminInteraction.pendingMessage = "";
            pixelAdminInteraction.didPaint = false;

            if (shouldRender) {
                renderPixelAdmin();
            }
        }

        function paintPixelAdminCellFromElement(cellElement, colorId) {
            if (!cellElement) {
                return;
            }

            const rowIndex = Number(cellElement.dataset.row);
            const colIndex = Number(cellElement.dataset.col);
            const cellKey = `${rowIndex}-${colIndex}`;

            if (pixelAdminInteraction.lastPaintedCellKey === cellKey) {
                return;
            }

            const changed = paintPixelAdminCellWithOptions(rowIndex, colIndex, colorId, {
                cellElement,
                render: false,
                updateMessage: false
            });

            cellElement.focus({ preventScroll: true });
            pixelAdminInteraction.lastPaintedCellKey = cellKey;
            if (changed) {
                pixelAdminInteraction.didPaint = true;
            }
        }

        function applyPixelAdminDraft() {
            const definition = getCurrentMapDefinition();
            if (!definition || !pixelAdminState.draftMap) {
                return;
            }

            clearPixelAdminAutoSaveTimer();
            try {
                syncPixelAdminDraftFromExportInput();
            } catch (error) {
                pixelAdminState.message = error.message || "코드 내용을 적용하지 못했어요.";
                renderPixelAdmin();
                return;
            }

            definition.adminTargetMap = clonePixelMap(pixelAdminState.draftMap);
            definition.adminPalette = clonePaletteMeta(pixelAdminState.draftPalette);
            definition.adminDisplayName =
                normalizeStageDisplayName(pixelAdminState.draftDisplayName) ||
                normalizeStageDisplayName(definition.displayName) ||
                null;
            const didPersist = persistPixelAdminStageOverride(definition);
            syncActiveMap(currentMapIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            currentLevelInitialState = null;
            pixelAdminState.pendingGameReset = null;
            resetGame({
                regenerateLevelStart: true,
                fastLevelStart: true,
                persistLevelStart: false
            });
            pixelAdminState.isDirty = false;
            pixelAdminState.exportIsDirty = false;
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.message = didPersist
                ? "이 스테이지에 캔버스와 팔레트 변경사항을 적용하고 저장했어요."
                : "이 스테이지에 캔버스와 팔레트 변경사항을 적용했지만 저장에는 실패했어요.";
            renderPixelAdmin();
        }

        function reloadPixelAdminDraft() {
            clearPixelAdminAutoSaveTimer();
            syncPixelAdminWithActiveMap(true, false);
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.message = "현재 스테이지에 적용된 캔버스와 팔레트를 다시 불러왔어요.";
            renderPixelAdmin();
        }

        function restorePixelAdminDefault() {
            const definition = getCurrentMapDefinition();
            if (!definition) {
                return;
            }

            clearPixelAdminAutoSaveTimer();
            definition.adminTargetMap = null;
            definition.adminPalette = null;
            definition.adminDisplayName = null;
            clearPersistedPixelAdminStageOverride(definition.id);
            syncActiveMap(currentMapIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            currentLevelInitialState = null;
            pixelAdminState.pendingGameReset = null;
            resetGame({
                regenerateLevelStart: true,
                fastLevelStart: true,
                persistLevelStart: false
            });
            syncPixelAdminWithActiveMap(true, false);
            pixelAdminState.exportIsDirty = false;
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.message = "기본 캔버스와 팔레트로 복원했어요.";
            renderPixelAdmin();
        }

        function goToNextLevelFromAdmin() {
            const nextMapIndex = (currentMapIndex + 1) % MAP_DEFINITIONS.length;
            const nextDefinition = MAP_DEFINITIONS[nextMapIndex];
            const nextOverrideVersion = getStageOverrideVersion(nextDefinition);
            persistPixelAdminDraftState({ shouldRender: false });
            clearRuntimeSnapshot();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            clearCelebrationTimers();
            isStageTransitioning = false;
            selected = null;
            syncActiveMap(nextMapIndex, {
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            currentLevelInitialState =
                preparedNextMapIndex === nextMapIndex &&
                preparedNextMapVersion === nextOverrideVersion &&
                preparedNextLevelInitialState?.mapId === ACTIVE_MAP?.id
                    ? {
                        mapId: preparedNextLevelInitialState.mapId,
                        rows: preparedNextLevelInitialState.rows,
                        cols: preparedNextLevelInitialState.cols,
                        boardState: cloneBoardSnapshot(preparedNextLevelInitialState.boardState),
                        trayState: [...preparedNextLevelInitialState.trayState],
                        cleanedSocketCells: [...(preparedNextLevelInitialState.cleanedSocketCells || [])],
                        actionCharges: clampActionChargesSnapshot(preparedNextLevelInitialState.actionCharges)
                    }
                    : null;
            pixelAdminState.pendingGameReset = null;
            resetGame({
                regenerateLevelStart: !currentLevelInitialState,
                fastLevelStart: !currentLevelInitialState,
                persistLevelStart: false
            });
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.message = `다음 레벨로 이동했어요. 현재 스테이지는 ${getMapDisplayName(getCurrentMapDefinition().id)}입니다.`;
            renderPixelAdmin();
        }

        function goToPreviousLevelFromAdmin() {
            const previousMapIndex =
                ((currentMapIndex - 1) % MAP_DEFINITIONS.length + MAP_DEFINITIONS.length) % MAP_DEFINITIONS.length;
            persistPixelAdminDraftState({ shouldRender: false });
            clearRuntimeSnapshot();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            clearCelebrationTimers();
            isStageTransitioning = false;
            selected = null;
            syncActiveMap(previousMapIndex, {
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            currentLevelInitialState =
                preparedPreviousMapIndex === previousMapIndex &&
                preparedPreviousMapVersion === getStageOverrideVersion(getCurrentMapDefinition()) &&
                preparedPreviousLevelInitialState?.mapId === ACTIVE_MAP?.id
                    ? {
                        mapId: preparedPreviousLevelInitialState.mapId,
                        rows: preparedPreviousLevelInitialState.rows,
                        cols: preparedPreviousLevelInitialState.cols,
                        boardState: cloneBoardSnapshot(preparedPreviousLevelInitialState.boardState),
                        trayState: [...preparedPreviousLevelInitialState.trayState],
                        cleanedSocketCells: [...(preparedPreviousLevelInitialState.cleanedSocketCells || [])],
                        actionCharges: clampActionChargesSnapshot(preparedPreviousLevelInitialState.actionCharges)
                    }
                    : null;
            pixelAdminState.pendingGameReset = null;
            resetGame({
                regenerateLevelStart: !currentLevelInitialState,
                fastLevelStart: !currentLevelInitialState,
                persistLevelStart: false
            });
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.message = `이전 레벨로 이동했어요. 현재 스테이지는 ${getMapDisplayName(getCurrentMapDefinition().id)}입니다.`;
            renderPixelAdmin();
        }

        function goToFirstPlayableLevelCheat() {
            const targetMapIndex = getFirstPlayableMapIndex();

            clearRuntimeSnapshot();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            clearCelebrationTimers();
            isStageTransitioning = false;
            selected = null;
            syncActiveMap(targetMapIndex);
            resetGame({ regenerateLevelStart: true });
        }

        async function copyPixelAdminExport() {
            if (!pixelAdminExportElement?.value) {
                return;
            }

            try {
                await navigator.clipboard.writeText(pixelAdminExportElement.value);
                pixelAdminState.message = "매트릭스를 클립보드에 복사했어요.";
            } catch (error) {
                pixelAdminExportElement.focus();
                pixelAdminExportElement.select();
                document.execCommand("copy");
                pixelAdminState.message = "직접 복사할 수 있도록 내보내기 텍스트를 선택했어요.";
            }

            renderPixelAdmin();
        }

        function renderPixelAdmin() {
            if (!pixelAdminElement || !pixelAdminToggleElement) {
                return;
            }

            const definition = getCurrentMapDefinition();
            const mapId = pixelAdminState.currentMapId || definition?.id;
            const sourceMap = pixelAdminState.draftMap;
            const paletteMeta = pixelAdminState.draftPalette || {};

            pixelAdminElement.classList.toggle("open", pixelAdminState.isOpen);
            pixelAdminElement.setAttribute("aria-hidden", String(!pixelAdminState.isOpen));
            pixelAdminToggleElement.setAttribute("aria-expanded", String(pixelAdminState.isOpen));
            applyPixelAdminPanelWidth();
            applyPixelAdminGridShellSize();

            if (!pixelAdminState.isOpen) {
                return;
            }

            if (!definition || !mapId || !sourceMap?.length) {
                return;
            }

            const rows = sourceMap.length;
            const cols = sourceMap[0].length;
            const draftDisplayName =
                normalizeStageDisplayName(pixelAdminState.draftDisplayName) || getMapDisplayName(mapId);
            const selectedColorHex = getPixelAdminColorHex(mapId, pixelAdminState.selectedColorId, paletteMeta);
            const selectedColorLabel = getPixelAdminColorLabel(mapId, pixelAdminState.selectedColorId, paletteMeta);
            const paletteIds = getPixelAdminPaletteIds(mapId, sourceMap, paletteMeta);
            const paletteColorKey = paletteIds
                .map((colorId) => `${colorId}:${getPixelAdminColorHex(mapId, colorId, paletteMeta)}`)
                .join("|");
            const paletteRenderKey = `${mapId}|${pixelAdminState.selectedColorId}|${paletteColorKey}`;
            const selectedColorMeta = pixelAdminState.selectedColorId === 0 ? null : paletteMeta[pixelAdminState.selectedColorId];
            const gridSizeKey = `${rows}x${cols}`;
            const shouldRefreshExport = !pixelAdminState.exportIsDirty && pixelAdminState.exportNeedsRefresh;
            const shouldRefreshPalette = pixelAdminState.renderedPaletteKey !== paletteRenderKey;
            const shouldRefreshGrid =
                pixelAdminGridElement.childElementCount !== rows * cols ||
                pixelAdminState.renderedGridMapId !== mapId ||
                pixelAdminState.renderedGridSizeKey !== gridSizeKey ||
                pixelAdminState.renderedGridMapRef !== sourceMap ||
                pixelAdminState.renderedGridPaletteKey !== paletteColorKey;
            const shouldDeferHeavyRender =
                pixelAdminState.deferHeavyRender &&
                (shouldRefreshExport || shouldRefreshPalette || shouldRefreshGrid);

            pixelAdminStageElement.textContent = `${draftDisplayName} - ${rows} x ${cols}`;
            pixelAdminHelpElement.textContent = shouldDeferHeavyRender
                ? "새 스테이지를 불러오는 중이에요. 코드값, 팔레트, 그리드는 잠시 후 갱신됩니다."
                : "제목, 캔버스, 팔레트를 직접 수정할 수 있어요. 그리드 위에서 마우스 휠로 확대/축소할 수 있고, HEX는 `#` 없이 6자리만 입력하면 채도는 자동으로 65 이하로 맞춰집니다.";
            pixelAdminSelectionElement.textContent = `선택: ${selectedColorLabel}${selectedColorMeta ? ` - ${selectedColorHex}` : ""}${pixelAdminState.isDirty ? " - 저장되지 않은 변경사항" : ""}`;
            pixelAdminMessageElement.textContent = pixelAdminState.message;
            pixelAdminGridElement.setAttribute("aria-busy", String(shouldDeferHeavyRender));
            pixelAdminPaletteElement.setAttribute("aria-busy", String(shouldDeferHeavyRender));
            pixelAdminExportElement.setAttribute("aria-busy", String(shouldDeferHeavyRender));
            if (shouldDeferHeavyRender) {
                if (pixelAdminState.deferredHeavyRenderTimer) {
                    window.clearTimeout(pixelAdminState.deferredHeavyRenderTimer);
                }
                pixelAdminState.deferredHeavyRenderTimer = window.setTimeout(() => {
                    pixelAdminState.deferredHeavyRenderTimer = null;
                    pixelAdminState.deferHeavyRender = false;
                    if (pixelAdminState.isOpen) {
                        renderPixelAdmin();
                    }
                }, 64);
                return;
            }
            if (pixelAdminState.deferredHeavyRenderTimer) {
                window.clearTimeout(pixelAdminState.deferredHeavyRenderTimer);
                pixelAdminState.deferredHeavyRenderTimer = null;
            }
            pixelAdminState.deferHeavyRender = false;
            if (shouldRefreshExport) {
                pixelAdminExportElement.value = serializePixelAdminMap(mapId, sourceMap, paletteMeta, draftDisplayName);
                pixelAdminState.exportNeedsRefresh = false;
            }
            if (pixelAdminTitleInputElement) {
                pixelAdminTitleInputElement.value = pixelAdminState.draftDisplayName || "";
            }
            if (pixelAdminColorHexTextElement) {
                pixelAdminColorHexTextElement.value = selectedColorMeta?.color?.replace(/^#/, "") || "";
                pixelAdminColorHexTextElement.disabled = !selectedColorMeta;
            }
            if (pixelAdminColorHexPickerElement) {
                pixelAdminColorHexPickerElement.value = selectedColorMeta?.color || "#FFFFFF";
                pixelAdminColorHexPickerElement.disabled = !selectedColorMeta;
            }
            if (pixelAdminEraseElement) {
                pixelAdminEraseElement.classList.toggle("selected", pixelAdminState.selectedColorId === 0);
            }

            if (shouldRefreshPalette) {
                pixelAdminPaletteElement.innerHTML = "";
                paletteIds.forEach((colorId) => {
                    const swatchCard = document.createElement("div");
                    const swatch = document.createElement("button");
                    const swatchChip = document.createElement("span");
                    const swatchLabel = document.createElement("span");
                    const swatchHex = document.createElement("span");
                    const colorHex = getPixelAdminColorHex(mapId, colorId, paletteMeta);
                    const removableColor = canRemovePixelAdminColor(mapId, colorId);

                    swatchCard.className = "pixel-admin-swatch-card";
                    swatch.type = "button";
                    swatch.className = "pixel-admin-swatch";
                    if (colorId === pixelAdminState.selectedColorId) swatch.classList.add("selected");

                    swatchChip.className = "pixel-admin-swatch-chip";
                    swatchChip.style.setProperty("--swatch-color", colorHex);

                    swatchLabel.className = "pixel-admin-swatch-label";
                    swatchLabel.textContent = getPixelAdminColorLabel(mapId, colorId, paletteMeta);

                    swatchHex.className = "pixel-admin-swatch-hex";
                    swatchHex.textContent = colorHex;

                    swatch.append(swatchChip, swatchLabel, swatchHex);
                    swatch.addEventListener("click", () => {
                        pixelAdminState.selectedColorId = colorId;
                        pixelAdminState.message = `${getPixelAdminColorLabel(mapId, colorId, paletteMeta)}을(를) 선택했어요.`;
                        renderPixelAdmin();
                    });

                    swatchCard.appendChild(swatch);

                    if (removableColor) {
                        const deleteButton = document.createElement("button");
                        deleteButton.type = "button";
                        deleteButton.className = "pixel-admin-swatch-delete";
                        deleteButton.textContent = "x";
                        deleteButton.setAttribute("aria-label", `${getPixelAdminColorLabel(mapId, colorId, paletteMeta)} 색상 삭제`);
                        deleteButton.title = `${getPixelAdminColorLabel(mapId, colorId, paletteMeta)} 삭제`;
                        deleteButton.addEventListener("click", (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removePixelAdminColor(colorId);
                        });
                        swatchCard.appendChild(deleteButton);
                    }

                    pixelAdminPaletteElement.appendChild(swatchCard);
                });
                pixelAdminState.renderedPaletteKey = paletteRenderKey;
            }

            renderPixelAdminAxes(rows, cols);
            pixelAdminGridElement.style.setProperty("--pixel-admin-cols", cols);
            syncPixelAdminGridMetrics(cols, rows);
            if (pixelAdminGridElement.childElementCount !== rows * cols) {
                const fragment = document.createDocumentFragment();

                sourceMap.forEach((row, rowIndex) => {
                    row.forEach((colorId, colIndex) => {
                        const cell = document.createElement("button");

                        cell.type = "button";
                        cell.className = "pixel-admin-cell";
                        cell.addEventListener("mousedown", (event) => {
                            if (event.button !== 0 && event.button !== 2) {
                                return;
                            }

                            event.preventDefault();
                            startPixelAdminDrawing(event.button === 2 ? 0 : pixelAdminState.selectedColorId);
                            paintPixelAdminCellFromElement(cell, pixelAdminInteraction.drawColorId);
                        });
                        cell.addEventListener("mouseenter", (event) => {
                            if (!pixelAdminInteraction.isDrawing) {
                                return;
                            }

                            if (!(event.buttons & 1) && !(event.buttons & 2)) {
                                stopPixelAdminDrawing();
                                return;
                            }

                            paintPixelAdminCellFromElement(cell, pixelAdminInteraction.drawColorId);
                        });
                        cell.addEventListener("contextmenu", (event) => {
                            event.preventDefault();
                        });
                        fragment.appendChild(cell);
                    });
                });

                pixelAdminGridElement.replaceChildren(fragment);
            }

            if (shouldRefreshGrid) {
                sourceMap.forEach((row, rowIndex) => {
                    row.forEach((colorId, colIndex) => {
                        const cell = pixelAdminGridElement.children[(rowIndex * cols) + colIndex];
                        cell.className = "pixel-admin-cell";
                        setPixelAdminCellPresentation(cell, rowIndex, colIndex, colorId, mapId, paletteMeta);
                    });
                });
                pixelAdminState.renderedGridMapId = mapId;
                pixelAdminState.renderedGridSizeKey = gridSizeKey;
                pixelAdminState.renderedGridMapRef = sourceMap;
                pixelAdminState.renderedGridPaletteKey = paletteColorKey;
            }
        }

function clearCurrentStageFromPixelAdmin() {
            if (!ACTIVE_MAP) {
                return;
            }

            if (isAnimating || isStageTransitioning) {
                pixelAdminState.message = "이동이나 전환이 끝난 뒤에 스테이지 클리어를 눌러 주세요.";
                renderPixelAdmin();
                return;
            }

            clearSparkles();
            clearCelebrationTimers();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            boardState = clonePixelMap(TARGET_MAP);
            trayState = Array.from({ length: POCKET_SIZE }, () => 0);
            cleanedSocketCells = new Set();
            actionOverlayState = null;
            selected = null;
            completedColorIds = getCompletedColorIds();
            solved = checkSolved();
            setStatus("현재 스테이지를 즉시 클리어했어요.");
            render();

            if (solved) {
                pixelAdminState.message = "현재 스테이지를 클리어했어요.";
                renderPixelAdmin();
                triggerSolvedStageSequence(gameSessionVersion);
            }
        }

function flushPendingPixelAdminStageStorage() {
    if (pixelAdminStageStorageFlushTimer) {
        window.clearTimeout(pixelAdminStageStorageFlushTimer);
        pixelAdminStageStorageFlushTimer = null;
    }
    if (pixelAdminStageStorageNeedsFlush && writePixelAdminStageStorage(readPixelAdminStageStorage())) {
        pixelAdminStageStorageNeedsFlush = false;
    }
}

pixelAdminToggleElement?.addEventListener("click", (event) => {
            if (suppressPixelAdminToggleClick) {
                event.preventDefault();
                suppressPixelAdminToggleClick = false;
                return;
            }

            togglePixelAdmin();
        });

        pixelAdminToggleElement?.addEventListener("pointerdown", (event) => {
            startPixelAdminToggleHold(event);
        });

        pixelAdminToggleElement?.addEventListener("pointerup", () => {
            cancelPixelAdminToggleHold();
        });

        pixelAdminToggleElement?.addEventListener("pointercancel", () => {
            cancelPixelAdminToggleHold();
        });

        pixelAdminToggleElement?.addEventListener("pointerleave", () => {
            cancelPixelAdminToggleHold();
        });

        pixelAdminCloseElement?.addEventListener("click", () => {
            setPixelAdminOpen(false);
        });

        pixelAdminAddColorElement?.addEventListener("click", () => {
            addPixelAdminColor();
        });

        pixelAdminEraseElement?.addEventListener("click", () => {
            pixelAdminState.selectedColorId = 0;
            pixelAdminState.message = "지우개를 선택했어요.";
            renderPixelAdmin();
        });

        pixelAdminColorHexTextElement?.addEventListener("input", (event) => {
            const sanitized = String(event.target.value || "")
                .toUpperCase()
                .replace(/[^0-9A-F]/g, "")
                .slice(0, 6);
            event.target.value = sanitized;
        });

        pixelAdminColorHexTextElement?.addEventListener("change", (event) => {
            const normalized = normalizeHexColor(event.target.value);
            if (!normalized && pixelAdminState.selectedColorId !== 0) {
                pixelAdminState.message = "FFAA33 같은 6자리 HEX 값을 입력해 주세요.";
                renderPixelAdmin();
                return;
            }

            updateSelectedPixelAdminColorDraft({ color: normalized });
        });

        pixelAdminColorHexPickerElement?.addEventListener("input", (event) => {
            updateSelectedPixelAdminColorDraft({ color: event.target.value });
        });

        pixelAdminTitleInputElement?.addEventListener("input", (event) => {
            updatePixelAdminStageTitleDraft(event.target.value);
        });

        pixelAdminExportElement?.addEventListener("input", () => {
            pixelAdminState.exportIsDirty = true;
            pixelAdminState.isDirty = true;
            pixelAdminState.message = "코드 창을 수정했어요. 잠시 후 자동 저장됩니다.";
            schedulePixelAdminAutoSave(900);
            renderPixelAdmin();
        });

        pixelAdminApplyElement?.addEventListener("click", () => {
            applyPixelAdminDraft();
        });

        pixelAdminStageClearElement?.addEventListener("click", () => {
            clearCurrentStageFromPixelAdmin();
        });

        pixelAdminReloadElement?.addEventListener("click", () => {
            reloadPixelAdminDraft();
        });

        pixelAdminRestoreElement?.addEventListener("click", () => {
            restorePixelAdminDefault();
        });

        pixelAdminCopyElement?.addEventListener("click", () => {
            void copyPixelAdminExport();
        });

        pixelAdminCopyMiniElement?.addEventListener("click", () => {
            void copyPixelAdminExport();
        });

        pixelAdminPreviousLevelElement?.addEventListener("click", () => {
            goToPreviousLevelFromAdmin();
        });

        pixelAdminNextLevelElement?.addEventListener("click", () => {
            goToNextLevelFromAdmin();
        });

        pixelAdminResizeHandleElement?.addEventListener("mousedown", (event) => {
            startPixelAdminResize(event);
        });

        pixelAdminGridResizeBarElement?.addEventListener("mousedown", (event) => {
            startPixelAdminGridResize(event);
        });

        pixelAdminGridWrapElement?.addEventListener(
            "wheel",
            (event) => {
                zoomPixelAdminCanvasByWheel(event);
            },
            { passive: false }
        );

        pixelAdminGridWrapElement?.addEventListener("scroll", () => {
            syncPixelAdminAxisScroll();
        });

        pixelAdminGridElement?.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        window.addEventListener("mousemove", (event) => {
            updatePixelAdminResize(event);
            updatePixelAdminGridResize(event);
        });

        window.addEventListener("mouseup", () => {
            stopPixelAdminResize({});
            stopPixelAdminGridResize();
            stopPixelAdminDrawing();
        });

        window.addEventListener("blur", () => {
            stopPixelAdminResize({});
            stopPixelAdminGridResize();
            stopPixelAdminDrawing();
        });

window.addEventListener("mousemove", (event) => {
    updatePixelAdminResize(event);
    updatePixelAdminGridResize(event);
});

window.addEventListener("mouseup", () => {
    stopPixelAdminResize({});
    stopPixelAdminGridResize();
    stopPixelAdminDrawing();
});

window.addEventListener("blur", () => {
    stopPixelAdminResize({});
    stopPixelAdminGridResize();
    stopPixelAdminDrawing();
});

window.addEventListener("resize", () => {
    applyPixelAdminPanelWidth();
    applyPixelAdminGridShellSize();
    if (pixelAdminState.isOpen) {
        renderPixelAdmin();
    }
});

window.addEventListener("keydown", (event) => {
    if (event.repeat) {
        return;
    }

    const activeElement = document.activeElement;
    const isTypingTarget =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.isContentEditable);

    if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.code === "KeyZ" &&
        pixelAdminState.isOpen &&
        pixelAdminGridElement?.contains(activeElement) &&
        !pixelAdminInteraction.isDrawing
    ) {
        const previousDraftMap = pixelAdminState.undoStack.pop();
        if (!previousDraftMap) {
            return;
        }

        event.preventDefault();
        pixelAdminState.draftMap = clonePixelMap(previousDraftMap);
        pixelAdminState.isDirty = true;
        pixelAdminState.exportIsDirty = false;
        pixelAdminState.message = "?? ??? ??? ?????.";
        schedulePixelAdminAutoSave();
        renderPixelAdmin();
        return;
    }

    if (isTypingTarget) {
        return;
    }

    if (event.shiftKey && event.code === "KeyA") {
        event.preventDefault();
        togglePixelAdmin();
    }
});

window.addEventListener("pagehide", () => {
    flushPendingPixelAdminStageStorage();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        flushPendingPixelAdminStageStorage();
    }
});

window.addEventListener("beforeunload", () => {
    flushPendingPixelAdminStageStorage();
});

document.addEventListener("freeze", () => {
    flushPendingPixelAdminStageStorage();
});
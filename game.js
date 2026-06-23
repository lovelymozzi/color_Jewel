function createPixelMap(rows, cols, fill = 0) {
            return Array.from({ length: rows }, () => Array(cols).fill(fill));
        }

        function clonePixelMap(sourceMap) {
            return sourceMap.map((row) => [...row]);
        }

        function clonePaletteMeta(sourcePalette = {}) {
            return Object.fromEntries(
                Object.entries(sourcePalette)
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

        const MAX_COLOR_SATURATION = 65;

        function clampNumber(value, min, max) {
            return Math.min(max, Math.max(min, value));
        }

        function rgbToHex({ r, g, b }) {
            const toHex = (channel) => clampNumber(Math.round(channel), 0, 255).toString(16).padStart(2, "0").toUpperCase();
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }

        function rgbToHsl({ r, g, b }) {
            const red = clampNumber(r, 0, 255) / 255;
            const green = clampNumber(g, 0, 255) / 255;
            const blue = clampNumber(b, 0, 255) / 255;
            const max = Math.max(red, green, blue);
            const min = Math.min(red, green, blue);
            const lightness = (max + min) / 2;
            const delta = max - min;
            let hue = 0;
            let saturation = 0;

            if (delta !== 0) {
                saturation = delta / (1 - Math.abs(2 * lightness - 1));

                switch (max) {
                    case red:
                        hue = ((green - blue) / delta) % 6;
                        break;
                    case green:
                        hue = (blue - red) / delta + 2;
                        break;
                    default:
                        hue = (red - green) / delta + 4;
                        break;
                }

                hue *= 60;
                if (hue < 0) {
                    hue += 360;
                }
            }

            return {
                h: hue,
                s: saturation * 100,
                l: lightness * 100
            };
        }

        function rgbToHsv({ r, g, b }) {
            const red = clampNumber(r, 0, 255) / 255;
            const green = clampNumber(g, 0, 255) / 255;
            const blue = clampNumber(b, 0, 255) / 255;
            const max = Math.max(red, green, blue);
            const min = Math.min(red, green, blue);
            const delta = max - min;
            let hue = 0;

            if (delta !== 0) {
                switch (max) {
                    case red:
                        hue = ((green - blue) / delta) % 6;
                        break;
                    case green:
                        hue = (blue - red) / delta + 2;
                        break;
                    default:
                        hue = (red - green) / delta + 4;
                        break;
                }

                hue *= 60;
                if (hue < 0) {
                    hue += 360;
                }
            }

            return {
                h: hue,
                s: max === 0 ? 0 : (delta / max) * 100,
                v: max * 100
            };
        }

        function hslToRgb({ h, s, l }) {
            const hue = ((h % 360) + 360) % 360;
            const saturation = clampNumber(s, 0, 100) / 100;
            const lightness = clampNumber(l, 0, 100) / 100;
            const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
            const huePrime = hue / 60;
            const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
            let red = 0;
            let green = 0;
            let blue = 0;

            if (huePrime >= 0 && huePrime < 1) {
                red = chroma;
                green = secondComponent;
            } else if (huePrime < 2) {
                red = secondComponent;
                green = chroma;
            } else if (huePrime < 3) {
                green = chroma;
                blue = secondComponent;
            } else if (huePrime < 4) {
                green = secondComponent;
                blue = chroma;
            } else if (huePrime < 5) {
                red = secondComponent;
                blue = chroma;
            } else {
                red = chroma;
                blue = secondComponent;
            }

            const match = lightness - chroma / 2;
            return {
                r: Math.round((red + match) * 255),
                g: Math.round((green + match) * 255),
                b: Math.round((blue + match) * 255)
            };
        }

        function hsvToRgb({ h, s, v }) {
            const hue = ((h % 360) + 360) % 360;
            const saturation = clampNumber(s, 0, 100) / 100;
            const value = clampNumber(v, 0, 100) / 100;
            const chroma = value * saturation;
            const huePrime = hue / 60;
            const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
            let red = 0;
            let green = 0;
            let blue = 0;

            if (huePrime >= 0 && huePrime < 1) {
                red = chroma;
                green = secondComponent;
            } else if (huePrime < 2) {
                red = secondComponent;
                green = chroma;
            } else if (huePrime < 3) {
                green = chroma;
                blue = secondComponent;
            } else if (huePrime < 4) {
                green = secondComponent;
                blue = chroma;
            } else if (huePrime < 5) {
                red = secondComponent;
                blue = chroma;
            } else {
                red = chroma;
                blue = secondComponent;
            }

            const match = value - chroma;
            return {
                r: Math.round((red + match) * 255),
                g: Math.round((green + match) * 255),
                b: Math.round((blue + match) * 255)
            };
        }

        function clampRgbSaturation(rgb, maxSaturation = MAX_COLOR_SATURATION) {
            const hsv = rgbToHsv(rgb);
            if (hsv.s <= maxSaturation) {
                return {
                    r: clampNumber(rgb.r, 0, 255),
                    g: clampNumber(rgb.g, 0, 255),
                    b: clampNumber(rgb.b, 0, 255)
                };
            }

            let targetSaturation = maxSaturation;
            let adjusted = hsvToRgb({
                h: hsv.h,
                s: targetSaturation,
                v: hsv.v
            });
            let adjustedHsv = rgbToHsv(adjusted);

            while (adjustedHsv.s > maxSaturation && targetSaturation > 0) {
                targetSaturation = Math.max(0, targetSaturation - 0.25);
                adjusted = hsvToRgb({
                    h: hsv.h,
                    s: targetSaturation,
                    v: hsv.v
                });
                adjustedHsv = rgbToHsv(adjusted);
            }

            return adjusted;
        }

        function normalizeHexColor(value) {
            if (!value) return null;
            const trimmed = String(value).trim();
            const expanded = trimmed.match(/^#?([0-9a-f]{3})$/i);
            if (expanded) {
                const expandedHex = `#${expanded[1]
                    .split("")
                    .map((char) => `${char}${char}`)
                    .join("")
                    .toUpperCase()}`;
                return rgbToHex(clampRgbSaturation(hexToRgb(expandedHex)));
            }

            const full = trimmed.match(/^#?([0-9a-f]{6})$/i);
            if (!full) return null;
            return rgbToHex(clampRgbSaturation(hexToRgb(`#${full[1].toUpperCase()}`)));
        }

        function escapeJsString(value) {
            return String(value ?? "")
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"');
        }

        function setPixel(map, x, y, colorId) {
            if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return;
            map[y][x] = colorId;
        }

        function fillRow(map, y, startX, endX, colorId) {
            for (let x = startX; x <= endX; x += 1) {
                setPixel(map, x, y, colorId);
            }
        }

        function scaleMap(sourceMap, factor) {
            return sourceMap.flatMap((row) => {
                const scaledRow = row.flatMap((cell) => Array(factor).fill(cell));
                return Array.from({ length: factor }, () => [...scaledRow]);
            });
        }

        const PALETTE_COLOR_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const CARDINAL_DIRECTIONS = [
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ];

        function getMapColorCounts(sourceMap) {
            return sourceMap.reduce((counts, row) => {
                row.forEach((cell) => {
                    if (!cell) return;
                    counts[cell] = (counts[cell] || 0) + 1;
                });
                return counts;
            }, {});
        }

        function getCellsByColor(sourceMap, colorId) {
            return sourceMap.flatMap((row, rowIndex) =>
                row
                    .map((cell, colIndex) => (cell === colorId ? { row: rowIndex, col: colIndex } : null))
                    .filter(Boolean)
            );
        }

        function getLeastUsedColorIds(colorCounts, excludedColorIds, count, seed = 0) {
            const excludedSet = new Set(excludedColorIds);

            return [...PALETTE_COLOR_IDS]
                .filter((colorId) => !excludedSet.has(colorId))
                .sort((left, right) => {
                    const countDiff = (colorCounts[left] || 0) - (colorCounts[right] || 0);
                    if (countDiff) return countDiff;
                    return ((left + seed) % PALETTE_COLOR_IDS.length) - ((right + seed) % PALETTE_COLOR_IDS.length);
                })
                .slice(0, count);
        }

        function chooseSpreadSeeds(cells, count, seed = 0) {
            if (!cells.length) return [];

            const seeds = [cells[Math.abs(seed * 11) % cells.length]];

            while (seeds.length < count) {
                let bestCell = null;
                let bestScore = -1;

                cells.forEach((cell, index) => {
                    if (seeds.some((seedCell) => seedCell.row === cell.row && seedCell.col === cell.col)) {
                        return;
                    }

                    const minDistance = seeds.reduce(
                        (distance, seedCell) =>
                            Math.min(distance, Math.abs(cell.row - seedCell.row) + Math.abs(cell.col - seedCell.col)),
                        Number.POSITIVE_INFINITY
                    );
                    const tieBreaker = (index * 17 + seed * 13) % 101;
                    const score = minDistance * 1000 + tieBreaker;

                    if (score > bestScore) {
                        bestCell = cell;
                        bestScore = score;
                    }
                });

                seeds.push(bestCell || cells[0]);
            }

            return seeds;
        }

        function splitCellsIntoBlobs(cells, blobCount, seed = 0) {
            if (blobCount <= 1 || cells.length <= 1) {
                return [cells];
            }

            const seeds = chooseSpreadSeeds(cells, Math.min(blobCount, cells.length), seed);
            const blobs = seeds.map((seedCell) => [seedCell]);
            const seedKeys = new Set(seeds.map((cell) => toCellKey(cell.row, cell.col)));
            const remainingCells = cells.filter((cell) => !seedKeys.has(toCellKey(cell.row, cell.col)));

            remainingCells
                .sort((left, right) => left.row - right.row || left.col - right.col)
                .forEach((cell, cellIndex) => {
                    let bestBlobIndex = 0;
                    let bestDistance = Number.POSITIVE_INFINITY;

                    seeds.forEach((seedCell, blobIndex) => {
                        const distance = Math.abs(cell.row - seedCell.row) + Math.abs(cell.col - seedCell.col);
                        if (
                            distance < bestDistance ||
                            (distance === bestDistance && (blobIndex + cellIndex + seed) % seeds.length < bestBlobIndex)
                        ) {
                            bestDistance = distance;
                            bestBlobIndex = blobIndex;
                        }
                    });

                    blobs[bestBlobIndex].push(cell);
                });

            return blobs;
        }

        function getLargestMapClusterSize(sourceMap) {
            const visited = new Set();
            let largestClusterSize = 0;

            sourceMap.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (!cell) return;

                    const startKey = toCellKey(rowIndex, colIndex);
                    if (visited.has(startKey)) {
                        return;
                    }

                    let clusterSize = 0;
                    const stack = [{ row: rowIndex, col: colIndex }];
                    visited.add(startKey);

                    while (stack.length) {
                        const current = stack.pop();
                        clusterSize += 1;

                        CARDINAL_DIRECTIONS.forEach((direction) => {
                            const nextRow = current.row + direction.row;
                            const nextCol = current.col + direction.col;
                            const nextKey = toCellKey(nextRow, nextCol);

                            if (
                                nextRow < 0 ||
                                nextRow >= sourceMap.length ||
                                nextCol < 0 ||
                                nextCol >= sourceMap[0].length ||
                                visited.has(nextKey) ||
                                sourceMap[nextRow][nextCol] !== cell
                            ) {
                                return;
                            }

                            visited.add(nextKey);
                            stack.push({ row: nextRow, col: nextCol });
                        });
                    }

                    largestClusterSize = Math.max(largestClusterSize, clusterSize);
                });
            });

            return largestClusterSize;
        }

        function createSpatialBlobColorMap(sourceMap, seed = 0) {
            const activeCells = sourceMap.flatMap((row, rowIndex) =>
                row
                    .map((cell, colIndex) => (cell ? { row: rowIndex, col: colIndex } : null))
                    .filter(Boolean)
            );
            const blobCount = Math.min(6, Math.max(4, Math.round(activeCells.length / 42)));
            const nextMap = sourceMap.map((row) => row.map(() => 0));
            const sourceColorCounts = getMapColorCounts(sourceMap);
            const sourceColorIds = Object.entries(sourceColorCounts)
                .sort((left, right) => right[1] - left[1] || Number(left[0]) - Number(right[0]))
                .map(([colorId]) => Number(colorId));
            const extraColorIds = getLeastUsedColorIds(
                sourceColorCounts,
                sourceColorIds,
                Math.max(0, blobCount - sourceColorIds.length),
                seed
            );
            const blobColorIds = [...sourceColorIds, ...extraColorIds].slice(0, blobCount);
            const blobs = splitCellsIntoBlobs(activeCells, blobColorIds.length, seed).sort((left, right) => {
                const leftCenter = left.reduce(
                    (center, cell) => ({
                        row: center.row + cell.row / left.length,
                        col: center.col + cell.col / left.length
                    }),
                    { row: 0, col: 0 }
                );
                const rightCenter = right.reduce(
                    (center, cell) => ({
                        row: center.row + cell.row / right.length,
                        col: center.col + cell.col / right.length
                    }),
                    { row: 0, col: 0 }
                );
                return leftCenter.row - rightCenter.row || leftCenter.col - rightCenter.col;
            });

            blobs.forEach((blob, blobIndex) => {
                blob.forEach(({ row, col }) => {
                    nextMap[row][col] = blobColorIds[blobIndex];
                });
            });

            return nextMap;
        }

        function balanceShapeColors(sourceMap, seed = 0) {
            const nextMap = sourceMap.map((row) => [...row]);
            const activeCellCount = nextMap.reduce(
                (count, row) => count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0),
                0
            );
            const maxAllowedCount = Math.max(1, Math.floor(activeCellCount / 2));
            let pass = 0;

            // Keep the original silhouette blocks, and only split colors that are too dominant.
            while (pass < PALETTE_COLOR_IDS.length) {
                const colorCounts = getMapColorCounts(nextMap);
                const dominantEntry = Object.entries(colorCounts)
                    .map(([colorId, count]) => ({ colorId: Number(colorId), count }))
                    .sort((left, right) => right.count - left.count || left.colorId - right.colorId)
                    .find(({ count }) => count > maxAllowedCount);

                if (!dominantEntry) {
                    break;
                }

                const dominantCells = getCellsByColor(nextMap, dominantEntry.colorId);
                const splitCount = Math.ceil(dominantCells.length / maxAllowedCount);
                const extraColorIds = getLeastUsedColorIds(colorCounts, [dominantEntry.colorId], splitCount - 1, seed + pass);
                const blobColorIds = [dominantEntry.colorId, ...extraColorIds];
                const blobs = splitCellsIntoBlobs(dominantCells, blobColorIds.length, seed + pass);

                blobs.forEach((blob, blobIndex) => {
                    blob.forEach(({ row, col }) => {
                        nextMap[row][col] = blobColorIds[blobIndex];
                    });
                });

                pass += 1;
            }

            if (getLargestMapClusterSize(nextMap) < Math.max(10, Math.floor(activeCellCount * 0.12))) {
                return createSpatialBlobColorMap(sourceMap, seed);
            }

            return nextMap;
        }

        let MAP_DEFINITIONS = [];
        let pixelAdminScriptLoadPromise = null;
        let pixelAdminStylesheetLoadPromise = null;

        const MAX_GRID_ROWS = 30;
        const MAX_GRID_COLS = 30;
        const CURRENT_MAP_STORAGE_KEY = "color_jewel_current_map_v1";
        const PIXEL_ADMIN_STAGE_STORAGE_KEY = "color_jewel_pixel_admin_stage_overrides_v1";
        const PIXEL_ADMIN_STAGE_CATALOG_REFRESH_KEY = "color_jewel_stage_catalog_refresh_v1";
        const RUNTIME_SNAPSHOT_STORAGE_KEY = "color_jewel_runtime_snapshot_v2";
        const LIFECYCLE_DEBUG_STORAGE_KEY = "color_jewel_lifecycle_debug_v1";
        const APP_SETTINGS_STORAGE_KEY = "color_jewel_app_settings_v2";
        const ITEM_ECONOMY_STORAGE_KEY = "color_jewel_item_economy_v1";
        const LEVEL_INITIAL_STATE_CACHE_STORAGE_KEY = "color_jewel_level_initial_state_cache_v3";
        const FORCE_FIRST_MAP_RESET_STORAGE_KEY = "color_jewel_force_first_map_reset_v1";
        const RESET_TO_FIRST_QUERY_PARAM = "resetToFirstMap";
        const BRIDGE_STAGE_SYNC_PATH = "./stage-data/bridge-sync.json";
        const BRIDGE_STAGE_SYNC_POLL_MS = 4000;
        const BACKGROUND_STAGE_SYNC_POLL_MS = 15000;
        const SHARED_STAGE_STATE_PATH = "./stage-data/shared-state.json";
        const SHARED_STAGE_STATE_HEALTH_URL = "http://127.0.0.1:8765/health";
        const SHARED_STAGE_STATE_BRIDGE_URL = "http://127.0.0.1:8765/api/save-shared-state";
        const CAN_WRITE_SHARED_STAGE_STATE =
            window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
        const DEFAULT_APP_SETTINGS = Object.freeze({
            soundEffectsOn: true,
            bgmOn: true,
            hapticsOn: true,
            tutorialTapHintShown: false
        });
        const SCENE_CONTRACT_VERSION = "20260623-06";
        const IS_NGROK_HOST = window.location.hostname.includes("ngrok");
        const NGROK_BYPASS_HEADERS = IS_NGROK_HOST
            ? { "ngrok-skip-browser-warning": "true" }
            : {};
        const TITLE_MINIMUM_VISIBLE_MS = 0;
        const TITLE_READY_VISIBLE_MS = 0;
        const TITLE_FADE_OUT_MS = 80;
        const RUNTIME_SNAPSHOT_SAVE_DELAY_MS = 220;
        const INITIAL_STAGE_PREPARATION_DELAY_MS = 180;
        const FOLLOWUP_STAGE_PREPARATION_DELAY_MS = 220;
        const STAGE_PREPARATION_IDLE_TIMEOUT_MS = 1200;
        const pixelAdminWindowRequested = new URLSearchParams(window.location.search).get("adminWindow") === "1";
        const RUNTIME_SCENE_ASSET_BUSTER = `${Date.now()}`;
        const TUTORIAL_PINCH_GUIDE_ASSET_PATH = "./src/assets/hand_ani.png";
        const TUTORIAL_PINCH_GUIDE_ASSET_URL = `${TUTORIAL_PINCH_GUIDE_ASSET_PATH}?v=${RUNTIME_SCENE_ASSET_BUSTER}`;
        const TUTORIAL_PAN_GUIDE_ASSET_PATH = "./src/assets/hand1.png";
        const TUTORIAL_PAN_GUIDE_ASSET_URL = `${TUTORIAL_PAN_GUIDE_ASSET_PATH}?v=${RUNTIME_SCENE_ASSET_BUSTER}`;
        const TUTORIAL_GESTURE_GUIDE_STEPS = Object.freeze([
            { id: "pinch_ani", assetPath: "hand-ani-png-171" },
            { id: "tuto_pan", assetPath: TUTORIAL_PAN_GUIDE_ASSET_PATH }
        ]);
        const tutorialPinchGuidePreloadImage = typeof Image === "function" ? new Image() : null;
        if (tutorialPinchGuidePreloadImage) {
            tutorialPinchGuidePreloadImage.decoding = "sync";
            tutorialPinchGuidePreloadImage.src = TUTORIAL_PINCH_GUIDE_ASSET_URL;
        }
        const tutorialPanGuidePreloadImage = typeof Image === "function" ? new Image() : null;
        if (tutorialPanGuidePreloadImage) {
            tutorialPanGuidePreloadImage.decoding = "sync";
            tutorialPanGuidePreloadImage.src = TUTORIAL_PAN_GUIDE_ASSET_URL;
        }
        const NONCACHED_SCENE_ASSET_PATHS = new Set([
            "assets/title.png",
            "assets/animation (5).png",
            "assets/magic.png",
            "assets/clean.png",
            "assets/rock.png"
        ]);
        const LIFECYCLE_DEBUG_LIMIT = 96;
        const LIFECYCLE_DEBUG_ENABLED = false;
        let bridgeStageSyncSeenAt = 0;
        let bridgeStageSyncPollTimer = null;
        let sharedStageStateSeenAt = 0;
        let sharedStageStatePollTimer = null;
        let sharedStageBridgeAvailable = false;
        let sharedCurrentMapId = null;
        let sharedPixelAdminStageStorageCache = null;
        let runtimeSnapshotSaveTimer = null;
        let preparedNextMapIdleCallbackId = null;
        let hasCompletedInitialBoot = false;
        window.__pixelAdminWindowMode = pixelAdminWindowRequested;

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
            const template =
                (typeof definition?.startMessageTemplate === "string" && definition.startMessageTemplate.trim()) ||
                definition?.startMessage ||
                "배경색을 보면서 보석을 제자리로 정리해 보세요.";
            if (!template.includes("{title}")) {
                return template;
            }

            return template
                .replaceAll("{title} ", "")
                .replaceAll("{title}", "")
                .replace(/\s+/g, " ")
                .trim();
        }

        function getStagePaletteMeta(
            definition,
            sourceMap = definition?.adminTargetMap || definition?.baseImageMap || [],
            paletteOverride = null
        ) {
            const adminPalette = definition?.adminPalette || {};
            const stagePalette =
                Object.keys(definition?.themeOverridePalette || {}).length
                    ? definition.themeOverridePalette
                    : definition?.palette || {};
            const colorIds = new Set();

            (Array.isArray(sourceMap) ? sourceMap : []).forEach((row) => {
                (Array.isArray(row) ? row : []).forEach((colorId) => {
                    if (colorId) {
                        colorIds.add(colorId);
                    }
                });
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
                                normalizeHexColor(MAP_THEME_OVERRIDES[definition?.id]?.palette?.[colorId]) ||
                                normalizeHexColor(DEFAULT_COLOR_PALETTE[colorId]?.color) ||
                                "#CCCCCC"
                        }
                    ])
            );
        }

        function buildStageCanvasMapFromBase(definition) {
            const rawScaledMap = scaleMap(definition.baseImageMap, definition.scale ?? 1);
            const scaledTargetMap = definition.balancedColors
                ? balanceShapeColors(rawScaledMap, definition.colorSeed ?? 0)
                : rawScaledMap;
            return padMapToGrid(scaledTargetMap).map;
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

        function isStageDefinitionLoaded(definition) {
            return definition?.__stageLoaded === true;
        }

        function isPixelAdminOpen() {
            return window.__pixelAdminState?.isOpen === true;
        }

        function invalidatePreparedMapCaches() {
            if (preparedNextMapTimer) {
                window.clearTimeout(preparedNextMapTimer);
                preparedNextMapTimer = null;
            }

            if (preparedNextMapIdleCallbackId != null && typeof window.cancelIdleCallback === "function") {
                window.cancelIdleCallback(preparedNextMapIdleCallbackId);
                preparedNextMapIdleCallbackId = null;
            }

            preparedNextMapIndex = -1;
            preparedNextMapVersion = 0;
            preparedNextMapConfig = null;
            preparedNextLevelInitialState = null;
            preparedPreviousMapIndex = -1;
            preparedPreviousMapVersion = 0;
            preparedPreviousMapConfig = null;
            preparedPreviousLevelInitialState = null;
            deferredUpcomingPreparationMapIndex = -1;
            deferredUpcomingPreparationIncludePrevious = true;
        }

        function syncPixelAdminWithActiveMapIfReady(force = false, shouldRender = true) {
            if (typeof window.syncPixelAdminWithActiveMap === "function") {
                window.syncPixelAdminWithActiveMap(force, shouldRender);
            }
        }

        function createStageCatalogDefinition(stageEntry) {
            const sequence = Number(stageEntry?.sequence) || 0;
            const fileName = String(stageEntry?.file || "").trim();
            const exportName = fileName ? fileName.replace(/\.json$/i, "") : null;
            return {
                id: stageEntry?.id || exportName || `stage_${sequence || "unknown"}`,
                sequence,
                file: fileName || null,
                exportName,
                displayName: normalizeStageDisplayName(stageEntry?.displayName) || null,
                displayNameNumbered:
                    typeof stageEntry?.displayNameNumbered === "string" && stageEntry.displayNameNumbered.trim()
                        ? stageEntry.displayNameNumbered.trim()
                        : null,
                scale: 1,
                startMessageTemplate: "",
                startMessage: "",
                balancedColors: false,
                colorSeed: 0,
                palette: {},
                themeOverridePalette: {},
                baseImageMap: [],
                initialBoardState: null,
                initialTrayState: [],
                __stageEntry: stageEntry && typeof stageEntry === "object" ? { ...stageEntry } : {},
                __stageLoaded: false,
                __stageLoadPromise: null
            };
        }

        async function loadStagePayload(stageEntry) {
            if (!stageEntry?.file) {
                throw new Error("Stage entry is missing its file path.");
            }

            const stageResponse = await fetch(`./stage-data/${stageEntry.file}?v=${SCENE_CONTRACT_VERSION}`, {
                cache: "no-store",
                headers: NGROK_BYPASS_HEADERS
            });
            if (!stageResponse.ok) {
                throw new Error(`Stage data load failed (${stageEntry.file}): ${stageResponse.status}`);
            }

            return stageResponse.json();
        }

        async function ensureStageDefinitionLoaded(mapIndex) {
            if (!Array.isArray(MAP_DEFINITIONS) || !MAP_DEFINITIONS.length) {
                throw new Error("Stage catalog is not ready.");
            }

            const resolvedIndex = ((mapIndex % MAP_DEFINITIONS.length) + MAP_DEFINITIONS.length) % MAP_DEFINITIONS.length;
            const definition = MAP_DEFINITIONS[resolvedIndex];
            if (!definition) {
                throw new Error(`Unknown stage index: ${mapIndex}`);
            }

            if (isStageDefinitionLoaded(definition)) {
                return definition;
            }

            if (definition.__stageLoadPromise) {
                return definition.__stageLoadPromise;
            }

            const stageEntry = definition.__stageEntry || {};
            definition.__stageLoadPromise = loadStagePayload(stageEntry).then((stagePayload) => {
                Object.assign(definition, buildStageDefinition(stageEntry, stagePayload), {
                    __stageEntry: stageEntry,
                    __stageLoaded: true,
                    __stageLoadPromise: null
                });
                invalidatePreparedMapCaches();
                applyPersistedPixelAdminStageOverride(definition);
                rebuildRuntimeMapThemeOverrides();
                return definition;
            }).catch((error) => {
                definition.__stageLoadPromise = null;
                throw error;
            });

            return definition.__stageLoadPromise;
        }

        async function prepareAdjacentStageDefinitions(activeMapIndex, options = {}) {
            const { includePrevious = true } = options;
            if (!Array.isArray(MAP_DEFINITIONS) || !MAP_DEFINITIONS.length || isPixelAdminOpen()) {
                return;
            }

            const upcomingMapIndex = (activeMapIndex + 1) % MAP_DEFINITIONS.length;
            const previousMapIndex =
                ((activeMapIndex - 1) % MAP_DEFINITIONS.length + MAP_DEFINITIONS.length) % MAP_DEFINITIONS.length;
            const stageIndexesToPrepare = includePrevious
                ? [...new Set([upcomingMapIndex, previousMapIndex])]
                : [upcomingMapIndex];
            await Promise.all(stageIndexesToPrepare.map((mapIndex) => ensureStageDefinitionLoaded(mapIndex)));

            if (currentMapIndex !== activeMapIndex || isPixelAdminOpen()) {
                return;
            }

            const currentDefinition = MAP_DEFINITIONS[currentMapIndex];
            const upcomingDefinition = MAP_DEFINITIONS[upcomingMapIndex];
            const previousDefinition = MAP_DEFINITIONS[previousMapIndex];
            const upcomingOverrideVersion = getStageOverrideVersion(upcomingDefinition);
            const preservedActiveMap = ACTIVE_MAP;
            const preservedTargetMap = TARGET_MAP;
            const preservedRows = ROWS;
            const preservedCols = COLS;
            const preservedTargetPositions = TARGET_POSITIONS;
            const preservedTargetColorCounts = TARGET_COLOR_COUNTS;
            const preservedInitialLayoutOrder = INITIAL_LAYOUT_ORDER;
            const preservedInitialLayoutIndex = INITIAL_LAYOUT_INDEX;
            const preservedTargetNeighborPairs = TARGET_NEIGHBOR_PAIRS;
            const preservedTotalTargetCells = TOTAL_TARGET_CELLS;
            const adjacentDefinitions = [
                {
                    mapIndex: upcomingMapIndex,
                    definition: upcomingDefinition,
                    overrideVersion: upcomingOverrideVersion,
                    storeAsPreparedNext: true
                }
            ];
            if (includePrevious) {
                adjacentDefinitions.push({
                    mapIndex: previousMapIndex,
                    definition: previousDefinition,
                    overrideVersion: getStageOverrideVersion(previousDefinition),
                    storeAsPreparedNext: false
                });
            }
            let nextPreparedConfig = null;
            let nextPreparedInitialState = null;
            let previousPreparedConfig = null;
            let previousPreparedInitialState = null;

            adjacentDefinitions.forEach(({ mapIndex, definition, overrideVersion, storeAsPreparedNext }) => {
                const preparedConfig = buildMapConfig(definition);
                ACTIVE_MAP = preparedConfig;
                TARGET_MAP = preparedConfig.targetMap;
                ROWS = preparedConfig.rows;
                COLS = preparedConfig.cols;
                TARGET_POSITIONS = preparedConfig.targetPositions;
                TARGET_COLOR_COUNTS = preparedConfig.targetColorCounts;
                INITIAL_LAYOUT_ORDER = preparedConfig.initialLayoutOrder;
                INITIAL_LAYOUT_INDEX = preparedConfig.initialLayoutIndex;
                TARGET_NEIGHBOR_PAIRS = preparedConfig.targetNeighborPairs;
                TOTAL_TARGET_CELLS = preparedConfig.totalTargetCells;

                const preparedInitialState = buildCurrentLevelInitialState({
                    persistState: false,
                    fastMode: isPixelAdminOpen()
                });
                if (storeAsPreparedNext) {
                    preparedNextMapIndex = mapIndex;
                    preparedNextMapVersion = overrideVersion;
                    nextPreparedConfig = preparedConfig;
                    nextPreparedInitialState = preparedInitialState;
                    return;
                }

                preparedPreviousMapIndex = mapIndex;
                preparedPreviousMapVersion = overrideVersion;
                previousPreparedConfig = preparedConfig;
                previousPreparedInitialState = preparedInitialState;
            });

            if (currentMapIndex !== activeMapIndex || currentDefinition?.id !== MAP_DEFINITIONS[currentMapIndex]?.id) {
                ACTIVE_MAP = preservedActiveMap;
                TARGET_MAP = preservedTargetMap;
                ROWS = preservedRows;
                COLS = preservedCols;
                TARGET_POSITIONS = preservedTargetPositions;
                TARGET_COLOR_COUNTS = preservedTargetColorCounts;
                INITIAL_LAYOUT_ORDER = preservedInitialLayoutOrder;
                INITIAL_LAYOUT_INDEX = preservedInitialLayoutIndex;
                TARGET_NEIGHBOR_PAIRS = preservedTargetNeighborPairs;
                TOTAL_TARGET_CELLS = preservedTotalTargetCells;
                return;
            }

            preparedNextMapConfig = nextPreparedConfig;
            preparedNextLevelInitialState = nextPreparedInitialState;
            preparedPreviousMapConfig = previousPreparedConfig;
            preparedPreviousLevelInitialState = previousPreparedInitialState;
            ACTIVE_MAP = preservedActiveMap;
            TARGET_MAP = preservedTargetMap;
            ROWS = preservedRows;
            COLS = preservedCols;
            TARGET_POSITIONS = preservedTargetPositions;
            TARGET_COLOR_COUNTS = preservedTargetColorCounts;
            INITIAL_LAYOUT_ORDER = preservedInitialLayoutOrder;
            INITIAL_LAYOUT_INDEX = preservedInitialLayoutIndex;
            TARGET_NEIGHBOR_PAIRS = preservedTargetNeighborPairs;
            TOTAL_TARGET_CELLS = preservedTotalTargetCells;
        }

        function scheduleUpcomingStagePreparation(activeMapIndex, options = {}) {
            const {
                includePrevious = true,
                delayMs = FOLLOWUP_STAGE_PREPARATION_DELAY_MS,
                useIdleCallback = false
            } = options;

            if (preparedNextMapTimer) {
                window.clearTimeout(preparedNextMapTimer);
                preparedNextMapTimer = null;
            }

            if (preparedNextMapIdleCallbackId != null && typeof window.cancelIdleCallback === "function") {
                window.cancelIdleCallback(preparedNextMapIdleCallbackId);
                preparedNextMapIdleCallbackId = null;
            }

            preparedNextMapTimer = window.setTimeout(() => {
                preparedNextMapTimer = null;
                const runPreparation = () => {
                    preparedNextMapIdleCallbackId = null;
                    void prepareAdjacentStageDefinitions(activeMapIndex, { includePrevious });
                };

                if (useIdleCallback && typeof window.requestIdleCallback === "function") {
                    preparedNextMapIdleCallbackId = window.requestIdleCallback(runPreparation, {
                        timeout: STAGE_PREPARATION_IDLE_TIMEOUT_MS
                    });
                    return;
                }

                runPreparation();
            }, Math.max(0, delayMs));
        }

        function flushDeferredUpcomingPreparation() {
            if (deferredUpcomingPreparationMapIndex < 0 || isPixelAdminOpen()) {
                return;
            }

            const activeMapIndex = deferredUpcomingPreparationMapIndex;
            const includePrevious = deferredUpcomingPreparationIncludePrevious;

            if (preparedNextMapTimer) {
                window.clearTimeout(preparedNextMapTimer);
                preparedNextMapTimer = null;
            }

            if (preparedNextMapIdleCallbackId != null && typeof window.cancelIdleCallback === "function") {
                window.cancelIdleCallback(preparedNextMapIdleCallbackId);
                preparedNextMapIdleCallbackId = null;
            }

            preparedNextMapTimer = window.setTimeout(() => {
                preparedNextMapTimer = null;
                deferredUpcomingPreparationMapIndex = -1;
                deferredUpcomingPreparationIncludePrevious = true;

                const runPreparation = () => {
                    preparedNextMapIdleCallbackId = null;
                    void prepareAdjacentStageDefinitions(activeMapIndex, { includePrevious });
                };

                if (typeof window.requestIdleCallback === "function") {
                    preparedNextMapIdleCallbackId = window.requestIdleCallback(runPreparation, {
                        timeout: STAGE_PREPARATION_IDLE_TIMEOUT_MS
                    });
                    return;
                }

                runPreparation();
            }, Math.max(420, FOLLOWUP_STAGE_PREPARATION_DELAY_MS));
        }

        async function activateMapIndex(nextMapIndex = 0, options = {}) {
            await ensureStageDefinitionLoaded(nextMapIndex);
            syncActiveMap(nextMapIndex, options);
            return currentMapIndex;
        }

        function loadPixelAdminStylesheet() {
            if (pixelAdminStylesheetLoadPromise) {
                return pixelAdminStylesheetLoadPromise;
            }

            if (document.querySelector('link[data-pixel-admin-stylesheet="true"]')) {
                return Promise.resolve();
            }

            pixelAdminStylesheetLoadPromise = new Promise((resolve, reject) => {
                const linkElement = document.createElement("link");
                linkElement.rel = "stylesheet";
                linkElement.href = `./admin.css?v=${SCENE_CONTRACT_VERSION}`;
                linkElement.dataset.pixelAdminStylesheet = "true";
                linkElement.onload = () => resolve();
                linkElement.onerror = () => {
                    pixelAdminStylesheetLoadPromise = null;
                    reject(new Error("Failed to load admin.css"));
                };
                document.head.appendChild(linkElement);
            });

            return pixelAdminStylesheetLoadPromise;
        }

        function loadPixelAdminScript() {
            if (window.__pixelAdminLoaded) {
                return Promise.resolve();
            }

            if (pixelAdminScriptLoadPromise) {
                return pixelAdminScriptLoadPromise;
            }

            pixelAdminScriptLoadPromise = new Promise((resolve, reject) => {
                const scriptElement = document.createElement("script");
                scriptElement.src = `./admin.js?v=${SCENE_CONTRACT_VERSION}`;
                scriptElement.dataset.pixelAdminScript = "true";
                scriptElement.onload = () => resolve();
                scriptElement.onerror = () => {
                    pixelAdminScriptLoadPromise = null;
                    reject(new Error("Failed to load admin.js"));
                };
                document.head.appendChild(scriptElement);
            });
            return pixelAdminScriptLoadPromise;
        }

        async function ensurePixelAdminReady(options = {}) {
            const { open = false } = options;
            await loadPixelAdminStylesheet();
            await loadPixelAdminScript();
            if (typeof window.loadPersistedPixelAdminStageOverrides === "function" && !window.__pixelAdminOverridesLoaded) {
                window.loadPersistedPixelAdminStageOverrides();
            }
            if (open && typeof window.setPixelAdminOpen === "function") {
                window.setPixelAdminOpen(true);
            }
        }

        async function pollSharedStageState() {
            const sharedStateResponse = await fetch(`${SHARED_STAGE_STATE_PATH}?t=${Date.now()}`, {
                cache: "no-store",
                headers: NGROK_BYPASS_HEADERS
            });
            if (sharedStateResponse.status === 404) {
                return;
            }
            if (!sharedStateResponse.ok) {
                throw new Error(`Shared state load failed: ${sharedStateResponse.status}`);
            }

            const sharedState = await sharedStateResponse.json();
            const nextSeenAt = Math.max(0, Number(sharedState?.at) || 0);
            const nextCurrentMapId = typeof sharedState?.currentMapId === "string" && sharedState.currentMapId.trim()
                ? sharedState.currentMapId.trim()
                : null;
            const nextActiveOverrideMapId =
                typeof sharedState?.activeOverrideMapId === "string" && sharedState.activeOverrideMapId.trim()
                    ? sharedState.activeOverrideMapId.trim()
                    : null;
            const nextActiveOverride =
                sharedState?.activeOverride &&
                typeof sharedState.activeOverride === "object" &&
                !Array.isArray(sharedState.activeOverride)
                    ? sharedState.activeOverride
                    : null;
            const nextOverrides =
                nextActiveOverrideMapId && nextActiveOverride
                    ? {
                        [nextActiveOverrideMapId]: nextActiveOverride
                    }
                    : sharedState?.overrides && typeof sharedState.overrides === "object" && !Array.isArray(sharedState.overrides)
                        ? sharedState.overrides
                        : {};
            const activeMapId = getCurrentMapDefinition()?.id || null;
            const previousActiveSharedOverrideSignature = activeMapId
                ? JSON.stringify((sharedPixelAdminStageStorageCache || {})[activeMapId] || null)
                : "null";
            const nextActiveSharedOverrideSignature = activeMapId
                ? JSON.stringify(nextOverrides[activeMapId] || null)
                : "null";
            const activeSharedOverrideDidChange =
                previousActiveSharedOverrideSignature !== nextActiveSharedOverrideSignature;

            sharedCurrentMapId = nextCurrentMapId;
            sharedPixelAdminStageStorageCache = nextOverrides;

            if (!nextSeenAt || nextSeenAt <= sharedStageStateSeenAt) {
                return;
            }

            if (!Array.isArray(MAP_DEFINITIONS) || !MAP_DEFINITIONS.length) {
                sharedStageStateSeenAt = nextSeenAt;
                return;
            }

            sharedStageStateSeenAt = nextSeenAt;
            pixelAdminStageStorageCache = null;
            loadPersistedPixelAdminStageOverrides();
            rebuildRuntimeMapThemeOverrides();

            const nextMapId = sharedCurrentMapId;
            if (!nextMapId) {
                if (!activeSharedOverrideDidChange) {
                    return;
                }

                syncActiveMap(currentMapIndex, {
                    syncPixelAdmin: false,
                    renderPixelAdmin: false,
                    prepareUpcomingMap: false
                });
                currentLevelInitialState = null;
                resetGame({
                    regenerateLevelStart: true,
                    fastLevelStart: true,
                    persistLevelStart: false
                });
                return;
            }

            const nextMapIndex = MAP_DEFINITIONS.findIndex((definition) => definition.id === nextMapId);
            if (nextMapIndex < 0) {
                return;
            }

            if (nextMapIndex !== currentMapIndex) {
                clearRuntimeSnapshot();
                clearSolvedStageFailSafeTimer();
                clearStageClearTimers();
                clearCelebrationTimers();
                isStageTransitioning = false;
                selected = null;

                void activateMapIndex(nextMapIndex, {
                    syncPixelAdmin: false,
                    renderPixelAdmin: false,
                    prepareUpcomingMap: false
                }).then(() => {
                    currentLevelInitialState = null;
                    resetGame({
                        regenerateLevelStart: true,
                        fastLevelStart: true,
                        persistLevelStart: false
                    });
                });
                return;
            }

            if (!activeSharedOverrideDidChange) {
                return;
            }

            syncActiveMap(currentMapIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            currentLevelInitialState = null;
            resetGame({
                regenerateLevelStart: true,
                fastLevelStart: true,
                persistLevelStart: false
            });
        }

        function scheduleSharedStageStatePoll(delayMs = BRIDGE_STAGE_SYNC_POLL_MS) {
            if (!sharedStageBridgeAvailable) {
                if (sharedStageStatePollTimer) {
                    window.clearTimeout(sharedStageStatePollTimer);
                    sharedStageStatePollTimer = null;
                }
                return;
            }
            if (sharedStageStatePollTimer) {
                window.clearTimeout(sharedStageStatePollTimer);
            }

            sharedStageStatePollTimer = window.setTimeout(async () => {
                sharedStageStatePollTimer = null;
                try {
                    await pollSharedStageState();
                } catch (error) {
                    console.error("[Game] failed to poll shared stage state", error);
                }
                scheduleSharedStageStatePoll(
                    document.visibilityState === "hidden"
                        ? BACKGROUND_STAGE_SYNC_POLL_MS
                        : BRIDGE_STAGE_SYNC_POLL_MS
                );
            }, delayMs);
        }

        async function pollBridgeStageSync() {
            const syncResponse = await fetch(`${BRIDGE_STAGE_SYNC_PATH}?t=${Date.now()}`, {
                cache: "no-store",
                headers: NGROK_BYPASS_HEADERS
            });
            if (syncResponse.status === 404) {
                return;
            }
            if (!syncResponse.ok) {
                throw new Error(`Bridge sync load failed: ${syncResponse.status}`);
            }

            const syncPayload = await syncResponse.json();
            const nextSyncAt = Math.max(0, Number(syncPayload?.at) || 0);
            if (!nextSyncAt || nextSyncAt <= bridgeStageSyncSeenAt) {
                return;
            }

            bridgeStageSyncSeenAt = nextSyncAt;
            const stageEntry = syncPayload?.stageEntry || null;
            if (!stageEntry?.file) {
                return;
            }

            const stageResponse = await fetch(`./stage-data/${stageEntry.file}?v=${nextSyncAt}`, {
                cache: "no-store",
                headers: NGROK_BYPASS_HEADERS
            });
            if (!stageResponse.ok) {
                throw new Error(`Synced stage data load failed (${stageEntry.file}): ${stageResponse.status}`);
            }

            const stagePayload = await stageResponse.json();
            const syncedStageIndex = upsertRuntimeStageDefinition(stageEntry, stagePayload);
            if (syncedStageIndex < 0) {
                return;
            }

            if (syncPayload.activate) {
                clearRuntimeSnapshot();
                clearSolvedStageFailSafeTimer();
                clearStageClearTimers();
                clearCelebrationTimers();
                isStageTransitioning = false;
                selected = null;

                void activateMapIndex(syncedStageIndex, {
                    syncPixelAdmin: false,
                    renderPixelAdmin: false,
                    prepareUpcomingMap: false
                }).then(() => {
                    currentLevelInitialState = null;
                    resetGame({
                        regenerateLevelStart: true,
                        fastLevelStart: true,
                        persistLevelStart: false
                    });
                });
                return;
            }

            const activeMapId = getCurrentMapDefinition()?.id || null;
            if (activeMapId !== stageEntry.id) {
                return;
            }

            syncActiveMap(currentMapIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            currentLevelInitialState = null;
            resetGame({
                regenerateLevelStart: true,
                fastLevelStart: true,
                persistLevelStart: false
            });
        }

        function scheduleBridgeStageSyncPoll(delayMs = BRIDGE_STAGE_SYNC_POLL_MS) {
            if (bridgeStageSyncPollTimer) {
                window.clearTimeout(bridgeStageSyncPollTimer);
            }

            bridgeStageSyncPollTimer = window.setTimeout(async () => {
                bridgeStageSyncPollTimer = null;
                try {
                    await pollBridgeStageSync();
                } catch (error) {
                    console.error("[Game] failed to poll bridge sync", error);
                }
                scheduleBridgeStageSyncPoll(
                    document.visibilityState === "hidden"
                        ? BACKGROUND_STAGE_SYNC_POLL_MS
                        : BRIDGE_STAGE_SYNC_POLL_MS
                );
            }, delayMs);
        }

        function withRuntimeSceneAssetBuster(path) {
            if (typeof path !== "string" || !path.trim()) {
                return path;
            }

            const hashIndex = path.indexOf("#");
            const hashSuffix = hashIndex >= 0 ? path.slice(hashIndex) : "";
            const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
            const queryIndex = pathWithoutHash.indexOf("?");
            const basePath = queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
            const normalizedBasePath = basePath.replace(/^\.\//, "").replace(/^\/+/, "");

            if (!NONCACHED_SCENE_ASSET_PATHS.has(normalizedBasePath)) {
                return path;
            }

            const params = new URLSearchParams(queryIndex >= 0 ? pathWithoutHash.slice(queryIndex + 1) : "");
            params.set("v", RUNTIME_SCENE_ASSET_BUSTER);
            return `${basePath}?${params.toString()}${hashSuffix}`;
        }

        function patchContractAssetPaths(target, seen = new WeakSet()) {
            if (!target || typeof target !== "object") {
                return target;
            }

            if (seen.has(target)) {
                return target;
            }
            seen.add(target);

            if (Array.isArray(target)) {
                target.forEach((item) => patchContractAssetPaths(item, seen));
                return target;
            }

            Object.entries(target).forEach(([key, value]) => {
                if ((key === "exportPath" || key === "imagePath") && typeof value === "string") {
                    target[key] = withRuntimeSceneAssetBuster(value);
                    return;
                }

                if (value && typeof value === "object") {
                    patchContractAssetPaths(value, seen);
                }
            });

            return target;
        }

        function padMapToGrid(sourceMap, rows = MAX_GRID_ROWS, cols = MAX_GRID_COLS) {
            const sourceRows = sourceMap.length;
            const sourceCols = sourceMap[0]?.length || 0;

            if (sourceRows > rows || sourceCols > cols) {
                throw new Error(`맵이 최대 그리드 크기를 초과했어요: ${sourceRows}x${sourceCols} > ${rows}x${cols}`);
            }

            const rowOffset = Math.floor((rows - sourceRows) / 2);
            const colOffset = Math.floor((cols - sourceCols) / 2);
            const paddedMap = Array.from({ length: rows }, () => Array(cols).fill(0));

            sourceMap.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    paddedMap[rowOffset + rowIndex][colOffset + colIndex] = cell;
                });
            });

            return {
                map: paddedMap,
                rowOffset,
                colOffset,
                sourceRows,
                sourceCols
            };
        }


        function normalizeAppSettings(rawSettings) {
            return {
                soundEffectsOn: rawSettings?.soundEffectsOn !== false,
                bgmOn: rawSettings?.bgmOn !== false,
                hapticsOn: rawSettings?.hapticsOn !== false,
                tutorialTapHintShown: rawSettings?.tutorialTapHintShown === true
            };
        }

        function readPersistedAppSettings() {
            try {
                const rawValue = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
                if (!rawValue) {
                    return { ...DEFAULT_APP_SETTINGS };
                }

                return {
                    ...normalizeAppSettings(JSON.parse(rawValue)),
                    tutorialTapHintShown: false
                };
            } catch (error) {
                return { ...DEFAULT_APP_SETTINGS };
            }
        }

        function persistAppSettings(nextSettings) {
            try {
                window.localStorage.setItem(
                    APP_SETTINGS_STORAGE_KEY,
                    JSON.stringify({
                        soundEffectsOn: nextSettings?.soundEffectsOn !== false,
                        bgmOn: nextSettings?.bgmOn !== false,
                        hapticsOn: nextSettings?.hapticsOn !== false
                    })
                );
                return true;
            } catch (error) {
                return false;
            }
        }

        function createDefaultItemEconomyState() {
            return {
                charges: {
                    magic: 3,
                    clean: 2,
                    magnet: 0
                },
                adUses: {
                    magic: 0,
                    clean: 0,
                    magnet: 0
                },
                refill: {
                    magic: { active: false, clearCount: 0 },
                    clean: { active: false, clearCount: 0 },
                    magnet: { active: false, clearCount: 0 }
                },
                unlocks: {
                    magnetGranted: false
                }
            };
        }

        function normalizeItemEconomyState(rawState) {
            const defaultState = createDefaultItemEconomyState();
            const rawCharges =
                rawState?.charges && typeof rawState.charges === "object" && !Array.isArray(rawState.charges)
                    ? rawState.charges
                    : {};
            const rawRefill =
                rawState?.refill && typeof rawState.refill === "object" && !Array.isArray(rawState.refill)
                    ? rawState.refill
                    : {};
            const rawAdUses =
                rawState?.adUses && typeof rawState.adUses === "object" && !Array.isArray(rawState.adUses)
                    ? rawState.adUses
                    : {};

            return {
                charges: {
                    magic: Math.max(0, Math.min(3, Number(rawCharges.magic ?? defaultState.charges.magic))),
                    clean: Math.max(0, Math.min(2, Number(rawCharges.clean ?? defaultState.charges.clean))),
                    magnet: Math.max(0, Math.min(2, Number(rawCharges.magnet ?? defaultState.charges.magnet)))
                },
                adUses: {
                    magic: Math.max(0, Math.min(1, Number(rawAdUses.magic || 0))),
                    clean: Math.max(0, Math.min(1, Number(rawAdUses.clean || 0))),
                    magnet: Math.max(0, Math.min(1, Number(rawAdUses.magnet || 0)))
                },
                refill: {
                    magic: {
                        active: rawRefill?.magic?.active === true,
                        clearCount: Math.max(0, Math.min(2, Number(rawRefill?.magic?.clearCount || 0)))
                    },
                    clean: {
                        active: rawRefill?.clean?.active === true,
                        clearCount: Math.max(0, Math.min(2, Number(rawRefill?.clean?.clearCount || 0)))
                    },
                    magnet: {
                        active: rawRefill?.magnet?.active === true,
                        clearCount: Math.max(0, Math.min(2, Number(rawRefill?.magnet?.clearCount || 0)))
                    }
                },
                unlocks: {
                    magnetGranted: rawState?.unlocks?.magnetGranted === true || Number(rawCharges.magnet || 0) > 0
                }
            };
        }

        function readPersistedItemEconomyState() {
            try {
                const rawValue = window.localStorage.getItem(ITEM_ECONOMY_STORAGE_KEY);
                if (!rawValue) {
                    return createDefaultItemEconomyState();
                }

                return normalizeItemEconomyState(JSON.parse(rawValue));
            } catch (error) {
                return createDefaultItemEconomyState();
            }
        }

        function cloneItemEconomyState(sourceState = null) {
            return normalizeItemEconomyState(sourceState || itemEconomyState || createDefaultItemEconomyState());
        }

        function persistItemEconomyState(nextState = null) {
            try {
                itemEconomyState = normalizeItemEconomyState(nextState || itemEconomyState);
                window.localStorage.setItem(
                    ITEM_ECONOMY_STORAGE_KEY,
                    JSON.stringify(itemEconomyState)
                );
                return true;
            } catch (error) {
                itemEconomyState = normalizeItemEconomyState(nextState || itemEconomyState);
                return false;
            }
        }


        function readPersistedCurrentMapId() {
            if (new URLSearchParams(window.location.search).get(RESET_TO_FIRST_QUERY_PARAM) === "1") {
                return "tutorial";
            }

            try {
                if (window.localStorage.getItem(FORCE_FIRST_MAP_RESET_STORAGE_KEY) === "1") {
                    return "tutorial";
                }
            } catch (error) {
                // Fall through to the shared/local persisted map lookup.
            }

            if (sharedCurrentMapId) {
                return sharedCurrentMapId;
            }

            try {
                const rawValue = window.localStorage.getItem(CURRENT_MAP_STORAGE_KEY);
                return typeof rawValue === "string" && rawValue.trim() ? rawValue : null;
            } catch (error) {
                return null;
            }
        }

        function persistCurrentMapId(mapId) {
            if (!mapId) {
                return false;
            }

            try {
                const resetRequested =
                    new URLSearchParams(window.location.search).get(RESET_TO_FIRST_QUERY_PARAM) === "1" ||
                    window.localStorage.getItem(FORCE_FIRST_MAP_RESET_STORAGE_KEY) === "1";
                const nextMapId = resetRequested ? "tutorial" : mapId;
                window.localStorage.setItem(CURRENT_MAP_STORAGE_KEY, nextMapId);
                return true;
            } catch (error) {
                return false;
            }
        }

        function buildStageDefinition(stageEntry, stagePayload) {
            const palette = clonePaletteMeta(stagePayload?.palette || {});
            const themeOverridePalette = clonePaletteMeta(stagePayload?.themeOverridePalette || {});
            const sequence = Number(stagePayload?.sequence ?? stageEntry?.sequence) || 0;
            const normalizedImageMap = Array.isArray(stagePayload?.imageMap) ? clonePixelMap(stagePayload.imageMap) : [];
            const normalizedInitialBoardState = Array.isArray(stagePayload?.initialBoardState)
                ? clonePixelMap(stagePayload.initialBoardState)
                : null;
            const normalizedInitialTrayState = Array.isArray(stagePayload?.initialTrayState)
                ? [...stagePayload.initialTrayState]
                : [];
            const sourceSignature = JSON.stringify({
                imageMap: normalizedImageMap,
                palette,
                themeOverridePalette,
                scale: Math.max(1, Number(stagePayload?.scale) || 1),
                boardCellSize: Number(stagePayload?.boardCellSize) || null,
                trayCellSize: Number(stagePayload?.trayCellSize) || null,
                initialBoardState: normalizedInitialBoardState,
                initialTrayState: normalizedInitialTrayState,
                overrideVersion: Number(stagePayload?.overrideVersion) || 1
            });

            return {
                id: stagePayload?.id || stageEntry?.id || `stage_${sequence || "unknown"}`,
                sequence,
                file: stageEntry?.file || null,
                exportName:
                    stagePayload?.exportName ||
                    String(stageEntry?.file || "")
                        .replace(/\.json$/i, "") ||
                    null,
                displayName:
                    normalizeStageDisplayName(stagePayload?.displayName) ||
                    normalizeStageDisplayName(stageEntry?.displayName) ||
                    null,
                displayNameNumbered:
                    typeof stagePayload?.displayNameNumbered === "string" && stagePayload.displayNameNumbered.trim()
                        ? stagePayload.displayNameNumbered.trim()
                        : typeof stageEntry?.displayNameNumbered === "string" && stageEntry.displayNameNumbered.trim()
                            ? stageEntry.displayNameNumbered.trim()
                            : null,
                scale: Math.max(1, Number(stagePayload?.scale) || 1),
                boardCellSize: Number(stagePayload?.boardCellSize) || undefined,
                trayCellSize: Number(stagePayload?.trayCellSize) || undefined,
                startMessageTemplate: stagePayload?.startMessageTemplate || "",
                startMessage: stagePayload?.startMessage || "",
                overrideVersion: Number(stagePayload?.overrideVersion) || undefined,
                balancedColors: stagePayload?.balancedColors === true,
                colorSeed: Number(stagePayload?.colorSeed) || 0,
                sourceSignature,
                sourceRefs:
                    stagePayload?.sourceRefs && typeof stagePayload.sourceRefs === "object" && !Array.isArray(stagePayload.sourceRefs)
                        ? { ...stagePayload.sourceRefs }
                        : null,
                pocketUnlock:
                    stagePayload?.pocketUnlock && typeof stagePayload.pocketUnlock === "object" && !Array.isArray(stagePayload.pocketUnlock)
                        ? { ...stagePayload.pocketUnlock }
                        : undefined,
                palette,
                themeOverridePalette,
                cssVars:
                    stagePayload?.cssVars && typeof stagePayload.cssVars === "object" && !Array.isArray(stagePayload.cssVars)
                        ? { ...stagePayload.cssVars }
                        : undefined,
                baseImageMap: normalizedImageMap,
                initialBoardState: normalizedInitialBoardState,
                initialTrayState: normalizedInitialTrayState,
                __stageEntry: stageEntry && typeof stageEntry === "object" ? { ...stageEntry } : {},
                __stageLoaded: true,
                __stageLoadPromise: null
            };
        }

        function rebuildRuntimeMapThemeOverrides() {
            MAP_THEME_OVERRIDES = Object.fromEntries(
                MAP_DEFINITIONS.map((definition) => [
                    definition.id,
                    {
                        palette: clonePaletteMeta(
                            Object.keys(definition.themeOverridePalette || {}).length
                                ? definition.themeOverridePalette
                                : definition.palette || {}
                        ),
                        cssVars: definition.cssVars ? { ...definition.cssVars } : {}
                    }
                ])
            );
        }

        function upsertRuntimeStageDefinition(stageEntry, stagePayload) {
            const nextDefinition = buildStageDefinition(stageEntry, stagePayload);
            const existingIndex = MAP_DEFINITIONS.findIndex(
                (definition) => definition.id === nextDefinition.id || definition.file === nextDefinition.file
            );

            if (existingIndex >= 0) {
                const existingDefinition = MAP_DEFINITIONS[existingIndex];
                delete existingDefinition.__cachedMapConfig;
                delete existingDefinition.__cachedMapConfigSignature;
                delete existingDefinition.__cachedLevelInitialState;
                delete existingDefinition.__cachedLevelInitialStateSignature;
                delete existingDefinition.__cachedStageEditorCanvasMap;
                delete existingDefinition.__cachedStageEditorCanvasMapSignature;
                Object.assign(existingDefinition, nextDefinition);
            } else {
                MAP_DEFINITIONS.push(nextDefinition);
            }

            MAP_DEFINITIONS.sort((left, right) => {
                const sequenceDiff = (Number(left?.sequence) || 0) - (Number(right?.sequence) || 0);
                if (sequenceDiff) {
                    return sequenceDiff;
                }

                return String(left?.id || "").localeCompare(String(right?.id || ""));
            });
            invalidatePreparedMapCaches();
            rebuildRuntimeMapThemeOverrides();
            return MAP_DEFINITIONS.findIndex((definition) => definition.id === nextDefinition.id);
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
                    pixelAdminStageStorageCache = sharedPixelAdminStageStorageCache
                        ? JSON.parse(JSON.stringify(sharedPixelAdminStageStorageCache))
                        : {};
                    return pixelAdminStageStorageCache;
                }

                const parsed = JSON.parse(rawValue);
                const localPayload =
                    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
                pixelAdminStageStorageCache = {
                    ...localPayload,
                    ...(sharedPixelAdminStageStorageCache || {})
                };
                return pixelAdminStageStorageCache;
            } catch (error) {
                pixelAdminStageStorageCache = sharedPixelAdminStageStorageCache
                    ? JSON.parse(JSON.stringify(sharedPixelAdminStageStorageCache))
                    : {};
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

        function applyPersistedPixelAdminStageOverride(definition) {
            if (!definition?.id || !isStageDefinitionLoaded(definition)) {
                return false;
            }

            const storagePayload = readPixelAdminStageStorage();
            const override = storagePayload[definition.id];
            if (!override || typeof override !== "object") {
                definition.adminTargetMap = null;
                definition.adminPalette = null;
                definition.adminDisplayName = null;
                invalidatePreparedMapCaches();
                rebuildRuntimeMapThemeOverrides();
                return false;
            }

            let didMutateStorage = false;
            let shouldClearOverride = false;
            if ((Number(override.overrideVersion) || 1) !== getStageOverrideVersion(definition)) {
                delete storagePayload[definition.id];
                didMutateStorage = true;
                shouldClearOverride = true;
            } else {
                const normalizedMap = normalizeStoredPixelAdminMap(override.map);
                if (!normalizedMap) {
                    delete storagePayload[definition.id];
                    didMutateStorage = true;
                    shouldClearOverride = true;
                } else {
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
                        const stageColor = normalizeHexColor(
                            typeof colorMeta === "string" ? colorMeta : colorMeta?.color
                        );
                        const defaultColor = normalizeHexColor(DEFAULT_COLOR_PALETTE[colorId]?.color);
                        return stageColor && stageColor !== defaultColor;
                    });

                    definition.adminTargetMap = clonePixelMap(normalizedMap);
                    definition.adminPalette =
                        stagePaletteDiffersFromDefault && normalizedPaletteLooksLegacyDefault
                            ? clonePaletteMeta(stagePalette)
                            : normalizedPalette;
                    definition.adminDisplayName = normalizeStageDisplayName(override.displayName) || null;
                    invalidatePreparedMapCaches();

                    if (stagePaletteDiffersFromDefault && normalizedPaletteLooksLegacyDefault) {
                        storagePayload[definition.id] = {
                            ...override,
                            palette: clonePaletteMeta(stagePalette)
                        };
                        didMutateStorage = true;
                    }
                }
            }

            if (shouldClearOverride) {
                definition.adminTargetMap = null;
                definition.adminPalette = null;
                definition.adminDisplayName = null;
                invalidatePreparedMapCaches();
            }

            if (didMutateStorage) {
                writePixelAdminStageStorage(storagePayload);
            }

            return true;
        }

        function loadPersistedPixelAdminStageOverrides() {
            const storagePayload = readPixelAdminStageStorage();
            let didMutateStorage = false;

            Object.keys(storagePayload).forEach((mapId) => {
                if (!getMapDefinitionById(mapId)) {
                    delete storagePayload[mapId];
                    didMutateStorage = true;
                }
            });

            if (didMutateStorage) {
                writePixelAdminStageStorage(storagePayload);
            }

            MAP_DEFINITIONS.forEach((definition) => {
                applyPersistedPixelAdminStageOverride(definition);
            });
            window.__pixelAdminOverridesLoaded = true;
        }

        function readLevelInitialStateCacheStorage() {
            if (levelInitialStateStorageCache) {
                return levelInitialStateStorageCache;
            }

            try {
                const rawValue = window.localStorage.getItem(LEVEL_INITIAL_STATE_CACHE_STORAGE_KEY);
                if (!rawValue) {
                    levelInitialStateStorageCache = {};
                    return levelInitialStateStorageCache;
                }

                const parsed = JSON.parse(rawValue);
                levelInitialStateStorageCache =
                    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
                return levelInitialStateStorageCache;
            } catch (error) {
                levelInitialStateStorageCache = {};
                return levelInitialStateStorageCache;
            }
        }

        function writeLevelInitialStateCacheStorage(storagePayload) {
            try {
                if (!storagePayload || !Object.keys(storagePayload).length) {
                    window.localStorage.removeItem(LEVEL_INITIAL_STATE_CACHE_STORAGE_KEY);
                    levelInitialStateStorageCache = {};
                    return true;
                }

                window.localStorage.setItem(
                    LEVEL_INITIAL_STATE_CACHE_STORAGE_KEY,
                    JSON.stringify(storagePayload)
                );
                levelInitialStateStorageCache = storagePayload;
                return true;
            } catch (error) {
                return false;
            }
        }

        function getLevelInitialStateCacheSignature(definition, config = ACTIVE_MAP) {
            if (!definition || !config) {
                return "";
            }

            const baseSignature = `${config.id}:${config.rows}:${config.cols}:${getStageOverrideVersion(definition)}`;
            if (!definition.adminTargetMap) {
                return baseSignature;
            }

            return `${baseSignature}:${JSON.stringify(definition.adminTargetMap)}`;
        }

        function readPersistedLevelInitialState(definition, config = ACTIVE_MAP) {
            if (!definition || !config) {
                return null;
            }

            const storagePayload = readLevelInitialStateCacheStorage();
            const cacheEntry = storagePayload[definition.id];
            const cacheSignature = getLevelInitialStateCacheSignature(definition, config);
            if (!cacheEntry || cacheEntry.signature !== cacheSignature) {
                return null;
            }

            const allowedColorIds = new Set([0, ...Object.keys(config.targetColorCounts).map(Number)]);
            return normalizeLevelInitialStateSnapshot(cacheEntry.state, config, allowedColorIds);
        }

        function persistLevelInitialState(definition, levelInitialState, config = ACTIVE_MAP) {
            if (!definition || !levelInitialState || !config) {
                return false;
            }

            const storagePayload = readLevelInitialStateCacheStorage();
            storagePayload[definition.id] = {
                signature: getLevelInitialStateCacheSignature(definition, config),
                state: {
                    mapId: levelInitialState.mapId,
                    rows: levelInitialState.rows,
                    cols: levelInitialState.cols,
                    boardState: cloneBoardSnapshot(levelInitialState.boardState),
                    trayState: [...levelInitialState.trayState],
                    cleanedSocketCells: [...(levelInitialState.cleanedSocketCells || [])],
                    actionCharges: clampActionChargesSnapshot(levelInitialState.actionCharges)
                }
            };
            return writeLevelInitialStateCacheStorage(storagePayload);
        }

        function getInitialMapIndex() {
            if (new URLSearchParams(window.location.search).get(RESET_TO_FIRST_QUERY_PARAM) === "1") {
                return getFirstPlayableMapIndex();
            }
            try {
                if (window.localStorage.getItem(FORCE_FIRST_MAP_RESET_STORAGE_KEY) === "1") {
                    return getFirstPlayableMapIndex();
                }
            } catch (error) {
                // Fall through to the normal persisted map lookup.
            }
            if (IS_NGROK_HOST) {
                return getFirstPlayableMapIndex();
            }

            const persistedMapId = readPersistedCurrentMapId();
            const targetMapId = persistedMapId || "tutorial";
            const restoredIndex = MAP_DEFINITIONS.findIndex((definition) => definition.id === targetMapId);
            return restoredIndex >= 0 ? restoredIndex : 0;
        }

        function getFirstPlayableMapIndex() {
            const tutorialIndex = MAP_DEFINITIONS.findIndex((definition) => definition.id === "tutorial");
            return tutorialIndex >= 0 ? tutorialIndex : 0;
        }

        function clearPersistedGameProgress() {
            try {
                window.sessionStorage.removeItem("color_jewel_game_progress_v1");
                window.sessionStorage.removeItem(RUNTIME_SNAPSHOT_STORAGE_KEY);
                return true;
            } catch (error) {
                return false;
            }
        }

        window.goToFirstPlayableLevelCheat = async function () {
            if (!Array.isArray(MAP_DEFINITIONS) || !MAP_DEFINITIONS.length) {
                return false;
            }

            const firstMapIndex = getFirstPlayableMapIndex();
            const firstDefinition = MAP_DEFINITIONS[firstMapIndex];
            const firstMapId = firstDefinition?.id || null;
            const overridePayload = readPixelAdminStageStorage();
            const firstOverride =
                firstMapId &&
                overridePayload?.[firstMapId] &&
                typeof overridePayload[firstMapId] === "object" &&
                !Array.isArray(overridePayload[firstMapId])
                    ? overridePayload[firstMapId]
                    : null;
            const sharedOverridePayload = firstOverride
                ? {
                    overrideVersion: firstOverride.overrideVersion,
                    displayName: firstOverride.displayName,
                    map: firstOverride.map,
                    palette: firstOverride.palette
                }
                : null;

            clearPersistedGameProgress();
            clearRuntimeSnapshot();
            resetItemEconomyState();
            writeLevelInitialStateCacheStorage({});
            MAP_DEFINITIONS.forEach((definition) => {
                definition.__cachedLevelInitialState = null;
                definition.__cachedLevelInitialStateSignature = null;
            });
            sharedCurrentMapId = firstMapId;
            try {
                window.localStorage.setItem(FORCE_FIRST_MAP_RESET_STORAGE_KEY, "1");
            } catch (error) {
                // Ignore storage write failures and continue with the in-memory reset.
            }
            if (firstMapId) {
                persistCurrentMapId(firstMapId);
            }
            const resetUrl = new URL(window.location.href);
            resetUrl.searchParams.set(RESET_TO_FIRST_QUERY_PARAM, "1");
            window.history.replaceState(null, "", `${resetUrl.pathname}${resetUrl.search}${resetUrl.hash}`);
            sharedPixelAdminStageStorageCache =
                firstMapId && sharedOverridePayload
                    ? {
                        [firstMapId]: sharedOverridePayload
                    }
                    : {};
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            clearCelebrationTimers();
            isAnimating = false;
            isStageTransitioning = false;
            selected = null;
            currentLevelInitialState = null;

            const sharedStateSyncPromise = sharedStageBridgeAvailable && firstMapId
                ? fetch(SHARED_STAGE_STATE_BRIDGE_URL, {
                    method: "POST",
                    keepalive: true,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentMapId: firstMapId,
                        activeOverrideMapId: sharedOverridePayload ? firstMapId : null,
                        activeOverride: sharedOverridePayload
                    })
                })
                : null;
            sharedStateSyncPromise?.catch?.(() => {});
            window.location.replace(resetUrl.toString());
            return true;
        };

        function cloneBoardSnapshot(boardSnapshot) {
            return boardSnapshot.map((row) => [...row]);
        }

        function clampActionChargesSnapshot(charges = DEFAULT_ACTION_CHARGES) {
            return {
                magic: Math.max(0, Math.min(MAX_ACTION_CHARGES.magic, Number(charges?.magic ?? DEFAULT_ACTION_CHARGES.magic))),
                clean: Math.max(0, Math.min(MAX_ACTION_CHARGES.clean, Number(charges?.clean ?? DEFAULT_ACTION_CHARGES.clean))),
                magnet: Math.max(0, Math.min(MAX_ACTION_CHARGES.magnet, Number(charges?.magnet ?? DEFAULT_ACTION_CHARGES.magnet)))
            };
        }

        function getItemEconomyChargesForMap(map = ACTIVE_MAP) {
            const normalizedCharges = clampActionChargesSnapshot(itemEconomyState?.charges || DEFAULT_ACTION_CHARGES);
            return {
                magic: normalizedCharges.magic,
                clean: normalizedCharges.clean,
                magnet: isSpecialActionUnlocked(map) ? normalizedCharges.magnet : 0
            };
        }

        function syncActionChargesFromItemEconomy(map = ACTIVE_MAP) {
            actionCharges = getItemEconomyChargesForMap(map);
            return actionCharges;
        }

        function ensureItemEconomyForMap(map = ACTIVE_MAP) {
            if (!map) {
                return false;
            }

            itemEconomyState = normalizeItemEconomyState(itemEconomyState);
            let didChange = false;

            if (isSpecialActionUnlocked(map) && itemEconomyState.unlocks.magnetGranted !== true) {
                itemEconomyState.unlocks.magnetGranted = true;
                itemEconomyState.charges.magnet = Math.max(
                    Number(itemEconomyState.charges.magnet || 0),
                    MAX_ACTION_CHARGES.magnet
                );
                itemEconomyState.adUses.magnet = 0;
                itemEconomyState.refill.magnet.active = false;
                itemEconomyState.refill.magnet.clearCount = 0;
                didChange = true;
            }

            if (didChange) {
                persistItemEconomyState(itemEconomyState);
            }

            syncActionChargesFromItemEconomy(map);
            return didChange;
        }

        function resetItemEconomyState() {
            itemEconomyState = createDefaultItemEconomyState();
            persistItemEconomyState(itemEconomyState);
            syncActionChargesFromItemEconomy(ACTIVE_MAP);
            return itemEconomyState;
        }

        function consumeItemCharge(itemType, amount = 1) {
            if (!itemType || amount <= 0) {
                return false;
            }

            itemEconomyState = normalizeItemEconomyState(itemEconomyState);
            const currentCharge = Math.max(0, Number(itemEconomyState.charges[itemType] || 0));
            if (currentCharge < amount) {
                const currentAdUse = Math.max(0, Number(itemEconomyState.adUses?.[itemType] || 0));
                if (amount === 1 && currentCharge <= 0 && currentAdUse > 0) {
                    itemEconomyState.adUses[itemType] = currentAdUse - 1;
                    persistItemEconomyState(itemEconomyState);
                    syncActionChargesFromItemEconomy(ACTIVE_MAP);
                    return true;
                }
                syncActionChargesFromItemEconomy(ACTIVE_MAP);
                return false;
            }

            const nextCharge = Math.max(0, currentCharge - amount);
            const refillState = itemEconomyState.refill[itemType];
            itemEconomyState.charges[itemType] = nextCharge;

            if (nextCharge <= 0) {
                const canTrackRefill = itemType !== "magnet" || itemEconomyState.unlocks.magnetGranted;
                if (canTrackRefill && refillState.active !== true) {
                    refillState.clearCount = 0;
                }
                refillState.active = canTrackRefill;
            } else if (refillState.active !== true) {
                refillState.clearCount = 0;
            }

            persistItemEconomyState(itemEconomyState);
            syncActionChargesFromItemEconomy(ACTIVE_MAP);
            return true;
        }

        function collectStageClearItemRewards() {
            itemEconomyState = normalizeItemEconomyState(itemEconomyState);
            if (isTutorialMap()) {
                syncActionChargesFromItemEconomy(ACTIVE_MAP);
                return [];
            }
            const rewardedItems = [];

            ["magic", "clean", "magnet"].forEach((itemType) => {
                if (itemType === "magnet" && itemEconomyState.unlocks.magnetGranted !== true) {
                    return;
                }

                const refillState = itemEconomyState.refill[itemType];
                const currentCharge = Math.max(0, Number(itemEconomyState.charges[itemType] || 0));
                if (!refillState.active) {
                    return;
                }

                refillState.clearCount = Math.max(0, Number(refillState.clearCount || 0)) + 1;
                if (refillState.clearCount < ITEM_CLEAR_REWARD_TARGET) {
                    return;
                }

                refillState.active = false;
                refillState.clearCount = 0;

                if (currentCharge >= MAX_ACTION_CHARGES[itemType]) {
                    return;
                }

                itemEconomyState.charges[itemType] = Math.min(MAX_ACTION_CHARGES[itemType], currentCharge + 1);
                itemEconomyState.adUses[itemType] = 0;
                rewardedItems.push(itemType);
            });

            persistItemEconomyState(itemEconomyState);
            syncActionChargesFromItemEconomy(ACTIVE_MAP);
            return rewardedItems;
        }

        function grantAdRewardItem(itemType) {
            const rewardMeta = ITEM_REWARD_META[itemType];
            if (!rewardMeta) {
                return false;
            }

            itemEconomyState = normalizeItemEconomyState(itemEconomyState);
            if (itemType === "magnet" && itemEconomyState.unlocks.magnetGranted !== true) {
                return false;
            }

            const currentAdUse = Math.max(0, Number(itemEconomyState.adUses?.[itemType] || 0));
            if (currentAdUse > 0) {
                return true;
            }

            itemEconomyState.adUses[itemType] = 1;
            persistItemEconomyState(itemEconomyState);
            syncActionChargesFromItemEconomy(ACTIVE_MAP);
            setStatus(`광고 보상으로 ${rewardMeta.label} 1회 사용 가능해요.`);
            persistRuntimeSnapshot();
            return true;
        }

        function clearItemRewardOverlay() {
            if (!itemRewardOverlayElement) {
                return;
            }

            itemRewardOverlayElement.replaceChildren();
            itemRewardOverlayElement.classList.remove("active");
            itemRewardOverlayElement.setAttribute("aria-hidden", "true");
        }

        function showStageClearItemRewards(rewardedItems = [], sessionVersion = gameSessionVersion) {
            if (!itemRewardOverlayElement || !rewardedItems.length) {
                clearItemRewardOverlay();
                return;
            }

            clearItemRewardOverlay();
            itemRewardOverlayElement.classList.add("active");
            itemRewardOverlayElement.setAttribute("aria-hidden", "false");

            rewardedItems.forEach((itemType, index) => {
                const timerId = window.setTimeout(() => {
                    if (!isCurrentGameSession(sessionVersion)) {
                        return;
                    }

                    const rewardMeta = ITEM_REWARD_META[itemType];
                    if (!rewardMeta) {
                        return;
                    }

                    itemRewardOverlayElement.replaceChildren();

                    const rewardCard = document.createElement("div");
                    rewardCard.className = "item-reward-pop";

                    const rewardIconWrap = document.createElement("div");
                    rewardIconWrap.className = "item-reward-icon-wrap";

                    const rewardSceneIconSource = rewardMeta.sceneStableId
                        ? colorJewelSceneRenderer?.getElement?.(rewardMeta.sceneStableId)
                        : null;

                    if (rewardSceneIconSource) {
                        const rewardSceneIcon = rewardSceneIconSource.cloneNode(true);
                        rewardSceneIcon.classList.add("item-reward-scene-icon");
                        rewardSceneIcon.removeAttribute("data-stable-id");
                        rewardSceneIcon.style.display = "";
                        rewardSceneIcon.style.opacity = "1";
                        rewardSceneIcon.style.visibility = "visible";
                        rewardSceneIcon.querySelectorAll("[data-fallback-stable-id]").forEach((element) => element.remove());
                        rewardSceneIcon.querySelectorAll(".text-0").forEach((element) => element.remove());
                        rewardSceneIcon.querySelectorAll("img").forEach((image) => {
                            const imageSource = `${image.currentSrc || ""} ${image.src || ""}`.toLowerCase();
                            if (
                                imageSource.includes("circle1.png") ||
                                imageSource.includes("pictoicon_player_play") ||
                                imageSource.includes("player_play")
                            ) {
                                image.remove();
                            }
                        });
                        rewardIconWrap.appendChild(rewardSceneIcon);
                    } else {
                        const rewardIcon = document.createElement("img");
                        rewardIcon.className = "item-reward-icon";
                        rewardIcon.src = `${rewardMeta.iconPath}?v=${RUNTIME_SCENE_ASSET_BUSTER}`;
                        rewardIcon.alt = "";
                        rewardIcon.setAttribute("aria-hidden", "true");
                        rewardIconWrap.appendChild(rewardIcon);
                    }

                    rewardCard.append(rewardIconWrap);
                    itemRewardOverlayElement.appendChild(rewardCard);
                }, ITEM_REWARD_POP_START_MS + (index * ITEM_REWARD_POP_DELAY_MS));

                stageClearTimers.push(timerId);
            });

            const cleanupTimerId = window.setTimeout(() => {
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }
                clearItemRewardOverlay();
            }, ITEM_REWARD_POP_START_MS + (rewardedItems.length * ITEM_REWARD_POP_DELAY_MS) + ITEM_REWARD_POP_VISIBLE_MS);

            stageClearTimers.push(cleanupTimerId);
        }

        function createLevelInitialStateSnapshot(boardSnapshot, traySnapshot, cleanedCells = [], charges = DEFAULT_ACTION_CHARGES) {
            return {
                mapId: ACTIVE_MAP?.id || null,
                rows: ROWS,
                cols: COLS,
                boardState: cloneBoardSnapshot(boardSnapshot),
                trayState: [...traySnapshot],
                cleanedSocketCells: [...cleanedCells],
                actionCharges: clampActionChargesSnapshot(charges)
            };
        }

        function isValidLevelInitialStateSnapshot(levelInitialState, config, allowedColorIds) {
            if (!levelInitialState || levelInitialState.mapId !== config.id) {
                return false;
            }

            return (
                levelInitialState.rows === config.rows &&
                levelInitialState.cols === config.cols &&
                isValidSnapshotBoardForConfig(levelInitialState.boardState, config, allowedColorIds) &&
                isValidSnapshotTrayForConfig(levelInitialState.trayState, allowedColorIds) &&
                isValidSnapshotGemCounts(levelInitialState.boardState, levelInitialState.trayState, config)
            );
        }

        function normalizeLevelInitialStateSnapshot(levelInitialState, config, allowedColorIds) {
            if (!isValidLevelInitialStateSnapshot(levelInitialState, config, allowedColorIds)) {
                return null;
            }

            const normalizedCharges = clampActionChargesSnapshot(levelInitialState.actionCharges);
            if (isSpecialActionUnlocked(config) && (Number(normalizedCharges.magnet) || 0) <= 0) {
                normalizedCharges.magnet = getDefaultActionCharges(config).magnet;
            }

            return {
                mapId: config.id,
                rows: config.rows,
                cols: config.cols,
                boardState: cloneBoardSnapshot(levelInitialState.boardState),
                trayState: [...levelInitialState.trayState],
                cleanedSocketCells: normalizeSnapshotCleanedSocketCells(levelInitialState.cleanedSocketCells, config),
                actionCharges: normalizedCharges
            };
        }

        function getRuntimeSnapshotPayload() {
            return {
                version: 1,
                mapId: ACTIVE_MAP?.id || null,
                rows: ROWS,
                cols: COLS,
                boardState: cloneBoardSnapshot(boardState),
                trayState: [...trayState],
                cleanedSocketCells: [...cleanedSocketCells],
                actionCharges: {
                    magic: Math.max(0, Number(actionCharges.magic || 0)),
                    clean: Math.max(0, Number(actionCharges.clean || 0)),
                    magnet: Math.max(0, Number(actionCharges.magnet || 0))
                },
                itemEconomy: cloneItemEconomyState(),
                moves: Math.max(0, Number(moves || 0)),
                levelInitialState: currentLevelInitialState
                    ? createLevelInitialStateSnapshot(
                        currentLevelInitialState.boardState,
                        currentLevelInitialState.trayState,
                        currentLevelInitialState.cleanedSocketCells,
                        currentLevelInitialState.actionCharges
                    )
                    : null
            };
        }

        function persistRuntimeSnapshot(options = {}) {
            const { immediate = false } = options;
            if (!ACTIVE_MAP || solved || isAnimating || isStageTransitioning) {
                return false;
            }

            if (runtimeSnapshotSaveTimer) {
                window.clearTimeout(runtimeSnapshotSaveTimer);
                runtimeSnapshotSaveTimer = null;
            }

            if (!immediate) {
                runtimeSnapshotSaveTimer = window.setTimeout(() => {
                    runtimeSnapshotSaveTimer = null;
                    persistRuntimeSnapshot({ immediate: true });
                }, RUNTIME_SNAPSHOT_SAVE_DELAY_MS);
                return true;
            }

            try {
                window.sessionStorage.setItem(
                    RUNTIME_SNAPSHOT_STORAGE_KEY,
                    JSON.stringify(getRuntimeSnapshotPayload())
                );
                return true;
            } catch (error) {
                return false;
            }
        }

        function clearRuntimeSnapshot() {
            if (runtimeSnapshotSaveTimer) {
                window.clearTimeout(runtimeSnapshotSaveTimer);
                runtimeSnapshotSaveTimer = null;
            }
            try {
                window.sessionStorage.removeItem(RUNTIME_SNAPSHOT_STORAGE_KEY);
                return true;
            } catch (error) {
                return false;
            }
        }

        function readRuntimeSnapshot() {
            try {
                const rawValue = window.sessionStorage.getItem(RUNTIME_SNAPSHOT_STORAGE_KEY);
                if (!rawValue) {
                    return null;
                }
                return JSON.parse(rawValue);
            } catch (error) {
                return null;
            }
        }

        function readLifecycleDebugLog() {
            if (!LIFECYCLE_DEBUG_ENABLED) {
                return [];
            }
            try {
                const rawValue = window.localStorage.getItem(LIFECYCLE_DEBUG_STORAGE_KEY);
                if (!rawValue) {
                    return [];
                }

                const parsed = JSON.parse(rawValue);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                return [];
            }
        }

        function writeLifecycleDebugLog(entries) {
            if (!LIFECYCLE_DEBUG_ENABLED) {
                return true;
            }
            try {
                if (!Array.isArray(entries) || !entries.length) {
                    window.localStorage.removeItem(LIFECYCLE_DEBUG_STORAGE_KEY);
                    return true;
                }

                window.localStorage.setItem(
                    LIFECYCLE_DEBUG_STORAGE_KEY,
                    JSON.stringify(entries.slice(-LIFECYCLE_DEBUG_LIMIT))
                );
                return true;
            } catch (error) {
                return false;
            }
        }

        function getNavigationDebugEntry() {
            if (typeof performance?.getEntriesByType !== "function") {
                return null;
            }

            return performance.getEntriesByType("navigation")[0] || null;
        }

        function getHeapDebugSnapshot() {
            const memory = performance?.memory;
            if (!memory) {
                return null;
            }

            return {
                usedJSHeapSize: Number(memory.usedJSHeapSize || 0),
                totalJSHeapSize: Number(memory.totalJSHeapSize || 0),
                jsHeapSizeLimit: Number(memory.jsHeapSizeLimit || 0)
            };
        }

        function summarizeLifecycleTarget(target) {
            if (!(target instanceof Element)) {
                return null;
            }

            const tagName = target.tagName ? target.tagName.toLowerCase() : "unknown";
            const idLabel = target.id ? `#${target.id}` : "";
            const classLabel = typeof target.className === "string" && target.className.trim()
                ? `.${target.className.trim().split(/\s+/).slice(0, 3).join(".")}`
                : "";
            return `${tagName}${idLabel}${classLabel}`;
        }

        function getLifecycleViewportSnapshot() {
            return {
                width: Number(window.innerWidth || 0),
                height: Number(window.innerHeight || 0)
            };
        }

        function getLifecycleCauseFromLogEntries(entries = readLifecycleDebugLog()) {
            const latestBootEntry = [...entries].reverse().find((entry) => entry?.type === "boot");
            if (!latestBootEntry) {
                return "unknown";
            }

            if (latestBootEntry.wasDiscarded) {
                return "discarded";
            }

            if (latestBootEntry.navType === "reload") {
                return "reload";
            }

            if (latestBootEntry.navType === "back_forward") {
                return "back_forward";
            }

            return latestBootEntry.navType || "navigate";
        }

        const lifecycleDebugState = {
            lastInteraction: null
        };

        function syncLifecycleDebugGlobals(entries = readLifecycleDebugLog()) {
            window.__colorJewelLifecycleLog = entries;
            window.__colorJewelReloadCause = getLifecycleCauseFromLogEntries(entries);
            window.getColorJewelLifecycleLog = () => readLifecycleDebugLog();
            window.getColorJewelReloadCause = () => getLifecycleCauseFromLogEntries();
        }

        function noteLifecycleInteraction(kind, event) {
            const primaryTouch = event?.touches?.[0] || event?.changedTouches?.[0] || null;
            lifecycleDebugState.lastInteraction = {
                kind,
                at: Date.now(),
                target: summarizeLifecycleTarget(event?.target || null),
                x: Number(primaryTouch?.clientX ?? event?.clientX ?? 0),
                y: Number(primaryTouch?.clientY ?? event?.clientY ?? 0)
            };
        }

        function pushLifecycleDebugEntry(type, details = {}) {
            const nextEntry = {
                type,
                at: new Date().toISOString(),
                mapId: ACTIVE_MAP?.id || null,
                moves: Math.max(0, Number(moves || 0)),
                solved: Boolean(solved),
                visibility: document.visibilityState,
                viewport: getLifecycleViewportSnapshot(),
                heap: getHeapDebugSnapshot(),
                interaction: lifecycleDebugState.lastInteraction,
                ...details
            };

            if (!LIFECYCLE_DEBUG_ENABLED) {
                return nextEntry;
            }

            const nextEntries = [...readLifecycleDebugLog(), nextEntry].slice(-LIFECYCLE_DEBUG_LIMIT);
            writeLifecycleDebugLog(nextEntries);
            syncLifecycleDebugGlobals(nextEntries);
            return nextEntry;
        }

        function bootLifecycleDebug() {
            const navigationEntry = getNavigationDebugEntry();
            const bootEntry = pushLifecycleDebugEntry("boot", {
                navType: navigationEntry?.type || "unknown",
                activationStart: Number(navigationEntry?.activationStart || 0),
                notRestoredReasons: navigationEntry?.notRestoredReasons || null,
                wasDiscarded: Boolean(document.wasDiscarded),
                referrer: document.referrer || null,
                userAgent: navigator.userAgent || null
            });

            if (bootEntry.wasDiscarded || bootEntry.navType === "reload") {
                console.warn("[ColorJewel] page lifecycle", bootEntry);
            }
        }

        function isValidSnapshotBoardForConfig(boardSnapshot, config, allowedColorIds) {
            if (!Array.isArray(boardSnapshot) || boardSnapshot.length !== config.rows) {
                return false;
            }

            return boardSnapshot.every((row, rowIndex) => (
                Array.isArray(row) &&
                row.length === config.cols &&
                row.every((cell, colIndex) => {
                    if (!Number.isInteger(cell) || !allowedColorIds.has(cell)) {
                        return false;
                    }

                    if (
                        !config.targetMap[rowIndex][colIndex] &&
                        !config.initialSpawnPositionKeySet?.has(toCellKey(rowIndex, colIndex))
                    ) {
                        return cell === 0;
                    }

                    return true;
                })
            ));
        }

        function isValidSnapshotTrayForConfig(traySnapshot, allowedColorIds) {
            return Array.isArray(traySnapshot) &&
                traySnapshot.length === POCKET_SIZE &&
                traySnapshot.every((cell) => Number.isInteger(cell) && allowedColorIds.has(cell));
        }

        function isValidSnapshotGemCounts(boardSnapshot, traySnapshot, config) {
            const counts = new Map(
                Object.entries(config.targetColorCounts).map(([colorId]) => [Number(colorId), 0])
            );

            boardSnapshot.forEach((row) => {
                row.forEach((cell) => {
                    if (cell) {
                        counts.set(cell, (counts.get(cell) || 0) + 1);
                    }
                });
            });

            traySnapshot.forEach((cell) => {
                if (cell) {
                    counts.set(cell, (counts.get(cell) || 0) + 1);
                }
            });

            return Object.entries(config.targetColorCounts).every(
                ([colorId, targetCount]) => (counts.get(Number(colorId)) || 0) === targetCount
            );
        }

        function normalizeSnapshotCleanedSocketCells(cleanedCells, config) {
            if (!Array.isArray(cleanedCells)) {
                return [];
            }

            const validKeys = new Set(config.targetPositions.map((position) => toCellKey(position.row, position.col)));
            return cleanedCells.filter((key) => typeof key === "string" && validKeys.has(key));
        }

        async function restoreRuntimeSnapshot() {
            if (new URLSearchParams(window.location.search).get(RESET_TO_FIRST_QUERY_PARAM) === "1") {
                clearRuntimeSnapshot();
                return false;
            }
            try {
                if (window.localStorage.getItem(FORCE_FIRST_MAP_RESET_STORAGE_KEY) === "1") {
                    clearRuntimeSnapshot();
                    return false;
                }
            } catch (error) {
                // Keep the usual restore flow when the reset flag cannot be read.
            }
            const snapshot = readRuntimeSnapshot();
            if (!snapshot || snapshot.version !== 1 || !snapshot.mapId) {
                return false;
            }

            const definitionIndex = MAP_DEFINITIONS.findIndex((definition) => definition.id === snapshot.mapId);
            if (definitionIndex < 0) {
                clearRuntimeSnapshot();
                return false;
            }

            const config = buildMapConfig(MAP_DEFINITIONS[definitionIndex]);
            const allowedColorIds = new Set([0, ...Object.keys(config.targetColorCounts).map(Number)]);

            if (
                snapshot.rows !== config.rows ||
                snapshot.cols !== config.cols ||
                !isValidSnapshotBoardForConfig(snapshot.boardState, config, allowedColorIds) ||
                !isValidSnapshotTrayForConfig(snapshot.trayState, allowedColorIds) ||
                !isValidSnapshotGemCounts(snapshot.boardState, snapshot.trayState, config)
            ) {
                clearRuntimeSnapshot();
                return false;
            }

            await activateMapIndex(definitionIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: true
            });
            if (snapshot.itemEconomy) {
                itemEconomyState = normalizeItemEconomyState(snapshot.itemEconomy);
                persistItemEconomyState(itemEconomyState);
            } else if (snapshot.actionCharges) {
                itemEconomyState = normalizeItemEconomyState({
                    ...itemEconomyState,
                    charges: {
                        ...(itemEconomyState?.charges || {}),
                        ...snapshot.actionCharges
                    },
                    refill: {
                        ...(itemEconomyState?.refill || {}),
                        magic: {
                            active: Math.max(0, Number(snapshot.actionCharges?.magic || 0)) <= 0,
                            clearCount: 0
                        },
                        clean: {
                            active: Math.max(0, Number(snapshot.actionCharges?.clean || 0)) <= 0,
                            clearCount: 0
                        },
                        magnet: {
                            active:
                                isSpecialActionUnlocked(config) &&
                                Math.max(0, Number(snapshot.actionCharges?.magnet || 0)) <= 0,
                            clearCount: 0
                        }
                    },
                    unlocks: {
                        magnetGranted:
                            itemEconomyState?.unlocks?.magnetGranted === true ||
                            Math.max(0, Number(snapshot.actionCharges?.magnet || 0)) > 0
                    }
                });
                persistItemEconomyState(itemEconomyState);
            }
            ensureItemEconomyForMap(config);
            currentLevelInitialState = normalizeLevelInitialStateSnapshot(snapshot.levelInitialState, config, allowedColorIds);
            boardState = cloneBoardSnapshot(snapshot.boardState);
            trayState = [...snapshot.trayState];
            cleanedSocketCells = new Set(normalizeSnapshotCleanedSocketCells(snapshot.cleanedSocketCells, config));
            syncActionChargesFromItemEconomy(config);
            actionOverlayState = null;
            clearSparkles();
            clearCelebrationTimers();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            resetBoardTransform();
            resetTutorialGestureGuideState();
            selected = null;
            moves = Math.max(0, Number(snapshot.moves || 0));
            solved = false;
            isAnimating = false;
            isStageTransitioning = false;
            completedColorIds = getCompletedColorIds();
            setStatus(ACTIVE_MAP.startMessage || "배경색을 보면서 보석을 제자리로 정리해 보세요.");
            scheduleRender();
            persistRuntimeSnapshot();
            return true;
        }



        function buildMapConfig(definition) {
            if (!isStageDefinitionLoaded(definition)) {
                throw new Error(`Stage payload is not loaded for ${definition?.id || "unknown"}.`);
            }

            const cachedConfig = definition.__cachedMapConfig;
            const cachedSignature = definition.__cachedMapConfigSignature;
            const sourceMapRef = definition.adminTargetMap || definition.baseImageMap || null;
            const initialBoardStateRef = definition.initialBoardState || null;
            const adminPaletteRef = definition.adminPalette || null;
            const pocketUnlockRef = definition.pocketUnlock || null;

            if (
                cachedConfig &&
                cachedSignature &&
                cachedSignature.sourceMapRef === sourceMapRef &&
                cachedSignature.initialBoardStateRef === initialBoardStateRef &&
                cachedSignature.adminPaletteRef === adminPaletteRef &&
                cachedSignature.adminDisplayName === definition.adminDisplayName &&
                cachedSignature.displayName === definition.displayName &&
                cachedSignature.startMessageTemplate === definition.startMessageTemplate &&
                cachedSignature.startMessage === definition.startMessage &&
                cachedSignature.scale === definition.scale &&
                cachedSignature.boardCellSize === definition.boardCellSize &&
                cachedSignature.trayCellSize === definition.trayCellSize &&
                cachedSignature.overrideVersion === definition.overrideVersion &&
                cachedSignature.pocketUnlockRef === pocketUnlockRef
            ) {
                return cachedConfig;
            }

            const paddedTarget = padMapToGrid(getStageEditorCanvasMap(definition));
            const targetMap = paddedTarget.map;
            const rows = targetMap.length;
            const cols = targetMap[0].length;
            const initialBoardState = initialBoardStateRef
                ? padMapToGrid(initialBoardStateRef, rows, cols).map
                : null;
            const targetPositions = targetMap.flatMap((row, rowIndex) =>
                row
                    .map((target, colIndex) => (target ? { row: rowIndex, col: colIndex } : null))
                    .filter(Boolean)
            );
            const targetColorCounts = targetPositions.reduce((counts, position) => {
                const colorId = targetMap[position.row][position.col];
                counts[colorId] = (counts[colorId] || 0) + 1;
                return counts;
            }, {});
            const center = { row: (rows - 1) / 2, col: (cols - 1) / 2 };
            const sortCenterOut = (left, right) => {
                const leftDistance = Math.abs(left.row - center.row) + Math.abs(left.col - center.col);
                const rightDistance = Math.abs(right.row - center.row) + Math.abs(right.col - center.col);
                return leftDistance - rightDistance || left.row - right.row || left.col - right.col;
            };
            const initialLayoutOrder = [...targetPositions].sort(sortCenterOut);
            const initialLayoutIndex = new Map(
                initialLayoutOrder.map((position, index) => [`${position.row}-${position.col}`, index])
            );
            const targetNeighborPairs = targetPositions.flatMap((position) => {
                const neighbors = [];
                [
                    { row: position.row + 1, col: position.col },
                    { row: position.row, col: position.col + 1 }
                ].forEach((neighbor) => {
                    if (!targetMap[neighbor.row]?.[neighbor.col]) return;
                    neighbors.push([
                        initialLayoutIndex.get(`${position.row}-${position.col}`),
                        initialLayoutIndex.get(`${neighbor.row}-${neighbor.col}`)
                    ]);
                });
                return neighbors;
            });
            const spawnWidth = Math.min(
                cols,
                Math.max(8, Math.min(cols - 2, Math.ceil(Math.sqrt(targetPositions.length * 1.55))))
            );
            const spawnHeight = Math.min(rows, Math.max(1, Math.ceil(targetPositions.length / spawnWidth)));
            const spawnStartRow = Math.max(0, Math.floor((rows - spawnHeight) / 2));
            const spawnStartCol = Math.max(0, Math.floor((cols - spawnWidth) / 2));
            const initialSpawnPositions = [];

            for (let row = spawnStartRow; row < rows && initialSpawnPositions.length < targetPositions.length; row += 1) {
                for (let col = spawnStartCol; col < spawnStartCol + spawnWidth && col < cols; col += 1) {
                    initialSpawnPositions.push({ row, col });
                    if (initialSpawnPositions.length >= targetPositions.length) {
                        break;
                    }
                }
            }

            const initialSpawnPositionKeySet = new Set(
                initialSpawnPositions.map((position) => toCellKey(position.row, position.col))
            );
            const sortedLayoutPositionsByColor = [...initialLayoutOrder].sort((left, right) => {
                const leftColor = targetMap[left.row][left.col];
                const rightColor = targetMap[right.row][right.col];
                return leftColor - rightColor || left.row - right.row || left.col - right.col;
            });
            const sortedLayoutColors = sortedLayoutPositionsByColor.map((position) => targetMap[position.row][position.col]);
            const maxTargetColorCount = sortedLayoutColors.reduce((counts, color) => {
                counts.set(color, (counts.get(color) || 0) + 1);
                return counts;
            }, new Map());
            const initialLayoutOffsets = getInitialLayoutOffsets(initialLayoutOrder, targetMap, targetNeighborPairs);

            const config = {
                ...definition,
                displayName: "",
                startMessage: getStageStartMessage(definition),
                targetMap,
                initialBoardState,
                rows,
                cols,
                mapOffset: {
                    row: paddedTarget.rowOffset,
                    col: paddedTarget.colOffset
                },
                sourceRows: paddedTarget.sourceRows,
                sourceCols: paddedTarget.sourceCols,
                targetPositions,
                targetColorCounts,
                totalTargetCells: targetPositions.length,
                initialLayoutOrder,
                initialLayoutIndex,
                initialSpawnPositions,
                initialSpawnPositionKeySet,
                targetNeighborPairs,
                sortedLayoutPositionsByColor,
                sortedLayoutColors,
                maxTargetColorCount: Math.max(0, ...maxTargetColorCount.values()),
                initialLayoutOffsets,
                pocketUnlock: {
                    initialOpenCount: 12,
                    completedColorsPerUnlock: 1,
                    pocketsPerUnlock: 1,
                    ...(definition.pocketUnlock || {})
                }
            };

            definition.__cachedMapConfigSignature = {
                sourceMapRef,
                initialBoardStateRef,
                adminPaletteRef,
                adminDisplayName: definition.adminDisplayName,
                displayName: definition.displayName,
                startMessageTemplate: definition.startMessageTemplate,
                startMessage: definition.startMessage,
                scale: definition.scale,
                boardCellSize: definition.boardCellSize,
                trayCellSize: definition.trayCellSize,
                overrideVersion: definition.overrideVersion,
                pocketUnlockRef
            };
            definition.__cachedMapConfig = config;
            return config;
        }

        const COLOR_PALETTE = {
            1: { name: "루비", color: "#DF766D" },
            2: { name: "허니", color: "#E3BE7C" },
            3: { name: "리프", color: "#59d77d" },
            4: { name: "하늘", color: "#86B7E5" },
            5: { name: "로즈", color: "#ECA9B5" },
            6: { name: "코코아", color: "#a9744f" },
            7: { name: "에스프레소", color: "#5a3728" }
        };

        Object.assign(COLOR_PALETTE, {
            8: { name: "사과 기본색", color: "#D8544C" },
            9: { name: "사과 광택", color: "#DC675C" },
            10: { name: "사과 반짝임", color: "#E6E08D" }
        });

        Object.values(COLOR_PALETTE).forEach((colorMeta) => {
            colorMeta.color = normalizeHexColor(colorMeta.color) || colorMeta.color;
        });

        const DEFAULT_COLOR_PALETTE = Object.fromEntries(
            Object.entries(COLOR_PALETTE).map(([colorId, colorMeta]) => [colorId, { ...colorMeta }])
        );
        const DEFAULT_THEME_VARS = {
            "--body-bg": "#fffef6",
            "--app-bg": "#fffef6",
            "--grid-bg": "rgba(148, 163, 184, 0.08)",
            "--grid-line": "rgba(226, 232, 240, 0.9)"
        };
        let MAP_THEME_OVERRIDES = {};

        function resetRuntimeColorPalette(paletteMeta = {}) {
            const nextPaletteSignature = Object.entries(paletteMeta)
                .map(([colorId, colorMeta]) => [
                    Number(colorId),
                    normalizeHexColor(typeof colorMeta === "string" ? colorMeta : colorMeta?.color) || "#CCCCCC"
                ])
                .filter(([colorId]) => Number.isInteger(colorId) && colorId > 0)
                .sort((left, right) => left[0] - right[0])
                .map(([colorId, color]) => `${colorId}:${color}`)
                .join("|");
            const defaultIds = new Set(Object.keys(DEFAULT_COLOR_PALETTE));

            Object.keys(COLOR_PALETTE).forEach((colorId) => {
                if (!defaultIds.has(colorId) && !paletteMeta[colorId]) {
                    delete COLOR_PALETTE[colorId];
                }
            });

            Object.entries(DEFAULT_COLOR_PALETTE).forEach(([colorId, colorMeta]) => {
                COLOR_PALETTE[colorId] = { ...colorMeta };
            });

            Object.entries(paletteMeta).forEach(([colorId, colorMeta]) => {
                COLOR_PALETTE[colorId] = {
                    name: `C${colorId}`,
                    color: normalizeHexColor(typeof colorMeta === "string" ? colorMeta : colorMeta?.color) || "#CCCCCC"
                };
            });

            if (runtimePaletteSignature !== nextPaletteSignature) {
                // Gem sprites are cached per color id, so clear them only when the palette actually changes.
                jewelImageCache.clear();
                shadeColorCache.clear();
                runtimePaletteSignature = nextPaletteSignature;
            }
        }

        function applyMapTheme(mapId) {
            const rootStyle = document.documentElement.style;
            const themeOverride = MAP_THEME_OVERRIDES[mapId] || {};
            const definition = getMapDefinitionById(mapId);
            const paletteMeta = definition ? getStagePaletteMeta(definition) : {};
            const nextCssVars = {
                ...DEFAULT_THEME_VARS,
                ...(themeOverride.cssVars || {})
            };

            resetRuntimeColorPalette(paletteMeta);

            Object.entries(nextCssVars).forEach(([name, value]) => {
                rootStyle.setProperty(name, value);
            });
        }

        function getColorJewelContract() {
            if (colorJewelSceneContract) {
                return Promise.resolve(colorJewelSceneContract);
            }

            if (colorJewelSceneContractPromise) {
                return colorJewelSceneContractPromise;
            }

            colorJewelSceneContractPromise = (
                window.location.protocol === "file:"
                    ? import("./scene-contracts.js").then((module) => JSON.parse(JSON.stringify(module.COLOR_JEWEL_CONTRACT)))
                    : fetch(`./Color_Jewel.contract.json?v=${SCENE_CONTRACT_VERSION}`, {
                        headers: NGROK_BYPASS_HEADERS
                    })
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error(`Color_Jewel contract load failed: ${response.status}`);
                            }
                            return response.json();
                        })
            )
                .then((contract) => {
                    patchContractAssetPaths(contract);
                    colorJewelSceneContract = contract;
                    return contract;
                })
                .catch((error) => {
                    colorJewelSceneContractPromise = null;
                    throw error;
                });

            return colorJewelSceneContractPromise;
        }

        function getColorJewelPocketLayout(contract) {
            const pocketLayer = contract?.layers?.find((layer) => layer.stableId === "time-display-56");
            const shape = pocketLayer?.visual?.model?.shape || {};
            const images = Array.isArray(pocketLayer?.visual?.images) ? pocketLayer.visual.images : [];
            const topRowImages = images
                .filter((image) => image.offsetY < 0)
                .sort((left, right) => left.offsetX - right.offsetX);
            const pocketWidth = shape.width || 327;
            const pocketHeight = shape.height || 71;
            const slotCount = TOP_POCKET_COUNT;
            const horizontalPadding = Math.max(12, Math.round(pocketWidth * 0.038));
            const verticalPadding = Math.max(11, Math.round(pocketHeight * 0.16));
            const rowGap = Math.max(8, Math.round(pocketHeight * 0.14));
            const defaultGap = 8;
            const hasExplicitSlotImages = topRowImages.length >= 2;

            if (!hasExplicitSlotImages) {
                const slotSizeFromWidth = Math.floor(
                    (pocketWidth - horizontalPadding * 2 - defaultGap * (slotCount - 1)) / slotCount
                );
                const slotSizeFromHeight = Math.floor(
                    (pocketHeight - verticalPadding * 2 - rowGap) / 2
                );
                const slotSize = Math.max(14, Math.min(18, slotSizeFromWidth, slotSizeFromHeight));
                const totalRowWidth = slotSize * slotCount;
                const slotGap = Math.max(
                    4,
                    Math.floor((pocketWidth - horizontalPadding * 2 - totalRowWidth) / Math.max(1, slotCount - 1))
                );
                const contentHeight = slotSize * 2 + rowGap;
                const topTop = Math.max(6, Math.floor((pocketHeight - contentHeight) / 2));

                return {
                    slotWidth: slotSize,
                    slotGap,
                    topLeft: Math.floor((pocketWidth - (totalRowWidth + slotGap * (slotCount - 1))) / 2),
                    topTop,
                    bottomLeft: Math.floor((pocketWidth - (totalRowWidth + slotGap * (slotCount - 1))) / 2),
                    bottomTop: topTop + slotSize + rowGap
                };
            }

            const nextRowImage =
                images.find((image) => String(image.exportPath || "").includes("pocket_slot_next")) ||
                images.find((image) => image.offsetY >= 0) ||
                null;
            const firstTopRowImage = topRowImages[0] || nextRowImage || { width: 18, height: 18, offsetX: -121, offsetY: -12 };
            const secondTopRowImage = topRowImages[1] || null;
            const slotWidth = firstTopRowImage.width || 18;
            const slotHeight = firstTopRowImage.height || 18;
            const slotGap = secondTopRowImage
                ? Math.max(0, Math.round(Math.abs(secondTopRowImage.offsetX - firstTopRowImage.offsetX) - slotWidth))
                : defaultGap;

            return {
                slotWidth,
                slotGap,
                topLeft: (pocketWidth / 2) + (firstTopRowImage.offsetX || 0) - (slotWidth / 2),
                topTop: (pocketHeight / 2) + (firstTopRowImage.offsetY || 0) - (slotHeight / 2),
                bottomLeft: (pocketWidth / 2) + ((nextRowImage?.offsetX) ?? (firstTopRowImage.offsetX || 0)) - (slotWidth / 2),
                bottomTop: (pocketHeight / 2) + ((nextRowImage?.offsetY) ?? 12) - (slotHeight / 2)
            };
        }

        function applyActiveSceneViewport(contract) {
            activeSceneViewportWidth =
                contract?.viewport?.width ||
                contract?.canvas?.width ||
                activeSceneViewportWidth;
            activeSceneViewportHeight =
                contract?.viewport?.height ||
                contract?.canvas?.height ||
                activeSceneViewportHeight;
        }

        function getViewportMetrics() {
            const visualViewport = window.visualViewport;
            const width = Math.round(
                Number(visualViewport?.width) ||
                Number(window.innerWidth) ||
                Number(document.documentElement?.clientWidth) ||
                0
            );
            const height = Math.round(
                Number(visualViewport?.height) ||
                Number(window.innerHeight) ||
                Number(document.documentElement?.clientHeight) ||
                0
            );

            return {
                width,
                height
            };
        }

        function getSceneLayerBounds(layer) {
            const shape = layer?.visual?.model?.shape;
            const baseWidth = Number(shape?.width ?? 0);
            const baseHeight = Number(shape?.height ?? 0);
            const layerScale = Number(layer?.scale ?? 1);
            const layerScaleX = Number(layer?.scaleX ?? 1);
            const layerScaleY = Number(layer?.scaleY ?? 1);
            const width = baseWidth * layerScale * layerScaleX;
            const height = baseHeight * layerScale * layerScaleY;
            const left = Number(layer?.x ?? 0);
            const top = Number(layer?.y ?? 0);

            if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
                return null;
            }

            return {
                left,
                top,
                right: left + width,
                bottom: top + height,
                width,
                height
            };
        }

        function getColorJewelBottomUiBounds(contract = colorJewelSceneContract) {
            const designHeight = contract?.viewport?.height || contract?.canvas?.height || 844;
            const fallbackTop = Math.round(designHeight * 0.7);
            const relevantIds = new Set([
                "time-display-56",
                "level-node-4",
                "level-node-57",
                "level-node-18",
                "level-node-170",
                "level-node-19"
            ]);
            const bounds = (contract?.layers || [])
                .filter((layer) => relevantIds.has(layer?.stableId))
                .map(getSceneLayerBounds)
                .filter(Boolean);

            if (!bounds.length) {
                return {
                    top: fallbackTop,
                    bottom: designHeight,
                    height: Math.max(0, designHeight - fallbackTop)
                };
            }

            const union = bounds.reduce(
                (acc, layerBounds) => ({
                    top: Math.min(acc.top, layerBounds.top),
                    bottom: Math.max(acc.bottom, layerBounds.bottom)
                }),
                {
                    top: designHeight,
                    bottom: 0
                }
            );

            return {
                top: union.top,
                bottom: union.bottom,
                height: Math.max(0, union.bottom - union.top)
            };
        }

        function getColorJewelSceneLayoutMetrics({
            contract = colorJewelSceneContract,
            mountWidth = sceneBottomUiMountElement?.clientWidth || 0,
            mountHeight = sceneBottomUiMountElement?.clientHeight || 0,
            compactLayout = mountWidth <= 540
        } = {}) {
            const designWidth = contract?.viewport?.width || contract?.canvas?.width || 390;
            const designHeight = contract?.viewport?.height || contract?.canvas?.height || 844;
            const bottomUiBounds = getColorJewelBottomUiBounds(contract);
            const widthScale = mountWidth > 0 ? mountWidth / designWidth : 1;
            const heightScale = mountHeight > 0 ? mountHeight / designHeight : 1;
            const scale = compactLayout
                ? Math.max(0.72, widthScale)
                : Math.min(1, widthScale, heightScale);
            const reservedHeight = Math.ceil(
                Math.max(
                    180,
                    (designHeight - bottomUiBounds.top) * scale + Math.max(12, Math.round(scale * 16))
                )
            );

            return {
                designWidth,
                designHeight,
                scale,
                reservedHeight,
                bottomUiBounds
            };
        }

        function syncColorJewelSceneLayout() {
            if (!colorJewelSceneRootElement || !sceneBottomUiMountElement) {
                return null;
            }

            const { width: viewportWidth, height: viewportHeight } = getViewportMetrics();
            const compactLayout = viewportWidth <= 540;
            const metrics = getColorJewelSceneLayoutMetrics({
                mountWidth: sceneBottomUiMountElement.clientWidth || viewportWidth,
                mountHeight: sceneBottomUiMountElement.clientHeight || viewportHeight,
                compactLayout
            });

            colorJewelSceneRootElement.style.position = "absolute";
            colorJewelSceneRootElement.style.left = "50%";
            colorJewelSceneRootElement.style.right = "auto";
            colorJewelSceneRootElement.style.top = "auto";
            colorJewelSceneRootElement.style.bottom = "0";
            colorJewelSceneRootElement.style.transformOrigin = "50% 100%";
            colorJewelSceneRootElement.style.transform = `translateX(-50%) scale(${metrics.scale})`;

            return metrics;
        }

        function attachColorJewelPocketOverlay(contract) {
            const pocketElement = colorJewelSceneRenderer?.getElement("time-display-56");
            if (!pocketElement) {
                return;
            }

            colorJewelPocketOverlayElement?.remove();

            const layout = getColorJewelPocketLayout(contract);
            const overlay = document.createElement("div");
            overlay.className = "scene-pocket-overlay";
            overlay.setAttribute("aria-hidden", "true");
            overlay.style.setProperty("--scene-pocket-slot-size", `${layout.slotWidth}px`);
            overlay.style.setProperty("--scene-pocket-slot-gap", `${layout.slotGap}px`);

            const topTray = document.createElement("div");
            topTray.id = "topTray";
            topTray.className = "tray scene-pocket-tray";
            topTray.setAttribute("aria-label", "하단 포켓 1열");
            topTray.style.left = `${layout.topLeft}px`;
            topTray.style.top = `${layout.topTop}px`;

            const bottomTray = document.createElement("div");
            bottomTray.id = "bottomTray";
            bottomTray.className = "tray scene-pocket-tray";
            bottomTray.setAttribute("aria-label", "하단 포켓 2열");
            bottomTray.style.left = `${layout.bottomLeft}px`;
            bottomTray.style.top = `${layout.bottomTop}px`;

            overlay.append(topTray, bottomTray);
            pocketElement.appendChild(overlay);

            colorJewelPocketOverlayElement = overlay;
            topTrayElement = topTray;
            bottomTrayElement = bottomTray;
        }

        async function ensureColorJewelSceneUi() {
            if (colorJewelUiReadyPromise) {
                return colorJewelUiReadyPromise;
            }

            colorJewelUiReadyPromise = Promise.all([
                getSceneRendererCtor(),
                getColorJewelContract()
            ]).then(([SceneRenderer, contract]) => {
                if (!sceneBottomUiMountElement) {
                    return false;
                }

                applyActiveSceneViewport(contract);
                colorJewelSceneRootElement = null;
                sceneBottomUiMountElement.replaceChildren();

                const surface = document.createElement("div");
                surface.className = "scene-ui-surface";
                sceneBottomUiMountElement.appendChild(surface);
                colorJewelSceneRenderer = new SceneRenderer(surface, {
                    basePath: "./src/"
                });
                colorJewelSceneRenderer.loadSync(contract);
                colorJewelSceneRenderer.show();
                setSceneLayerDisplay("hand-ani-png-171", false);

                const sceneRootElement = surface.firstElementChild;
                if (sceneRootElement) {
                    sceneRootElement.style.pointerEvents = "none";
                    colorJewelSceneRootElement = sceneRootElement;
                }

                bottomActionButton1Element = colorJewelSceneRenderer.getElement("level-node-4");
                bottomActionButton2Element = colorJewelSceneRenderer.getElement("level-node-57");
                bottomActionButton3Element = colorJewelSceneRenderer.getElement("level-node-18");
                bottomActionButton3TreasureElement = colorJewelSceneRenderer.getElement("level-node-170");
                bottomActionButton4Element = colorJewelSceneRenderer.getElement("level-node-19");
                bottomActionButtonElements = [
                    bottomActionButton1Element,
                    bottomActionButton2Element,
                    bottomActionButton3Element,
                    bottomActionButton3TreasureElement,
                    bottomActionButton4Element
                ].filter(Boolean);

                bottomActionButtonElements.forEach((button) => {
                    button.style.pointerEvents = "auto";
                });

                attachColorJewelPocketOverlay(contract);
                updateActionButtonState();
                syncColorJewelSceneLayout();
                return true;
            }).catch((error) => {
                colorJewelUiReadyPromise = null;
                console.error("[ColorJewel] scene mount failed:", error);
                throw error;
            });

            return colorJewelUiReadyPromise;
        }

        const POCKET_SIZE = 24;
        const TOP_POCKET_COUNT = 12;
        const TRAY_ROW_COUNT = POCKET_SIZE / TOP_POCKET_COUNT;
        const INITIAL_MAX_CLUSTER_SIZE = 12;
        const CLUSTER_STEP_MS = 46;
        const MAGIC_AREA_SIZE = 5;
        const ORTHOGONAL_DIRECTIONS = Object.freeze([
            { row: -1, col: 0 },
            { row: 1, col: 0 },
            { row: 0, col: -1 },
            { row: 0, col: 1 }
        ]);
        const DIAGONAL_DIRECTIONS = Object.freeze([
            { row: -1, col: -1 },
            { row: -1, col: 1 },
            { row: 1, col: -1 },
            { row: 1, col: 1 }
        ]);
        const EIGHT_WAY_DIRECTIONS = Object.freeze([
            ...ORTHOGONAL_DIRECTIONS,
            ...DIAGONAL_DIRECTIONS
        ]);
        const MAX_ACTION_CHARGES = Object.freeze({
            magic: 3,
            clean: 2,
            magnet: 2
        });
        const BASE_ACTION_CHARGES = Object.freeze({
            magic: MAX_ACTION_CHARGES.magic,
            clean: MAX_ACTION_CHARGES.clean,
            magnet: 0
        });
        const ITEM_CLEAR_REWARD_TARGET = 3;
        const ITEM_REWARD_POP_START_MS = 90;
        const ITEM_REWARD_POP_DELAY_MS = 520;
        const ITEM_REWARD_POP_VISIBLE_MS = 480;
        const ITEM_REWARD_META = Object.freeze({
            magic: {
                label: "마법봉",
                iconPath: "./src/assets/magic.png",
                sceneStableId: "level-node-4"
            },
            clean: {
                label: "빗자루",
                iconPath: "./src/assets/clean.png",
                sceneStableId: "level-node-57"
            },
            magnet: {
                label: "자석",
                iconPath: "./src/assets/magnet.png",
                sceneStableId: "level-node-170"
            }
        });
        function isSpecialActionUnlocked(map = null) {
            const activeMap = map || ACTIVE_MAP || null;
            const sequence = Number(activeMap?.sequence || 0);
            return sequence >= 11 || activeMap?.id === "treasurechest";
        }
        function getDefaultActionCharges(map = null) {
            const activeMap = map || ACTIVE_MAP || null;
            return {
                ...BASE_ACTION_CHARGES,
                magnet: isSpecialActionUnlocked(activeMap) ? 2 : 0
            };
        }
        const DEFAULT_ACTION_CHARGES = Object.freeze({ ...BASE_ACTION_CHARGES });
        const MAGNET_TARGET_PAIR_COUNT = 10;
        const TOUCH_TAP_GUARD_MS = 520;
        const BOARD_PAN_DRAG_THRESHOLD_PX = 8;
        const TUTORIAL_GESTURE_SCALE_DELTA_THRESHOLD = 0.08;
        const TUTORIAL_GESTURE_PAN_THRESHOLD_PX = 28;
        const TUTORIAL_BOARD_INITIAL_OFFSET_Y = 20;
        const BOARD_COMPACT_MIN_SCALE_VERTICAL_PAN_MULTIPLIER = 2.2;
        const BOARD_COMPACT_LOW_ZOOM_PAN_MAX_SCALE = 1.2;
        const BOARD_COMPACT_LOW_ZOOM_PAN_SOFT_MAX_SCALE = 1.5;
        const SOUND_VOLUME_MULTIPLIER = 5.4;
        const SOUND_SFX_VOLUME_MULTIPLIER = 0.5;
        const SOUND_BGM_VOLUME_MULTIPLIER = 1.4;
        const TUTORIAL_ITEM_INTRO_START_DELAY_MS = 260;
        const TUTORIAL_ITEM_INTRO_STEP_DELAY_MS = 240;
        const TUTORIAL_ITEM_INTRO_END_DELAY_MS = 320;
        const appElement = document.querySelector(".app");
        const boardStageElement = document.querySelector(".board-stage");
        const sceneBottomUiMountElement = document.getElementById("sceneBottomUiMount");
        const restartFromFirstMapButtonElement = document.getElementById("restartFromFirstMapButton");
        const mobilePrevMapCheatElement = document.getElementById("mobilePrevMapCheat");
        const mobileNextMapCheatElement = document.getElementById("mobileNextMapCheat");
        const boardWrapElement = document.querySelector(".board-wrap");
        const boardPanzoomElement = document.getElementById("boardPanzoom");
        const boardElement = document.getElementById("board");
        let topTrayElement = null;
        let bottomTrayElement = null;
        let pocketDockElement = null;
        let bottomActionsElement = null;
        let bottomActionButtonElements = [];
        let bottomActionButton1Element = null;
        let bottomActionButton2Element = null;
        let bottomActionButton3Element = null;
        let bottomActionButton3TreasureElement = null;
        let bottomActionButton4Element = null;
        let bottomAdSlotElement = null;
        const tutorialLayerElement = document.getElementById("tutorialLayer");
        const titleLoadingOverlayElement = document.getElementById("titleLoadingOverlay");
        const titleSceneMountElement = document.getElementById("titleSceneMount");
        const settingOverlayElement = document.getElementById("settingOverlay");
        const settingSceneMountElement = document.getElementById("settingSceneMount");
        const stageClearOverlayElement = document.getElementById("stageClearOverlay");
        const stageClearSceneMountElement = document.getElementById("stageClearSceneMount");
        const itemRewardOverlayElement = document.getElementById("itemRewardOverlay");

        let currentMapIndex = 0;
        let ACTIVE_MAP = null;
        let TARGET_MAP = null;
        let ROWS = 0;
        let COLS = 0;
        let TARGET_POSITIONS = [];
        let TARGET_COLOR_COUNTS = {};
        let INITIAL_LAYOUT_ORDER = [];
        let POCKET_UNLOCK_RULE = {};
        let DEFAULT_BOARD_CELL_SIZE = 36;
        let DEFAULT_TRAY_CELL_SIZE = 40;
        let INITIAL_LAYOUT_INDEX = new Map();
        let TARGET_NEIGHBOR_PAIRS = [];
        let TOTAL_TARGET_CELLS = 0;
        let boardState = [];
        let trayState = [];
        let selected = null;
        let moves = 0;
        let solved = false;
        let isAnimating = false;
        let isStageTransitioning = false;
        let sparkleCells = new Map();
        let sparkleCleanupTimer = null;
        let completedColorIds = new Set();
        let cleanedSocketCells = new Set();
        let actionCharges = { ...DEFAULT_ACTION_CHARGES };
        let actionOverlayState = null;
        let celebrationTimers = [];
        let stageClearTimers = [];
        let pendingStageClearItemRewards = [];
        let lastResponsiveLayoutKey = "";
        let colorJewelSceneRenderer = null;
        let colorJewelSceneContract = null;
        let colorJewelSceneContractPromise = null;
        let colorJewelUiReadyPromise = null;
        let colorJewelSceneRootElement = null;
        let colorJewelPocketOverlayElement = null;
        let currentLevelInitialState = null;
        let preparedNextMapIndex = -1;
        let preparedNextMapVersion = 0;
        let preparedNextMapConfig = null;
        let preparedNextLevelInitialState = null;
        let preparedPreviousMapIndex = -1;
        let preparedPreviousMapVersion = 0;
        let preparedPreviousMapConfig = null;
        let preparedPreviousLevelInitialState = null;
        let preparedNextMapTimer = null;
        let deferredUpcomingPreparationMapIndex = -1;
        let deferredUpcomingPreparationIncludePrevious = true;
        let titleSceneRenderer = null;
        let settingSceneRenderer = null;
        let settingSceneContract = null;
        let settingSceneContractPromise = null;
        let settingSceneUnsubscribers = [];
        let isSettingSceneOpen = false;
        let isSettingSceneClosing = false;
        let settingSceneCloseTimer = null;
        let settingSceneCloseAnimationCleanup = null;
        let settingSceneAfterCloseAction = null;
        let stageClearSceneRenderer = null;
        let stageClearSceneContract = null;
        let stageClearSceneContractPromise = null;
        let sceneRendererCtorPromise = null;
        let tutorialOverlayFrame = null;
        let tutorialGestureGuideState = {
            stepId: null,
            pinchPhase: "zoom_in",
            pinchReferenceScale: 1,
            panOriginX: 0,
            panOriginY: 0
        };
        let tutorialGestureTypingState = {
            stepId: null,
            message: "",
            startedAt: 0,
            revealedCharacterCount: 0,
            completed: true
        };
        let renderFrame = null;
        let areGemsHiddenByCheat = false;
        let gameSessionVersion = 0;
        let activeSceneViewportWidth = 390;
        let activeSceneViewportHeight = 844;
        let lastTouchActivationAt = 0;
        let lastLifecycleHiddenAt = 0;
        let solvedStageFailSafeTimer = null;
        let lastCorrectPlacementHapticAt = 0;
        let pixelAdminStageStorageCache = null;
        let levelInitialStateStorageCache = null;
        let runtimePaletteSignature = "";
        let appSettings = readPersistedAppSettings();
        let itemEconomyState = readPersistedItemEconomyState();
        let tutorialItemIntroState = null;

        const boardInteraction = {
            scale: 1,
            minScale: 1,
            maxScale: 4.2,
            panX: 0,
            panY: 0,
            touches: new Map(),
            pinchStartDistance: 0,
            pinchStartScale: 1,
            panStartX: 0,
            panStartY: 0,
            basePanX: 0,
            basePanY: 0,
            suppressClickUntil: 0,
            lastTapAt: 0,
            lastTapX: 0,
            lastTapY: 0,
            isTouchGestureActive: false,
            isTouchPanning: false,
            pointerId: null,
            isPointerDragging: false,
            isPointerPanActive: false,
            magicPointerId: null,
            isMagicDragging: false,
            magicLastCell: null
        };

        function resetTutorialGestureGuideState() {
            if (isTutorialMap() && appSettings.tutorialTapHintShown) {
                updateAppSettings({ tutorialTapHintShown: false }, { persist: false });
            }
            tutorialGestureGuideState = {
                stepId: isTutorialMap() ? TUTORIAL_GESTURE_GUIDE_STEPS[0].id : null,
                pinchPhase: "zoom_in",
                pinchReferenceScale: boardInteraction.scale,
                panOriginX: boardInteraction.panX,
                panOriginY: boardInteraction.panY
            };
            tutorialGestureTypingState = {
                stepId: null,
                message: "",
                startedAt: 0,
                revealedCharacterCount: 0,
                completed: tutorialGestureGuideState.stepId === null
            };
        }

        function setTutorialGestureGuideStep(nextStepId) {
            if (tutorialGestureGuideState.stepId === nextStepId) {
                return;
            }
            tutorialGestureGuideState.stepId = nextStepId;
            tutorialGestureGuideState.pinchPhase = nextStepId === "pinch_ani" ? "zoom_in" : tutorialGestureGuideState.pinchPhase;
            tutorialGestureGuideState.pinchReferenceScale = boardInteraction.scale;
            tutorialGestureGuideState.panOriginX = boardInteraction.panX;
            tutorialGestureGuideState.panOriginY = boardInteraction.panY;
            tutorialGestureTypingState = {
                stepId: null,
                message: "",
                startedAt: 0,
                revealedCharacterCount: 0,
                completed: nextStepId === null
            };
            if (nextStepId !== "pinch_ani") {
                setSceneLayerDisplay("hand-ani-png-171", false);
            }
            scheduleTutorialOverlayRender();
        }

        function isTutorialGestureGuideActive() {
            return (
                isTutorialMap() &&
                !solved &&
                !isAnimating &&
                typeof tutorialGestureGuideState.stepId === "string" &&
                tutorialGestureGuideState.stepId.length > 0
            );
        }

        function advanceTutorialGestureGuideScale(previousScale, nextScale) {
            if (!isTutorialGestureGuideActive()) {
                return;
            }

            if (
                tutorialGestureGuideState.stepId === "pinch_ani" &&
                tutorialGestureGuideState.pinchPhase === "zoom_in" &&
                nextScale > previousScale &&
                nextScale - tutorialGestureGuideState.pinchReferenceScale >= TUTORIAL_GESTURE_SCALE_DELTA_THRESHOLD
            ) {
                void playPickupSound(1);
                tutorialGestureGuideState.pinchPhase = "zoom_out";
                tutorialGestureGuideState.pinchReferenceScale = nextScale;
                return;
            }

            if (
                tutorialGestureGuideState.stepId === "pinch_ani" &&
                tutorialGestureGuideState.pinchPhase === "zoom_out" &&
                nextScale < previousScale &&
                tutorialGestureGuideState.pinchReferenceScale - nextScale >= TUTORIAL_GESTURE_SCALE_DELTA_THRESHOLD
            ) {
                void playPickupSound(1);
                setTutorialGestureGuideStep("tuto_pan");
            }
        }

        function advanceTutorialGestureGuidePan() {
            if (tutorialGestureGuideState.stepId !== "tuto_pan") {
                return;
            }

            if (
                Math.hypot(
                    boardInteraction.panX - tutorialGestureGuideState.panOriginX,
                    boardInteraction.panY - tutorialGestureGuideState.panOriginY
                ) >= TUTORIAL_GESTURE_PAN_THRESHOLD_PX
            ) {
                void playPickupSound(1);
                setTutorialGestureGuideStep(null);
            }
        }

        settingSceneMountElement?.addEventListener("click", (event) => {
            if (!isSettingSceneOpen || isSettingSceneClosing) {
                return;
            }

            const shellElement = settingSceneMountElement.querySelector(".setting-scene-shell");
            if (!shellElement || !settingSceneContract) {
                clearSettingScene();
                return;
            }

            const shellRect = shellElement.getBoundingClientRect();
            if (!shellRect.width || !shellRect.height) {
                clearSettingScene();
                return;
            }

            const { designWidth, designHeight } = getSettingSceneLayoutMetrics(settingSceneContract);
            const scaleX = shellRect.width / designWidth;
            const scaleY = shellRect.height / designHeight;
            const panelBounds = getSettingScenePanelBounds(settingSceneContract);
            const relativeX = event.clientX - shellRect.left;
            const relativeY = event.clientY - shellRect.top;
            const isInsidePanel =
                relativeX >= panelBounds.left * scaleX &&
                relativeX <= panelBounds.right * scaleX &&
                relativeY >= panelBounds.top * scaleY &&
                relativeY <= panelBounds.bottom * scaleY;

            if (isInsidePanel) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            clearSettingScene();
        });

        const SETTING_SCENE_CLOSE_ANIMATION_MS = 760;
        const MATCH_SPARKLE_MS = 240;
        const COLOR_COMPLETE_STEP_MS = 20;
        const FULL_BOARD_CELEBRATION_MAX_MS = 120;
        const STAGE_CLEAR_CONFETTI_MS = 420;
        const STAGE_CLEAR_FADE_OUT_MS = 180;
        const STAGE_CLEAR_TOTAL_MS = STAGE_CLEAR_CONFETTI_MS + 140;
        const STAGE_CLEAR_FIREWORK_SEQUENCE = [
            { left: 18, top: 22, delay: 0, accent: 0 },
            { left: 82, top: 20, delay: 120, accent: 1 },
            { left: 30, top: 42, delay: 220, accent: 2 },
            { left: 70, top: 40, delay: 340, accent: 1 },
            { left: 50, top: 24, delay: 460, accent: 3 },
            { left: 24, top: 30, delay: 620, accent: 2 },
            { left: 76, top: 28, delay: 760, accent: 4 },
            { left: 50, top: 34, delay: 900, accent: 3 }
        ];
        const STAGE_TRANSITION_DELAY_MS = Math.max(
            0,
            STAGE_CLEAR_TOTAL_MS - STAGE_CLEAR_FADE_OUT_MS
        );
        const STAGE_CLEAR_MIN_TRANSITION_DELAY_MS = Math.max(1400, STAGE_TRANSITION_DELAY_MS);
        const STAGE_CLEAR_MAX_TRANSITION_DELAY_MS = Math.max(2200, STAGE_CLEAR_MIN_TRANSITION_DELAY_MS + 420);
        const DIAMOND_PARTICLE_PRESETS = [
            { dx: -18, dy: -16, size: 16, rotation: -24, delay: 0 },
            { dx: 20, dy: -14, size: 14, rotation: 18, delay: 30 },
            { dx: -14, dy: 18, size: 12, rotation: -12, delay: 54 },
            { dx: 16, dy: 20, size: 13, rotation: 26, delay: 76 },
            { dx: 0, dy: -24, size: 11, rotation: 10, delay: 92 },
            { dx: 0, dy: 24, size: 10, rotation: -18, delay: 112 }
        ];

        function syncActiveMap(nextMapIndex = 0, options = {}) {
            const {
                syncPixelAdmin = true,
                renderPixelAdmin = true,
                prepareUpcomingMap = true
            } = options;
            currentMapIndex = ((nextMapIndex % MAP_DEFINITIONS.length) + MAP_DEFINITIONS.length) % MAP_DEFINITIONS.length;
            const currentDefinition = MAP_DEFINITIONS[currentMapIndex];
            const currentOverrideVersion = getStageOverrideVersion(currentDefinition);
            if (currentDefinition?.id && currentDefinition.id !== "tutorial") {
                try {
                    window.localStorage.removeItem(FORCE_FIRST_MAP_RESET_STORAGE_KEY);
                } catch (error) {
                    // Ignore cleanup failures.
                }
                if (new URLSearchParams(window.location.search).get(RESET_TO_FIRST_QUERY_PARAM) === "1") {
                    const clearedResetUrl = new URL(window.location.href);
                    clearedResetUrl.searchParams.delete(RESET_TO_FIRST_QUERY_PARAM);
                    window.history.replaceState(null, "", `${clearedResetUrl.pathname}${clearedResetUrl.search}${clearedResetUrl.hash}`);
                }
            }
            persistCurrentMapId(currentDefinition.id);
            applyMapTheme(currentDefinition.id);
            ACTIVE_MAP =
                preparedNextMapIndex === currentMapIndex &&
                preparedNextMapVersion === currentOverrideVersion &&
                preparedNextMapConfig?.id === currentDefinition.id
                    ? preparedNextMapConfig
                    : preparedPreviousMapIndex === currentMapIndex &&
                      preparedPreviousMapVersion === currentOverrideVersion &&
                      preparedPreviousMapConfig?.id === currentDefinition.id
                        ? preparedPreviousMapConfig
                    : buildMapConfig(currentDefinition);
            TARGET_MAP = ACTIVE_MAP.targetMap;
            ROWS = ACTIVE_MAP.rows;
            COLS = ACTIVE_MAP.cols;
            TARGET_POSITIONS = ACTIVE_MAP.targetPositions;
            TARGET_COLOR_COUNTS = ACTIVE_MAP.targetColorCounts;
            INITIAL_LAYOUT_ORDER = ACTIVE_MAP.initialLayoutOrder;
            INITIAL_LAYOUT_INDEX = ACTIVE_MAP.initialLayoutIndex;
            TARGET_NEIGHBOR_PAIRS = ACTIVE_MAP.targetNeighborPairs;
            POCKET_UNLOCK_RULE = ACTIVE_MAP.pocketUnlock;
            DEFAULT_BOARD_CELL_SIZE = ACTIVE_MAP.boardCellSize ?? 36;
            DEFAULT_TRAY_CELL_SIZE = ACTIVE_MAP.trayCellSize ?? 40;
            TOTAL_TARGET_CELLS = ACTIVE_MAP.totalTargetCells;
            boardElement.style.gridTemplateColumns = `repeat(${COLS}, var(--board-cell-size))`;
            if (syncPixelAdmin) {
                syncPixelAdminWithActiveMapIfReady(false, renderPixelAdmin);
            }

            if (preparedNextMapTimer) {
                window.clearTimeout(preparedNextMapTimer);
                preparedNextMapTimer = null;
            }

            if (preparedNextMapIdleCallbackId != null && typeof window.cancelIdleCallback === "function") {
                window.cancelIdleCallback(preparedNextMapIdleCallbackId);
                preparedNextMapIdleCallbackId = null;
            }

            deferredUpcomingPreparationMapIndex = -1;
            deferredUpcomingPreparationIncludePrevious = true;

            if (!prepareUpcomingMap || isPixelAdminOpen()) {
                return;
            }

            const activeMapIndexForPreparation = currentMapIndex;
            const upcomingMapIndex = (activeMapIndexForPreparation + 1) % MAP_DEFINITIONS.length;
            const upcomingDefinition = MAP_DEFINITIONS[upcomingMapIndex];
            const upcomingOverrideVersion = getStageOverrideVersion(upcomingDefinition);
            const isUpcomingPrepared =
                preparedNextMapIndex === upcomingMapIndex &&
                preparedNextMapVersion === upcomingOverrideVersion &&
                preparedNextMapConfig?.id === upcomingDefinition?.id &&
                preparedNextLevelInitialState?.mapId === upcomingDefinition?.id;

            if (!isUpcomingPrepared) {
                const shouldLimitPreparationDuringBoot = !hasCompletedInitialBoot;
                if (shouldLimitPreparationDuringBoot) {
                    scheduleUpcomingStagePreparation(activeMapIndexForPreparation, {
                        includePrevious: false,
                        delayMs: INITIAL_STAGE_PREPARATION_DELAY_MS,
                        useIdleCallback: true
                    });
                    return;
                }
            }
        }

        function getCurrentMapDefinition() {
            return MAP_DEFINITIONS[currentMapIndex];
        }



        function shuffle(list) {
            const copy = [...list];
            for (let i = copy.length - 1; i > 0; i -= 1) {
                const randomIndex = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
            }
            return copy;
        }

        function getCellDistance(from, to) {
            return Math.abs(from.row - to.row) + Math.abs(from.col - to.col);
        }

        function getInitialClusterLimit() {
            return INITIAL_MAX_CLUSTER_SIZE;
        }

        function getInitialLayoutOffsets(
            layoutOrder = INITIAL_LAYOUT_ORDER,
            targetMap = TARGET_MAP,
            targetNeighborPairs = TARGET_NEIGHBOR_PAIRS
        ) {
            const sourceColors = layoutOrder.map((position) => targetMap[position.row][position.col]);
            const scoredOffsets = [];

            for (let offset = 1; offset < sourceColors.length; offset += 1) {
                const shiftedColors = sourceColors.map((_, index) => sourceColors[(index + offset) % sourceColors.length]);

                const isValidOffset = shiftedColors.every((color, index) => {
                    const position = layoutOrder[index];
                    return color !== targetMap[position.row][position.col];
                });

                if (!isValidOffset) continue;

                const adjacencyScore =
                    targetNeighborPairs.reduce(
                        (sameNeighbors, [leftIndex, rightIndex]) =>
                            sameNeighbors + (shiftedColors[leftIndex] === shiftedColors[rightIndex] ? 1 : 0),
                        0
                    ) / Math.max(1, targetNeighborPairs.length);

                scoredOffsets.push({ offset, adjacencyScore });
            }

            if (!scoredOffsets.length) {
                return [Math.floor(sourceColors.length / 2)];
            }

            return scoredOffsets
                .sort(
                    (left, right) =>
                        left.adjacencyScore - right.adjacencyScore ||
                        Math.abs(left.offset - sourceColors.length / 2) - Math.abs(right.offset - sourceColors.length / 2)
                )
                .slice(0, 16)
                .map(({ offset }) => offset);
        }

        const INITIAL_LAYOUT_OFFSETS = getInitialLayoutOffsets();

        function softenInitialClusters(board) {
            let swaps = 0;
            let attempts = 0;

            while (swaps < 12 && attempts < TOTAL_TARGET_CELLS * 3) {
                attempts += 1;
                const source = TARGET_POSITIONS[Math.floor(Math.random() * TARGET_POSITIONS.length)];
                const target = TARGET_POSITIONS[Math.floor(Math.random() * TARGET_POSITIONS.length)];

                if (source.row === target.row && source.col === target.col) continue;

                const sourceColor = board[source.row][source.col];
                const targetColor = board[target.row][target.col];

                if (
                    sourceColor === targetColor ||
                    sourceColor === TARGET_MAP[target.row][target.col] ||
                    targetColor === TARGET_MAP[source.row][source.col]
                ) {
                    continue;
                }

                [board[source.row][source.col], board[target.row][target.col]] = [
                    targetColor,
                    sourceColor
                ];
                swaps += 1;
            }
        }

        function getBoardColorClusters(board) {
            const visited = new Set();
            const clusters = [];

            TARGET_POSITIONS.forEach((position) => {
                const startKey = toCellKey(position.row, position.col);
                if (visited.has(startKey)) return;

                const colorId = board[position.row][position.col];
                const stack = [position];
                const cells = [];
                visited.add(startKey);

                while (stack.length) {
                    const current = stack.pop();
                    cells.push(current);

                    EIGHT_WAY_DIRECTIONS.forEach((direction) => {
                        const nextRow = current.row + direction.row;
                        const nextCol = current.col + direction.col;
                        const nextKey = toCellKey(nextRow, nextCol);

                        if (
                            nextRow < 0 ||
                            nextRow >= ROWS ||
                            nextCol < 0 ||
                            nextCol >= COLS ||
                            !TARGET_MAP[nextRow][nextCol] ||
                            visited.has(nextKey) ||
                            board[nextRow][nextCol] !== colorId
                        ) {
                            return;
                        }

                        visited.add(nextKey);
                        stack.push({ row: nextRow, col: nextCol });
                    });
                }

                clusters.push({ colorId, cells, size: cells.length });
            });

            return clusters;
        }

        function getBoardAdjacencyScore(board) {
            let sameNeighbors = 0;

            TARGET_NEIGHBOR_PAIRS.forEach(([leftIndex, rightIndex]) => {
                const left = INITIAL_LAYOUT_ORDER[leftIndex];
                const right = INITIAL_LAYOUT_ORDER[rightIndex];
                if (board[left.row][left.col] === board[right.row][right.col]) {
                    sameNeighbors += 1;
                }
            });

            return sameNeighbors / TARGET_NEIGHBOR_PAIRS.length;
        }

        function getBoardClusterStats(board) {
            const clusterLimit = getInitialClusterLimit();
            const clusters = getBoardColorClusters(board);
            const oversizedClusters = clusters.filter(({ size }) => size > clusterLimit);

            return {
                clusters,
                oversizedClusters,
                maxClusterSize: clusters.reduce((maxSize, cluster) => Math.max(maxSize, cluster.size), 0),
                oversizeCellCount: oversizedClusters.reduce(
                    (count, cluster) => count + (cluster.size - clusterLimit),
                    0
                ),
                adjacencyScore: getBoardAdjacencyScore(board)
            };
        }

        function prepareInitialBoardCandidate(board) {
            if (!board?.length) {
                return board;
            }

            removeMatchedInitialCells(board);
            softenInitialClusters(board);
            breakLargeInitialClusters(board);
            removeMatchedInitialCells(board);
            return board;
        }

        function getInitialBoardQuality(board) {
            const clusterStats = getBoardClusterStats(board);
            return {
                matchedCount: countCorrectCellsInBoard(board),
                maxClusterSize: clusterStats.maxClusterSize,
                oversizeCellCount: clusterStats.oversizeCellCount,
                adjacencyScore: clusterStats.adjacencyScore
            };
        }

        function isBetterInitialBoardQuality(candidate, currentBest) {
            if (!currentBest) {
                return true;
            }

            const preferredClusterSize = Math.max(4, Math.min(6, Math.floor(getInitialClusterLimit() / 2)));
            const candidateClusterDistance = Math.abs(candidate.maxClusterSize - preferredClusterSize);
            const currentBestClusterDistance = Math.abs(currentBest.maxClusterSize - preferredClusterSize);

            return (
                candidate.matchedCount < currentBest.matchedCount ||
                (candidate.matchedCount === currentBest.matchedCount &&
                    candidate.oversizeCellCount < currentBest.oversizeCellCount) ||
                (candidate.matchedCount === currentBest.matchedCount &&
                    candidate.oversizeCellCount === currentBest.oversizeCellCount &&
                    candidateClusterDistance < currentBestClusterDistance) ||
                (candidate.matchedCount === currentBest.matchedCount &&
                    candidate.oversizeCellCount === currentBest.oversizeCellCount &&
                    candidateClusterDistance === currentBestClusterDistance &&
                    candidate.adjacencyScore > currentBest.adjacencyScore) ||
                (candidate.matchedCount === currentBest.matchedCount &&
                    candidate.oversizeCellCount === currentBest.oversizeCellCount &&
                    candidateClusterDistance === currentBestClusterDistance &&
                    candidate.adjacencyScore === currentBest.adjacencyScore &&
                    candidate.maxClusterSize > currentBest.maxClusterSize)
            );
        }

        function breakLargeInitialClusters(board) {
            for (let pass = 0; pass < TOTAL_TARGET_CELLS; pass += 1) {
                const currentStats = getBoardClusterStats(board);
                if (!currentStats.oversizedClusters.length) return;

                const oversizedCluster = [...currentStats.oversizedClusters].sort((left, right) => right.size - left.size)[0];
                const clusterCenter = oversizedCluster.cells.reduce(
                    (center, cell) => ({
                        row: center.row + cell.row / oversizedCluster.cells.length,
                        col: center.col + cell.col / oversizedCluster.cells.length
                    }),
                    { row: 0, col: 0 }
                );
                const clusterCellKeys = new Set(
                    oversizedCluster.cells.map((cell) => toCellKey(cell.row, cell.col))
                );
                const sourceCells = [...oversizedCluster.cells].sort(
                    (left, right) => getCellDistance(right, clusterCenter) - getCellDistance(left, clusterCenter)
                );
                const candidateCells = shuffle(TARGET_POSITIONS).filter((position) => {
                    const key = toCellKey(position.row, position.col);
                    return (
                        !clusterCellKeys.has(key) &&
                        board[position.row][position.col] !== oversizedCluster.colorId
                    );
                });

                let bestSwap = null;

                sourceCells.slice(0, 16).forEach((source) => {
                    candidateCells.slice(0, 64).forEach((candidate) => {
                        const sourceColor = board[source.row][source.col];
                        const candidateColor = board[candidate.row][candidate.col];

                        if (
                            sourceColor === TARGET_MAP[candidate.row][candidate.col] ||
                            candidateColor === TARGET_MAP[source.row][source.col]
                        ) {
                            return;
                        }

                        [board[source.row][source.col], board[candidate.row][candidate.col]] = [
                            candidateColor,
                            sourceColor
                        ];

                        const nextStats = getBoardClusterStats(board);

                        [board[source.row][source.col], board[candidate.row][candidate.col]] = [
                            sourceColor,
                            candidateColor
                        ];

                        const improvesClusterLimit =
                            nextStats.maxClusterSize < currentStats.maxClusterSize ||
                            nextStats.oversizeCellCount < currentStats.oversizeCellCount;

                        if (!improvesClusterLimit) {
                            return;
                        }

                        const candidateScore = [
                            nextStats.maxClusterSize,
                            nextStats.oversizeCellCount,
                            -nextStats.adjacencyScore,
                            getCellDistance(source, candidate)
                        ];

                        if (
                            !bestSwap ||
                            candidateScore[0] < bestSwap.score[0] ||
                            (candidateScore[0] === bestSwap.score[0] && candidateScore[1] < bestSwap.score[1]) ||
                            (candidateScore[0] === bestSwap.score[0] &&
                                candidateScore[1] === bestSwap.score[1] &&
                                candidateScore[2] < bestSwap.score[2]) ||
                            (candidateScore[0] === bestSwap.score[0] &&
                                candidateScore[1] === bestSwap.score[1] &&
                                candidateScore[2] === bestSwap.score[2] &&
                                candidateScore[3] < bestSwap.score[3])
                        ) {
                            bestSwap = { source, candidate, score: candidateScore };
                        }
                    });
                });

                if (!bestSwap) {
                    return;
                }

                [board[bestSwap.source.row][bestSwap.source.col], board[bestSwap.candidate.row][bestSwap.candidate.col]] = [
                    board[bestSwap.candidate.row][bestSwap.candidate.col],
                    board[bestSwap.source.row][bestSwap.source.col]
                ];
            }
        }

        function hasMatchedInitialCells(board) {
            return TARGET_POSITIONS.some(
                (position) => board[position.row][position.col] === TARGET_MAP[position.row][position.col]
            );
        }

        function removeMatchedInitialCells(board) {
            const shuffledPositions = () => shuffle(TARGET_POSITIONS);

            for (let pass = 0; pass < TOTAL_TARGET_CELLS * 3; pass += 1) {
                const matchedCells = TARGET_POSITIONS.filter(
                    (position) => board[position.row][position.col] === TARGET_MAP[position.row][position.col]
                );

                if (!matchedCells.length) {
                    return true;
                }

                let swapped = false;

                for (const source of shuffle(matchedCells)) {
                    const sourceColor = board[source.row][source.col];
                    const candidate = shuffledPositions().find((target) => {
                        if (target.row === source.row && target.col === source.col) return false;

                        const targetColor = board[target.row][target.col];
                        return (
                            sourceColor !== TARGET_MAP[target.row][target.col] &&
                            targetColor !== TARGET_MAP[source.row][source.col]
                        );
                    });

                    if (!candidate) continue;

                    [board[source.row][source.col], board[candidate.row][candidate.col]] = [
                        board[candidate.row][candidate.col],
                        board[source.row][source.col]
                    ];
                    swapped = true;
                    break;
                }

                if (!swapped) {
                    return false;
                }
            }

            return !hasMatchedInitialCells(board);
        }

        function buildDerangedInitialColors() {
            const colorEntries = Object.entries(TARGET_COLOR_COUNTS)
                .map(([colorId, count]) => ({ colorId: Number(colorId), count: Number(count) }))
                .filter(({ count }) => count > 0)
                .sort((left, right) => right.count - left.count || left.colorId - right.colorId);

            if (!colorEntries.length || !INITIAL_LAYOUT_ORDER.length) {
                return [];
            }

            const averageBlobSize = TOTAL_TARGET_CELLS > 320 ? 4 : TOTAL_TARGET_CELLS > 180 ? 3.5 : 3;
            const preferredClusterSize = Math.max(4, Math.min(6, Math.floor(getInitialClusterLimit() / 2)));
            const initialBlobCount = Math.max(1, Math.round(INITIAL_LAYOUT_ORDER.length / averageBlobSize));
            const blobSeed = Math.floor(Math.random() * Math.max(1, TOTAL_TARGET_CELLS * 17));
            const pendingBlobs = splitCellsIntoBlobs(shuffle(INITIAL_LAYOUT_ORDER), initialBlobCount, blobSeed)
                .filter((blob) => blob.length)
                .sort((left, right) => right.length - left.length);
            const remainingCounts = new Map(colorEntries.map(({ colorId, count }) => [colorId, count]));
            const assignedColors = new Map();
            let splitSeed = blobSeed + 1;

            while (pendingBlobs.length) {
                const blob = pendingBlobs.shift();
                const availableColors = [...remainingCounts.entries()].filter(([, count]) => count > 0);

                if (!availableColors.length) {
                    break;
                }

                const fittingColors = availableColors.filter(([, count]) => count >= blob.length);
                if (!fittingColors.length && blob.length > 1) {
                    const largestRemainingCount = Math.max(...availableColors.map(([, count]) => count));
                    const splitCount = Math.min(
                        blob.length,
                        Math.max(2, Math.ceil(blob.length / Math.max(1, largestRemainingCount)))
                    );

                    splitCellsIntoBlobs(blob, splitCount, splitSeed)
                        .filter((subBlob) => subBlob.length)
                        .sort((left, right) => right.length - left.length)
                        .reverse()
                        .forEach((subBlob) => {
                            pendingBlobs.unshift(subBlob);
                        });
                    splitSeed += 1;
                    continue;
                }

                const candidateColors = (fittingColors.length ? fittingColors : availableColors)
                    .map(([colorId, count], index) => {
                        const matchedCells = blob.reduce(
                            (total, position) => total + (TARGET_MAP[position.row][position.col] === colorId ? 1 : 0),
                            0
                        );
                        const touchingCells = blob.reduce(
                            (total, position) =>
                                total +
                                CARDINAL_DIRECTIONS.reduce((touches, direction) => {
                                    const neighborColor = assignedColors.get(
                                        toCellKey(position.row + direction.row, position.col + direction.col)
                                    );
                                    return touches + (neighborColor === colorId ? 1 : 0);
                                }, 0),
                            0
                        );
                        const continuityPenalty = touchingCells === 0 ? 1 : 0;
                        const oversizeTouchPenalty = Math.max(0, touchingCells - preferredClusterSize);
                        const tieBreaker = (index + splitSeed + colorId) % 7;

                        return {
                            colorId,
                            count,
                            matchedCells,
                            continuityPenalty,
                            oversizeTouchPenalty,
                            touchingCells,
                            tieBreaker
                        };
                    })
                    .sort(
                        (left, right) =>
                            left.matchedCells - right.matchedCells ||
                            left.continuityPenalty - right.continuityPenalty ||
                            left.oversizeTouchPenalty - right.oversizeTouchPenalty ||
                            right.touchingCells - left.touchingCells ||
                            right.count - left.count ||
                            left.tieBreaker - right.tieBreaker
                    );

                const nextColorId = candidateColors[0]?.colorId;
                if (!nextColorId) {
                    continue;
                }

                blob.forEach((position) => {
                    assignedColors.set(toCellKey(position.row, position.col), nextColorId);
                });
                remainingCounts.set(nextColorId, Math.max(0, (remainingCounts.get(nextColorId) || 0) - blob.length));
            }

            const assignedColorsInOrder = INITIAL_LAYOUT_ORDER.map((position) =>
                assignedColors.get(toCellKey(position.row, position.col)) || 0
            );

            if (assignedColorsInOrder.every((colorId) => colorId > 0)) {
                return assignedColorsInOrder;
            }

            const colorPool = Object.entries(TARGET_COLOR_COUNTS).flatMap(([colorId, count]) =>
                Array.from({ length: count }, () => Number(colorId))
            );
            return shuffle(colorPool);
        }

        function createBoardState(options = {}) {
            const { fastMode = false } = options;
            if (ACTIVE_MAP.initialBoardState) {
                return ACTIVE_MAP.initialBoardState.map((row) => [...row]);
            }

            const createEmptyBoard = () => TARGET_MAP.map((row) => row.map((target) => (target ? 0 : 0)));
            const randomAttemptCount =
                fastMode
                    ? 1
                    : TOTAL_TARGET_CELLS > 320 ? 3 : TOTAL_TARGET_CELLS > 240 ? 4 : TOTAL_TARGET_CELLS > 180 ? 5 : 7;
            let fallbackBoardState = null;
            let fallbackBoardQuality = null;

            for (let attempt = 0; attempt < randomAttemptCount; attempt += 1) {
                const sourceColors = buildDerangedInitialColors();
                if (!sourceColors.length) {
                    break;
                }
                const board = createEmptyBoard();

                INITIAL_LAYOUT_ORDER.forEach((position, index) => {
                    board[position.row][position.col] = sourceColors[index];
                });

                prepareInitialBoardCandidate(board);
                if (!hasMatchedInitialCells(board) || (removeMatchedInitialCells(board) && !hasMatchedInitialCells(board))) {
                    return board;
                }

                const candidateQuality = getInitialBoardQuality(board);
                if (!fallbackBoardQuality || isBetterInitialBoardQuality(candidateQuality, fallbackBoardQuality)) {
                    fallbackBoardState = cloneBoardSnapshot(board);
                    fallbackBoardQuality = candidateQuality;
                }
            }

            if (fallbackBoardState) {
                return fallbackBoardState;
            }

            const fallbackBoard = createEmptyBoard();
            const fallbackColors = buildDerangedInitialColors();
            INITIAL_LAYOUT_ORDER.forEach((position, index) => {
                fallbackBoard[position.row][position.col] = fallbackColors[index] || 0;
            });
            prepareInitialBoardCandidate(fallbackBoard);
            removeMatchedInitialCells(fallbackBoard);
            return fallbackBoard;
        }

        function buildCurrentLevelInitialState(options = {}) {
            const { persistState = true, fastMode = false } = options;
            const definition = getCurrentMapDefinition();
            const cachedInitialState = definition?.__cachedLevelInitialState;
            const cachedInitialStateSignature = definition?.__cachedLevelInitialStateSignature;
            const sourceMapRef = definition?.adminTargetMap || definition?.baseImageMap || null;
            const initialBoardStateRef = definition?.initialBoardState || null;
            const initialTrayStateRef = definition?.initialTrayState || null;

            if (
                cachedInitialState &&
                cachedInitialStateSignature &&
                cachedInitialStateSignature.sourceMapRef === sourceMapRef &&
                cachedInitialStateSignature.initialBoardStateRef === initialBoardStateRef &&
                cachedInitialStateSignature.initialTrayStateRef === initialTrayStateRef &&
                cachedInitialStateSignature.overrideVersion === definition?.overrideVersion &&
                cachedInitialState.mapId === ACTIVE_MAP?.id &&
                cachedInitialState.rows === ROWS &&
                cachedInitialState.cols === COLS
            ) {
                return createLevelInitialStateSnapshot(
                    cachedInitialState.boardState,
                    cachedInitialState.trayState,
                    cachedInitialState.cleanedSocketCells,
                    cachedInitialState.actionCharges
                );
            }

            const persistedInitialState = readPersistedLevelInitialState(definition, ACTIVE_MAP);
            if (persistedInitialState) {
                if (definition) {
                    definition.__cachedLevelInitialStateSignature = {
                        sourceMapRef,
                        initialBoardStateRef,
                        initialTrayStateRef,
                        overrideVersion: definition.overrideVersion
                    };
                    definition.__cachedLevelInitialState = createLevelInitialStateSnapshot(
                        persistedInitialState.boardState,
                        persistedInitialState.trayState,
                        persistedInitialState.cleanedSocketCells,
                        persistedInitialState.actionCharges
                    );
                }
                return persistedInitialState;
            }

            let nextBoardState = createBoardState({ fastMode });

            if (!ACTIVE_MAP.initialBoardState) {
                let bestBoardState = nextBoardState;
                let bestBoardQuality = getInitialBoardQuality(nextBoardState);
                const additionalAttemptCount =
                    fastMode ? 0 : TOTAL_TARGET_CELLS > 260 ? 0 : TOTAL_TARGET_CELLS > 150 ? 1 : 3;

                for (let attempt = 0; attempt < additionalAttemptCount; attempt += 1) {
                    const candidateBoardState = createBoardState({ fastMode });
                    const candidateQuality = getInitialBoardQuality(candidateBoardState);

                    if (isBetterInitialBoardQuality(candidateQuality, bestBoardQuality)) {
                        bestBoardState = candidateBoardState;
                        bestBoardQuality = candidateQuality;
                    }

                    if (
                        bestBoardQuality.matchedCount === 0 &&
                        bestBoardQuality.oversizeCellCount === 0 &&
                        bestBoardQuality.maxClusterSize <= getInitialClusterLimit()
                    ) {
                        break;
                    }
                }

                nextBoardState = bestBoardState;
            }

            const nextInitialState = createLevelInitialStateSnapshot(
                nextBoardState,
                Array.from({ length: POCKET_SIZE }, (_, index) => ACTIVE_MAP.initialTrayState?.[index] || 0),
                [],
                getDefaultActionCharges()
            );

            if (definition) {
                definition.__cachedLevelInitialStateSignature = {
                    sourceMapRef,
                    initialBoardStateRef,
                    initialTrayStateRef,
                    overrideVersion: definition.overrideVersion
                };
                definition.__cachedLevelInitialState = createLevelInitialStateSnapshot(
                    nextInitialState.boardState,
                    nextInitialState.trayState,
                    nextInitialState.cleanedSocketCells,
                    nextInitialState.actionCharges
                );
                if (persistState) {
                    persistLevelInitialState(definition, nextInitialState, ACTIVE_MAP);
                }
            }

            return nextInitialState;
        }

        function setStatus(message) {
            const nextMessage = typeof message === "string" ? message.trim() : "";
            return nextMessage || "";
        }

        function setSceneLayerDisplay(stableId, isVisible) {
            const element = colorJewelSceneRenderer?.getElement?.(stableId);
            if (!element) {
                return;
            }

            element.style.display = isVisible ? "" : "none";
        }

        const ACTION_BUTTON_FALLBACK_LAYOUTS = Object.freeze({
            "pictoicon-tv-png-163": { xOffset: 38, yOffset: 32 },
            "pictoicon-tv-png-164": { xOffset: 33, yOffset: 34 }
        });

        function getActionButtonCounterBadgeLayout(buttonElement) {
            if (!buttonElement) {
                return null;
            }

            const buttonStableId = buttonElement.dataset?.stableId;
            const layer = colorJewelSceneContract?.layers?.find((entry) => entry?.stableId === buttonStableId);
            const badgeImage = layer?.visual?.images?.find((image) =>
                typeof image?.exportPath === "string" &&
                image.exportPath.toLowerCase().includes("circle1.png")
            );

            if (layer && badgeImage) {
                const layerScale = Number(layer.scale || 1);
                const layerScaleX = Number(layer.scaleX == null ? 1 : layer.scaleX);
                const layerScaleY = Number(layer.scaleY == null ? 1 : layer.scaleY);
                const offsetX = Number(badgeImage.offsetX || 0) * layerScale * layerScaleX;
                const offsetY = Number(badgeImage.offsetY || 0) * layerScale * layerScaleY;

                return {
                    left: `calc(50% + ${offsetX}px)`,
                    top: `calc(50% + ${offsetY}px)`,
                    transform: "translate(-50%, -50%)"
                };
            }

            return null;
        }

        function getActionButtonFallbackElement(stableId, anchorButtonElement = null) {
            if (
                stableId === "shape-ellipse-169-wand-clone" ||
                stableId === "shape-ellipse-169-clean-clone" ||
                stableId === "shape-ellipse-169-magnet-clone"
            ) {
                const sourceElement = colorJewelSceneRenderer?.getElement?.("shape-ellipse-169");
                const pressSurface =
                    anchorButtonElement?.firstElementChild instanceof HTMLElement
                        ? anchorButtonElement.firstElementChild
                        : anchorButtonElement;
                if (!sourceElement || !pressSurface) {
                    return null;
                }

                let cloneElement = anchorButtonElement.querySelector(`[data-fallback-stable-id="${stableId}"]`);
                if (!cloneElement) {
                    cloneElement = sourceElement.cloneNode(true);
                    cloneElement.dataset.fallbackStableId = stableId;
                    cloneElement.removeAttribute("data-stable-id");
                    cloneElement.style.display = "none";
                    cloneElement.style.position = "absolute";
                    cloneElement.style.pointerEvents = "none";
                    pressSurface.appendChild(cloneElement);
                } else if (cloneElement.parentElement !== pressSurface) {
                    pressSurface.appendChild(cloneElement);
                }

                return cloneElement;
            }

            return colorJewelSceneRenderer?.getElement?.(stableId) || null;
        }

        function setActionButtonFallbackIconState(stableId, isVisible, anchorButtonElement = null) {
            const element = getActionButtonFallbackElement(stableId, anchorButtonElement);
            if (!element) {
                return;
            }

            const counterBadgeLayout =
                (stableId === "shape-ellipse-169-wand-clone" ||
                    stableId === "shape-ellipse-169-clean-clone" ||
                    stableId === "shape-ellipse-169-magnet-clone") &&
                anchorButtonElement
                    ? getActionButtonCounterBadgeLayout(anchorButtonElement)
                    : null;
            const layout = ACTION_BUTTON_FALLBACK_LAYOUTS[stableId];
            if (counterBadgeLayout) {
                element.style.left = counterBadgeLayout.left;
                element.style.top = counterBadgeLayout.top;
                element.style.transform = counterBadgeLayout.transform || "";
                element.style.width = "";
                element.style.height = "";
            } else if (layout && anchorButtonElement) {
                element.style.left = `${layout.xOffset}px`;
                element.style.top = `${layout.yOffset}px`;
                element.style.transform = "";
                element.style.width = "";
                element.style.height = "";
            }

            element.style.display = isVisible ? "" : "none";
            element.style.pointerEvents = "none";
            element.style.zIndex = isVisible ? "99" : "";

            const iconImage = element.querySelector("img");
            if (iconImage) {
                iconImage.style.filter = isVisible
                    ? "drop-shadow(0 1px 0 rgba(255,255,255,0.72)) drop-shadow(0 1px 3px rgba(0,0,0,0.18))"
                    : "";
            }
        }

        function syncActionButtonCounterBadge(buttonElement, count, tvStableId) {
            if (!buttonElement) {
                if (tvStableId) {
                    setActionButtonFallbackIconState(tvStableId, count <= 0);
                }
                return;
            }

            const countBadgeImage = [...buttonElement.querySelectorAll("img")]
                .find((image) => image.currentSrc?.includes("circle1.png") || image.src?.includes("circle1.png"));
            const countBadgeText = buttonElement.querySelector(".text-0");
            const shouldShowCountBadge = count > 0;

            if (countBadgeImage) {
                countBadgeImage.style.display = shouldShowCountBadge ? "" : "none";
            }

            if (countBadgeText) {
                countBadgeText.textContent = String(Math.max(0, count));
                countBadgeText.style.display = shouldShowCountBadge ? "" : "none";
            }

            if (tvStableId) {
                setActionButtonFallbackIconState(tvStableId, !shouldShowCountBadge, buttonElement);
            }
        }

        function updateActionButtonState() {
            const specialActionUnlocked = isSpecialActionUnlocked(ACTIVE_MAP);
            const specialActionButton = specialActionUnlocked ? bottomActionButton3TreasureElement : bottomActionButton3Element;
            const tutorialActionLockEnabled = isTutorialMap();
            const tutorialItemIntroActive =
                tutorialItemIntroState?.active === true && tutorialItemIntroState.mapId === ACTIVE_MAP?.id;
            const displayedMagicCharge = tutorialItemIntroActive
                ? Math.max(0, Number(tutorialItemIntroState.displayCharges?.magic || 0))
                : actionCharges.magic;
            const displayedCleanCharge = tutorialItemIntroActive
                ? Math.max(0, Number(tutorialItemIntroState.displayCharges?.clean || 0))
                : actionCharges.clean;
            const referenceLockSurface =
                bottomActionButton3Element?.firstElementChild instanceof HTMLElement
                    ? bottomActionButton3Element.firstElementChild
                    : null;
            const referenceLockStableId = bottomActionButton3Element?.dataset?.stableId || "level-node-18";
            const referenceLockLayer = colorJewelSceneContract?.layers?.find(
                (entry) => entry?.stableId === referenceLockStableId
            );
            colorJewelSceneRenderer?.update({
                item: {
                    wand: Math.max(0, actionCharges.magnet),
                    clean: displayedCleanCharge,
                    magnet: displayedMagicCharge
                }
            });
            setSceneLayerDisplay("level-node-18", !specialActionUnlocked);
            setSceneLayerDisplay("level-node-170", specialActionUnlocked);

            const buttonStates = [
                {
                    button: bottomActionButton1Element,
                    count: displayedMagicCharge,
                    label: "마법봉",
                    armed: actionOverlayState?.type === "magic-targeting",
                    tutorialLocked: tutorialActionLockEnabled
                },
                {
                    button: bottomActionButton2Element,
                    count: displayedCleanCharge,
                    label: "빗자루",
                    armed: false,
                    tutorialLocked: tutorialActionLockEnabled
                },
                {
                    button: specialActionButton,
                    count: Math.max(0, actionCharges.magnet),
                    label: specialActionUnlocked ? "자석" : "특수 아이템",
                    armed: false,
                    tutorialLocked: false
                }
            ];

            buttonStates.forEach(({ button, count, label, armed, tutorialLocked }) => {
                if (!button) {
                    return;
                }

                button.style.opacity = "1";
                if (tutorialLocked) {
                    button.setAttribute("title", `${label}은(는) 튜토리얼에서 잠겨 있어요.`);
                    button.setAttribute("aria-disabled", "true");
                } else {
                    button.removeAttribute("title");
                    button.setAttribute("aria-disabled", "false");
                }
                button.setAttribute("aria-pressed", armed ? "true" : "false");

                const pressSurface =
                    button.firstElementChild instanceof HTMLElement ? button.firstElementChild : null;
                let tutorialLockOverlay = button.querySelector('[data-tutorial-lock-overlay="true"]');
                const buttonStableId = button.dataset?.stableId || "";
                const buttonLayer = colorJewelSceneContract?.layers?.find((entry) => entry?.stableId === buttonStableId);
                const tutorialLockOffsetY =
                    referenceLockLayer && buttonLayer
                        ? Number(referenceLockLayer.y || 0) - Number(buttonLayer.y || 0)
                        : 0;

                if (tutorialLocked) {
                    if (!(tutorialLockOverlay instanceof HTMLElement) && referenceLockSurface) {
                        tutorialLockOverlay = referenceLockSurface.cloneNode(true);
                        tutorialLockOverlay.dataset.tutorialLockOverlay = "true";
                        tutorialLockOverlay.setAttribute("aria-hidden", "true");
                        tutorialLockOverlay.style.position = "absolute";
                        tutorialLockOverlay.style.left = "50%";
                        tutorialLockOverlay.style.zIndex = "120";
                        tutorialLockOverlay.style.pointerEvents = "none";
                        tutorialLockOverlay.querySelectorAll("[data-group]").forEach((groupElement) => {
                            groupElement.style.pointerEvents = "none";
                        });
                        button.appendChild(tutorialLockOverlay);
                    }

                    if (tutorialLockOverlay instanceof HTMLElement) {
                        tutorialLockOverlay.style.top = `calc(50% + ${tutorialLockOffsetY.toFixed(3)}px)`;
                        tutorialLockOverlay.style.transform = "translate(-50%, -50%)";
                        tutorialLockOverlay.style.display = "";
                    }
                    button.style.pointerEvents = "none";
                    if (pressSurface) {
                        pressSurface.style.opacity = "0";
                    }
                } else {
                    if (tutorialLockOverlay instanceof HTMLElement) {
                        tutorialLockOverlay.style.display = "none";
                    }
                    button.style.pointerEvents = tutorialItemIntroActive ? "none" : "auto";
                    if (pressSurface) {
                        pressSurface.style.opacity = "";
                    }
                }
            });

            setSceneLayerDisplay("shape-ellipse-169", false);
            setActionButtonFallbackIconState("pictoicon-tv-png-163", false);
            setActionButtonFallbackIconState("pictoicon-tv-png-164", false);
            syncActionButtonCounterBadge(bottomActionButton1Element, displayedMagicCharge, "shape-ellipse-169-wand-clone");
            syncActionButtonCounterBadge(bottomActionButton2Element, displayedCleanCharge, "shape-ellipse-169-clean-clone");
            syncActionButtonCounterBadge(bottomActionButton3Element, 0, null);
            syncActionButtonCounterBadge(
                bottomActionButton3TreasureElement,
                specialActionUnlocked ? actionCharges.magnet : 0,
                "shape-ellipse-169-magnet-clone"
            );
        }

        function setActionOverlay(nextOverlay) {
            actionOverlayState = nextOverlay ? { ...nextOverlay } : null;
            if (!nextOverlay || nextOverlay.type !== "magic-targeting") {
                clearMagicDragState();
            }
            scheduleTutorialOverlayRender();
        }

        function sleep(ms) {
            return new Promise((resolve) => window.setTimeout(resolve, ms));
        }

        function waitForNextPaint(frameCount = 1) {
            const remainingFrames = Math.max(1, Number(frameCount) || 1);

            return new Promise((resolve) => {
                const step = (framesLeft) => {
                    window.requestAnimationFrame(() => {
                        if (framesLeft <= 1) {
                            resolve();
                            return;
                        }
                        step(framesLeft - 1);
                    });
                };

                step(remainingFrames);
            });
        }

        function isCurrentGameSession(sessionVersion) {
            return sessionVersion === gameSessionVersion;
        }

        function clearMagicDragState() {
            boardInteraction.magicPointerId = null;
            boardInteraction.isMagicDragging = false;
            boardInteraction.magicLastCell = null;
        }

        function isCleanedSocketCell(row, col) {
            return cleanedSocketCells.has(toCellKey(row, col));
        }

        function isCompletedTargetCell(row, col) {
            return Boolean(TARGET_MAP[row][col]) && (
                isCleanedSocketCell(row, col) ||
                (boardState[row][col] !== 0 && boardState[row][col] === TARGET_MAP[row][col])
            );
        }

        function isCompletedTargetCellInBoard(boardSnapshot, row, col) {
            return Boolean(TARGET_MAP[row][col]) && (
                isCleanedSocketCell(row, col) ||
                (boardSnapshot[row][col] !== 0 && boardSnapshot[row][col] === TARGET_MAP[row][col])
            );
        }

        function isAvailableTargetCell(row, col, colorId = null) {
            if (!TARGET_MAP[row][col] || isCleanedSocketCell(row, col) || boardState[row][col] !== 0) {
                return false;
            }

            return colorId == null || TARGET_MAP[row][col] === colorId;
        }

        function isLockedCorrectGem(row, col) {
            return isCompletedTargetCell(row, col);
        }

        function isSelected(source, rowOrIndex, col) {
            if (!selected || selected.source !== source) return false;
            if (source === "board") {
                return selected.cells.some((cell) => cell.row === rowOrIndex && cell.col === col);
            }
            return (selected.indices || []).includes(rowOrIndex);
        }

        function shadeColor(hex, amount) {
            const normalizedHex = normalizeHexColor(hex) || hex;
            const cacheKey = `${normalizedHex}|${amount}`;
            const cachedColor = shadeColorCache.get(cacheKey);
            if (cachedColor) {
                return cachedColor;
            }

            const clamp = (channel) => Math.max(0, Math.min(255, channel + amount));
            const base = hexToRgb(normalizedHex);
            const shaded = clampRgbSaturation({
                r: clamp(base.r),
                g: clamp(base.g),
                b: clamp(base.b)
            });
            const r = shaded.r;
            const g = shaded.g;
            const b = shaded.b;
            const nextColor = `rgb(${r}, ${g}, ${b})`;
            shadeColorCache.set(cacheKey, nextColor);
            return nextColor;
        }

        const JEWEL_TEMPLATE_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAJZElEQVR4nO2dy24TPRiGnUkpUI7isGDHohK3wFWwZ4GEWNFyPYX+G4TEHXAnLJG6ADYsOENawmRm+PUM+aI05DSJPf4c+5VGPUI9fh9/Poz9TefPnz8mKV5tGWV69OhRZ3t7+2BnZ2ev2+2aTVBZlubk5ORZnudPnj9/rqrFZUaRHjx40BkMBgd5nu/leW6qqjKhq6oqw71wT9wb92gUqaOlCxhWzIExZo+vHz58aHZ3d8358+dNyPr165c5OjoyL168kG89M8Y8efnypYqKzzSaf+/ePXPu3Lm65RA+Q1VZlvU9cC/c01Dco5pIkGk0/+rVq2YwGJh+vx88AP1+v74X7kkjBJlG85EAUBSFCVVFUYwAQBohyDSaLzo5OakvqcCQNBgMRuUflzYIMq3mSwtiEBViFCjmlF0TBJlW82UK9fv3bxPalLAaTv0o+6xya4Eg02q+iFZEGKVCQ1Ge53WZKfs8aYAg02w+ogXJOCCEKFBV1aj/X6a8viHINJsvokIJpyFMCcuyrMvaZOA6BYKnbUGQaTcfUaGhzAYGw9ZPmZtoAoLHbUGQaTdfRH/atGW1rcEwUi3q+zVBkIVgvlQuFau5GyjLsi7jOpC2DUEWgvmTlatxMFgNB382IG0TgiwE8yenhBoXhoqiWGrqpw2CLBTzx6MAla0pClRVNVr5s9lFtQFBFor5IgZZXFr2MSDKIuWyLdcQZCGZj3i61uv1VK0M5nlel4myuZBLCLKQzBdR0VoWhsrhwo8r811DkIVmPtK0WaQc2/ThWi4gyEIzfxwADd1AnuetAeACgiw080VMuXxDkA/Nn9z0ERIEWYjmj8+7fXYD5d/9/l7WJWxB0GhbuBbzRRwcybLM2/OBM2fO1GsAPiH89u2befXqlXx5aIzZb7LlfGkAtJnPyPv79+/my5cvzkfgs8R272vXrpkrV66Ys2fPmhAhWAoAreZ//vzZm/njEFy/fj1YCBaOAZL580UZKAtlcrES6HpMMBeAZP7mQzATgGR+HBBMBSCZHw8E/wCQzI8LglMAJPPjg2AEQDI/TghqAO7fv5/MjwyCoed/Acjz/KAoimR+JBAURfE4z/OnIwB6vd7ejx8/zN27d83W1pa3tfVNM18TBHiKt3iM171e7/EoSxgF7HQ65ufPn+b9+/fm0qVL5uLFi+bChQv1Aw9+5lqbav4kBKitZWOW+TH++Pi43rKGv2xc5Wt5BDBKE8c3+AEF5Rd3dnbqi8KSqInPXYGw6ea3DQFeSnIKWrt8zmNrnlyOP//5J08gvyD73KAGY4gERAQiA4W2WfBYzG8DAtmbiG9ysWllXpc+N1Ek/1AOO0IST74uX75cA8G1vb1dP5Nfp8Axme8CAslERvTmwifZNLvM2YmlMoXyH8nhTKiS7oGIAAh83hSEWM23BQHGYziNky6bz+VgSpNDM41SxfIfc2Ecf5CPmE/3QGQgQnAtUuzmrwMB/4ZrOJIfZU9ZdVvayrmC+YNyHAoCv379WoMgFzfDtGNSyfzmEFDPEn3lkg2x656Q2rJ1LEpOx8iMQboHLkBgBpHMXx4C6hXjpW+XMM/vEoVtHY2zli2cAtH/AAFRgRAFCAAADEAAJMn8xRAwuMZ8TJf6ZDDuYvOpk3TxMpWUNQW6B8YGRIFk/mIIaEwykne9Kuv8fQEylQSIaWOCpNOS9Li28gyoTxad5FcJgMiVAIhcCYDIlQCIXAmAyJUAiFwJgMiVAIhcCYDIlQCIXAmAyJUAiFwJgMiVAIhcCYDIlQCIXAmAyJUAiFwJgMiVAIhcCYDIlQCIXAmAyJUAiFwJgMiVAIhcCYDIlQCIXM6P60oSI068kjximRQysZ8O/jV8QTY5GtdJwuUNAHmTFjciOQI4Gk72i5s3byYIZoi6+vTpU/3+HwAgsQZ1RcORN6SpBgDjae2SjZIERuPv+JVkBwmC6eZ//PixBoC6Q9Qf6WIk0wofiQo2QbACgCQxEtMlpclkujLSnYgSBLPNl/w/8mLK8eytRANgmJWEq6lW/h8wV5JIjr/SfVFKkwTBcuZP1jUNbDx7K5nYqDtJwrVqVGgMgOT+EdNp7RjfJDlhgmB582el3KHeSSZFRAAGPhIVmg4at5q+sVtMXyUr5bhih6C/gvnjot4lVyD/XgaLEhkYK6wNAAZLunEZ2PG1rZclxwpBf03zpw28uSSnM92CjBUWTSX/AUASFMp8VLJSYryt5IQxQ9C3aP6s7K38DboHugSZSnJJws5xnXpfgKQbZ8Qp/fxkfnkXigWCvkPzZ2VvJSpMdg/8XEAYvTEEo9++fTt6y0Tbr0TfdAj6LZk/LZrLuI2GjfFAId1CDcDx8fFhWZaPX79+bW7fvl2HDx/aVAj6HsyflKzM0siZMna73f/4fj15LMtyv6oqXjle/wKhw5eAgIqiwjYhrWxfgfkIT/EWVVX1X1mW9VviOlKgO3fu0CnwKrH6bVI+IwGiv7px40bQkaCv0HxjDC1/782bN3VhRstHw2/sG2NSJIjEfHRq/TBBEJf56J8F5ARBPOajqU8QEgRxmI9mPkJKEGy++WjuM8QEwWabjxY+RE4QbK75p9YBFknzOkEbL2KeJtbbQza/EQAaIeBvcy377Nu2BoPBaBdUiOY3BkAbBLRAXxUv4uGKrwi0rvmo8UYyLWMCmy9PXEeUYdVdUb7NRyvtJNQAgev36Wkuiy3z0cobzH1CoKX1+4gCNs1Ha50w8AVB25tVtJTJtvlo7SMmPiDw0ef6LpML85GVM0ZtQuBzyjVPspUuJPORtUNmbUGg0XyXZXNpPrJ63NQ1BIRZjeHfVflcm4+snzd2CYGtAykuVVgqYxvmO8sQ4gIC7a3fZjnbMt9pihjbEGju+22WtU3znecIsglBCOF/3bK2bX4rSaJsQNDG8TSboqxNF4Z8mN9alrB1IdC48mezzL7MbzVN3KoQ+Hra1tbzCh5p+zK/9TyBq0Cg6alfUy0qO+a/e/fOm/leEkU2gYAWFFLf36T83LNv871lCl0WAm2PfZtqVvc10ecf+jLfa6rYZSAIaeo3S5P3MMX8fV/me88VPA+C0KZ+y0wJtZm/0qZQF5q20ZTNliFO/6aJbBzUszbz1QAwDYJbt2552+7tYjbw4cMHdearAmAcAtLVaCqXDRHRut2uKvPVAYB2d3cp0ygSbJAOO53O/tHRkaoKVwdAkmlV/wMxiHJbKhfz6wAAAABJRU5ErkJggg==";
        const jewelTemplateImage = new Image();
        const jewelImageCache = new Map();
        const shadeColorCache = new Map();
        let jewelTemplateReady = false;

        function hexToRgb(hex) {
            const value = hex.replace("#", "");
            const number = Number.parseInt(value, 16);
            return {
                r: (number >> 16) & 255,
                g: (number >> 8) & 255,
                b: number & 255
            };
        }

        function tintRgb(rgb, amount) {
            const clamp = (channel) => Math.max(0, Math.min(255, channel));
            return clampRgbSaturation({
                r: clamp(rgb.r + amount),
                g: clamp(rgb.g + amount),
                b: clamp(rgb.b + amount)
            });
        }

        function mixRgb(start, end, factor) {
            return clampRgbSaturation({
                r: Math.round(start.r + (end.r - start.r) * factor),
                g: Math.round(start.g + (end.g - start.g) * factor),
                b: Math.round(start.b + (end.b - start.b) * factor)
            });
        }

        function sampleGemTone(tone, base, light, deep, shadow, highlight) {
            if (tone < 0.18) {
                return mixRgb(shadow, deep, tone / 0.18);
            }
            if (tone < 0.56) {
                return mixRgb(deep, base, (tone - 0.18) / 0.38);
            }
            if (tone < 0.82) {
                return mixRgb(base, light, (tone - 0.56) / 0.26);
            }
            return mixRgb(light, highlight, (tone - 0.82) / 0.18);
        }

        function getTintedJewelSrc(colorId) {
            if (jewelImageCache.has(colorId)) return jewelImageCache.get(colorId);
            if (!jewelTemplateReady) return JEWEL_TEMPLATE_SRC;

            const canvas = document.createElement("canvas");
            canvas.width = jewelTemplateImage.width;
            canvas.height = jewelTemplateImage.height;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            context.drawImage(jewelTemplateImage, 0, 0);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            const base = hexToRgb(COLOR_PALETTE[colorId].color);
            const light = tintRgb(base, 46);
            const deep = tintRgb(base, -46);
            const shadow = tintRgb(base, -92);
            const highlight = tintRgb(base, 72);

            for (let index = 0; index < pixels.length; index += 4) {
                const alpha = pixels[index + 3];
                if (alpha === 0) continue;

                const tone = pixels[index] / 255;
                const tinted = sampleGemTone(tone, base, light, deep, shadow, highlight);
                pixels[index] = tinted.r;
                pixels[index + 1] = tinted.g;
                pixels[index + 2] = tinted.b;
            }

            context.putImageData(imageData, 0, 0);
            const src = canvas.toDataURL("image/png");
            jewelImageCache.set(colorId, src);
            return src;
        }

        jewelTemplateImage.addEventListener("load", () => {
            jewelTemplateReady = true;
            jewelImageCache.clear();
            scheduleRender();
        });
        jewelTemplateImage.src = JEWEL_TEMPLATE_SRC;

        const soundController = window.ColorJewelSound?.createController?.({
            volumeMultiplier: SOUND_VOLUME_MULTIPLIER,
            sfxVolumeMultiplier: SOUND_SFX_VOLUME_MULTIPLIER,
            bgmVolumeMultiplier: SOUND_BGM_VOLUME_MULTIPLIER,
            sfxEnabled: appSettings.soundEffectsOn,
            bgmEnabled: appSettings.bgmOn
        }) || null;
        let shouldResumeBgmOnForeground = false;
        let lastAudioWarmupQueuedAt = -Infinity;

        function syncAudioPreferenceState() {
            soundController?.setSfxEnabled?.(appSettings.soundEffectsOn);
            soundController?.setBgmEnabled?.(appSettings.bgmOn);
        }

        const SETTING_SCENE_GROUP_ALIASES = Object.freeze({
            bgm_on: ["bgm_on"],
            bgm_off: ["bgm_off"],
            sfx_on: ["sfx_on", "ssfx_on", "sound_on"],
            sfx_offf: ["sfx_offf", "sfx_off", "sound_off"],
            vibration_on: ["vibration_on", "vivration_on", "haptics_on"],
            vibration_off: ["vibration_off", "haptics_off"]
        });

        function getSettingSceneGroups(groupName) {
            const candidateNames = SETTING_SCENE_GROUP_ALIASES[groupName] || [groupName];
            return candidateNames
                .map((name) => settingSceneRenderer?.getGroup?.(name) || null)
                .filter(Boolean);
        }

        function setSettingSceneGroupVisibility(groupName, isVisible) {
            const groupElements = getSettingSceneGroups(groupName);
            if (!groupElements.length) {
                return;
            }

            groupElements.forEach((groupElement) => {
                groupElement.style.display = isVisible ? "" : "none";
                groupElement.setAttribute("aria-hidden", String(!isVisible));
            });
        }

        const SETTING_TOGGLE_LABEL_CONFIG = Object.freeze({
            bgm: {
                pillStableId: "-254",
                primaryButtonStableId: "jewel-soket-png-256",
                jewelStableId: "jewel-soket-png-256",
                iconStableId: "icon-whiteicon-check-s-png-258",
                stableIds: [
                    "-254",
                    "jewel-soket-png-256",
                    "icon-whiteicon-check-s-png-258",
                    "shape-pill-274",
                    "jewel-soket-png-275",
                    "icon-whiteicon-close-png-277",
                    "bgm-184"
                ],
                getValue: () => appSettings.bgmOn
            },
            sfx: {
                pillStableId: "-304",
                primaryButtonStableId: "jewel-soket-png-305",
                jewelStableId: "jewel-soket-png-305",
                iconStableId: "icon-whiteicon-check-s-png-306",
                stableIds: [
                    "-304",
                    "jewel-soket-png-305",
                    "icon-whiteicon-check-s-png-306",
                    "shape-pill-307",
                    "jewel-soket-png-308",
                    "icon-whiteicon-close-png-309",
                    "sfx-185"
                ],
                getValue: () => appSettings.soundEffectsOn
            },
            vibration: {
                pillStableId: "-310",
                primaryButtonStableId: "jewel-soket-png-311",
                jewelStableId: "jewel-soket-png-311",
                iconStableId: "icon-whiteicon-check-s-png-312",
                stableIds: [
                    "-310",
                    "jewel-soket-png-311",
                    "icon-whiteicon-check-s-png-312",
                    "shape-pill-313",
                    "jewel-soket-png-314",
                    "icon-whiteicon-close-png-315",
                    "vibration-187"
                ],
                getValue: () => appSettings.hapticsOn
            }
        });
        const SETTING_TOGGLE_ICON_SOURCES = Object.freeze({
            on: `./src/assets/Icon_WhiteIcon_check_s.png?v=${SCENE_CONTRACT_VERSION}`,
            off: `./src/assets/Icon_WhiteIcon_Close.png?v=${SCENE_CONTRACT_VERSION}`
        });

        function getSettingToggleIconImage(stableId) {
            return settingSceneRenderer?.getElement?.(stableId)?.querySelector?.("img") || null;
        }

        function getSettingSceneElement(stableId) {
            return settingSceneRenderer?.getElement?.(stableId) || null;
        }

        function getSettingSceneElementPosition(stableId) {
            const element = getSettingSceneElement(stableId);
            if (!element) {
                return null;
            }

            const left = parseFloat(element.style.left || "0");
            const top = parseFloat(element.style.top || "0");
            if (!Number.isFinite(left) || !Number.isFinite(top)) {
                return null;
            }

            return { left, top };
        }

        function setSettingSceneElementPosition(stableId, left, top) {
            const element = getSettingSceneElement(stableId);
            if (!element) {
                return;
            }

            element.style.left = `${left}px`;
            element.style.top = `${top}px`;
        }

        function syncSettingSceneToggleLayouts() {
            Object.values(SETTING_TOGGLE_LABEL_CONFIG).forEach(({ pillStableId, jewelStableId, iconStableId, getValue }) => {
                const pillPosition = getSettingSceneElementPosition(pillStableId);
                if (!pillPosition) {
                    return;
                }

                const isEnabled = !!getValue();
                const jewelLeft = pillPosition.left + (isEnabled ? 50 : -6);
                const jewelTop = pillPosition.top - 5;
                const iconLeft = pillPosition.left + (isEnabled ? 16 : 59);
                const iconTop = pillPosition.top + (isEnabled ? 8 : 11);

                setSettingSceneElementPosition(jewelStableId, jewelLeft, jewelTop);
                setSettingSceneElementPosition(iconStableId, iconLeft, iconTop);
            });
        }

        function syncSettingSceneToggleIcons() {
            Object.values(SETTING_TOGGLE_LABEL_CONFIG).forEach(({ iconStableId, getValue }) => {
                const iconElement = getSettingToggleIconImage(iconStableId);
                if (!iconElement) {
                    return;
                }

                iconElement.src = getValue()
                    ? SETTING_TOGGLE_ICON_SOURCES.on
                    : SETTING_TOGGLE_ICON_SOURCES.off;
            });
        }

        function syncSettingScenePreferenceGroups() {
            setSettingSceneGroupVisibility("sfx_on", appSettings.soundEffectsOn);
            setSettingSceneGroupVisibility("sfx_offf", !appSettings.soundEffectsOn);
            setSettingSceneGroupVisibility("bgm_on", appSettings.bgmOn);
            setSettingSceneGroupVisibility("bgm_off", !appSettings.bgmOn);
            setSettingSceneGroupVisibility("vibration_on", appSettings.hapticsOn);
            setSettingSceneGroupVisibility("vibration_off", !appSettings.hapticsOn);
        }

        function applyAppSettings(nextSettings, options = {}) {
            const { persist = true } = options;
            appSettings = normalizeAppSettings(nextSettings);
            syncAudioPreferenceState();
            syncSettingScenePreferenceGroups();
            if (persist) {
                persistAppSettings(appSettings);
            }
            return appSettings;
        }

        function updateAppSettings(partialSettings, options = {}) {
            return applyAppSettings(
                {
                    ...appSettings,
                    ...partialSettings
                },
                options
            );
        }

        function queueAudioContextWarmup() {
            const now = typeof performance !== "undefined" && typeof performance.now === "function"
                ? performance.now()
                : Date.now();
            if (now - lastAudioWarmupQueuedAt < 120) {
                return;
            }
            lastAudioWarmupQueuedAt = now;
            soundController?.warmup?.();
        }

        function playPickupSound(clusterSize = 1) {
            soundController?.playPickup?.(clusterSize);
        }

        function playPlaceSound(clusterSize = 1) {
            soundController?.playPlace?.(clusterSize);
        }

        function triggerButtonPressSound(volumeScale = 1) {
            soundController?.playButton?.(volumeScale);
        }

        function playColorCompleteSound(startDelayMs = 0) {
            soundController?.playComplete?.(startDelayMs);
        }

        function playFireworkBurstSound(startDelayMs = 0, accent = 0) {
            soundController?.playFirework?.(startDelayMs, accent);
        }

        const CORRECT_PLACEMENT_HAPTIC_MS = 16;
        const CORRECT_PLACEMENT_HAPTIC_COOLDOWN_MS = 48;

        function canUseMobilePlacementHaptics() {
            if (!appSettings.hapticsOn) {
                return false;
            }

            if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
                return false;
            }

            const hasCoarsePointer = typeof window.matchMedia === "function" && (
                window.matchMedia("(pointer: coarse)").matches ||
                window.matchMedia("(any-pointer: coarse)").matches
            );
            const userAgent = navigator.userAgent || "";
            return hasCoarsePointer || /Android|iPhone|iPad|iPod/i.test(userAgent);
        }

        function triggerCorrectPlacementHaptic() {
            if (!canUseMobilePlacementHaptics()) {
                return false;
            }

            const now = performance.now();
            if (now - lastCorrectPlacementHapticAt < CORRECT_PLACEMENT_HAPTIC_COOLDOWN_MS) {
                return false;
            }

            lastCorrectPlacementHapticAt = now;
            try {
                return navigator.vibrate(CORRECT_PLACEMENT_HAPTIC_MS);
            } catch (error) {
                return false;
            }
        }

        function setSoundEffectsEnabled(isEnabled) {
            const previousValue = appSettings.soundEffectsOn;
            updateAppSettings({ soundEffectsOn: isEnabled });
            if (!previousValue && isEnabled) {
                triggerButtonPressSound();
            }
        }

        function setBgmEnabled(isEnabled) {
            if (isEnabled) {
                queueAudioContextWarmup();
            }
            updateAppSettings({ bgmOn: isEnabled });
            soundController?.setBgmEnabled?.(isEnabled, { resumePlayback: isEnabled });
            if (appSettings.soundEffectsOn) {
                triggerButtonPressSound();
            }
        }

        function setHapticsEnabled(isEnabled) {
            updateAppSettings({ hapticsOn: isEnabled });
            if (appSettings.soundEffectsOn) {
                triggerButtonPressSound();
            }
        }

        function getConnectedGemCluster(startRow, startCol) {
            const colorId = boardState[startRow][startCol];
            if (!colorId || isLockedCorrectGem(startRow, startCol)) return [];

            const visited = new Set();
            const cluster = [];
            const queue = [{ row: startRow, col: startCol }];
            let queueIndex = 0;
            visited.add(`${startRow}-${startCol}`);

            while (queueIndex < queue.length) {
                const current = queue[queueIndex];
                queueIndex += 1;
                cluster.push(current);

                EIGHT_WAY_DIRECTIONS.forEach((direction) => {
                    const nextRow = current.row + direction.row;
                    const nextCol = current.col + direction.col;
                    const key = `${nextRow}-${nextCol}`;

                    if (
                        nextRow < 0 ||
                        nextRow >= ROWS ||
                        nextCol < 0 ||
                        nextCol >= COLS ||
                        visited.has(key) ||
                        isLockedCorrectGem(nextRow, nextCol) ||
                        boardState[nextRow][nextCol] !== colorId
                    ) {
                        return;
                    }

                    visited.add(key);
                    queue.push({ row: nextRow, col: nextCol });
                });
            }

            return cluster;
        }

        function getEmptyTrayIndices() {
            const openedPocketIndices = getOpenedPocketIndexSet();
            return trayState
                .map((gem, index) => (gem === 0 && isPocketOpened(index, openedPocketIndices) ? index : -1))
                .filter((index) => index !== -1);
        }

        function getTrayPosition(index) {
            return {
                row: Math.floor(index / TOP_POCKET_COUNT),
                col: index % TOP_POCKET_COUNT
            };
        }

        function getTrayIndex(row, col) {
            return row * TOP_POCKET_COUNT + col;
        }

        function getConnectedTrayCluster(startIndex) {
            const colorId = trayState[startIndex];
            if (!colorId) return [];

            const visited = new Set([startIndex]);
            const cluster = [];
            const queue = [startIndex];
            let queueIndex = 0;

            while (queueIndex < queue.length) {
                const currentIndex = queue[queueIndex];
                queueIndex += 1;
                const currentPosition = getTrayPosition(currentIndex);
                cluster.push(currentIndex);

                EIGHT_WAY_DIRECTIONS.forEach((direction) => {
                    const nextRow = currentPosition.row + direction.row;
                    const nextCol = currentPosition.col + direction.col;

                    if (
                        nextRow < 0 ||
                        nextRow >= TRAY_ROW_COUNT ||
                        nextCol < 0 ||
                        nextCol >= TOP_POCKET_COUNT
                    ) {
                        return;
                    }

                    const nextIndex = getTrayIndex(nextRow, nextCol);
                    if (visited.has(nextIndex) || trayState[nextIndex] !== colorId) {
                        return;
                    }

                    visited.add(nextIndex);
                    queue.push(nextIndex);
                });
            }

            return cluster;
        }

        function toCellKey(row, col) {
            return `${row}-${col}`;
        }

        function scheduleRender() {
            if (renderFrame) {
                return;
            }

            renderFrame = window.requestAnimationFrame(() => {
                renderFrame = null;
                render();
            });
        }

        function clearSparkles() {
            sparkleCells.clear();
            if (sparkleCleanupTimer) {
                window.clearTimeout(sparkleCleanupTimer);
                sparkleCleanupTimer = null;
            }
        }

        function clearCelebrationTimers() {
            celebrationTimers.forEach((timerId) => window.clearTimeout(timerId));
            celebrationTimers = [];
        }

        function getSceneRendererCtor() {
            if (sceneRendererCtorPromise) {
                return sceneRendererCtorPromise;
            }

            sceneRendererCtorPromise = import("./scene-renderer.js")
                .then((module) => {
                    const ctor = module.SceneRenderer ?? window.SceneRenderer;
                    if (!ctor) {
                        throw new Error("SceneRenderer를 찾을 수 없습니다.");
                    }
                    return ctor;
                })
                .catch((error) => {
                    sceneRendererCtorPromise = null;
                    throw error;
                });
            return sceneRendererCtorPromise;
        }

        function getStageClearContract() {
            if (stageClearSceneContract) {
                return Promise.resolve(stageClearSceneContract);
            }

            if (stageClearSceneContractPromise) {
                return stageClearSceneContractPromise;
            }

            stageClearSceneContractPromise = (
                window.location.protocol === "file:"
                    ? import("./scene-contracts.js").then((module) => JSON.parse(JSON.stringify(module.STAGE_CLEAR_CONTRACT)))
                    : fetch(`./Stage_Clear.contract.json?v=${SCENE_CONTRACT_VERSION}`, {
                        headers: NGROK_BYPASS_HEADERS
                    })
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error(`Stage_Clear contract load failed: ${response.status}`);
                            }
                            return response.json();
                        })
            )
                .then((contract) => {
                    if (!contract || contract.sceneName !== "Stage_Clear" || contract.sceneId !== "stage-clear") {
                        throw new Error("Stage_Clear contract payload is invalid.");
                    }
                    return contract;
                })
                .then((contract) => {
                    stageClearSceneContract = contract;
                    return contract;
                })
                .catch((error) => {
                    stageClearSceneContractPromise = null;
                    throw error;
                });
            return stageClearSceneContractPromise;
        }

        function getSettingContract() {
            if (settingSceneContract) {
                return Promise.resolve(settingSceneContract);
            }

            if (settingSceneContractPromise) {
                return settingSceneContractPromise;
            }

            settingSceneContractPromise = (
                window.location.protocol === "file:"
                    ? import("./scene-contracts.js").then((module) => JSON.parse(JSON.stringify(module.SETTING_CONTRACT)))
                    : fetch(`./setting.contract.json?v=${SCENE_CONTRACT_VERSION}`, {
                        headers: NGROK_BYPASS_HEADERS
                    })
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error(`setting contract load failed: ${response.status}`);
                            }
                            return response.json();
                        })
            )
                .then((contract) => {
                    settingSceneContract = contract;
                    return contract;
                })
                .catch((error) => {
                    settingSceneContractPromise = null;
                    throw error;
                });
            return settingSceneContractPromise;
        }

        function getSettingSceneLayoutMetrics(contract) {
            const designWidth = contract?.viewport?.width || contract?.canvas?.width || 390;
            const designHeight = contract?.viewport?.height || contract?.canvas?.height || 844;
            const mountWidth = settingSceneMountElement?.clientWidth || designWidth;
            const mountHeight = settingSceneMountElement?.clientHeight || designHeight;
            const scale = Math.min(1, mountWidth / designWidth, mountHeight / designHeight);

            return {
                designWidth,
                designHeight,
                scale,
                scaledWidth: Math.ceil(designWidth * scale),
                scaledHeight: Math.ceil(designHeight * scale)
            };
        }

        function getSettingSceneContentBounds(contract) {
            const designWidth = contract?.viewport?.width || contract?.canvas?.width || 390;
            const designHeight = contract?.viewport?.height || contract?.canvas?.height || 844;
            const bounds = (contract?.layers || [])
                .map((layer) => {
                    const shape = layer?.visual?.model?.shape;
                    const left = Number(layer?.x ?? 0);
                    const top = Number(layer?.y ?? 0);
                    const width = Number(shape?.width ?? 0);
                    const height = Number(shape?.height ?? 0);

                    if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
                        return null;
                    }

                    return {
                        left,
                        top,
                        right: left + width,
                        bottom: top + height
                    };
                })
                .filter(Boolean);

            if (!bounds.length) {
                return {
                    left: 0,
                    top: 0,
                    right: designWidth,
                    bottom: designHeight,
                    width: designWidth,
                    height: designHeight
                };
            }

            const union = bounds.reduce(
                (acc, layerBounds) => ({
                    left: Math.min(acc.left, layerBounds.left),
                    top: Math.min(acc.top, layerBounds.top),
                    right: Math.max(acc.right, layerBounds.right),
                    bottom: Math.max(acc.bottom, layerBounds.bottom)
                }),
                {
                    left: designWidth,
                    top: designHeight,
                    right: 0,
                    bottom: 0
                }
            );

            return {
                ...union,
                width: Math.max(designWidth, union.right),
                height: Math.max(designHeight, union.bottom)
            };
        }

        function getSettingScenePanelBounds(contract) {
            const designWidth = contract?.viewport?.width || contract?.canvas?.width || 390;
            const designHeight = contract?.viewport?.height || contract?.canvas?.height || 844;
            const panelLayerIds = ["shape-rect-112", "shape-rect-113", "-111"];
            const panelBounds = panelLayerIds
                .map((stableId) => contract?.layers?.find((layer) => layer?.stableId === stableId))
                .filter(Boolean)
                .map((layer) => {
                    const shape = layer?.visual?.model?.shape;
                    const left = Number(layer?.x ?? 0);
                    const top = Number(layer?.y ?? 0);
                    const width = Number(shape?.width ?? 0);
                    const height = Number(shape?.height ?? 0);

                    if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
                        return null;
                    }

                    return {
                        left,
                        top,
                        right: left + width,
                        bottom: top + height
                    };
                })
                .filter(Boolean);

            if (!panelBounds.length) {
                return {
                    left: 0,
                    top: 0,
                    right: designWidth,
                    bottom: designHeight
                };
            }

            return panelBounds.reduce(
                (bounds, layerBounds) => ({
                    left: Math.min(bounds.left, layerBounds.left),
                    top: Math.min(bounds.top, layerBounds.top),
                    right: Math.max(bounds.right, layerBounds.right),
                    bottom: Math.max(bounds.bottom, layerBounds.bottom)
                }),
                {
                    left: designWidth,
                    top: designHeight,
                    right: 0,
                    bottom: 0
                }
            );
        }

        function createSettingSceneSurface(contract) {
            if (!settingSceneMountElement) {
                return null;
            }

            const { designWidth, designHeight, scale, scaledWidth, scaledHeight } =
                getSettingSceneLayoutMetrics(contract);
            const contentBounds = getSettingSceneContentBounds(contract);
            const mountWidth = settingSceneMountElement?.clientWidth || designWidth;
            const scaledContentWidth = Math.ceil(contentBounds.width * scale);
            const exitDistance = Math.ceil(mountWidth * 0.5 + scaledContentWidth * 0.5 + 24);
            const shell = document.createElement("div");
            shell.className = "setting-scene-shell";
            shell.style.width = `${scaledWidth}px`;
            shell.style.height = `${scaledHeight}px`;
            shell.style.setProperty("--setting-scene-exit-distance", `${exitDistance}px`);

            const surface = document.createElement("div");
            surface.className = "setting-scene-surface";
            surface.style.width = `${contentBounds.width}px`;
            surface.style.height = `${contentBounds.height}px`;
            surface.style.transform = `scale(${scale})`;

            shell.appendChild(surface);
            settingSceneMountElement.appendChild(shell);
            return surface;
        }

        function finalizeSettingSceneClear() {
            if (settingSceneCloseTimer) {
                window.clearTimeout(settingSceneCloseTimer);
                settingSceneCloseTimer = null;
            }

            if (settingSceneCloseAnimationCleanup) {
                settingSceneCloseAnimationCleanup();
                settingSceneCloseAnimationCleanup = null;
            }

            settingSceneUnsubscribers.forEach((off) => {
                try {
                    off?.();
                } catch (error) {
                    console.warn("[Setting] unsubscribe failed:", error);
                }
            });
            settingSceneUnsubscribers = [];

            if (settingSceneRenderer) {
                settingSceneRenderer.hide();
                settingSceneRenderer = null;
            }

            if (settingSceneMountElement) {
                settingSceneMountElement.replaceChildren();
                settingSceneMountElement.setAttribute("aria-hidden", "true");
            }

            if (settingOverlayElement) {
                settingOverlayElement.classList.remove("active");
                settingOverlayElement.classList.remove("closing");
                settingOverlayElement.setAttribute("aria-hidden", "true");
            }

            isSettingSceneOpen = false;
            isSettingSceneClosing = false;

            const afterCloseAction = settingSceneAfterCloseAction;
            settingSceneAfterCloseAction = null;
            if (typeof afterCloseAction === "function") {
                afterCloseAction();
            }
        }

        function clearSettingScene(options = {}) {
            const { immediate = false, afterClose = null } = options;
            if (typeof afterClose === "function") {
                settingSceneAfterCloseAction = afterClose;
            }

            if (immediate) {
                finalizeSettingSceneClear();
                return;
            }

            if (!isSettingSceneOpen || isSettingSceneClosing) {
                if (!isSettingSceneClosing) {
                    finalizeSettingSceneClear();
                }
                return;
            }

            settingSceneUnsubscribers.forEach((off) => {
                try {
                    off?.();
                } catch (error) {
                    console.warn("[Setting] unsubscribe failed:", error);
                }
            });
            settingSceneUnsubscribers = [];

            isSettingSceneOpen = false;
            isSettingSceneClosing = true;

            if (settingOverlayElement) {
                settingOverlayElement.classList.remove("active");
                settingOverlayElement.classList.add("closing");
                settingOverlayElement.setAttribute("aria-hidden", "false");
            }

            const shellElement = settingSceneMountElement?.querySelector(".setting-scene-shell");
            if (settingSceneCloseAnimationCleanup) {
                settingSceneCloseAnimationCleanup();
                settingSceneCloseAnimationCleanup = null;
            }

            if (shellElement) {
                const handleCloseAnimationEnd = (event) => {
                    if (event.target !== shellElement || event.animationName !== "setting-panel-exit") {
                        return;
                    }
                    finalizeSettingSceneClear();
                };

                shellElement.addEventListener("animationend", handleCloseAnimationEnd);
                settingSceneCloseAnimationCleanup = () => {
                    shellElement.removeEventListener("animationend", handleCloseAnimationEnd);
                };
            }

            if (settingSceneCloseTimer) {
                window.clearTimeout(settingSceneCloseTimer);
            }
            settingSceneCloseTimer = window.setTimeout(() => {
                finalizeSettingSceneClear();
            }, SETTING_SCENE_CLOSE_ANIMATION_MS);
        }

        function restartGameFromSettingScene() {
            clearSettingScene({ afterClose: resetGame });
        }

        function registerSettingSceneToggleHandler(groupName, handler) {
            const groupElements = getSettingSceneGroups(groupName);
            if (!groupElements.length) {
                return;
            }

            groupElements.forEach((groupElement) => {
                const handleClick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handler();
                };

                groupElement.addEventListener("click", handleClick);
                settingSceneUnsubscribers.push(() => {
                    groupElement.removeEventListener("click", handleClick);
                });
            });
        }

        function registerSettingSceneStableIdToggleHandlers(stableIds, handler) {
            stableIds.forEach((stableId) => {
                const element = settingSceneRenderer?.getElement?.(stableId);
                if (!element) {
                    return;
                }

                element.style.cursor = "pointer";
                element.setAttribute("role", "button");
                element.setAttribute("tabindex", "0");

                const handleClick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handler();
                };

                const handleKeydown = (event) => {
                    if (event.key !== "Enter" && event.key !== " ") {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    handler();
                };

                element.addEventListener("click", handleClick);
                element.addEventListener("keydown", handleKeydown);
                settingSceneUnsubscribers.push(() => {
                    element.removeEventListener("click", handleClick);
                    element.removeEventListener("keydown", handleKeydown);
                });
            });
        }

        async function showSettingScene() {
            if (!settingSceneMountElement || !settingOverlayElement || isSettingSceneOpen || isSettingSceneClosing) {
                return false;
            }

            try {
                const [SceneRenderer, contract] = await Promise.all([
                    getSceneRendererCtor(),
                    getSettingContract()
                ]);

                clearSettingScene({ immediate: true });

                const surface = createSettingSceneSurface(contract);
                if (!surface) {
                    return false;
                }

                settingSceneRenderer = new SceneRenderer(surface, {
                    basePath: "./src/"
                });
                settingSceneRenderer.loadSync(contract);
                settingSceneRenderer.show();

                const sceneRootElement = surface.firstElementChild;
                if (sceneRootElement) {
                    const contentBounds = getSettingSceneContentBounds(contract);
                    sceneRootElement.style.top = "0";
                    sceneRootElement.style.left = "0";
                    sceneRootElement.style.right = "auto";
                    sceneRootElement.style.bottom = "auto";
                    sceneRootElement.style.width = `${contentBounds.width}px`;
                    sceneRootElement.style.height = `${contentBounds.height}px`;
                    sceneRootElement.style.opacity = "1";
                    sceneRootElement.style.overflow = "visible";
                    sceneRootElement.style.pointerEvents = "auto";
                    sceneRootElement.style.transition = "none";
                    sceneRootElement.querySelectorAll("[data-group]").forEach((groupElement) => {
                        groupElement.style.width = `${contentBounds.width}px`;
                        groupElement.style.height = `${contentBounds.height}px`;
                        groupElement.style.overflow = "visible";
                    });
                }

                settingSceneUnsubscribers = [
                    settingSceneRenderer.on("re play", () => {
                        triggerButtonPressSound();
                        clearSettingScene();
                    }),
                    settingSceneRenderer.on("re-start-115:click", () => {
                        triggerButtonPressSound();
                        restartGameFromSettingScene();
                    })
                ];

                registerSettingSceneToggleHandler("sfx_on", () => setSoundEffectsEnabled(false));
                registerSettingSceneToggleHandler("sfx_offf", () => {
                    queueAudioContextWarmup();
                    setSoundEffectsEnabled(true);
                });
                registerSettingSceneToggleHandler("bgm_on", () => setBgmEnabled(false));
                registerSettingSceneToggleHandler("bgm_off", () => setBgmEnabled(true));
                registerSettingSceneToggleHandler("vibration_on", () => setHapticsEnabled(false));
                registerSettingSceneToggleHandler("vibration_off", () => setHapticsEnabled(true));
                registerSettingSceneStableIdToggleHandlers(
                    SETTING_TOGGLE_LABEL_CONFIG.sfx.stableIds,
                    () => {
                        if (!appSettings.soundEffectsOn) {
                            queueAudioContextWarmup();
                        }
                        setSoundEffectsEnabled(!appSettings.soundEffectsOn);
                    }
                );
                registerSettingSceneStableIdToggleHandlers(
                    SETTING_TOGGLE_LABEL_CONFIG.bgm.stableIds,
                    () => setBgmEnabled(!appSettings.bgmOn)
                );
                registerSettingSceneStableIdToggleHandlers(
                    SETTING_TOGGLE_LABEL_CONFIG.vibration.stableIds,
                    () => setHapticsEnabled(!appSettings.hapticsOn)
                );
                syncSettingScenePreferenceGroups();

                settingOverlayElement.classList.remove("closing");
                settingOverlayElement.classList.add("active");
                settingOverlayElement.setAttribute("aria-hidden", "false");
                settingSceneMountElement.setAttribute("aria-hidden", "false");
                isSettingSceneOpen = true;
                return true;
            } catch (error) {
                clearSettingScene({ immediate: true });
                console.error("[Setting] setting scene mount failed:", error);
                return false;
            }
        }

        function clearStageClearSceneEffects() {
            if (!stageClearSceneMountElement) {
                return;
            }

            const mountedNodes = [
                stageClearSceneMountElement,
                ...stageClearSceneMountElement.querySelectorAll("*")
            ];

            mountedNodes.forEach((node) => {
                if (node._confettiLoopId) {
                    window.clearInterval(node._confettiLoopId);
                    node._confettiLoopId = null;
                }

                if (node._confettiCleanupId) {
                    window.clearTimeout(node._confettiCleanupId);
                    node._confettiCleanupId = null;
                }
            });
        }

        function getStageClearSceneLayoutMetrics(contract) {
            const designWidth = contract?.viewport?.width || contract?.canvas?.width || 390;
            const designHeight = contract?.viewport?.height || contract?.canvas?.height || 844;
            const mountWidth = stageClearSceneMountElement?.clientWidth || designWidth;
            const mountHeight = stageClearSceneMountElement?.clientHeight || designHeight;
            const scale = Math.min(1, mountWidth / designWidth, mountHeight / designHeight);

            return {
                designWidth,
                designHeight,
                scale,
                scaledWidth: Math.round(designWidth * scale),
                scaledHeight: Math.round(designHeight * scale)
            };
        }

        function createStageClearSceneSurface(contract) {
            if (!stageClearSceneMountElement) {
                return null;
            }

            const { designWidth, designHeight, scale, scaledWidth, scaledHeight } =
                getStageClearSceneLayoutMetrics(contract);
            const shell = document.createElement("div");
            shell.className = "stage-clear-scene-shell";
            shell.style.width = `${scaledWidth}px`;
            shell.style.height = `${scaledHeight}px`;

            const surface = document.createElement("div");
            surface.className = "stage-clear-scene-surface";
            surface.style.width = `${designWidth}px`;
            surface.style.height = `${designHeight}px`;
            surface.style.transform = `scale(${scale})`;

            shell.appendChild(surface);
            stageClearSceneMountElement.appendChild(shell);
            return surface;
        }

        async function showStageClearScene(sessionVersion = gameSessionVersion) {
            if (!stageClearSceneMountElement) {
                return false;
            }

            try {
                const [SceneRenderer, contract] = await Promise.all([
                    getSceneRendererCtor(),
                    getStageClearContract()
                ]);

                if (!isCurrentGameSession(sessionVersion) || !isStageTransitioning) {
                    return false;
                }

                clearStageClearSceneEffects();
                stageClearSceneMountElement.replaceChildren();
                stageClearSceneRenderer?.hide();

                const surface = createStageClearSceneSurface(contract);
                if (!surface) {
                    return false;
                }

                stageClearSceneRenderer = new SceneRenderer(surface, {
                    basePath: "./src/"
                });
                stageClearSceneRenderer.loadSync(contract);
                stageClearSceneRenderer.show();
                const sceneRootElement = surface.firstElementChild;
                if (sceneRootElement) {
                    sceneRootElement.style.top = "0";
                    sceneRootElement.style.left = "0";
                    sceneRootElement.style.right = "auto";
                    sceneRootElement.style.bottom = "auto";
                    sceneRootElement.style.overflow = "visible";
                    sceneRootElement.style.pointerEvents = "none";
                    sceneRootElement.querySelectorAll("[data-group]").forEach((groupElement) => {
                        groupElement.style.overflow = "visible";
                    });
                }
                stageClearSceneMountElement.setAttribute("aria-hidden", "false");
                return true;
            } catch (error) {
                console.error("[StageClear] Stage_Clear scene mount failed:", error);
                return false;
            }
        }

        function clearStageClearTimers() {
            stageClearTimers.forEach((timerId) => window.clearTimeout(timerId));
            stageClearTimers = [];
            pendingStageClearItemRewards = [];

            clearStageClearSceneEffects();
            clearItemRewardOverlay();

            if (stageClearSceneRenderer) {
                stageClearSceneRenderer.hide();
                stageClearSceneRenderer = null;
            }

            if (stageClearSceneMountElement) {
                stageClearSceneMountElement.replaceChildren();
                stageClearSceneMountElement.setAttribute("aria-hidden", "true");
            }

            if (stageClearOverlayElement) {
                stageClearOverlayElement.classList.remove("active");
                stageClearOverlayElement.setAttribute("aria-hidden", "true");
            }
        }

        function clearSolvedStageFailSafeTimer() {
            if (!solvedStageFailSafeTimer) {
                return;
            }

            window.clearTimeout(solvedStageFailSafeTimer);
            solvedStageFailSafeTimer = null;
        }

        async function advanceToNextStage(sessionVersion = gameSessionVersion, options = {}) {
            const { preserveStageClearOverlay = false } = options;
            if (!isCurrentGameSession(sessionVersion)) {
                return false;
            }

            const currentSpecialActionUnlocked = isSpecialActionUnlocked(ACTIVE_MAP);
            const nextMapIndex = (currentMapIndex + 1) % MAP_DEFINITIONS.length;
            const nextDefinition = MAP_DEFINITIONS[nextMapIndex];
            const nextOverrideVersion = getStageOverrideVersion(nextDefinition);
            const shouldGrantTutorialIntroItems =
                ACTIVE_MAP?.id === "tutorial" && nextDefinition?.id === "bear";

            if (shouldGrantTutorialIntroItems) {
                const tutorialIntroCharges = getDefaultActionCharges(nextDefinition);
                itemEconomyState = normalizeItemEconomyState(itemEconomyState);
                itemEconomyState.charges.magic = Math.max(
                    Number(itemEconomyState.charges.magic || 0),
                    Number(tutorialIntroCharges.magic || 0)
                );
                itemEconomyState.charges.clean = Math.max(
                    Number(itemEconomyState.charges.clean || 0),
                    Number(tutorialIntroCharges.clean || 0)
                );
                itemEconomyState.adUses.magic = 0;
                itemEconomyState.adUses.clean = 0;
                itemEconomyState.refill.magic.active = false;
                itemEconomyState.refill.magic.clearCount = 0;
                itemEconomyState.refill.clean.active = false;
                itemEconomyState.refill.clean.clearCount = 0;
                persistItemEconomyState(itemEconomyState);
            }

            const carriedActionCharges = clampActionChargesSnapshot(
                shouldGrantTutorialIntroItems ? getItemEconomyChargesForMap(nextDefinition) : actionCharges
            );
            tutorialItemIntroState =
                shouldGrantTutorialIntroItems
                    ? {
                        mapId: "bear",
                        active: false,
                        displayCharges: {
                            magic: 0,
                            clean: 0
                        }
                    }
                    : null;
            clearPersistedGameProgress();
            clearRuntimeSnapshot();
            clearSolvedStageFailSafeTimer();
            if (!preserveStageClearOverlay) {
                clearStageClearTimers();
            }
            isStageTransitioning = false;
            await activateMapIndex(nextMapIndex);
            if (
                !currentSpecialActionUnlocked &&
                isSpecialActionUnlocked(ACTIVE_MAP) &&
                (Number(carriedActionCharges.magnet) || 0) <= 0
            ) {
                carriedActionCharges.magnet = getDefaultActionCharges(ACTIVE_MAP).magnet;
            }
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
                        actionCharges: clampActionChargesSnapshot(carriedActionCharges)
                    }
                    : (() => {
                        const nextLevelInitialState = buildCurrentLevelInitialState({
                            persistState: false,
                            fastMode: true
                        });
                        return {
                            mapId: nextLevelInitialState.mapId,
                            rows: nextLevelInitialState.rows,
                            cols: nextLevelInitialState.cols,
                            boardState: cloneBoardSnapshot(nextLevelInitialState.boardState),
                            trayState: [...nextLevelInitialState.trayState],
                            cleanedSocketCells: [...(nextLevelInitialState.cleanedSocketCells || [])],
                            actionCharges: clampActionChargesSnapshot(carriedActionCharges)
                        };
                    })();
            resetGame({
                regenerateLevelStart: false,
                preserveStageClearOverlay
            });
            return true;
        }

        function startStageClearSequence(sessionVersion = gameSessionVersion) {
            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            const stageClearItemRewards = [...pendingStageClearItemRewards];
            pendingStageClearItemRewards = [];
            isStageTransitioning = true;
            selected = null;
            soundController?.playComplete?.(0, "stage_clear");

            const nextMapIndex = (currentMapIndex + 1) % MAP_DEFINITIONS.length;
            const nextDefinition = MAP_DEFINITIONS[nextMapIndex];
            const nextOverrideVersion = getStageOverrideVersion(nextDefinition);
            const isNextPrepared =
                preparedNextMapIndex === nextMapIndex &&
                preparedNextMapVersion === nextOverrideVersion &&
                preparedNextMapConfig?.id === nextDefinition?.id &&
                preparedNextLevelInitialState?.mapId === nextDefinition?.id;
            let minimumDelayElapsed = false;
            let preparationFinished = isNextPrepared || isPixelAdminOpen();
            let advanceRequested = false;
            let preparationStarted = false;

            const requestStageAdvance = () => {
                if (advanceRequested || !isCurrentGameSession(sessionVersion) || !isStageTransitioning) {
                    return;
                }

                advanceRequested = true;
                const shouldFadeOverlay = stageClearOverlayElement?.classList.contains("active");
                if (shouldFadeOverlay) {
                    stageClearOverlayElement.classList.remove("active");
                    soundController?.playComplete?.(0, "stage_clear_dim");
                }

                if (shouldFadeOverlay) {
                    requestAnimationFrame(() => {
                        void advanceToNextStage(sessionVersion, { preserveStageClearOverlay: shouldFadeOverlay }).then((didAdvance) => {
                            if (!didAdvance) {
                                return;
                            }

                            const stageClearCleanupTimer = window.setTimeout(() => {
                                clearStageClearTimers();
                            }, STAGE_CLEAR_FADE_OUT_MS + 34);
                            stageClearTimers.push(stageClearCleanupTimer);
                        });
                    });
                } else {
                    void advanceToNextStage(sessionVersion, { preserveStageClearOverlay: shouldFadeOverlay }).then((didAdvance) => {
                        if (!didAdvance) {
                            return;
                        }
                    });
                }
            };

            const beginStageAdvancePreparation = () => {
                if (preparationFinished || preparationStarted || !isCurrentGameSession(sessionVersion) || !isStageTransitioning) {
                    return;
                }

                preparationStarted = true;
                if (preparedNextMapTimer) {
                    window.clearTimeout(preparedNextMapTimer);
                    preparedNextMapTimer = null;
                }

                if (preparedNextMapIdleCallbackId != null && typeof window.cancelIdleCallback === "function") {
                    window.cancelIdleCallback(preparedNextMapIdleCallbackId);
                    preparedNextMapIdleCallbackId = null;
                }

                prepareAdjacentStageDefinitions(currentMapIndex, {
                    includePrevious: false
                }).then(
                    () => {
                        preparationFinished = true;
                        if (!minimumDelayElapsed) {
                            return;
                        }

                        requestStageAdvance();
                    },
                    (error) => {
                        console.error("[StageClear] Next stage preparation failed:", error);
                        preparationFinished = true;
                        if (!minimumDelayElapsed) {
                            return;
                        }

                        requestStageAdvance();
                    }
                );
            };

            if (stageClearOverlayElement) {
                stageClearOverlayElement.classList.add("active");
                stageClearOverlayElement.setAttribute("aria-hidden", "false");
            }

            if (stageClearItemRewards.length) {
                showStageClearItemRewards(stageClearItemRewards, sessionVersion);
            }

            void showStageClearScene(sessionVersion).then(async (didShow) => {
                if (!isCurrentGameSession(sessionVersion) || !isStageTransitioning) {
                    return;
                }

                if (!didShow) {
                    minimumDelayElapsed = true;
                    beginStageAdvancePreparation();
                    if (!preparationFinished) {
                        return;
                    }

                    requestStageAdvance();
                    return;
                }

                requestAnimationFrame(() => {
                    if (!isCurrentGameSession(sessionVersion) || !isStageTransitioning) {
                        return;
                    }

                    void playFireworkBurstSound(0, 3);
                });
                await waitForNextPaint(2);
                if (!isCurrentGameSession(sessionVersion) || !isStageTransitioning) {
                    return;
                }

                beginStageAdvancePreparation();

                const minimumDelayTimer = window.setTimeout(() => {
                    if (!isCurrentGameSession(sessionVersion)) {
                        return;
                    }

                    minimumDelayElapsed = true;
                    if (!preparationFinished) {
                        return;
                    }

                    requestStageAdvance();
                }, STAGE_CLEAR_MIN_TRANSITION_DELAY_MS);
                stageClearTimers.push(minimumDelayTimer);
            });

            void playColorCompleteSound(30);
            void playColorCompleteSound(520);

            const maximumDelayTimer = window.setTimeout(() => {
                if (!isCurrentGameSession(sessionVersion) || advanceRequested || !isStageTransitioning) {
                    return;
                }

                minimumDelayElapsed = true;
                preparationFinished = true;
                requestStageAdvance();
            }, STAGE_CLEAR_MAX_TRANSITION_DELAY_MS);
            stageClearTimers.push(maximumDelayTimer);
        }

        function triggerSolvedStageSequence(sessionVersion = gameSessionVersion) {
            clearCelebrationTimers();
            clearSolvedStageFailSafeTimer();
            clearPersistedGameProgress();
            clearRuntimeSnapshot();
            pendingStageClearItemRewards = collectStageClearItemRewards();
            const stageClearDelay = scheduleFullBoardCelebration();
            const stageClearTimer = window.setTimeout(() => {
                startStageClearSequence(sessionVersion);
            }, stageClearDelay);
            stageClearTimers.push(stageClearTimer);
            solvedStageFailSafeTimer = window.setTimeout(() => {
                if (!isCurrentGameSession(sessionVersion) || !solved) {
                    return;
                }

                void advanceToNextStage(sessionVersion);
            }, stageClearDelay + STAGE_CLEAR_MAX_TRANSITION_DELAY_MS + 480);
        }


        function cleanupExpiredSparkles(now = performance.now()) {
            let changed = false;

            sparkleCells.forEach((expiresAt, key) => {
                if (expiresAt <= now) {
                    sparkleCells.delete(key);
                    changed = true;
                }
            });

            return changed;
        }

        function scheduleSparkleCleanup() {
            if (sparkleCleanupTimer) {
                window.clearTimeout(sparkleCleanupTimer);
                sparkleCleanupTimer = null;
            }

            if (!sparkleCells.size) {
                return;
            }

            const nextExpiry = Math.min(...sparkleCells.values());
            const waitMs = Math.max(0, nextExpiry - performance.now());

            sparkleCleanupTimer = window.setTimeout(() => {
                sparkleCleanupTimer = null;
                if (cleanupExpiredSparkles()) {
                    scheduleRender();
                }
                scheduleSparkleCleanup();
            }, waitMs);
        }

        function isCellSparkling(row, col) {
            const key = toCellKey(row, col);
            const expiresAt = sparkleCells.get(key);

            if (!expiresAt) {
                return false;
            }

            if (expiresAt <= performance.now()) {
                sparkleCells.delete(key);
                return false;
            }

            return true;
        }

        function getCellSparkleElapsed(row, col, now = performance.now()) {
            const key = toCellKey(row, col);
            const expiresAt = sparkleCells.get(key);

            if (!expiresAt) {
                return null;
            }

            if (expiresAt <= now) {
                sparkleCells.delete(key);
                return null;
            }

            return MATCH_SPARKLE_MS - (expiresAt - now);
        }

        function markCorrectPlacementSparkle(row, col, options = {}) {
            const { triggerHaptic = false } = options;
            if (!TARGET_MAP[row][col] || boardState[row][col] !== TARGET_MAP[row][col]) {
                return;
            }

            sparkleCells.set(toCellKey(row, col), performance.now() + MATCH_SPARKLE_MS);
            scheduleSparkleCleanup();

            if (triggerHaptic) {
                triggerCorrectPlacementHaptic();
            }
        }

        function getCompletedColorIds() {
            const completed = new Set();

            Object.entries(TARGET_COLOR_COUNTS).forEach(([colorId, targetCount]) => {
                let matchedCount = 0;

                for (let row = 0; row < ROWS; row += 1) {
                    for (let col = 0; col < COLS; col += 1) {
                        if (TARGET_MAP[row][col] === Number(colorId) && isCompletedTargetCell(row, col)) {
                            matchedCount += 1;
                        }
                    }
                }

                if (matchedCount === targetCount) {
                    completed.add(Number(colorId));
                }
            });

            return completed;
        }

        function scheduleColorCompletionCelebration(colorId, startDelayMs = 0) {
            const completedCells = TARGET_POSITIONS
                .filter((position) => TARGET_MAP[position.row][position.col] === colorId)
                .sort((left, right) => left.row - right.row || left.col - right.col);

            completedCells.forEach((cell, index) => {
                const timerId = window.setTimeout(() => {
                    markCorrectPlacementSparkle(cell.row, cell.col);
                    scheduleRender();
                }, startDelayMs + index * COLOR_COMPLETE_STEP_MS);
                celebrationTimers.push(timerId);
            });

            void playColorCompleteSound(startDelayMs);

            return startDelayMs + completedCells.length * COLOR_COMPLETE_STEP_MS + 90;
        }

        function scheduleFullBoardCelebration(startDelayMs = 0) {
            const completedCells = TARGET_POSITIONS
                .filter((position) => isCompletedTargetCell(position.row, position.col))
                .sort((left, right) => left.row - right.row || left.col - right.col);
            const sparkleSpreadBudgetMs = Math.max(0, FULL_BOARD_CELEBRATION_MAX_MS - MATCH_SPARKLE_MS - 60);

            completedCells.forEach((cell, index) => {
                const sparkleDelayMs = completedCells.length <= 1
                    ? startDelayMs
                    : startDelayMs + Math.round((index / (completedCells.length - 1)) * sparkleSpreadBudgetMs);
                const timerId = window.setTimeout(() => {
                    markCorrectPlacementSparkle(cell.row, cell.col);
                    scheduleRender();
                }, sparkleDelayMs);
                celebrationTimers.push(timerId);
            });

            void playColorCompleteSound(startDelayMs);

            if (completedCells.length > 10) {
                void playColorCompleteSound(startDelayMs + 120);
            }

            if (!completedCells.length) {
                return startDelayMs;
            }

            return startDelayMs + FULL_BOARD_CELEBRATION_MAX_MS;
        }

        function getOpenedPocketCount(completedColorCount = completedColorIds.size) {
            const initialOpenCount = POCKET_UNLOCK_RULE.initialOpenCount ?? 12;
            const completedColorsPerUnlock = Math.max(1, POCKET_UNLOCK_RULE.completedColorsPerUnlock ?? 1);
            const pocketsPerUnlock = Math.max(1, POCKET_UNLOCK_RULE.pocketsPerUnlock ?? 1);
            const additionalPockets = Math.floor(completedColorCount / completedColorsPerUnlock) * pocketsPerUnlock;

            return Math.min(POCKET_SIZE, initialOpenCount + additionalPockets);
        }

        function getOpenedPocketIndexSet(completedColorCount = completedColorIds.size) {
            return new Set(
                Array.from({ length: getOpenedPocketCount(completedColorCount) }, (_, index) => index)
            );
        }

        function isPocketOpened(index, openedPocketIndices = null) {
            const pocketIndices = openedPocketIndices || getOpenedPocketIndexSet();
            return pocketIndices.has(index);
        }

        function getTranslatedCells(cells, anchor, targetRow, targetCol) {
            const rowDelta = targetRow - anchor.row;
            const colDelta = targetCol - anchor.col;
            return cells.map((cell) => ({
                row: cell.row + rowDelta,
                col: cell.col + colDelta
            }));
        }

        function canPlaceBoardCluster(cells, anchor, targetRow, targetCol, colorId) {
            const sourceKeys = new Set(cells.map((cell) => toCellKey(cell.row, cell.col)));
            const translatedCells = getTranslatedCells(cells, anchor, targetRow, targetCol);
            const destinationKeys = new Set();

            for (const cell of translatedCells) {
                const key = toCellKey(cell.row, cell.col);

                if (
                    cell.row < 0 ||
                    cell.row >= ROWS ||
                    cell.col < 0 ||
                    cell.col >= COLS ||
                    !TARGET_MAP[cell.row][cell.col] ||
                    TARGET_MAP[cell.row][cell.col] !== colorId ||
                    destinationKeys.has(key)
                ) {
                    return false;
                }

                destinationKeys.add(key);

                if (!sourceKeys.has(key) && (boardState[cell.row][cell.col] !== 0 || isCleanedSocketCell(cell.row, cell.col))) {
                    return false;
                }
            }

            return true;
        }

        function getConnectedTargetRegion(startRow, startCol, colorId) {
            if (TARGET_MAP[startRow][startCol] !== colorId) {
                return [];
            }

            const region = [];
            const visited = new Set([toCellKey(startRow, startCol)]);
            const stack = [{ row: startRow, col: startCol }];

            while (stack.length) {
                const current = stack.pop();
                region.push(current);

                EIGHT_WAY_DIRECTIONS.forEach((direction) => {
                    const nextRow = current.row + direction.row;
                    const nextCol = current.col + direction.col;
                    const key = toCellKey(nextRow, nextCol);

                    if (
                        nextRow < 0 ||
                        nextRow >= ROWS ||
                        nextCol < 0 ||
                        nextCol >= COLS ||
                        visited.has(key) ||
                        TARGET_MAP[nextRow][nextCol] !== colorId
                    ) {
                        return;
                    }

                    visited.add(key);
                    stack.push({ row: nextRow, col: nextCol });
                });
            }

            return region;
        }

        function isAvailableTargetCellForRegion(row, col, colorId, extraAvailableKeys = null) {
            const key = toCellKey(row, col);
            if (!TARGET_MAP[row]?.[col] || TARGET_MAP[row][col] !== colorId || isCleanedSocketCell(row, col)) {
                return false;
            }

            if (extraAvailableKeys?.has(key)) {
                return true;
            }

            return isAvailableTargetCell(row, col, colorId);
        }

        function getConnectedEmptyTargetRegion(startRow, startCol, colorId, extraAvailableKeys = null) {
            if (!isAvailableTargetCellForRegion(startRow, startCol, colorId, extraAvailableKeys)) {
                return [];
            }

            const region = [];
            const visited = new Set([toCellKey(startRow, startCol)]);
            const queue = [{ row: startRow, col: startCol }];
            let queueIndex = 0;

            while (queueIndex < queue.length) {
                const current = queue[queueIndex];
                queueIndex += 1;
                region.push(current);

                EIGHT_WAY_DIRECTIONS.forEach((direction) => {
                    const nextRow = current.row + direction.row;
                    const nextCol = current.col + direction.col;
                    const key = toCellKey(nextRow, nextCol);

                    if (
                        nextRow < 0 ||
                        nextRow >= ROWS ||
                        nextCol < 0 ||
                        nextCol >= COLS ||
                        visited.has(key) ||
                        !isAvailableTargetCellForRegion(nextRow, nextCol, colorId, extraAvailableKeys)
                    ) {
                        return;
                    }

                    visited.add(key);
                    queue.push({ row: nextRow, col: nextCol });
                });
            }

            return region;
        }

        function isMatchingTargetCell(row, col, colorId) {
            return Boolean(TARGET_MAP[row][col]) && TARGET_MAP[row][col] === colorId;
        }

        function getColorMismatchMessage(colorId, row, col) {
            const targetColorId = TARGET_MAP[row][col];
            if (!targetColorId) {
                return "이 칸에는 보석을 놓을 수 없어요.";
            }
            return `${COLOR_PALETTE[colorId].name} 보석은 ${COLOR_PALETTE[targetColorId].name} 칸에 둘 수 없어요. 같은 색 칸으로 옮겨 주세요.`;
        }

        function canPlaceBoardClusterInConnectedEmptyRegion(cells, anchor, targetRow, targetCol, colorId, regionKeySet) {
            if (!canPlaceBoardCluster(cells, anchor, targetRow, targetCol, colorId)) {
                return false;
            }

            const translatedCells = getTranslatedCells(cells, anchor, targetRow, targetCol);
            return translatedCells.every((cell) => regionKeySet.has(toCellKey(cell.row, cell.col)));
        }

        function findNearestBoardClusterPlacement(cells, anchor, targetRow, targetCol, colorId, extraAvailableKeys = null) {
            const connectedEmptyRegion = getConnectedEmptyTargetRegion(targetRow, targetCol, colorId, extraAvailableKeys);
            const regionKeySet = new Set(
                connectedEmptyRegion.map((cell) => toCellKey(cell.row, cell.col))
            );
            let bestPlacement = null;

            for (let row = 0; row < ROWS; row += 1) {
                for (let col = 0; col < COLS; col += 1) {
                    if (!TARGET_MAP[row][col]) continue;
                    if (row === anchor.row && col === anchor.col) continue;
                    if (
                        !canPlaceBoardClusterInConnectedEmptyRegion(
                            cells,
                            anchor,
                            row,
                            col,
                            colorId,
                            regionKeySet
                        )
                    ) {
                        continue;
                    }

                    const translatedCells = getTranslatedCells(cells, anchor, row, col);
                    const includesTargetCell = translatedCells.some(
                        (cell) => cell.row === targetRow && cell.col === targetCol
                    );
                    const distance = Math.abs(targetRow - row) + Math.abs(targetCol - col);
                    const tieBreaker = Math.abs(anchor.row - row) + Math.abs(anchor.col - col);
                    const shouldReplace =
                        !bestPlacement ||
                        (includesTargetCell && !bestPlacement.includesTargetCell) ||
                        (includesTargetCell === bestPlacement.includesTargetCell &&
                            (distance < bestPlacement.distance ||
                                (distance === bestPlacement.distance && tieBreaker < bestPlacement.tieBreaker) ||
                                (distance === bestPlacement.distance &&
                                    tieBreaker === bestPlacement.tieBreaker &&
                                    (row < bestPlacement.row || (row === bestPlacement.row && col < bestPlacement.col)))));

                    if (shouldReplace) {
                        bestPlacement = { row, col, distance, tieBreaker, includesTargetCell };
                    }
                }
            }

            return bestPlacement;
        }

        function findNearestColorSlotPlacement(cells, targetRow, targetCol, colorId, extraAvailableKeys = null) {
            const regionCells = getConnectedEmptyTargetRegion(targetRow, targetCol, colorId, extraAvailableKeys);
            if (regionCells.length < cells.length) {
                return null;
            }

            return regionCells
                .slice(0, cells.length)
                .map(({ row, col }) => ({ row, col }));
        }

        function findPartialColorSlotPlacement(count, targetRow, targetCol, colorId, extraAvailableKeys = null) {
            const regionCells = getConnectedEmptyTargetRegion(targetRow, targetCol, colorId, extraAvailableKeys);
            const availableCells = regionCells
                .slice(0, count)
                .map(({ row, col }) => ({ row, col }));

            return availableCells.length ? availableCells : null;
        }

        function findBroomTargetCellInBoard(boardSnapshot, colorId) {
            const candidates = TARGET_POSITIONS
                .filter((position) =>
                    TARGET_MAP[position.row][position.col] === colorId &&
                    !isCleanedSocketCell(position.row, position.col) &&
                    (boardSnapshot[position.row][position.col] || 0) !== colorId
                )
                .map((position) => ({
                    row: position.row,
                    col: position.col,
                    isEmpty: (boardSnapshot[position.row][position.col] || 0) === 0
                }))
                .sort(
                    (left, right) =>
                        Number(right.isEmpty) - Number(left.isEmpty) ||
                        left.row - right.row ||
                        left.col - right.col
                );

            if (!candidates.length) {
                return null;
            }

            return {
                row: candidates[0].row,
                col: candidates[0].col
            };
        }

        function buildBroomMovePlan() {
            const openedPocketIndices = getOpenedPocketIndexSet();
            const boardSnapshot = boardState.map((row) => [...row]);
            const traySnapshot = [...trayState];
            const trayIndices = [...openedPocketIndices].sort((left, right) => left - right);
            const steps = [];

            let passMoved = true;
            let guard = 0;
            const maxPasses = Math.max(ROWS * COLS, POCKET_SIZE * 2);

            while (passMoved && guard < maxPasses) {
                passMoved = false;

                trayIndices.forEach((trayIndex) => {
                    const colorId = traySnapshot[trayIndex] || 0;
                    if (!colorId) {
                        return;
                    }

                    const targetCell = findBroomTargetCellInBoard(boardSnapshot, colorId);
                    if (!targetCell) {
                        return;
                    }

                    const displacedGem = boardSnapshot[targetCell.row][targetCell.col] || 0;
                    boardSnapshot[targetCell.row][targetCell.col] = colorId;
                    traySnapshot[trayIndex] = displacedGem;
                    steps.push({
                        sourceIndex: trayIndex,
                        targetCell,
                        colorId,
                        displacedGem
                    });
                    passMoved = true;
                });

                guard += 1;
            }

            return {
                steps,
                nextBoardState: boardSnapshot,
                nextTrayState: traySnapshot
            };
        }

        function buildMagnetMovePlan() {
            const boardSnapshot = boardState.map((row) => [...row]);
            const plannedSteps = [];
            const usedCellKeys = new Set();
            const usedColorIds = new Set();
            const usedPairKeys = new Set();

            while (plannedSteps.length < MAGNET_TARGET_PAIR_COUNT) {
                const mismatchedCells = TARGET_POSITIONS.filter((position) => {
                    if (isCleanedSocketCell(position.row, position.col)) {
                        return false;
                    }

                    const targetColor = TARGET_MAP[position.row][position.col] || 0;
                    const boardColor = boardSnapshot[position.row][position.col] || 0;
                    return Boolean(
                        targetColor &&
                        boardColor &&
                        targetColor !== boardColor &&
                        !usedCellKeys.has(toCellKey(position.row, position.col))
                    );
                });

                if (mismatchedCells.length < 2) {
                    break;
                }

                let bestSwap = null;
                let fallbackSwap = null;

                for (let leftIndex = 0; leftIndex < mismatchedCells.length - 1; leftIndex += 1) {
                    const leftCell = mismatchedCells[leftIndex];
                    const leftBoardColor = boardSnapshot[leftCell.row][leftCell.col];
                    const leftTargetColor = TARGET_MAP[leftCell.row][leftCell.col];

                    for (let rightIndex = leftIndex + 1; rightIndex < mismatchedCells.length; rightIndex += 1) {
                        const rightCell = mismatchedCells[rightIndex];
                        const rightBoardColor = boardSnapshot[rightCell.row][rightCell.col];
                        const rightTargetColor = TARGET_MAP[rightCell.row][rightCell.col];

                        if (!leftBoardColor || !rightBoardColor || leftBoardColor === rightBoardColor) {
                            continue;
                        }

                        const distance =
                            Math.abs(leftCell.row - rightCell.row) +
                            Math.abs(leftCell.col - rightCell.col);
                        const pairKey = [leftBoardColor, rightBoardColor].sort((left, right) => left - right).join(":");
                        const newColorCount =
                            Number(!usedColorIds.has(leftBoardColor)) +
                            Number(!usedColorIds.has(rightBoardColor));
                        const candidate = {
                            leftCell: {
                                row: leftCell.row,
                                col: leftCell.col,
                                currentColor: leftBoardColor,
                                targetColor: leftTargetColor
                            },
                            rightCell: {
                                row: rightCell.row,
                                col: rightCell.col,
                                currentColor: rightBoardColor,
                                targetColor: rightTargetColor
                            },
                            distance,
                            solvedCellCount: 0,
                            newColorCount,
                            introducesNewPair: !usedPairKeys.has(pairKey),
                            pairKey
                        };
                        const fallbackScore = [
                            candidate.newColorCount,
                            Number(candidate.introducesNewPair),
                            -candidate.distance,
                            -candidate.leftCell.row,
                            -candidate.leftCell.col,
                            -candidate.rightCell.row,
                            -candidate.rightCell.col
                        ];
                        let isBetterFallback = !fallbackSwap;
                        if (!isBetterFallback) {
                            for (let scoreIndex = 0; scoreIndex < fallbackScore.length; scoreIndex += 1) {
                                if (fallbackScore[scoreIndex] === fallbackSwap.score[scoreIndex]) {
                                    continue;
                                }
                                isBetterFallback = fallbackScore[scoreIndex] > fallbackSwap.score[scoreIndex];
                                break;
                            }
                        }
                        if (isBetterFallback) {
                            fallbackSwap = {
                                ...candidate,
                                score: fallbackScore
                            };
                        }

                        const solvedCellCount =
                            Number(rightBoardColor === leftTargetColor) +
                            Number(leftBoardColor === rightTargetColor);

                        if (solvedCellCount <= 0) {
                            continue;
                        }

                        candidate.solvedCellCount = solvedCellCount;
                        const bestScore = [
                            candidate.solvedCellCount,
                            candidate.newColorCount,
                            Number(candidate.introducesNewPair),
                            -candidate.distance,
                            -candidate.leftCell.row,
                            -candidate.leftCell.col,
                            -candidate.rightCell.row,
                            -candidate.rightCell.col
                        ];
                        let isBetterBest = !bestSwap;
                        if (!isBetterBest) {
                            for (let scoreIndex = 0; scoreIndex < bestScore.length; scoreIndex += 1) {
                                if (bestScore[scoreIndex] === bestSwap.score[scoreIndex]) {
                                    continue;
                                }
                                isBetterBest = bestScore[scoreIndex] > bestSwap.score[scoreIndex];
                                break;
                            }
                        }
                        if (isBetterBest) {
                            bestSwap = {
                                ...candidate,
                                score: bestScore
                            };
                        }
                    }
                }

                if (!bestSwap) {
                    bestSwap = fallbackSwap;
                }

                if (!bestSwap) {
                    break;
                }

                plannedSteps.push(bestSwap);
                usedCellKeys.add(toCellKey(bestSwap.leftCell.row, bestSwap.leftCell.col));
                usedCellKeys.add(toCellKey(bestSwap.rightCell.row, bestSwap.rightCell.col));
                usedColorIds.add(bestSwap.leftCell.currentColor);
                usedColorIds.add(bestSwap.rightCell.currentColor);
                usedPairKeys.add(bestSwap.pairKey);
                [boardSnapshot[bestSwap.leftCell.row][bestSwap.leftCell.col], boardSnapshot[bestSwap.rightCell.row][bestSwap.rightCell.col]] = [
                    boardSnapshot[bestSwap.rightCell.row][bestSwap.rightCell.col],
                    boardSnapshot[bestSwap.leftCell.row][bestSwap.leftCell.col]
                ];
            }

            return {
                steps: plannedSteps,
                nextBoardState: boardSnapshot,
                selectedColors: [],
                movedGemCount: plannedSteps.length * 2
            };
        }

        async function animateBroomMoves(steps) {
            const totalSteps = steps.length;
            const stepDelayMs = getMagicFlightDurationMs(totalSteps);
            const sessionVersion = gameSessionVersion;

            isAnimating = true;
            selected = null;

            for (let index = 0; index < steps.length; index += 1) {
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }

                const step = steps[index];

                if (step.displacedGem) {
                    swapBoardToTray(step.targetCell.row, step.targetCell.col, step.sourceIndex);
                } else {
                    moveTrayToBoard(step.sourceIndex, step.targetCell.row, step.targetCell.col, {
                        triggerSparkle: false
                    });
                }

                markCorrectPlacementSparkle(step.targetCell.row, step.targetCell.col, { triggerHaptic: true });
                render();
                void playPlaceSound();

                if (index < totalSteps - 1 || totalSteps === 1) {
                    await sleep(stepDelayMs);
                }
            }

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            isAnimating = false;
        }

        async function animateMagnetMoves(steps) {
            const totalSteps = steps.length;
            const totalGemMoves = Math.max(1, totalSteps * 2);
            const liftUpDurationMs = 140;
            const flightDurationMs = Math.max(100, Math.min(175, Math.floor(2050 / totalGemMoves)));
            const sessionVersion = gameSessionVersion;

            isAnimating = true;
            selected = null;
            const queuedFlights = [];

            steps.forEach((step) => {
                const leftRect = getBoardCellElement(step.leftCell.row, step.leftCell.col)?.getBoundingClientRect() || null;
                const rightRect = getBoardCellElement(step.rightCell.row, step.rightCell.col)?.getBoundingClientRect() || null;
                const leftGemColor = boardState[step.leftCell.row][step.leftCell.col];
                const rightGemColor = boardState[step.rightCell.row][step.rightCell.col];
                const leftLiftHeight = getSelectedGemLiftHeight(leftRect);
                const rightLiftHeight = getSelectedGemLiftHeight(rightRect);

                queuedFlights.push({
                    colorId: leftGemColor,
                    sourceRect: leftRect,
                    targetRect: rightRect,
                    targetCell: { row: step.rightCell.row, col: step.rightCell.col },
                    liftHeight: leftLiftHeight,
                    flyingGem: null
                });
                queuedFlights.push({
                    colorId: rightGemColor,
                    sourceRect: rightRect,
                    targetRect: leftRect,
                    targetCell: { row: step.leftCell.row, col: step.leftCell.col },
                    liftHeight: rightLiftHeight,
                    flyingGem: null
                });

                boardState[step.leftCell.row][step.leftCell.col] = 0;
                boardState[step.rightCell.row][step.rightCell.col] = 0;
            });

            render();

            queuedFlights.forEach((flight) => {
                flight.flyingGem = createFloatingGemElement(flight.colorId, flight.sourceRect);
            });

            await Promise.all(
                queuedFlights.map((flight) =>
                    animateFloatingGemLift(flight.flyingGem, flight.liftHeight, liftUpDurationMs)
                )
            );

            if (!isCurrentGameSession(sessionVersion)) {
                queuedFlights.forEach((flight) => removeFloatingGemElement(flight.flyingGem));
                isAnimating = false;
                return;
            }

            await sleep(48);

            for (let index = 0; index < queuedFlights.length; index += 1) {
                if (!isCurrentGameSession(sessionVersion)) {
                    queuedFlights.forEach((flight) => removeFloatingGemElement(flight.flyingGem));
                    isAnimating = false;
                    return;
                }

                const flight = queuedFlights[index];
                await animateFloatingGemToTarget(
                    flight.flyingGem,
                    flight.sourceRect,
                    flight.targetRect,
                    flight.liftHeight,
                    flightDurationMs
                );

                if (!isCurrentGameSession(sessionVersion)) {
                    queuedFlights.forEach((entry) => removeFloatingGemElement(entry.flyingGem));
                    isAnimating = false;
                    return;
                }

                boardState[flight.targetCell.row][flight.targetCell.col] = flight.colorId;
                if (isCompletedTargetCell(flight.targetCell.row, flight.targetCell.col)) {
                    markCorrectPlacementSparkle(flight.targetCell.row, flight.targetCell.col, { triggerHaptic: true });
                }
                removeFloatingGemElement(flight.flyingGem);
                render();
                void playPlaceSound();

                if (index < queuedFlights.length - 1) {
                    await sleep(Math.max(10, Math.floor(flightDurationMs * 0.1)));
                }
            }

            if (!isCurrentGameSession(sessionVersion)) {
                queuedFlights.forEach((flight) => removeFloatingGemElement(flight.flyingGem));
                isAnimating = false;
                return;
            }

            isAnimating = false;
        }

        function prioritizeBoardCells(cells, anchor) {
            return orderBoardCellsFromAnchor(cells, anchor);
        }

        function prioritizeTrayIndices(indices, anchorIndex) {
            if (anchorIndex == null) return [...indices];

            return [
                ...indices.filter((index) => index === anchorIndex),
                ...indices.filter((index) => index !== anchorIndex)
            ];
        }

        function moveBoardCluster(cells, anchor, targetRow, targetCol) {
            const translatedCells = getTranslatedCells(cells, anchor, targetRow, targetCol);
            const nextBoardState = boardState.map((row) => [...row]);
            const gems = cells.map((cell) => boardState[cell.row][cell.col]);

            cells.forEach((cell) => {
                nextBoardState[cell.row][cell.col] = 0;
            });

            translatedCells.forEach((cell, index) => {
                nextBoardState[cell.row][cell.col] = gems[index];
            });

            boardState = nextBoardState;
            translatedCells.forEach((cell) => {
                markCorrectPlacementSparkle(cell.row, cell.col, { triggerHaptic: true });
            });
        }

        async function animateBoardClusterMove(cells, anchor, targetRow, targetCol, previewSelection = null) {
            const translatedCells = getTranslatedCells(cells, anchor, targetRow, targetCol);
            const gems = cells.map((cell) => boardState[cell.row][cell.col]);
            const sessionVersion = gameSessionVersion;

            isAnimating = true;
            selected = normalizeSelection(previewSelection, true);
            cells.forEach((cell) => {
                boardState[cell.row][cell.col] = 0;
            });
            render();

            for (let index = 0; index < translatedCells.length; index += 1) {
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }

                const cell = translatedCells[index];
                boardState[cell.row][cell.col] = gems[index];
                markCorrectPlacementSparkle(cell.row, cell.col, { triggerHaptic: true });
                render();
                void playPlaceSound();
                if (index < translatedCells.length - 1) {
                    await sleep(CLUSTER_STEP_MS);
                }
            }

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            isAnimating = false;
        }

        async function animateBoardClusterToTray(cells, traySlots, previewSelection = null) {
            const sessionVersion = gameSessionVersion;
            isAnimating = true;
            selected = normalizeSelection(previewSelection, true);

            for (let index = 0; index < cells.length; index += 1) {
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }

                const cell = cells[index];
                const trayIndex = traySlots[index];
                trayState[trayIndex] = boardState[cell.row][cell.col];
                boardState[cell.row][cell.col] = 0;
                render();
                void playPlaceSound();

                if (index < cells.length - 1) {
                    await sleep(CLUSTER_STEP_MS);
                }
            }

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            isAnimating = false;
        }

        async function animateBoardClusterToBoardSlots(cells, targetCells, previewSelection = null) {
            const gems = cells.map((cell) => boardState[cell.row][cell.col]);
            const sessionVersion = gameSessionVersion;

            isAnimating = true;
            selected = normalizeSelection(previewSelection, true);
            cells.forEach((cell) => {
                boardState[cell.row][cell.col] = 0;
            });
            render();

            for (let index = 0; index < cells.length; index += 1) {
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }

                const targetCell = targetCells[index];
                boardState[targetCell.row][targetCell.col] = gems[index];
                markCorrectPlacementSparkle(targetCell.row, targetCell.col, { triggerHaptic: true });
                render();
                void playPlaceSound();

                if (index < cells.length - 1) {
                    await sleep(CLUSTER_STEP_MS);
                }
            }

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            isAnimating = false;
        }

        async function animateTrayClusterToBoardSlots(indices, targetCells, previewSelection = null) {
            const gems = indices.map((index) => trayState[index]);
            const sessionVersion = gameSessionVersion;

            isAnimating = true;
            selected = normalizeSelection(previewSelection, true);

            for (let index = 0; index < indices.length; index += 1) {
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }

                const sourceIndex = indices[index];
                const targetCell = targetCells[index];
                trayState[sourceIndex] = 0;
                boardState[targetCell.row][targetCell.col] = gems[index];
                markCorrectPlacementSparkle(targetCell.row, targetCell.col, { triggerHaptic: true });
                render();
                void playPlaceSound();

                if (index < indices.length - 1) {
                    await sleep(CLUSTER_STEP_MS);
                }
            }

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            isAnimating = false;
        }

        async function animateTrayClusterMove(indices, targetIndices, previewSelection = null) {
            const gems = indices.map((index) => trayState[index]);
            const sessionVersion = gameSessionVersion;

            isAnimating = true;
            selected = normalizeSelection(previewSelection, true);
            indices.forEach((index) => {
                trayState[index] = 0;
            });
            render();

            for (let index = 0; index < targetIndices.length; index += 1) {
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }

                trayState[targetIndices[index]] = gems[index];
                render();
                void playPlaceSound();

                if (index < targetIndices.length - 1) {
                    await sleep(CLUSTER_STEP_MS);
                }
            }

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            isAnimating = false;
        }

        function countCorrectCells() {
            let count = 0;
            for (let row = 0; row < ROWS; row += 1) {
                for (let col = 0; col < COLS; col += 1) {
                    if (isCompletedTargetCell(row, col)) {
                        count += 1;
                    }
                }
            }
            return count;
        }

        function countCorrectCellsInBoard(boardSnapshot) {
            let count = 0;
            for (let row = 0; row < ROWS; row += 1) {
                for (let col = 0; col < COLS; col += 1) {
                    if (isCompletedTargetCellInBoard(boardSnapshot, row, col)) {
                        count += 1;
                    }
                }
            }
            return count;
        }

        function countCompletedColors() {
            return completedColorIds.size;
        }

        function shouldRenderGemLayer() {
            return !areGemsHiddenByCheat;
        }

        function toggleGemVisibilityCheat() {
            areGemsHiddenByCheat = !areGemsHiddenByCheat;
            scheduleRender();
        }

        function checkSolved() {
            solved = countCorrectCells() === TOTAL_TARGET_CELLS;
            if (solved) {
                selected = null;
            }
            return solved;
        }

        function usesFlatBoardRender() {
            return false;
        }

        function createGem(colorId, sparkleElapsedMs = null, options = {}) {
            const { flat = false } = options;
            const gem = document.createElement("span");
            gem.className = "gem";
            if (sparkleElapsedMs != null) {
                gem.classList.add("sparkle");
                gem.style.setProperty("--sparkle-elapsed", `${Math.max(0, Math.min(MATCH_SPARKLE_MS, sparkleElapsedMs))}ms`);
            }
            gem.style.setProperty("--gem-main", COLOR_PALETTE[colorId].color);
            gem.style.setProperty("--gem-light", shadeColor(COLOR_PALETTE[colorId].color, 34));
            gem.style.setProperty("--gem-deep", shadeColor(COLOR_PALETTE[colorId].color, -24));
            gem.style.setProperty("--gem-shadow", shadeColor(COLOR_PALETTE[colorId].color, -48));
            if (flat) {
                gem.classList.add("flat-gem");
                gem.style.setProperty("--flat-gem-color", COLOR_PALETTE[colorId].color);
            } else {
                const gemImage = document.createElement("img");
                gemImage.className = "gem-image";
                gemImage.src = getTintedJewelSrc(colorId);
                gemImage.alt = "";
                gemImage.draggable = false;
                gem.appendChild(gemImage);
            }
            gem.setAttribute("aria-hidden", "true");
            return gem;
        }

        function createSparkleBurst(colorId, sparkleElapsedMs) {
            const burst = document.createElement("span");
            burst.className = "sparkle-burst";
            burst.style.setProperty("--sparkle-elapsed", `${Math.max(0, Math.min(MATCH_SPARKLE_MS, sparkleElapsedMs))}ms`);

            DIAMOND_PARTICLE_PRESETS.forEach((preset) => {
                const particle = document.createElement("span");
                particle.className = "sparkle-particle";
                particle.style.setProperty("--particle-dx", `${preset.dx}px`);
                particle.style.setProperty("--particle-dy", `${preset.dy}px`);
                particle.style.setProperty("--particle-size", `${preset.size}%`);
                particle.style.setProperty("--particle-rotation", `${preset.rotation}deg`);
                particle.style.setProperty("--particle-delay", `${preset.delay}ms`);
                particle.style.setProperty("--particle-tint", shadeColor(COLOR_PALETTE[colorId].color, 34));
                burst.appendChild(particle);
            });

            burst.setAttribute("aria-hidden", "true");
            return burst;
        }

        function bindTapActivation(element, handler) {
            if (!element) {
                return;
            }

            element.addEventListener(
                "touchend",
                (event) => {
                    if (event.touches?.length || (event.changedTouches && event.changedTouches.length !== 1)) {
                        return;
                    }

                    if (Date.now() < boardInteraction.suppressClickUntil) {
                        return;
                    }

                    if (event.cancelable) {
                        event.preventDefault();
                    }
                    lastTouchActivationAt = Date.now();
                    boardInteraction.suppressClickUntil = lastTouchActivationAt + TOUCH_TAP_GUARD_MS;
                    handler();
                },
                { passive: false }
            );

            element.addEventListener("click", (event) => {
                const now = Date.now();
                if (
                    now < boardInteraction.suppressClickUntil ||
                    now - lastTouchActivationAt < TOUCH_TAP_GUARD_MS
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                handler();
            });
        }

        function bindActionButtonPressState(button) {
            if (!button) {
                return;
            }

            const activatePressed = (event) => {
                if (event?.pointerType === "mouse" && event.button !== 0) {
                    return;
                }

                button.classList.add("is-pressed");
                triggerButtonPressSound();
            };
            const deactivatePressed = () => {
                button.classList.remove("is-pressed");
            };

            button.addEventListener("pointerdown", activatePressed);
            button.addEventListener("pointerup", deactivatePressed);
            button.addEventListener("pointerleave", deactivatePressed);
            button.addEventListener("pointercancel", deactivatePressed);
            button.addEventListener("blur", deactivatePressed);
            button.addEventListener("keyup", deactivatePressed);
        }

        function bindDirectPointerActivation(element, handler) {
            if (!element) {
                return;
            }

            let activePointerId = null;
            let shouldActivate = false;
            let lastDirectActivationAt = 0;

            const activate = (event = null) => {
                const now = Date.now();
                if (now - lastDirectActivationAt < TOUCH_TAP_GUARD_MS) {
                    if (event) {
                        event.preventDefault?.();
                        event.stopPropagation?.();
                    }
                    return false;
                }

                lastDirectActivationAt = now;
                if (event) {
                    event.preventDefault?.();
                    event.stopPropagation?.();
                }
                handler();
                return true;
            };

            element.addEventListener("pointerdown", (event) => {
                if (event.pointerType === "mouse" && event.button !== 0) {
                    return;
                }

                activePointerId = event.pointerId;
                shouldActivate = true;
            });

            element.addEventListener("pointerleave", (event) => {
                if (event.pointerId === activePointerId) {
                    shouldActivate = false;
                }
            });

            element.addEventListener("pointercancel", (event) => {
                if (event.pointerId === activePointerId) {
                    shouldActivate = false;
                    activePointerId = null;
                }
            });

            element.addEventListener("pointerup", (event) => {
                if (event.pointerType === "mouse" && event.button !== 0) {
                    return;
                }

                const isSamePointer = activePointerId == null || event.pointerId === activePointerId;
                const targetInsideButton = element.contains(event.target);
                activePointerId = null;

                if (!isSamePointer || !shouldActivate || !targetInsideButton) {
                    shouldActivate = false;
                    return;
                }

                shouldActivate = false;
                activate(event);
            });

            element.addEventListener(
                "touchend",
                (event) => {
                    if (event.touches?.length || (event.changedTouches && event.changedTouches.length !== 1)) {
                        return;
                    }

                    activePointerId = null;
                    shouldActivate = false;
                    activate(event);
                },
                { passive: false }
            );

            element.addEventListener("click", (event) => {
                if (Date.now() < boardInteraction.suppressClickUntil) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                activate(event);
            });
        }

        function initializeBottomActionButtons() {
            bottomActionButtonElements.forEach((button) => {
                bindActionButtonPressState(button);
            });

            bindDirectPointerActivation(bottomActionButton1Element, () => {
                void useMagicAction();
            });

            bindDirectPointerActivation(bottomActionButton2Element, () => {
                void useCleanAction();
            });

            bindDirectPointerActivation(bottomActionButton3Element, () => {
                void useSpecialAction();
            });

            bindDirectPointerActivation(bottomActionButton3TreasureElement, () => {
                void useSpecialAction();
            });

            bindDirectPointerActivation(bottomActionButton4Element, () => {
                void showSettingScene();
            });
        }

        function renderBoard() {
            const now = performance.now();
            cleanupExpiredSparkles(now);
            const shouldRenderGems = shouldRenderGemLayer();
            const useFlatGems = false;
            const magicTargeting = isMagicTargetingMode();
            const totalCellCount = ROWS * COLS;
            const selectedBoardCellKeys = selected?.source === "board"
                ? new Set(selected.cells.map((cell) => toCellKey(cell.row, cell.col)))
                : null;

            if (boardElement.childElementCount !== totalCellCount) {
                const fragment = document.createDocumentFragment();

                for (let row = 0; row < ROWS; row += 1) {
                    for (let col = 0; col < COLS; col += 1) {
                        const button = document.createElement("button");
                        button.type = "button";
                        button.className = "cell";

                        button.addEventListener("pointerdown", (event) => {
                            if (!isMagicTargetingMode() || button.disabled) {
                                return;
                            }

                            if (event.pointerType === "mouse" && event.button !== 0) {
                                return;
                            }

                            event.preventDefault();
                            beginMagicDrag(
                                Number(button.dataset.row),
                                Number(button.dataset.col),
                                event.pointerId
                            );
                        });

                        button.addEventListener("mouseenter", () => {
                            if (!isMagicTargetingMode() || boardInteraction.isMagicDragging || button.disabled) {
                                return;
                            }

                            previewMagicBounds(
                                Number(button.dataset.row),
                                Number(button.dataset.col)
                            );
                        });

                        bindTapActivation(button, () => {
                            if (button.disabled || isMagicTargetingMode()) {
                                return;
                            }

                            void handleBoardClick(
                                Number(button.dataset.row),
                                Number(button.dataset.col)
                            );
                        });

                        fragment.appendChild(button);
                    }
                }

                boardElement.replaceChildren(fragment);
            }

            for (let row = 0; row < ROWS; row += 1) {
                for (let col = 0; col < COLS; col += 1) {
                    const target = TARGET_MAP[row]?.[col] || 0;
                    const gem = boardState[row]?.[col] || 0;
                    const targetColor = target ? COLOR_PALETTE[target].color : "";
                    const gemColor = gem ? COLOR_PALETTE[gem].color : "";
                    const button = boardElement.children[(row * COLS) + col];
                    const cleaned = isCleanedSocketCell(row, col);
                    const isCorrectGem = target && (
                        cleaned ||
                        (gem !== 0 && gem === target)
                    );
                    const sparkleElapsedMs = isCorrectGem ? getCellSparkleElapsed(row, col, now) : null;
                    const shouldSparkle = sparkleElapsedMs != null;
                    const isSelectedCell = Boolean(selectedBoardCellKeys?.has(toCellKey(row, col)));
                    const renderKey = `${target}|${targetColor}|${gem}|${gemColor}|${cleaned ? 1 : 0}|${isCorrectGem ? 1 : 0}|${shouldSparkle ? 1 : 0}|${isSelectedCell ? 1 : 0}|${shouldRenderGems ? 1 : 0}|${magicTargeting ? 1 : 0}`;

                    if (button.dataset.renderKey === renderKey) {
                        continue;
                    }

                    button.className = "cell";
                    button.dataset.row = String(row);
                    button.dataset.col = String(col);
                    button.dataset.renderKey = renderKey;
                    button.disabled = false;
                    button.replaceChildren();
                    button.style.background = "";
                    button.style.removeProperty("--tile-base");
                    button.style.removeProperty("--tile-dark");
                    button.style.removeProperty("--tile-shadow");
                    button.style.removeProperty("--tile-light");
                    button.style.removeProperty("--tile-outline");
                    button.style.removeProperty("--socket-ghost-opacity");
                    button.style.removeProperty("--socket-ghost-filter");

                    if (!target) {
                        button.classList.add("void");
                        button.disabled = true;
                        button.setAttribute("aria-label", `${row + 1}행 ${col + 1}열 빈 영역`);
                        continue;
                    }

                    const targetRgb = hexToRgb(targetColor);
                    const targetBrightness = ((targetRgb.r * 299) + (targetRgb.g * 587) + (targetRgb.b * 114)) / 1000;
                    const isLowContrastTarget = targetBrightness >= 246;
                    button.classList.add("board-cell");
                    button.style.background = targetColor;
                    button.style.setProperty("--tile-base", targetColor);
                    button.style.setProperty("--tile-dark", shadeColor(targetColor, -18));
                    button.style.setProperty("--tile-shadow", shadeColor(targetColor, -34));
                    button.style.setProperty("--tile-light", shadeColor(targetColor, 12));
                    if (isLowContrastTarget) {
                        button.classList.add("low-contrast-target");
                        button.style.setProperty("--tile-outline", "rgba(176, 151, 114, 0.46)");
                        button.style.setProperty("--socket-ghost-opacity", "0.72");
                        button.style.setProperty("--socket-ghost-filter", "brightness(0.96) saturate(1.08) contrast(1.08)");
                    }
                    button.setAttribute("aria-label", `${row + 1}행 ${col + 1}열 ${COLOR_PALETTE[target].name} 자리`);

                    if (gem === 0 && !cleaned) button.classList.add("empty-target");
                    const sparkleColorId = gem || target;
                    if (isCorrectGem) {
                        button.classList.add("correct", "locked");
                        button.disabled = !magicTargeting;
                    }
                    if (shouldSparkle) button.classList.add("sparkle");
                    if (isSelectedCell) button.classList.add("selected");
                    if (shouldRenderGems && shouldSparkle) button.appendChild(createSparkleBurst(sparkleColorId, sparkleElapsedMs));
                    if (shouldRenderGems && gem) button.appendChild(createGem(gem, sparkleElapsedMs, { flat: useFlatGems }));
                }
            }
        }

        function renderTrayRange(container, startIndex, endIndex, labelPrefix, openedPocketIndices, nextOpenIndex, selectedTrayIndices) {
            const shouldRenderGems = shouldRenderGemLayer();
            const useFlatGems = false;
            const slotCount = endIndex - startIndex;

            if (container.childElementCount !== slotCount) {
                const fragment = document.createDocumentFragment();

                for (let index = startIndex; index < endIndex; index += 1) {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "cell tray-slot";
                    button.dataset.index = String(index);
                    bindTapActivation(button, () => {
                        if (button.disabled) {
                            return;
                        }

                        void handleTrayClick(Number(button.dataset.index));
                    });
                    fragment.appendChild(button);
                }

                container.replaceChildren(fragment);
            }

            for (let index = startIndex; index < endIndex; index += 1) {
                const gem = trayState[index];
                const gemColor = gem ? COLOR_PALETTE[gem].color : "";
                const isOpenedPocket = isPocketOpened(index, openedPocketIndices);
                const isNextOpenPocket = index === nextOpenIndex && nextOpenIndex < POCKET_SIZE;
                const button = container.children[index - startIndex];
                const isSelectedSlot = Boolean(selectedTrayIndices?.has(index));
                const renderKey = `${gem}|${gemColor}|${isOpenedPocket ? 1 : 0}|${isNextOpenPocket ? 1 : 0}|${isSelectedSlot ? 1 : 0}|${shouldRenderGems ? 1 : 0}`;

                if (button.dataset.renderKey === renderKey) {
                    continue;
                }

                button.className = "cell tray-slot";
                button.dataset.index = String(index);
                button.dataset.renderKey = renderKey;
                button.disabled = false;
                button.replaceChildren();
                button.setAttribute("aria-label", `${labelPrefix} 포켓 ${index - startIndex + 1}`);

                if (isNextOpenPocket) {
                    button.classList.add("next-open-slot");
                    button.disabled = true;
                    button.setAttribute("aria-label", `${labelPrefix} 포켓 ${index - startIndex + 1} 다음 등록 예정`);
                } else if (!isOpenedPocket) {
                    button.classList.add("hidden-slot");
                    button.disabled = true;
                    button.setAttribute("aria-label", `${labelPrefix} 포켓 ${index - startIndex + 1} 잠김`);
                } else if (!gem) {
                    button.classList.add("empty-target");
                }
                if (isSelectedSlot) button.classList.add("selected");
                if (shouldRenderGems && gem) button.appendChild(createGem(gem, null, { flat: useFlatGems }));
            }
        }

        function renderTrays() {
            const completedColorCount = completedColorIds.size;
            const openedPocketIndices = getOpenedPocketIndexSet(completedColorCount);
            const nextOpenIndex = getOpenedPocketCount(completedColorCount);
            const selectedTrayIndices = selected?.source === "tray"
                ? new Set(selected.indices || [])
                : null;

            renderTrayRange(topTrayElement, 0, TOP_POCKET_COUNT, "Pocket 1", openedPocketIndices, nextOpenIndex, selectedTrayIndices);
            renderTrayRange(bottomTrayElement, TOP_POCKET_COUNT, POCKET_SIZE, "Pocket 2", openedPocketIndices, nextOpenIndex, selectedTrayIndices);
        }

        function getBoardInteractionMetrics() {
            if (!boardWrapElement || !boardPanzoomElement) {
                return {
                    wrapWidth: 0,
                    wrapHeight: 0,
                    stageWidth: 0,
                    stageHeight: 0,
                    contentWidth: 0,
                    contentHeight: 0
                };
            }

            return {
                wrapWidth: boardWrapElement.clientWidth,
                wrapHeight: boardWrapElement.clientHeight,
                stageWidth: boardStageElement?.clientWidth || boardWrapElement.clientWidth,
                stageHeight: boardStageElement?.clientHeight || boardWrapElement.clientHeight,
                contentWidth: boardPanzoomElement.offsetWidth,
                contentHeight: boardPanzoomElement.offsetHeight
            };
        }

        function clampBoardPan(scale = boardInteraction.scale, panX = boardInteraction.panX, panY = boardInteraction.panY) {
            const metrics = getBoardInteractionMetrics();
            const scaledContentWidth = metrics.contentWidth * scale;
            const scaledContentHeight = metrics.contentHeight * scale;
            let maxPanX = Math.max(0, Math.abs(scaledContentWidth - metrics.wrapWidth) / 2);
            let maxPanY = Math.max(0, Math.abs(scaledContentHeight - metrics.wrapHeight) / 2);
            const naturalMaxPanY = maxPanY;

            if (scale <= boardInteraction.minScale + 0.001) {
                const isCompactBoardLayout = boardInteraction.minScale < 1;
                maxPanX = Math.max(maxPanX, (metrics.stageWidth + scaledContentWidth) / 2);
                maxPanY = Math.max(
                    maxPanY,
                    isCompactBoardLayout
                        ? metrics.stageHeight * BOARD_COMPACT_MIN_SCALE_VERTICAL_PAN_MULTIPLIER
                        : (metrics.stageHeight + scaledContentHeight) / 2
                );
            } else if (boardInteraction.minScale < 1 && scale <= BOARD_COMPACT_LOW_ZOOM_PAN_MAX_SCALE) {
                maxPanY = Math.max(maxPanY, (metrics.stageHeight + scaledContentHeight) / 2);
            } else if (boardInteraction.minScale < 1 && scale <= BOARD_COMPACT_LOW_ZOOM_PAN_SOFT_MAX_SCALE) {
                const expandedMaxPanY = (metrics.stageHeight + scaledContentHeight) / 2;
                const blendProgress =
                    (scale - BOARD_COMPACT_LOW_ZOOM_PAN_MAX_SCALE) /
                    (BOARD_COMPACT_LOW_ZOOM_PAN_SOFT_MAX_SCALE - BOARD_COMPACT_LOW_ZOOM_PAN_MAX_SCALE);
                const blendedMaxPanY =
                    expandedMaxPanY + (naturalMaxPanY - expandedMaxPanY) * Math.max(0, Math.min(1, blendProgress));
                maxPanY = Math.max(maxPanY, blendedMaxPanY);
            }

            return {
                x: Math.min(maxPanX, Math.max(-maxPanX, panX)),
                y: Math.min(maxPanY, Math.max(-maxPanY, panY))
            };
        }

        function applyBoardTransform() {
            if (!boardPanzoomElement) return;

            if (boardInteraction.scale <= boardInteraction.minScale + 0.001) {
                boardInteraction.scale = boardInteraction.minScale;
            }

            const clampedPan = clampBoardPan();
            boardInteraction.panX = clampedPan.x;
            boardInteraction.panY = clampedPan.y;

            boardPanzoomElement.style.transform = `translate(${boardInteraction.panX}px, ${boardInteraction.panY}px) scale(${boardInteraction.scale})`;
            if (!isTutorialGestureGuideActive()) {
                scheduleTutorialOverlayRender();
            }
        }

        function setBoardScale(nextScale, options = {}) {
            const { anchorClientX = null, anchorClientY = null } = options;
            const previousScale = boardInteraction.scale || 1;
            const clampedScale = Math.min(boardInteraction.maxScale, Math.max(boardInteraction.minScale, nextScale));

            if (
                anchorClientX != null &&
                anchorClientY != null &&
                boardWrapElement &&
                Math.abs(clampedScale - previousScale) > 0.0001
            ) {
                const wrapRect = boardWrapElement.getBoundingClientRect();
                const anchorX = anchorClientX - wrapRect.left - wrapRect.width / 2;
                const anchorY = anchorClientY - wrapRect.top - wrapRect.height / 2;
                const scaleRatio = clampedScale / previousScale;

                boardInteraction.panX = anchorX - (anchorX - boardInteraction.panX) * scaleRatio;
                boardInteraction.panY = anchorY - (anchorY - boardInteraction.panY) * scaleRatio;
            }

            boardInteraction.scale = clampedScale;
            applyBoardTransform();
            advanceTutorialGestureGuideScale(previousScale, boardInteraction.scale);
        }

        function zoomBoardByDelta(delta, zoomIntensity = 0.0018, options = {}) {
            const scaleFactor = Math.exp(-delta * zoomIntensity);
            setBoardScale(boardInteraction.scale * scaleFactor, options);
        }

        function resetBoardTransform() {
            boardInteraction.scale = 1;
            boardInteraction.panX = 0;
            boardInteraction.panY = isTutorialMap() ? TUTORIAL_BOARD_INITIAL_OFFSET_Y : 0;
            applyBoardTransform();
        }

        function getTouchDistance(firstTouch, secondTouch) {
            return Math.hypot(secondTouch.clientX - firstTouch.clientX, secondTouch.clientY - firstTouch.clientY);
        }

        function storeBoardTouches(touchList) {
            const activeTouchIds = new Set(Array.from(touchList, (touch) => touch.identifier));
            boardInteraction.touches.forEach((_, touchId) => {
                if (!activeTouchIds.has(touchId)) {
                    boardInteraction.touches.delete(touchId);
                }
            });
            Array.from(touchList).forEach((touch) => {
                boardInteraction.touches.set(touch.identifier, {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            });
        }

        function initializeBoardGestureState() {
            const activeTouches = [...boardInteraction.touches.values()];

            if (activeTouches.length >= 2) {
                boardInteraction.isTouchPanning = false;
                boardInteraction.pinchStartDistance = getTouchDistance(activeTouches[0], activeTouches[1]);
                boardInteraction.pinchStartScale = boardInteraction.scale;
                boardInteraction.basePanX = boardInteraction.panX;
                boardInteraction.basePanY = boardInteraction.panY;
                return;
            }

            if (activeTouches.length === 1) {
                boardInteraction.isTouchPanning = false;
                boardInteraction.panStartX = activeTouches[0].clientX;
                boardInteraction.panStartY = activeTouches[0].clientY;
                boardInteraction.basePanX = boardInteraction.panX;
                boardInteraction.basePanY = boardInteraction.panY;
            }
        }

        function initializeBoardGestures() {
            if (!boardWrapElement || !boardPanzoomElement) return;

            const preventBrowserGestureZoom = (event) => {
                event.preventDefault();
            };
            const DOUBLE_TAP_MS = 280;
            const DOUBLE_TAP_DISTANCE = 26;
            const preventBoardPageZoom = (event) => {
                if (!boardWrapElement.contains(event.target)) return;
                event.preventDefault();
            };

            boardWrapElement.addEventListener(
                "click",
                (event) => {
                    if (Date.now() < boardInteraction.suppressClickUntil) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                },
                true
            );

            document.addEventListener("gesturestart", preventBoardPageZoom, { passive: false, capture: true });
            document.addEventListener("gesturechange", preventBoardPageZoom, { passive: false, capture: true });
            document.addEventListener("gestureend", preventBoardPageZoom, { passive: false, capture: true });
            document.addEventListener(
                "wheel",
                (event) => {
                    if (!boardWrapElement.contains(event.target)) return;

                    event.preventDefault();
                    zoomBoardByDelta(event.deltaY, 0.0018, {
                        anchorClientX: event.clientX,
                        anchorClientY: event.clientY
                    });
                    boardInteraction.suppressClickUntil = Date.now() + 240;
                },
                { passive: false, capture: true }
            );

            document.addEventListener(
                "touchmove",
                (event) => {
                    if (pixelAdminElement?.contains(event.target)) {
                        return;
                    }

                    if (event.cancelable) {
                        event.preventDefault();
                    }
                },
                { passive: false, capture: true }
            );

            boardWrapElement.addEventListener("gesturestart", preventBrowserGestureZoom, { passive: false });
            boardWrapElement.addEventListener("gesturechange", preventBrowserGestureZoom, { passive: false });
            boardWrapElement.addEventListener("gestureend", preventBrowserGestureZoom, { passive: false });
            boardWrapElement.addEventListener(
                "wheel",
                (event) => {
                    event.preventDefault();
                    zoomBoardByDelta(event.deltaY, 0.0018, {
                        anchorClientX: event.clientX,
                        anchorClientY: event.clientY
                    });
                    boardInteraction.suppressClickUntil = Date.now() + 240;
                },
                { passive: false }
            );

            boardWrapElement.addEventListener("pointerdown", (event) => {
                queueAudioContextWarmup();
                if (isMagicTargetingMode()) {
                    return;
                }

                if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;

                boardInteraction.pointerId = event.pointerId;
                boardInteraction.isPointerDragging = true;
                boardInteraction.isPointerPanActive = false;
                boardInteraction.panStartX = event.clientX;
                boardInteraction.panStartY = event.clientY;
                boardInteraction.basePanX = boardInteraction.panX;
                boardInteraction.basePanY = boardInteraction.panY;
            });

            boardWrapElement.addEventListener("pointermove", (event) => {
                if (!boardInteraction.isPointerDragging || event.pointerId !== boardInteraction.pointerId) return;

                const deltaX = event.clientX - boardInteraction.panStartX;
                const deltaY = event.clientY - boardInteraction.panStartY;
                if (
                    !boardInteraction.isPointerPanActive &&
                    Math.hypot(deltaX, deltaY) < BOARD_PAN_DRAG_THRESHOLD_PX
                ) {
                    return;
                }

                if (!boardInteraction.isPointerPanActive) {
                    boardInteraction.isPointerPanActive = true;
                    boardWrapElement.setPointerCapture(event.pointerId);
                }

                boardInteraction.panX = boardInteraction.basePanX + deltaX;
                boardInteraction.panY = boardInteraction.basePanY + deltaY;
                applyBoardTransform();
                advanceTutorialGestureGuidePan();
                boardInteraction.suppressClickUntil = Date.now() + 240;
                event.preventDefault();
            });

            const stopPointerDrag = (event) => {
                if (event.pointerId != null && event.pointerId !== boardInteraction.pointerId) return;
                if (event.pointerId != null && boardWrapElement.hasPointerCapture?.(event.pointerId)) {
                    boardWrapElement.releasePointerCapture(event.pointerId);
                }
                boardInteraction.pointerId = null;
                boardInteraction.isPointerDragging = false;
                boardInteraction.isPointerPanActive = false;
            };

            boardWrapElement.addEventListener("pointerup", stopPointerDrag);
            boardWrapElement.addEventListener("pointercancel", stopPointerDrag);
            boardWrapElement.addEventListener("pointerleave", stopPointerDrag);

            window.addEventListener("pointermove", (event) => {
                if (
                    !boardInteraction.isMagicDragging ||
                    (boardInteraction.magicPointerId != null && event.pointerId !== boardInteraction.magicPointerId)
                ) {
                    return;
                }

                if (updateMagicDragFromPoint(event.clientX, event.clientY) && event.cancelable) {
                    event.preventDefault();
                }
            }, { passive: false });

            window.addEventListener("pointerup", (event) => {
                if (
                    !boardInteraction.isMagicDragging ||
                    (boardInteraction.magicPointerId != null && event.pointerId !== boardInteraction.magicPointerId)
                ) {
                    return;
                }

                if (event.cancelable) {
                    event.preventDefault();
                }
                finishMagicDrag(event.pointerId);
            }, { passive: false });

            window.addEventListener("pointercancel", (event) => {
                if (
                    !boardInteraction.isMagicDragging ||
                    (boardInteraction.magicPointerId != null && event.pointerId !== boardInteraction.magicPointerId)
                ) {
                    return;
                }

                finishMagicDrag(event.pointerId, { cancel: true });
            });

            boardWrapElement.addEventListener(
                "touchstart",
                (event) => {
                    queueAudioContextWarmup();
                    if (isMagicTargetingMode()) {
                        if (event.cancelable) {
                            event.preventDefault();
                        }
                        return;
                    }

                    if (event.touches.length === 1) {
                        const touch = event.touches[0];
                        const now = Date.now();
                        const tapDistance = Math.hypot(
                            touch.clientX - boardInteraction.lastTapX,
                            touch.clientY - boardInteraction.lastTapY
                        );

                        if (now - boardInteraction.lastTapAt <= DOUBLE_TAP_MS && tapDistance <= DOUBLE_TAP_DISTANCE) {
                            resetBoardTransform();
                            boardInteraction.lastTapAt = 0;
                            boardInteraction.suppressClickUntil = now + 300;
                            event.preventDefault();
                            return;
                        }

                        boardInteraction.lastTapAt = now;
                        boardInteraction.lastTapX = touch.clientX;
                        boardInteraction.lastTapY = touch.clientY;
                    } else {
                        boardInteraction.lastTapAt = 0;
                    }

                    storeBoardTouches(event.touches);
                    boardInteraction.isTouchGestureActive = true;
                    initializeBoardGestureState();

                    if (
                        boardInteraction.touches.size >= 2 ||
                        boardInteraction.scale > boardInteraction.minScale + 0.001
                    ) {
                        event.preventDefault();
                    }
                },
                { passive: false }
            );

            const handleBoardTouchMove = (event) => {
                if (!boardInteraction.isTouchGestureActive || boardInteraction.touches.size === 0) {
                    return;
                }

                if (isMagicTargetingMode()) {
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                    return;
                }

                storeBoardTouches(event.touches);
                const activeTouches = [...boardInteraction.touches.values()];

                if (activeTouches.length >= 2) {
                    const nextDistance = getTouchDistance(activeTouches[0], activeTouches[1]);
                    if (boardInteraction.pinchStartDistance > 0) {
                        const midpointX = (activeTouches[0].clientX + activeTouches[1].clientX) / 2;
                        const midpointY = (activeTouches[0].clientY + activeTouches[1].clientY) / 2;
                        setBoardScale(
                            boardInteraction.pinchStartScale * (nextDistance / boardInteraction.pinchStartDistance),
                            {
                                anchorClientX: midpointX,
                                anchorClientY: midpointY
                            }
                        );
                    }
                    boardInteraction.suppressClickUntil = Date.now() + 240;
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                    return;
                }

                if (
                    activeTouches.length === 1 &&
                    (
                        boardInteraction.isTouchPanning ||
                        Math.hypot(
                            activeTouches[0].clientX - boardInteraction.panStartX,
                            activeTouches[0].clientY - boardInteraction.panStartY
                        ) >= BOARD_PAN_DRAG_THRESHOLD_PX
                    )
                ) {
                    const activeTouch = activeTouches[0];
                    boardInteraction.isTouchPanning = true;
                    boardInteraction.panX = boardInteraction.basePanX + (activeTouch.clientX - boardInteraction.panStartX);
                    boardInteraction.panY = boardInteraction.basePanY + (activeTouch.clientY - boardInteraction.panStartY);
                    applyBoardTransform();
                    advanceTutorialGestureGuidePan();
                    boardInteraction.suppressClickUntil = Date.now() + 240;
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                }
            };

            window.addEventListener(
                "touchmove",
                handleBoardTouchMove,
                { passive: false }
            );

            const clearEndedTouches = (touchList) => {
                Array.from(touchList).forEach((touch) => {
                    boardInteraction.touches.delete(touch.identifier);
                });
                if (boardInteraction.touches.size === 0) {
                    boardInteraction.isTouchGestureActive = false;
                    boardInteraction.isTouchPanning = false;
                    boardInteraction.pinchStartDistance = 0;
                }
                initializeBoardGestureState();
                applyBoardTransform();
            };

            const handleBoardTouchEnd = (event) => {
                if (!boardInteraction.isTouchGestureActive && boardInteraction.touches.size === 0) {
                    return;
                }

                if (isMagicTargetingMode()) {
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                    return;
                }
                clearEndedTouches(event.changedTouches);
            };

            window.addEventListener("touchend", handleBoardTouchEnd, { passive: false });
            window.addEventListener("touchcancel", handleBoardTouchEnd, { passive: false });
        }

        function updateResponsiveLayout() {
            const root = document.documentElement;
            const { width: viewportWidth, height: viewportHeight } = getViewportMetrics();
            const aspectWidth = activeSceneViewportWidth;
            const aspectHeight = activeSceneViewportHeight;
            const maxShellWidth = activeSceneViewportWidth;
            const compactLayout = viewportWidth <= 540;
            const layoutKey = `${viewportWidth}x${viewportHeight}|${aspectWidth}x${aspectHeight}|${compactLayout ? 1 : 0}`;
            let appShellWidth;
            let appShellHeight;

            if (layoutKey === lastResponsiveLayoutKey) {
                return;
            }

            lastResponsiveLayoutKey = layoutKey;
            const rootStyles = getComputedStyle(root);

            if (compactLayout) {
                appShellWidth = viewportWidth;
                appShellHeight = viewportHeight;
            } else {
                const maxWidthFromHeight = Math.floor((viewportHeight * aspectWidth) / aspectHeight);
                appShellWidth = Math.min(viewportWidth, maxShellWidth, maxWidthFromHeight);
                appShellHeight = Math.floor((appShellWidth * aspectHeight) / aspectWidth);

                if (appShellHeight > viewportHeight) {
                    appShellHeight = viewportHeight;
                    appShellWidth = Math.floor((appShellHeight * aspectWidth) / aspectHeight);
                }
            }

            const viewportGap = parseFloat(rootStyles.getPropertyValue("--viewport-gap")) || 12;
            const trayGap = parseFloat(rootStyles.getPropertyValue("--tray-gap")) || 6;
            const pocketBottomOffset = parseFloat(rootStyles.getPropertyValue("--pocket-bottom-offset")) || 12;
            const adBannerHeight = parseFloat(rootStyles.getPropertyValue("--ad-banner-height")) || 50;
            const adBannerGap = parseFloat(rootStyles.getPropertyValue("--ad-banner-gap")) || 10;
            const actionBarGap = parseFloat(rootStyles.getPropertyValue("--action-bar-gap")) || 12;
            const actionButtonSize = parseFloat(rootStyles.getPropertyValue("--action-button-size")) || 56;
            const actionButtonGap = parseFloat(rootStyles.getPropertyValue("--action-button-gap")) || 16;
            const trayColumns = TOP_POCKET_COUNT;
            const totalTrayRows = TRAY_ROW_COUNT;
            const actionColumns = 4;
            const actionRows = Math.ceil(4 / actionColumns);
            const pocketHorizontalPadding = compactLayout ? 28 : 36;
            const availablePocketWidth = Math.max(180, appShellWidth - viewportGap * 2);
            const nextTrayCellSize = Math.max(
                compactLayout ? 22 : 18,
                Math.floor(
                    Math.min(
                        DEFAULT_TRAY_CELL_SIZE,
                        (availablePocketWidth - pocketHorizontalPadding - trayGap * (trayColumns - 1)) /
                            trayColumns
                    )
                )
            );
            const pocketContentHeight =
                totalTrayRows * nextTrayCellSize +
                Math.max(0, totalTrayRows - TRAY_ROW_COUNT) * trayGap +
                10;
            const pocketDockHeight = pocketContentHeight + 34;
            const nextActionBarHeight =
                actionRows * actionButtonSize +
                Math.max(0, actionRows - 1) * actionButtonGap;
            const fallbackReservedHeight = Math.ceil(
                pocketBottomOffset +
                adBannerHeight +
                adBannerGap +
                nextActionBarHeight +
                actionBarGap +
                pocketDockHeight +
                16
            );
            const sceneLayoutMetrics = colorJewelSceneContract
                ? getColorJewelSceneLayoutMetrics({
                    contract: colorJewelSceneContract,
                    mountWidth: appShellWidth,
                    mountHeight: appShellHeight,
                    compactLayout
                })
                : null;
            const pocketReservedHeight = sceneLayoutMetrics?.reservedHeight || fallbackReservedHeight;
            const availableBoardHeight = Math.max(120, appShellHeight - viewportGap * 2 - pocketReservedHeight);
            const availableBoardWidth = Math.max(120, appShellWidth - viewportGap * 2);
            const nextBoardCellSize = Math.max(
                compactLayout ? 17 : 16,
                Math.floor(
                    Math.min(
                        DEFAULT_BOARD_CELL_SIZE,
                        availableBoardWidth / COLS,
                        availableBoardHeight / ROWS
                    )
                )
            );
            boardInteraction.minScale = compactLayout || isTutorialMap() ? 0.82 : 1;
            boardInteraction.maxScale = compactLayout || isTutorialMap() ? 4.8 : 4.2;

            root.style.setProperty("--app-shell-width", `${appShellWidth}px`);
            root.style.setProperty("--app-shell-height", `${appShellHeight}px`);
            root.style.setProperty("--board-cell-size", `${nextBoardCellSize}px`);
            root.style.setProperty("--tray-cell-size", `${nextTrayCellSize}px`);
            root.style.setProperty("--action-bar-height", `${nextActionBarHeight}px`);
            root.style.setProperty("--pocket-reserved-height", `${pocketReservedHeight}px`);

            if (appElement) {
                appElement.style.width = `${appShellWidth}px`;
                appElement.style.maxWidth = `${appShellWidth}px`;
                appElement.style.height = `${appShellHeight}px`;
                appElement.style.maxHeight = `${appShellHeight}px`;
            }

            if (pocketDockElement) {
                pocketDockElement.style.maxWidth = `calc(${appShellWidth}px - (${viewportGap}px * 2))`;
            }

            if (bottomActionsElement) {
                bottomActionsElement.style.maxWidth = `calc(${appShellWidth}px - (${viewportGap}px * 2))`;
            }

            if (bottomAdSlotElement) {
                bottomAdSlotElement.style.maxWidth = `calc(${appShellWidth}px - (${viewportGap}px * 2))`;
            }

            requestAnimationFrame(() => {
                syncColorJewelSceneLayout();
                applyBoardTransform();
            });
        }

        window.addEventListener("keydown", (event) => {
            queueAudioContextWarmup();

            if (event.repeat) {
                return;
            }

            const activeElement = document.activeElement;
            const isTypingTarget =
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.isContentEditable);

            if (isTypingTarget) {
                return;
            }

            if (event.shiftKey && event.code === "KeyG") {
                event.preventDefault();
                toggleGemVisibilityCheat();
                return;
            }

            if (event.shiftKey && event.code === "KeyN") {
                if (typeof window.goToFirstPlayableLevelCheat === "function") {
                    event.preventDefault();
                    void window.goToFirstPlayableLevelCheat();
                }
                return;
            }

            if (event.shiftKey && event.code === "ArrowRight") {
                event.preventDefault();
                void advanceToNextStage();
                return;
            }

            if (event.shiftKey && event.code === "ArrowLeft") {
                event.preventDefault();

                const carriedActionCharges = clampActionChargesSnapshot(actionCharges);
                const currentSpecialActionUnlocked = isSpecialActionUnlocked(ACTIVE_MAP);
                const previousMapIndex =
                    ((currentMapIndex - 1) % MAP_DEFINITIONS.length + MAP_DEFINITIONS.length) % MAP_DEFINITIONS.length;
                const previousDefinition = MAP_DEFINITIONS[previousMapIndex];
                const previousOverrideVersion = getStageOverrideVersion(previousDefinition);

                clearPersistedGameProgress();
                clearRuntimeSnapshot();
                clearSolvedStageFailSafeTimer();
                clearStageClearTimers();
                clearCelebrationTimers();
                isStageTransitioning = false;
                selected = null;

                void activateMapIndex(previousMapIndex).then(() => {
                    if (
                        !currentSpecialActionUnlocked &&
                        isSpecialActionUnlocked(ACTIVE_MAP) &&
                        (Number(carriedActionCharges.magnet) || 0) <= 0
                    ) {
                        carriedActionCharges.magnet = getDefaultActionCharges(ACTIVE_MAP).magnet;
                    }
                    currentLevelInitialState =
                        preparedPreviousMapIndex === previousMapIndex &&
                        preparedPreviousMapVersion === previousOverrideVersion &&
                        preparedPreviousLevelInitialState?.mapId === ACTIVE_MAP?.id
                            ? {
                                mapId: preparedPreviousLevelInitialState.mapId,
                                rows: preparedPreviousLevelInitialState.rows,
                                cols: preparedPreviousLevelInitialState.cols,
                                boardState: cloneBoardSnapshot(preparedPreviousLevelInitialState.boardState),
                                trayState: [...preparedPreviousLevelInitialState.trayState],
                                cleanedSocketCells: [...(preparedPreviousLevelInitialState.cleanedSocketCells || [])],
                                actionCharges: clampActionChargesSnapshot(carriedActionCharges)
                            }
                            : (() => {
                                const previousLevelInitialState = buildCurrentLevelInitialState({
                                    persistState: false,
                                    fastMode: true
                                });
                                return {
                                    mapId: previousLevelInitialState.mapId,
                                    rows: previousLevelInitialState.rows,
                                    cols: previousLevelInitialState.cols,
                                    boardState: cloneBoardSnapshot(previousLevelInitialState.boardState),
                                    trayState: [...previousLevelInitialState.trayState],
                                    cleanedSocketCells: [...(previousLevelInitialState.cleanedSocketCells || [])],
                                    actionCharges: clampActionChargesSnapshot(carriedActionCharges)
                                };
                            })();
                    resetGame({
                        regenerateLevelStart: false,
                        fastLevelStart: false,
                        persistLevelStart: false
                    });
                });
                return;
            }

        });

        window.addEventListener("pointerdown", (event) => {
            noteLifecycleInteraction("pointerdown", event);
            queueAudioContextWarmup();
        }, { passive: true });

        window.addEventListener("touchstart", (event) => {
            noteLifecycleInteraction("touchstart", event);
            queueAudioContextWarmup();
        }, { passive: true });

        window.addEventListener("pageshow", (event) => {
            pushLifecycleDebugEntry("pageshow", {
                persisted: Boolean(event.persisted),
                navType: getNavigationDebugEntry()?.type || "unknown",
                wasDiscarded: Boolean(document.wasDiscarded)
            });
            queueAudioContextWarmup();
            if (shouldResumeBgmOnForeground && appSettings.bgmOn) {
                soundController?.setBgmEnabled?.(true, { resumePlayback: true });
                shouldResumeBgmOnForeground = false;
            }
        });

        window.addEventListener("pagehide", (event) => {
            pushLifecycleDebugEntry("pagehide", {
                persisted: Boolean(event.persisted)
            });
            lastLifecycleHiddenAt = Date.now();
            shouldResumeBgmOnForeground = appSettings.bgmOn;
            soundController?.setBgmEnabled?.(appSettings.bgmOn, { forceSuspend: true });
            persistRuntimeSnapshot({ immediate: true });
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                pushLifecycleDebugEntry("visibilitychange", {
                    state: "hidden"
                });
                lastLifecycleHiddenAt = Date.now();
                shouldResumeBgmOnForeground = appSettings.bgmOn;
                soundController?.setBgmEnabled?.(appSettings.bgmOn, { forceSuspend: true });
                persistRuntimeSnapshot({ immediate: true });
                scheduleBridgeStageSyncPoll(BACKGROUND_STAGE_SYNC_POLL_MS);
                scheduleSharedStageStatePoll(BACKGROUND_STAGE_SYNC_POLL_MS);
                return;
            }

            if (document.visibilityState === "visible") {
                const hiddenForMs = lastLifecycleHiddenAt > 0
                    ? Math.max(0, Date.now() - lastLifecycleHiddenAt)
                    : 0;
                pushLifecycleDebugEntry("visibilitychange", {
                    state: "visible",
                    hiddenForMs
                });
                lastLifecycleHiddenAt = 0;
                scheduleBridgeStageSyncPoll(800);
                scheduleSharedStageStatePoll(800);
                queueAudioContextWarmup();
                if (shouldResumeBgmOnForeground && appSettings.bgmOn) {
                    soundController?.setBgmEnabled?.(true, { resumePlayback: true });
                    shouldResumeBgmOnForeground = false;
                }
                if (solved && hiddenForMs >= STAGE_CLEAR_MIN_TRANSITION_DELAY_MS) {
                    pushLifecycleDebugEntry("stage-clear-foreground-recovery", {
                        hiddenForMs,
                        transitioning: isStageTransitioning
                    });
                    clearCelebrationTimers();
                    void advanceToNextStage(gameSessionVersion);
                }
            }
        });

        window.addEventListener("beforeunload", () => {
            pushLifecycleDebugEntry("beforeunload");
        });

        document.addEventListener("freeze", () => {
            pushLifecycleDebugEntry("freeze");
            lastLifecycleHiddenAt = Date.now();
            shouldResumeBgmOnForeground = appSettings.bgmOn;
            soundController?.setBgmEnabled?.(appSettings.bgmOn, { forceSuspend: true });
        });

        document.addEventListener("resume", () => {
            pushLifecycleDebugEntry("resume");
            queueAudioContextWarmup();
            if (shouldResumeBgmOnForeground && appSettings.bgmOn) {
                soundController?.setBgmEnabled?.(true, { resumePlayback: true });
                shouldResumeBgmOnForeground = false;
            }
        });

        window.addEventListener("error", (event) => {
            pushLifecycleDebugEntry("error", {
                message: event.message || null,
                source: event.filename || null,
                line: Number(event.lineno || 0),
                column: Number(event.colno || 0)
            });
        });

        window.addEventListener("unhandledrejection", (event) => {
            pushLifecycleDebugEntry("unhandledrejection", {
                reason: String(event.reason || "")
            });
        });

        function isTutorialMap() {
            return ACTIVE_MAP?.id === "tutorial";
        }

        function clearTutorialOverlay() {
            if (tutorialOverlayFrame) {
                window.cancelAnimationFrame(tutorialOverlayFrame);
                tutorialOverlayFrame = null;
            }

            [bottomActionButton1Element, bottomActionButton2Element].forEach((buttonElement) => {
                if (!(buttonElement instanceof HTMLElement)) {
                    return;
                }
                buttonElement.style.visibility = "";
            });
            delete tutorialLayerElement.dataset.tutorialGestureTypedStep;
            tutorialGestureTypingState = {
                stepId: null,
                message: "",
                startedAt: 0,
                revealedCharacterCount: 0,
                completed: true
            };
            tutorialLayerElement.style.pointerEvents = "none";
            tutorialLayerElement.innerHTML = "";
            setSceneLayerDisplay("hand-ani-png-171", false);
        }

        function renderTutorialGestureGuideOverlay() {
            if (!isTutorialGestureGuideActive()) {
                return false;
            }

            const stepMeta = TUTORIAL_GESTURE_GUIDE_STEPS.find(
                (entry) => entry.id === tutorialGestureGuideState.stepId
            );
            if (!stepMeta) {
                setSceneLayerDisplay("hand-ani-png-171", false);
                return false;
            }

            let guide = tutorialLayerElement.querySelector('[data-tutorial-gesture-guide="true"]');
            if (!(guide instanceof HTMLElement)) {
                guide = document.createElement("div");
                guide.dataset.tutorialGestureGuide = "true";
            }
            guide.className = `tutorial-gesture-guide tutorial-gesture-guide--${stepMeta.id.replaceAll("_", "-")}`;

            const isCoarsePointerDevice = typeof window.matchMedia === "function" && (
                window.matchMedia("(pointer: coarse)").matches ||
                window.matchMedia("(any-pointer: coarse)").matches
            );
            const isMobileTutorialDevice = isCoarsePointerDevice || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
            const isPinchGuide = stepMeta.id === "pinch_ani";
            const sceneGuideElement = colorJewelSceneRenderer?.getElement?.(stepMeta.assetPath) || null;
            const useSceneGuideElement = isPinchGuide && sceneGuideElement instanceof HTMLElement;

            let image = guide.querySelector(".tutorial-gesture-guide-image");
            if (!(image instanceof HTMLImageElement)) {
                guide.replaceChildren();
                image = document.createElement("img");
                image.className = "tutorial-gesture-guide-image";
                image.alt = "";
                image.setAttribute("aria-hidden", "true");
                image.decoding = "sync";
                image.loading = "eager";
                image.setAttribute("fetchpriority", "high");
                guide.append(image);
            }
            const sceneAssetImage = sceneGuideElement?.querySelector?.("img");
            const sceneAssetSrc = sceneAssetImage?.currentSrc || sceneAssetImage?.src || "";
            const contractAssetPath = colorJewelSceneContract?.layers
                ?.find((entry) => entry?.stableId === stepMeta.assetPath)
                ?.visual?.exportPath;
            const guideImagePath = contractAssetPath
                ? contractAssetPath.replace(/^assets\//, "./src/assets/")
                : (isPinchGuide ? TUTORIAL_PINCH_GUIDE_ASSET_PATH : stepMeta.assetPath);
            const nextImageSrc = sceneAssetSrc || (guideImagePath.includes("?")
                ? guideImagePath
                : `${guideImagePath}?v=${RUNTIME_SCENE_ASSET_BUSTER}`);
            if (image.getAttribute("src") !== nextImageSrc) {
                image.src = nextImageSrc;
            }
            setSceneLayerDisplay("hand-ani-png-171", useSceneGuideElement);

            let toast = tutorialLayerElement.querySelector('[data-tutorial-gesture-toast="true"]');
            if (!(toast instanceof HTMLElement)) {
                toast = document.createElement("div");
                toast.dataset.tutorialGestureToast = "true";
            }
            toast.className = "tutorial-gesture-toast";

            let toastCopy = toast.querySelector(".tutorial-gesture-toast-copy");
            if (!(toastCopy instanceof HTMLElement)) {
                toast.replaceChildren();
                toastCopy = document.createElement("div");
                toastCopy.className = "tutorial-gesture-toast-copy";
                toast.append(toastCopy);
            }
            const tutorialGuideMessage = stepMeta.id === "pinch_ani"
                ? (isMobileTutorialDevice ? "화면을 확대/축소해 보세요." : "마우스 휠로 확대/축소해 보세요.")
                : "보드를 드래그해서 원하는 위치로 움직여보세요.";
            const tutorialGuideCharacters = [...tutorialGuideMessage];
            const tutorialTypingDurationMs = Math.min(1200, Math.max(420, tutorialGuideCharacters.length * 52));
            if (
                tutorialGestureTypingState.stepId !== stepMeta.id ||
                tutorialGestureTypingState.message !== tutorialGuideMessage
            ) {
                tutorialGestureTypingState = {
                    stepId: stepMeta.id,
                    message: tutorialGuideMessage,
                    startedAt: Date.now(),
                    revealedCharacterCount: 0,
                    completed: false
                };
            }

            if (tutorialGestureTypingState.completed) {
                toastCopy.textContent = tutorialGuideMessage;
                tutorialLayerElement.dataset.tutorialGestureTypedStep = stepMeta.id;
            } else {
                const elapsedMs = Math.max(0, Date.now() - tutorialGestureTypingState.startedAt);
                const revealedCharacterCount = Math.min(
                    tutorialGuideCharacters.length,
                    Math.max(1, Math.ceil((elapsedMs / tutorialTypingDurationMs) * tutorialGuideCharacters.length))
                );
                if (revealedCharacterCount > tutorialGestureTypingState.revealedCharacterCount) {
                    tutorialGestureTypingState.revealedCharacterCount = revealedCharacterCount;
                }
                toastCopy.textContent = tutorialGuideCharacters.slice(0, revealedCharacterCount).join("");
                if (revealedCharacterCount >= tutorialGuideCharacters.length) {
                    tutorialGestureTypingState.completed = true;
                    tutorialLayerElement.dataset.tutorialGestureTypedStep = stepMeta.id;
                } else {
                    delete tutorialLayerElement.dataset.tutorialGestureTypedStep;
                    scheduleTutorialOverlayRender();
                }
            }
            toast.style.left = "50%";
            toast.style.top = "calc(53% + 82px)";
            toast.style.transform = "translateX(-50%)";

            const stageRect = boardStageElement?.getBoundingClientRect?.() || null;
            if (stageRect) {
                const stageCenterX = Math.round(stageRect.width / 2);
                const stageCenterY = Math.round(stageRect.height / 2);
                toast.style.left = `${stageCenterX}px`;
                if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 540px)").matches) {
                    const pocketRect = topTrayElement?.getBoundingClientRect?.() || bottomTrayElement?.getBoundingClientRect?.() || null;
                    const pocketTop = pocketRect
                        ? Math.round(pocketRect.top - stageRect.top)
                        : Math.round(stageCenterY + 32);
                    toast.style.top = `${Math.max(16, pocketTop - 18)}px`;
                    toast.style.transform = "translate(-50%, -100%)";
                } else {
                    toast.style.top = `${Math.round(stageCenterY + 82)}px`;
                    toast.style.transform = "translateX(-50%)";
                }
            }

            if (stageRect && isPinchGuide) {
                const stageCenterX = Math.round(stageRect.width / 2);
                const stageCenterY = Math.round(stageRect.height / 2);
                guide.style.left = `${stageCenterX}px`;
                guide.style.top = `${Math.round(stageCenterY - 162)}px`;
                if (useSceneGuideElement) {
                    sceneGuideElement.style.left = `${Math.round(stageCenterX - 32)}px`;
                    sceneGuideElement.style.top = `${Math.round(stageCenterY - 162)}px`;
                }
            } else {
                const occupiedCellRects = TARGET_POSITIONS
                    .map((position) => boardElement.querySelector(`[data-row="${position.row}"][data-col="${position.col}"]`))
                    .filter(Boolean)
                    .map((cell) => cell.getBoundingClientRect())
                    .filter((rect) => rect.width > 0 && rect.height > 0);

                if (!(stageRect && occupiedCellRects.length)) {
                    if (useSceneGuideElement) {
                        guide.remove();
                        tutorialLayerElement.append(toast);
                    } else {
                        tutorialLayerElement.append(guide, toast);
                    }
                    return true;
                }

                const minLeft = Math.min(...occupiedCellRects.map((rect) => rect.left));
                const maxRight = Math.max(...occupiedCellRects.map((rect) => rect.right));
                const maxBottom = Math.max(...occupiedCellRects.map((rect) => rect.bottom));
                guide.style.left = `${Math.round(stageRect.width / 2)}px`;
                guide.style.top = `${Math.round(maxBottom - stageRect.top - 35)}px`;
                if (useSceneGuideElement) {
                    sceneGuideElement.style.left = `${Math.round(((minLeft + maxRight) / 2) - stageRect.left - 9)}px`;
                    sceneGuideElement.style.top = `${Math.round(maxBottom - stageRect.top - 45)}px`;
                }
            }

            if (useSceneGuideElement) {
                guide.remove();
                tutorialLayerElement.append(toast);
            } else {
                tutorialLayerElement.append(guide, toast);
            }
            return true;
        }

        function findTutorialMisplacedBoardCells() {
            return TARGET_POSITIONS
                .filter((position) => {
                    const gem = boardState[position.row]?.[position.col] || 0;
                    return gem && gem !== TARGET_MAP[position.row][position.col];
                })
                .sort((left, right) => left.row - right.row || left.col - right.col);
        }

        function findTutorialEmptyColorSlot(colorId) {
            return (
                TARGET_POSITIONS.find(
                    (position) =>
                        TARGET_MAP[position.row][position.col] === colorId &&
                        isAvailableTargetCell(position.row, position.col, colorId)
                ) || null
            );
        }

        function getTutorialHintState() {
            if (!isTutorialMap() || solved || isAnimating) {
                return null;
            }

            if (selected) {
                if (selected.source === "board") {
                    const emptyColorSlot = findTutorialEmptyColorSlot(selected.color);
                    if (emptyColorSlot) {
                        return {
                            type: "board",
                            row: emptyColorSlot.row,
                            col: emptyColorSlot.col
                        };
                    }

                    const firstOpenPocket = getEmptyTrayIndices()[0];
                    if (firstOpenPocket != null) {
                        return {
                            type: "tray",
                            index: firstOpenPocket
                        };
                    }
                }

                if (selected.source === "tray") {
                    const emptyColorSlot = findTutorialEmptyColorSlot(selected.color);
                    if (emptyColorSlot) {
                        return {
                            type: "board",
                            row: emptyColorSlot.row,
                            col: emptyColorSlot.col
                        };
                    }
                }
            }

            const placeableTrayIndex = trayState.findIndex((gem) => gem && findTutorialEmptyColorSlot(gem));
            if (placeableTrayIndex !== -1) {
                return {
                    type: "tray",
                    index: placeableTrayIndex
                };
            }

            const misplacedCells = findTutorialMisplacedBoardCells();
            if (misplacedCells.length) {
                return {
                    type: "board",
                    row: misplacedCells[0].row,
                    col: misplacedCells[0].col
                };
            }

            return null;
        }

        function getTutorialTargetElement(hintState) {
            if (!hintState) return null;

            if (hintState.type === "board") {
                return boardElement.querySelector(`[data-row="${hintState.row}"][data-col="${hintState.col}"]`);
            }

            return tutorialLayerElement.parentElement.querySelector(`.tray-slot[data-index="${hintState.index}"]`);
        }

        function renderActionOverlay() {
            if (
                !actionOverlayState ||
                (actionOverlayState.type !== "magic" && actionOverlayState.type !== "magic-targeting")
            ) {
                return false;
            }

            const { bounds, sparkRow, sparkCol } = actionOverlayState;
            if (!bounds) {
                return false;
            }

            const stageRect = boardStageElement.getBoundingClientRect();
            const startCell = boardElement.querySelector(
                `[data-row="${bounds.startRow}"][data-col="${bounds.startCol}"]`
            );
            const endCell = boardElement.querySelector(
                `[data-row="${bounds.endRow}"][data-col="${bounds.endCol}"]`
            );
            if (!startCell || !endCell) {
                return false;
            }
            const startRect = startCell.getBoundingClientRect();
            const endRect = endCell.getBoundingClientRect();
            const minLeft = Math.min(startRect.left, endRect.left);
            const minTop = Math.min(startRect.top, endRect.top);
            const maxRight = Math.max(startRect.right, endRect.right);
            const maxBottom = Math.max(startRect.bottom, endRect.bottom);

            const focus = document.createElement("div");
            focus.className = "magic-area-focus";
            focus.style.left = `${Math.round(minLeft - stageRect.left - 7)}px`;
            focus.style.top = `${Math.round(minTop - stageRect.top - 7)}px`;
            focus.style.width = `${Math.round(maxRight - minLeft + 14)}px`;
            focus.style.height = `${Math.round(maxBottom - minTop + 14)}px`;
            tutorialLayerElement.append(focus);

            if (sparkRow != null && sparkCol != null) {
                const sparkTarget = boardElement.querySelector(`[data-row="${sparkRow}"][data-col="${sparkCol}"]`);
                if (sparkTarget) {
                    const sparkRect = sparkTarget.getBoundingClientRect();
                    const spark = document.createElement("div");
                    spark.className = "magic-area-spark";
                    spark.textContent = "✦";
                    spark.style.left = `${sparkRect.right - stageRect.left - 2}px`;
                    spark.style.top = `${sparkRect.bottom - stageRect.top + 2}px`;
                    tutorialLayerElement.append(spark);
                }
            }

            return true;
        }

        function renderTutorialOverlay() {
            const tutorialItemIntroActive =
                tutorialItemIntroState?.active === true && tutorialItemIntroState.mapId === ACTIVE_MAP?.id;
            tutorialLayerElement.style.pointerEvents = tutorialItemIntroActive ? "auto" : "none";
            [bottomActionButton1Element, bottomActionButton2Element].forEach((buttonElement) => {
                if (!(buttonElement instanceof HTMLElement)) {
                    return;
                }
                buttonElement.style.visibility = tutorialItemIntroActive ? "hidden" : "";
            });

            if (tutorialItemIntroActive) {
                const stageRect = boardStageElement?.getBoundingClientRect?.() || null;
                if (!stageRect) {
                    return;
                }

                let introRoot = tutorialLayerElement.querySelector('[data-tutorial-item-intro="true"]');
                if (!(introRoot instanceof HTMLElement)) {
                    tutorialLayerElement.innerHTML = "";
                    introRoot = document.createElement("div");
                    introRoot.dataset.tutorialItemIntro = "true";
                    introRoot.style.position = "absolute";
                    introRoot.style.inset = "0";
                    introRoot.style.pointerEvents = "none";

                    const dimLayer = document.createElement("div");
                    dimLayer.className = "tutorial-item-intro-dim";
                    introRoot.append(dimLayer);
                    tutorialLayerElement.append(introRoot);
                }

                [bottomActionButton1Element, bottomActionButton2Element].forEach((buttonElement, index) => {
                    if (!(buttonElement instanceof HTMLElement)) {
                        return;
                    }

                    const buttonRect = buttonElement.getBoundingClientRect();
                    if (buttonRect.width <= 0 || buttonRect.height <= 0) {
                        return;
                    }

                    let highlightShell = introRoot.querySelector(`[data-tutorial-item-highlight="${index}"]`);
                    if (!(highlightShell instanceof HTMLElement)) {
                        highlightShell = document.createElement("div");
                        highlightShell.className = "tutorial-item-intro-highlight";
                        highlightShell.dataset.tutorialItemHighlight = String(index);
                        highlightShell.style.pointerEvents = "none";
                        highlightShell.style.setProperty("--tutorial-item-intro-delay-ms", `${index * 90}ms`);

                        const introVisual = document.createElement("div");
                        introVisual.dataset.tutorialItemVisual = "true";
                        introVisual.style.position = "absolute";
                        introVisual.style.inset = "0";
                        introVisual.style.borderRadius = "28px";
                        introVisual.style.background = "linear-gradient(180deg, #fff7cf 0%, #fee48c 100%)";
                        introVisual.style.border = "2px solid rgba(255, 248, 220, 0.96)";
                        introVisual.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.82), 0 8px 22px rgba(255, 215, 120, 0.22)";

                        const iconImage = [...buttonElement.querySelectorAll("img")]
                            .find((image) => {
                                const imageSource = `${image.currentSrc || ""} ${image.src || ""}`.toLowerCase();
                                return (
                                    !imageSource.includes("circle1.png") &&
                                    !imageSource.includes("pictoicon_player_play") &&
                                    !imageSource.includes("player_play") &&
                                    !imageSource.includes("rock.png")
                                );
                            });
                        if (iconImage instanceof HTMLImageElement) {
                            const iconClone = iconImage.cloneNode(true);
                            iconClone.setAttribute("aria-hidden", "true");
                            iconClone.style.position = "absolute";
                            iconClone.style.left = "50%";
                            iconClone.style.top = "50%";
                            iconClone.style.width = "74%";
                            iconClone.style.height = "74%";
                            iconClone.style.objectFit = "contain";
                            iconClone.style.transform = "translate(-50%, -50%)";
                            iconClone.style.pointerEvents = "none";
                            introVisual.append(iconClone);
                        }

                        highlightShell.append(introVisual);

                        introRoot.append(highlightShell);
                    }

                    highlightShell.style.left = `${Math.round(buttonRect.left - stageRect.left)}px`;
                    highlightShell.style.top = `${Math.round(buttonRect.top - stageRect.top)}px`;
                    highlightShell.style.width = `${Math.round(buttonRect.width)}px`;
                    highlightShell.style.height = `${Math.round(buttonRect.height)}px`;

                    const countBadgeImage = [...buttonElement.querySelectorAll("img")]
                        .find((image) => image.currentSrc?.includes("circle1.png") || image.src?.includes("circle1.png"));
                    const countBadgeText = buttonElement.querySelector(".text-0");
                    let badgeShell = highlightShell.querySelector('[data-tutorial-item-badge="true"]');
                    if (!(badgeShell instanceof HTMLElement)) {
                        badgeShell = document.createElement("div");
                        badgeShell.dataset.tutorialItemBadge = "true";
                        badgeShell.style.position = "absolute";
                        badgeShell.style.pointerEvents = "none";
                        badgeShell.style.zIndex = "180";
                        highlightShell.append(badgeShell);
                    }

                    const badgeRect = countBadgeImage?.getBoundingClientRect?.() || countBadgeText?.getBoundingClientRect?.() || null;
                    const shouldShowBadge =
                        !!badgeRect &&
                        badgeRect.width > 0 &&
                        badgeRect.height > 0 &&
                        !!countBadgeText &&
                        countBadgeText.style.display !== "none" &&
                        String(countBadgeText.textContent || "").trim().length > 0;

                    if (!shouldShowBadge || !countBadgeText || !badgeRect) {
                        badgeShell.style.display = "none";
                        return;
                    }

                    badgeShell.style.display = "";
                    badgeShell.style.left = `${Math.round(badgeRect.left - buttonRect.left)}px`;
                    badgeShell.style.top = `${Math.round(badgeRect.top - buttonRect.top)}px`;
                    badgeShell.style.width = `${Math.round(badgeRect.width)}px`;
                    badgeShell.style.height = `${Math.round(badgeRect.height)}px`;
                    const badgeValue = String(countBadgeText.textContent || "").trim();
                    const shouldAnimateBadgeText = badgeShell.dataset.tutorialItemCount !== badgeValue;
                    badgeShell.dataset.tutorialItemCount = badgeValue;
                    badgeShell.replaceChildren();

                    if (countBadgeImage instanceof HTMLImageElement) {
                        const badgeImageClone = countBadgeImage.cloneNode(true);
                        badgeImageClone.setAttribute("aria-hidden", "true");
                        badgeImageClone.style.position = "absolute";
                        badgeImageClone.style.inset = "0";
                        badgeImageClone.style.left = "0";
                        badgeImageClone.style.top = "0";
                        badgeImageClone.style.width = "100%";
                        badgeImageClone.style.height = "100%";
                        badgeImageClone.style.margin = "0";
                        badgeImageClone.style.transform = "";
                        badgeImageClone.style.pointerEvents = "none";
                        badgeShell.append(badgeImageClone);
                    }

                    if (shouldAnimateBadgeText) {
                        const particleLayer = document.createElement("div");
                        particleLayer.className = "tutorial-item-intro-badge-particles";
                        [
                            { x: -14, y: -16, size: 7, delay: 0 },
                            { x: 15, y: -14, size: 8, delay: 18 },
                            { x: 18, y: 4, size: 6, delay: 36 },
                            { x: 10, y: 16, size: 7, delay: 8 },
                            { x: -12, y: 15, size: 6, delay: 28 },
                            { x: -18, y: 2, size: 8, delay: 14 }
                        ].forEach(({ x, y, size, delay }) => {
                            const particle = document.createElement("span");
                            particle.className = "tutorial-item-intro-badge-particle";
                            particle.style.setProperty("--tutorial-particle-x", `${x}px`);
                            particle.style.setProperty("--tutorial-particle-y", `${y}px`);
                            particle.style.setProperty("--tutorial-particle-size", `${size}px`);
                            particle.style.setProperty("--tutorial-particle-delay", `${delay}ms`);
                            particleLayer.append(particle);
                        });
                        badgeShell.append(particleLayer);
                    }

                    const badgeTextClone = countBadgeText.cloneNode(true);
                    if (badgeTextClone instanceof HTMLElement) {
                        badgeTextClone.setAttribute("aria-hidden", "true");
                        if (shouldAnimateBadgeText) {
                            badgeTextClone.classList.add("tutorial-item-intro-badge-pop");
                        }
                        badgeTextClone.style.position = "absolute";
                        badgeTextClone.style.inset = "0";
                        badgeTextClone.style.left = "0";
                        badgeTextClone.style.top = "0";
                        badgeTextClone.style.width = "100%";
                        badgeTextClone.style.height = "100%";
                        badgeTextClone.style.margin = "0";
                        badgeTextClone.style.display = "flex";
                        badgeTextClone.style.alignItems = "center";
                        badgeTextClone.style.justifyContent = "center";
                        badgeTextClone.style.transform = "";
                        badgeTextClone.style.pointerEvents = "none";
                        badgeShell.append(badgeTextClone);
                    }
                });
                return;
            }

            const preserveTutorialGestureGuide = !actionOverlayState && isTutorialGestureGuideActive();
            if (preserveTutorialGestureGuide) {
                [...tutorialLayerElement.children].forEach((childElement) => {
                    if (
                        childElement instanceof HTMLElement &&
                        (childElement.dataset.tutorialGestureGuide === "true" || childElement.dataset.tutorialGestureToast === "true")
                    ) {
                        return;
                    }
                    childElement.remove();
                });
            } else {
                tutorialLayerElement.innerHTML = "";
            }

            if (renderActionOverlay()) {
                return;
            }

            if (renderTutorialGestureGuideOverlay()) {
                return;
            }

            const hintState = getTutorialHintState();
            if (!hintState) {
                return;
            }

            const targetElement = getTutorialTargetElement(hintState);
            if (!targetElement) {
                return;
            }

            const stageRect = boardStageElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            const relativeLeft = targetRect.left - stageRect.left;
            const relativeTop = targetRect.top - stageRect.top;

            const focus = document.createElement("div");
            focus.className = "tutorial-focus";
            focus.style.left = `${relativeLeft - 5}px`;
            focus.style.top = `${relativeTop - 5}px`;
            focus.style.width = `${targetRect.width + 10}px`;
            focus.style.height = `${targetRect.height + 10}px`;

            const hint = document.createElement("div");
            hint.className = "tutorial-hint";
            hint.style.left = `${relativeLeft + targetRect.width / 2}px`;
            hint.style.top = hintState.type === "tray"
                ? `${Math.max(6, relativeTop - 34)}px`
                : `${Math.max(6, Math.round(relativeTop - 34))}px`;

            const hintArrow = document.createElement("img");
            hintArrow.className = "tutorial-hint-arrow";
            hintArrow.src = `./src/assets/tutorial_arr_down.png?v=${RUNTIME_SCENE_ASSET_BUSTER}`;
            hintArrow.alt = "";
            hintArrow.setAttribute("aria-hidden", "true");
            hint.append(hintArrow);

            const toast = document.createElement("div");
            toast.className = "tutorial-gesture-toast";
            toast.style.left = `${Math.round(stageRect.width / 2)}px`;
            if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 540px)").matches) {
                const pocketRect = topTrayElement?.getBoundingClientRect?.() || bottomTrayElement?.getBoundingClientRect?.() || null;
                const pocketTop = pocketRect
                    ? Math.round(pocketRect.top - stageRect.top)
                    : Math.round((stageRect.height / 2) + 32);
                toast.style.top = `${Math.max(16, pocketTop - 18)}px`;
                toast.style.transform = "translate(-50%, -100%)";
            } else {
                toast.style.top = `${Math.round((stageRect.height / 2) + 82)}px`;
                toast.style.transform = "translateX(-50%)";
            }

            if (!appSettings.tutorialTapHintShown) {
                const toastCopy = document.createElement("div");
                toastCopy.className = "tutorial-gesture-toast-copy";
                const tutorialTapHintMessage = "화살표가 가리키는 보석을 클릭해보세요.";
                const tutorialTapHintCharacters = [...tutorialTapHintMessage];
                const tutorialTapHintTypingDurationMs = Math.min(1200, Math.max(420, tutorialTapHintCharacters.length * 52));
                if (
                    tutorialGestureTypingState.stepId !== "tap_hint" ||
                    tutorialGestureTypingState.message !== tutorialTapHintMessage
                ) {
                    tutorialGestureTypingState = {
                        stepId: "tap_hint",
                        message: tutorialTapHintMessage,
                        startedAt: Date.now(),
                        revealedCharacterCount: 0,
                        completed: false
                    };
                }

                if (tutorialGestureTypingState.completed) {
                    toastCopy.textContent = tutorialTapHintMessage;
                } else {
                    const elapsedMs = Math.max(0, Date.now() - tutorialGestureTypingState.startedAt);
                    const revealedCharacterCount = Math.min(
                        tutorialTapHintCharacters.length,
                        Math.max(1, Math.ceil((elapsedMs / tutorialTapHintTypingDurationMs) * tutorialTapHintCharacters.length))
                    );
                    if (revealedCharacterCount > tutorialGestureTypingState.revealedCharacterCount) {
                        tutorialGestureTypingState.revealedCharacterCount = revealedCharacterCount;
                    }
                    toastCopy.textContent = tutorialTapHintCharacters.slice(0, revealedCharacterCount).join("");
                    if (revealedCharacterCount >= tutorialTapHintCharacters.length) {
                        tutorialGestureTypingState.completed = true;
                    } else {
                        scheduleTutorialOverlayRender();
                    }
                }
                toast.append(toastCopy);
            }

            tutorialLayerElement.append(focus, hint);
            if (!appSettings.tutorialTapHintShown) {
                tutorialLayerElement.append(toast);
            }
        }

        function scheduleTutorialOverlayRender() {
            if (!isTutorialMap() && !actionOverlayState && tutorialItemIntroState?.active !== true) {
                clearTutorialOverlay();
                return;
            }

            if (tutorialOverlayFrame) {
                window.cancelAnimationFrame(tutorialOverlayFrame);
            }

            tutorialOverlayFrame = window.requestAnimationFrame(() => {
                tutorialOverlayFrame = null;
                renderTutorialOverlay();
            });
        }

        function render() {
            renderFrame = null;
            updateResponsiveLayout();
            if (!ROWS || !COLS || !TARGET_MAP.length || !boardState.length) {
                clearTutorialOverlay();
                return;
            }
            renderBoard();
            renderTrays();
            updateActionButtonState();
            scheduleTutorialOverlayRender();
        }

        function clearSelection(message) {
            selected = null;
            if (message) setStatus(message);
            scheduleRender();
        }

        function swapBoardToBoard(from, to) {
            [boardState[from.row][from.col], boardState[to.row][to.col]] = [boardState[to.row][to.col], boardState[from.row][from.col]];
        }

        function swapTrayToTray(fromIndex, toIndex) {
            [trayState[fromIndex], trayState[toIndex]] = [trayState[toIndex], trayState[fromIndex]];
        }

        function moveBoardToTray(row, col, index) {
            trayState[index] = boardState[row][col];
            boardState[row][col] = 0;
        }

        function moveTrayToBoard(index, row, col, options = {}) {
            const { triggerHaptic = false, triggerSparkle = true } = options;
            boardState[row][col] = trayState[index];
            trayState[index] = 0;
            if (triggerSparkle) {
                markCorrectPlacementSparkle(row, col, { triggerHaptic });
            }
        }

        function swapBoardToTray(row, col, index) {
            [boardState[row][col], trayState[index]] = [trayState[index], boardState[row][col]];
        }

        function moveTrayCluster(indices, targetIndices) {
            const gems = indices.map((index) => trayState[index]);

            indices.forEach((index) => {
                trayState[index] = 0;
            });

            targetIndices.forEach((targetIndex, index) => {
                trayState[targetIndex] = gems[index];
            });
        }

        function getSelectedAnchorCell() {
            if (!selected || selected.source !== "board") return null;
            return (
                selected.cells.find((cell) => cell.row === selected.anchor.row && cell.col === selected.anchor.col) ||
                selected.cells[0] ||
                null
            );
        }

        function orderBoardCellsFromAnchor(cells, anchor = null) {
            if (!anchor) {
                return [...cells];
            }

            const anchorIndex = cells.findIndex((cell) => cell.row === anchor.row && cell.col === anchor.col);
            if (anchorIndex < 0) {
                return [...cells];
            }

            return [
                cells[anchorIndex],
                ...cells.slice(0, anchorIndex),
                ...cells.slice(anchorIndex + 1)
            ];
        }

        function createBoardSelection(cells, anchor, color = null, includeEmpty = false) {
            const uniqueCells = [...new Map(cells.map((cell) => [toCellKey(cell.row, cell.col), cell])).values()]
                .filter((cell) => (includeEmpty || boardState[cell.row][cell.col] !== 0) && !isLockedCorrectGem(cell.row, cell.col));
            const normalizedCells = orderBoardCellsFromAnchor(uniqueCells, anchor);

            if (!normalizedCells.length) return null;

            const nextAnchor =
                anchor &&
                normalizedCells.some((cell) => cell.row === anchor.row && cell.col === anchor.col)
                    ? { row: anchor.row, col: anchor.col }
                    : { row: normalizedCells[0].row, col: normalizedCells[0].col };

            return {
                source: "board",
                cells: normalizedCells,
                color: color || boardState[nextAnchor.row][nextAnchor.col],
                anchor: nextAnchor
            };
        }

        function getSelectedTrayIndices() {
            if (!selected || selected.source !== "tray") return [];
            return selected.indices || [];
        }

        function createTraySelection(indices, anchorIndex = null, color = null, includeEmpty = false) {
            const normalizedIndices = [...new Set(indices)]
                .filter((index) => includeEmpty || trayState[index] !== 0)
                .sort((left, right) => left - right);

            if (!normalizedIndices.length) return null;

            const nextAnchor = anchorIndex != null && normalizedIndices.includes(anchorIndex) ? anchorIndex : normalizedIndices[0];

            return {
                source: "tray",
                indices: normalizedIndices,
                color: color || trayState[nextAnchor],
                anchor: nextAnchor
            };
        }

        function mapBoardAnchor(cells, targetCells, anchor) {
            if (!targetCells.length) return null;
            const anchorIndex = cells.findIndex((cell) => cell.row === anchor?.row && cell.col === anchor?.col);
            const mappedCell = targetCells[anchorIndex >= 0 ? anchorIndex : 0];
            return mappedCell ? { row: mappedCell.row, col: mappedCell.col } : null;
        }

        function mapTrayAnchor(indices, targetIndices, anchorIndex) {
            if (!targetIndices.length) return null;
            const mappedIndex = indices.indexOf(anchorIndex);
            return targetIndices[mappedIndex >= 0 ? mappedIndex : 0] ?? null;
        }

        function normalizeSelection(nextSelection, includeEmpty = false) {
            if (!nextSelection) return null;
            if (nextSelection.source === "board") {
                return createBoardSelection(nextSelection.cells, nextSelection.anchor, nextSelection.color, includeEmpty);
            }
            return createTraySelection(nextSelection.indices, nextSelection.anchor, nextSelection.color, includeEmpty);
        }

        function isMagicTargetingMode() {
            return actionOverlayState?.type === "magic-targeting";
        }

        function getMagicBoundsFromCell(row, col) {
            const rowOffset = Math.floor((MAGIC_AREA_SIZE - 1) / 2);
            const colOffset = Math.floor((MAGIC_AREA_SIZE - 1) / 2);
            const maxRowStart = Math.max(0, ROWS - MAGIC_AREA_SIZE);
            const maxColStart = Math.max(0, COLS - MAGIC_AREA_SIZE);
            const startRow = Math.max(0, Math.min(maxRowStart, row - rowOffset));
            const startCol = Math.max(0, Math.min(maxColStart, col - colOffset));

            return {
                startRow,
                endRow: Math.min(ROWS - 1, startRow + MAGIC_AREA_SIZE - 1),
                startCol,
                endCol: Math.min(COLS - 1, startCol + MAGIC_AREA_SIZE - 1)
            };
        }

        function describeMagicBounds(bounds) {
            if (!bounds) {
                return "";
            }

            const width = bounds.endCol - bounds.startCol + 1;
            const height = bounds.endRow - bounds.startRow + 1;
            return `${height} x ${width} 영역`;
        }

        function getMagicTargetCells(bounds, includeCompleted = false) {
            const centerRow = (bounds.startRow + bounds.endRow) / 2;
            const centerCol = (bounds.startCol + bounds.endCol) / 2;

            return TARGET_POSITIONS
                .filter((position) => {
                    if (
                        position.row < bounds.startRow ||
                        position.row > bounds.endRow ||
                        position.col < bounds.startCol ||
                        position.col > bounds.endCol
                    ) {
                        return false;
                    }

                    return includeCompleted || !isCompletedTargetCell(position.row, position.col);
                })
                .map((position) => ({
                    row: position.row,
                    col: position.col,
                    color: TARGET_MAP[position.row][position.col],
                    distance: Math.abs(centerRow - position.row) + Math.abs(centerCol - position.col)
                }))
                .sort((left, right) => left.distance - right.distance || left.row - right.row || left.col - right.col);
        }

        function getTraySlotElement(index) {
            return document.querySelector(`.tray-slot[data-index="${index}"]`);
        }

        function getBoardCellElement(row, col) {
            return boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        }

        function getBoardCellFromClientPoint(clientX, clientY) {
            const target = document.elementFromPoint(clientX, clientY);
            const cell = target?.closest?.("[data-row][data-col]");
            if (!cell || !boardElement?.contains(cell)) {
                return null;
            }

            const row = Number(cell.dataset.row);
            const col = Number(cell.dataset.col);
            if (!Number.isInteger(row) || !Number.isInteger(col)) {
                return null;
            }

            return { row, col };
        }

        function getMagicSourceRect(source) {
            if (!source) {
                return null;
            }

            const sourceElement = source.type === "tray"
                ? getTraySlotElement(source.index)
                : getBoardCellElement(source.row, source.col);
            return sourceElement?.getBoundingClientRect() || null;
        }

        function getMagicTargetRect(targetCell) {
            return getBoardCellElement(targetCell.row, targetCell.col)?.getBoundingClientRect() || null;
        }

        function getMagicFlightDurationMs(targetCount) {
            const safeCount = Math.max(1, targetCount || 1);
            return Math.max(18, Math.min(46, Math.floor(1100 / safeCount)));
        }

        function getSelectedGemLiftHeight(sourceRect) {
            if (!sourceRect) {
                return 8;
            }

            const renderedGemSize = Math.min(sourceRect.width, sourceRect.height) * 0.84;
            return Math.max(7, Math.min(12, Math.round(renderedGemSize * 0.28)));
        }

        async function animateMagicGemFlight(colorId, sourceRect, targetRect, durationMs = 32) {
            if (!sourceRect || !targetRect) {
                return;
            }

            const flyingGem = createGem(colorId);
            flyingGem.classList.add("flying-gem");
            flyingGem.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
            flyingGem.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
            flyingGem.style.width = `${Math.min(sourceRect.width, sourceRect.height) * 0.84}px`;
            flyingGem.style.filter = "saturate(1.06) brightness(1.04) contrast(1.08) drop-shadow(0 8px 12px rgba(63, 33, 117, 0.22))";
            document.body.appendChild(flyingGem);

            const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
            const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
            try {
                if (typeof flyingGem.animate === "function") {
                    const animation = flyingGem.animate(
                        [
                            { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
                            { transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(1.04)`, opacity: 1 }
                        ],
                        {
                            duration: durationMs,
                            easing: "cubic-bezier(0.22, 0.9, 0.3, 1)",
                            fill: "forwards"
                        }
                    );
                    await animation.finished;
                } else {
                    flyingGem.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
                    await sleep(durationMs);
                }
            } catch (error) {
                await sleep(Math.max(12, Math.floor(durationMs * 0.5)));
            }

            if (flyingGem.parentNode) {
                flyingGem.parentNode.removeChild(flyingGem);
            }
        }

        async function animateLiftedGemFlight(colorId, sourceRect, targetRect, durationMs = 160) {
            if (!sourceRect || !targetRect) {
                return;
            }

            const flyingGem = createGem(colorId);
            flyingGem.classList.add("flying-gem");
            flyingGem.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
            flyingGem.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
            flyingGem.style.width = `${Math.min(sourceRect.width, sourceRect.height) * 0.84}px`;
            flyingGem.style.filter = "saturate(1.1) brightness(1.05) contrast(1.08) drop-shadow(0 14px 24px rgba(63, 33, 117, 0.28))";
            document.body.appendChild(flyingGem);

            const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
            const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
            const liftHeight = getSelectedGemLiftHeight(sourceRect);

            try {
                if (typeof flyingGem.animate === "function") {
                    const animation = flyingGem.animate(
                        [
                            { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0 },
                            { transform: `translate(-50%, calc(-50% - ${liftHeight}px)) scale(1.03)`, opacity: 1, offset: 0.22 },
                            {
                                transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px - ${liftHeight}px)) scale(1.03)`,
                                opacity: 1,
                                offset: 0.8
                            },
                            {
                                transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(1.02)`,
                                opacity: 1,
                                offset: 1
                            }
                        ],
                        {
                            duration: durationMs,
                            easing: "cubic-bezier(0.22, 0.9, 0.3, 1)",
                            fill: "forwards"
                        }
                    );
                    await animation.finished;
                } else {
                    flyingGem.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
                    await sleep(durationMs);
                }
            } catch (error) {
                await sleep(Math.max(18, Math.floor(durationMs * 0.5)));
            }

            if (flyingGem.parentNode) {
                flyingGem.parentNode.removeChild(flyingGem);
            }
        }

        function createFloatingGemElement(colorId, sourceRect) {
            if (!sourceRect) {
                return null;
            }

            const flyingGem = createGem(colorId);
            flyingGem.classList.add("flying-gem");
            flyingGem.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
            flyingGem.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
            flyingGem.style.width = `${Math.min(sourceRect.width, sourceRect.height) * 0.84}px`;
            flyingGem.style.filter = "saturate(1.1) brightness(1.05) contrast(1.08) drop-shadow(0 14px 24px rgba(63, 33, 117, 0.28))";
            flyingGem.style.transform = "translate(-50%, -50%) scale(1)";
            document.body.appendChild(flyingGem);
            return flyingGem;
        }

        async function animateFloatingGemLift(flyingGem, liftHeight, durationMs = 180) {
            if (!flyingGem) {
                return;
            }

            const finalTransform = `translate(-50%, calc(-50% - ${liftHeight}px)) scale(1.03)`;

            try {
                if (typeof flyingGem.animate === "function") {
                    const animation = flyingGem.animate(
                        [
                            { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
                            { transform: finalTransform, opacity: 1 }
                        ],
                        {
                            duration: durationMs,
                            easing: "cubic-bezier(0.22, 0.9, 0.3, 1)",
                            fill: "forwards"
                        }
                    );
                    await animation.finished;
                } else {
                    await sleep(durationMs);
                }
            } catch (error) {
                await sleep(Math.max(18, Math.floor(durationMs * 0.5)));
            }

            flyingGem.style.transform = finalTransform;
        }

        async function animateFloatingGemToTarget(flyingGem, sourceRect, targetRect, liftHeight, durationMs = 160) {
            if (!flyingGem || !sourceRect || !targetRect) {
                return;
            }

            const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
            const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
            const finalTransform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(1.02)`;

            try {
                if (typeof flyingGem.animate === "function") {
                    const animation = flyingGem.animate(
                        [
                            { transform: `translate(-50%, calc(-50% - ${liftHeight}px)) scale(1.03)`, opacity: 1, offset: 0 },
                            {
                                transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px - ${liftHeight}px)) scale(1.03)`,
                                opacity: 1,
                                offset: 0.78
                            },
                            { transform: finalTransform, opacity: 1, offset: 1 }
                        ],
                        {
                            duration: durationMs,
                            easing: "cubic-bezier(0.22, 0.9, 0.3, 1)",
                            fill: "forwards"
                        }
                    );
                    await animation.finished;
                } else {
                    await sleep(durationMs);
                }
            } catch (error) {
                await sleep(Math.max(18, Math.floor(durationMs * 0.5)));
            }

            flyingGem.style.transform = finalTransform;
        }

        function removeFloatingGemElement(flyingGem) {
            if (flyingGem?.parentNode) {
                flyingGem.parentNode.removeChild(flyingGem);
            }
        }

        function findMagicSourceForCellInState(
            boardSnapshot,
            traySnapshot,
            colorId,
            targetRow,
            targetCol,
            targetKeySet,
            resolvedTargetKeys
        ) {
            let bestBoardSource = null;
            const trayIndex = traySnapshot.findIndex((gem) => gem === colorId);

            TARGET_POSITIONS.forEach((position) => {
                if (boardSnapshot[position.row][position.col] !== colorId) {
                    return;
                }

                if (position.row === targetRow && position.col === targetCol) {
                    return;
                }

                const sourceKey = toCellKey(position.row, position.col);
                const isTargetCell = targetKeySet.has(sourceKey);
                const isResolvedTarget = resolvedTargetKeys.has(sourceKey);
                const sourceIsCompleted = isCompletedTargetCellInBoard(boardSnapshot, position.row, position.col);
                if (isTargetCell && isResolvedTarget) {
                    return;
                }

                if (sourceIsCompleted && !isTargetCell) {
                    return;
                }

                const distance = Math.abs(position.row - targetRow) + Math.abs(position.col - targetCol);
                const priority =
                    !isTargetCell ? 0 :
                    !isResolvedTarget ? 3 :
                    sourceIsCompleted ? 5 :
                    4;

                if (
                    !bestBoardSource ||
                    priority < bestBoardSource.priority ||
                    (priority === bestBoardSource.priority && distance < bestBoardSource.distance)
                ) {
                    bestBoardSource = {
                        type: "board",
                        row: position.row,
                        col: position.col,
                        distance,
                        priority
                    };
                }
            });

            if (bestBoardSource) {
                return bestBoardSource;
            }

            if (trayIndex !== -1) {
                return {
                    type: "tray",
                    index: trayIndex,
                    priority: 2,
                    distance: 0
                };
            }

            return null;
        }

        function findCurrentMagicSourceForCell(colorId, targetRow, targetCol, targetKeySet, resolvedTargetKeys) {
            return findMagicSourceForCellInState(
                boardState,
                trayState,
                colorId,
                targetRow,
                targetCol,
                targetKeySet,
                resolvedTargetKeys
            );
        }

        function applyMagicPlacementToState(boardSnapshot, traySnapshot, source, targetCell, colorId) {
            const displacedGem = boardSnapshot[targetCell.row][targetCell.col];

            if (source.type === "tray") {
                traySnapshot[source.index] = displacedGem || 0;
            } else {
                boardSnapshot[source.row][source.col] = displacedGem || 0;
            }

            boardSnapshot[targetCell.row][targetCell.col] = colorId;
        }

        function applyCurrentMagicPlacement(source, targetCell, colorId) {
            applyMagicPlacementToState(boardState, trayState, source, targetCell, colorId);
        }

        function refillMagicUsedTraySlots(boardSnapshot, traySnapshot, targetKeySet, consumedTrayIndices) {
            if (!consumedTrayIndices.size) {
                return;
            }

            const refillCandidates = TARGET_POSITIONS.filter((position) => {
                if (targetKeySet.has(toCellKey(position.row, position.col))) {
                    return false;
                }

                if (isCleanedSocketCell(position.row, position.col)) {
                    return false;
                }

                if ((boardSnapshot[position.row][position.col] || 0) === 0) {
                    return false;
                }

                return !isCompletedTargetCellInBoard(boardSnapshot, position.row, position.col);
            });

            consumedTrayIndices.forEach((trayIndex) => {
                if ((traySnapshot[trayIndex] || 0) !== 0) {
                    return;
                }

                const source = refillCandidates.find(
                    (position) => (boardSnapshot[position.row][position.col] || 0) !== 0
                );
                if (!source) {
                    return;
                }

                traySnapshot[trayIndex] = boardSnapshot[source.row][source.col] || 0;
                boardSnapshot[source.row][source.col] = 0;
            });
        }

        function computeMagicArrangement(bounds) {
            const targetCells = getMagicTargetCells(bounds, true)
                .filter((cell) => !isCleanedSocketCell(cell.row, cell.col));
            const selectedKeySet = new Set(targetCells.map((cell) => toCellKey(cell.row, cell.col)));
            const remainingIncompleteTargetKeys = new Set(
                TARGET_POSITIONS
                    .filter((position) => !isCompletedTargetCell(position.row, position.col))
                    .map((position) => toCellKey(position.row, position.col))
            );
            const canFinishStageByMagic =
                remainingIncompleteTargetKeys.size > 0 &&
                [...remainingIncompleteTargetKeys].every((cellKey) => selectedKeySet.has(cellKey));
            const nextBoardState = boardState.map((row) => [...row]);
            const nextTrayState = [...trayState];
            const resolvedTargetKeys = new Set(
                targetCells
                    .filter((cell) => nextBoardState[cell.row][cell.col] === cell.color)
                    .map((cell) => toCellKey(cell.row, cell.col))
            );
            const consumedTrayIndices = new Set();

            for (const cell of targetCells) {
                const cellKey = toCellKey(cell.row, cell.col);
                if (resolvedTargetKeys.has(cellKey)) {
                    continue;
                }

                const source = findMagicSourceForCellInState(
                    nextBoardState,
                    nextTrayState,
                    cell.color,
                    cell.row,
                    cell.col,
                    selectedKeySet,
                    resolvedTargetKeys
                );
                if (!source) {
                    if (!canFinishStageByMagic) {
                        return null;
                    }

                    // Let the magic wand complete the final unfinished region even when no spare source gem remains.
                    nextBoardState[cell.row][cell.col] = cell.color;
                    resolvedTargetKeys.add(cellKey);
                    continue;
                }

                if (source.type === "tray") {
                    consumedTrayIndices.add(source.index);
                }
                applyMagicPlacementToState(nextBoardState, nextTrayState, source, cell, cell.color);
                resolvedTargetKeys.add(cellKey);
            }

            refillMagicUsedTraySlots(nextBoardState, nextTrayState, selectedKeySet, consumedTrayIndices);

            return {
                targetCells,
                nextBoardState,
                nextTrayState
            };
        }

        async function applyMagicToBounds(bounds) {
            const sessionVersion = gameSessionVersion;
            const arrangement = computeMagicArrangement(bounds);
            if (!arrangement) {
                setActionOverlay(null);
                render();
                setStatus("선택한 영역을 맞출 수 있는 보석 구성이 아니에요.");
                return;
            }

            const { targetCells, nextBoardState, nextTrayState } = arrangement;
            const changedTargetCells = targetCells.filter(
                (cell) => boardState[cell.row][cell.col] !== nextBoardState[cell.row][cell.col]
            );
            const magicFlightDurationMs = getMagicFlightDurationMs(changedTargetCells.length);
            const targetKeySet = new Set(targetCells.map((cell) => toCellKey(cell.row, cell.col)));
            const resolvedTargetKeys = new Set(
                targetCells
                    .filter((cell) => boardState[cell.row][cell.col] === cell.color)
                    .map((cell) => toCellKey(cell.row, cell.col))
            );

            selected = null;
            isAnimating = true;
            setActionOverlay({
                type: "magic",
                bounds
            });
            render();
            await sleep(18);

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            for (let index = 0; index < changedTargetCells.length; index += 1) {
                const targetCell = changedTargetCells[index];
                const source = findCurrentMagicSourceForCell(
                    targetCell.color,
                    targetCell.row,
                    targetCell.col,
                    targetKeySet,
                    resolvedTargetKeys
                );
                const sourceRect = getMagicSourceRect(source);
                const targetRect = getMagicTargetRect(targetCell);
                await animateMagicGemFlight(targetCell.color, sourceRect, targetRect, magicFlightDurationMs);
                if (!isCurrentGameSession(sessionVersion)) {
                    return;
                }
                if (source) {
                    applyCurrentMagicPlacement(source, targetCell, targetCell.color);
                } else {
                    boardState[targetCell.row][targetCell.col] = targetCell.color;
                }
                markCorrectPlacementSparkle(targetCell.row, targetCell.col, { triggerHaptic: true });
                resolvedTargetKeys.add(toCellKey(targetCell.row, targetCell.col));
                setActionOverlay({
                    type: "magic",
                    bounds,
                    sparkRow: targetCell.row,
                    sparkCol: targetCell.col
                });
                render();
                void playPlaceSound();
            }

            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }

            boardState = nextBoardState;
            trayState = nextTrayState;
            render();

            isAnimating = false;

            if (!changedTargetCells.length) {
                setActionOverlay(null);
                render();
                setStatus("선택한 영역에서 매직으로 바로 맞출 수 있는 보석이 없어요.");
                return;
            }

            if (!consumeItemCharge("magic")) {
                setActionOverlay(null);
                render();
                setStatus("사용할 수 있는 마법봉이 없어요.");
                return;
            }
            await sleep(20);
            if (!isCurrentGameSession(sessionVersion)) {
                return;
            }
            setActionOverlay(null);
            commitMove(
                `${describeMagicBounds(bounds)} 안의 보석 ${changedTargetCells.length}개를 매직으로 자동 정렬했어요.`,
                changedTargetCells.length,
                false,
                null
            );
        }

        function previewMagicBounds(row, col) {
            if (!isMagicTargetingMode()) {
                return;
            }

            const nextBounds = getMagicBoundsFromCell(row, col);
            const currentBounds = actionOverlayState?.bounds;
            if (
                currentBounds &&
                currentBounds.startRow === nextBounds.startRow &&
                currentBounds.endRow === nextBounds.endRow &&
                currentBounds.startCol === nextBounds.startCol &&
                currentBounds.endCol === nextBounds.endCol
            ) {
                return;
            }

            setActionOverlay({
                ...actionOverlayState,
                bounds: nextBounds
            });
        }

        function beginMagicDrag(row, col, pointerId = null) {
            if (!isMagicTargetingMode()) {
                return;
            }

            boardInteraction.magicPointerId = pointerId;
            boardInteraction.isMagicDragging = true;
            boardInteraction.magicLastCell = { row, col };
            boardInteraction.suppressClickUntil = Date.now() + TOUCH_TAP_GUARD_MS;
            previewMagicBounds(row, col);
        }

        function updateMagicDragFromPoint(clientX, clientY) {
            if (!isMagicTargetingMode() || !boardInteraction.isMagicDragging) {
                return false;
            }

            const nextCell = getBoardCellFromClientPoint(clientX, clientY);
            if (!nextCell) {
                return false;
            }

            boardInteraction.magicLastCell = nextCell;
            previewMagicBounds(nextCell.row, nextCell.col);
            return true;
        }

        function finishMagicDrag(pointerId = null, options = {}) {
            const { cancel = false } = options;
            if (!boardInteraction.isMagicDragging) {
                return false;
            }

            if (
                pointerId != null &&
                boardInteraction.magicPointerId != null &&
                pointerId !== boardInteraction.magicPointerId
            ) {
                return false;
            }

            const targetCell = boardInteraction.magicLastCell;
            clearMagicDragState();

            if (cancel || !targetCell || !isMagicTargetingMode()) {
                return true;
            }

            void handleBoardClick(targetCell.row, targetCell.col);
            return true;
        }

        function startMagicTargeting() {
            selected = null;
            clearMagicDragState();
            const initialBounds = getMagicBoundsFromCell(Math.floor(ROWS / 2), Math.floor(COLS / 2));
            setActionOverlay({
                type: "magic-targeting",
                bounds: initialBounds
            });
            render();
            setStatus(`매직으로 맞출 ${MAGIC_AREA_SIZE}x${MAGIC_AREA_SIZE} 영역을 선택해 주세요.`);
        }

        function cancelMagicTargeting(message = "매직 영역 선택을 취소했어요.") {
            if (!isMagicTargetingMode()) {
                return;
            }

            clearMagicDragState();
            setActionOverlay(null);
            render();
            setStatus(message);
        }

        async function useMagicAction() {
            if (solved || isAnimating || isStageTransitioning) {
                return;
            }

            if (isTutorialMap()) {
                setStatus("튜토리얼에서는 아직 마법봉을 사용할 수 없어요.");
                return;
            }

            if (isMagicTargetingMode()) {
                cancelMagicTargeting();
                return;
            }

            if ((Number(actionCharges.magic) || 0) <= 0) {
                if (!grantAdRewardItem("magic")) {
                    return;
                }
                startMagicTargeting();
                return;
            }

            startMagicTargeting();
        }

        function getCleanableSocketCells() {
            return TARGET_POSITIONS
                .filter(
                    (position) =>
                        !isCleanedSocketCell(position.row, position.col) &&
                        boardState[position.row][position.col] !== 0 &&
                        boardState[position.row][position.col] === TARGET_MAP[position.row][position.col]
                )
                .sort((left, right) => left.row - right.row || left.col - right.col);
        }

        async function useCleanAction() {
            if (solved || isAnimating || isStageTransitioning) {
                return;
            }

            if (isTutorialMap()) {
                setStatus("튜토리얼에서는 아직 빗자루를 사용할 수 없어요.");
                return;
            }

            if (isMagicTargetingMode()) {
                cancelMagicTargeting();
            }

            const broomPlan = buildBroomMovePlan();
            const movedCount = broomPlan.steps.length;
            if (!movedCount) {
                setStatus("포켓의 보석으로 맞출 수 있는 칸이 없어요.");
                return;
            }

            if ((Number(actionCharges.clean) || 0) <= 0 && !grantAdRewardItem("clean")) {
                return;
            }

            if (!consumeItemCharge("clean")) {
                setStatus("사용할 수 있는 빗자루가 없어요.");
                return;
            }
            await animateBroomMoves(broomPlan.steps);
            boardState = broomPlan.nextBoardState;
            trayState = broomPlan.nextTrayState;
            commitMove(`빗자루로 포켓의 보석 ${movedCount}개를 알맞은 칸에 자동 배치했어요.`, movedCount, false, null);
        }

        async function useSpecialAction() {
            if (solved || isAnimating || isStageTransitioning) {
                return;
            }

            if (isMagicTargetingMode()) {
                cancelMagicTargeting("매직 영역 선택을 취소했어요.");
            }

            if (!isSpecialActionUnlocked(ACTIVE_MAP)) {
                setStatus("보물상자 스테이지 이후에 자석 아이템이 열려요.");
                return;
            }

            const magnetPlan = buildMagnetMovePlan();
            const movedCount = magnetPlan.movedGemCount || 0;
            if (!movedCount) {
                setStatus("자석으로 끌어올 보드 보석이 없어요.");
                return;
            }

            if ((Number(actionCharges.magnet) || 0) <= 0 && !grantAdRewardItem("magnet")) {
                return;
            }

            if (!consumeItemCharge("magnet")) {
                setStatus("사용할 수 있는 자석 아이템이 없어요.");
                return;
            }
            await animateMagnetMoves(magnetPlan.steps);
            boardState = magnetPlan.nextBoardState;
            const [primaryColorId, secondaryColorId] = magnetPlan.selectedColors || [];
            if (primaryColorId && secondaryColorId) {
                const primaryColorName = COLOR_PALETTE[primaryColorId]?.name || `C${primaryColorId}`;
                const secondaryColorName = COLOR_PALETTE[secondaryColorId]?.name || `C${secondaryColorId}`;
                commitMove(
                    `자석으로 ${primaryColorName}·${secondaryColorName} 보석 ${movedCount}개를 서로의 자리로 정렬했어요.`,
                    movedCount,
                    false,
                    null
                );
                return;
            }

            commitMove(
                `자석으로 보드 보석 ${movedCount}개를 더 알맞은 자리로 정렬했어요.`,
                movedCount,
                false,
                null
            );
        }

        function findTrayClusterPlacement(indices, targetIndex) {
            if (!isPocketOpened(targetIndex)) {
                return null;
            }

            const selectedIndexSet = new Set(indices);
            const targetPosition = getTrayPosition(targetIndex);
            const availableSlots = getEmptyTrayIndices()
                .filter((index) => !selectedIndexSet.has(index))
                .map((index) => ({
                    index,
                    distance: getCellDistance(targetPosition, getTrayPosition(index))
                }));

            if (availableSlots.length < indices.length) {
                return null;
            }

            return availableSlots
                .sort((left, right) => left.distance - right.distance || left.index - right.index)
                .slice(0, indices.length)
                .map(({ index }) => index);
        }

        function commitMove(message, clusterSize = 1, shouldPlaySound = true, nextSelection = null) {
            const previousCompleted = new Set(completedColorIds);
            const sessionVersion = gameSessionVersion;
            moves += 1;
            selected = normalizeSelection(nextSelection);
            const justSolved = checkSolved();
            completedColorIds = getCompletedColorIds();
            const newlyCompletedColorIds = [...completedColorIds]
                .filter((colorId) => !previousCompleted.has(colorId))
                .sort((left, right) => left - right);
            setStatus(justSolved ? "정답 배경과 모든 보석이 맞아떨어졌어요." : message);
            if (shouldPlaySound) {
                void playPlaceSound(clusterSize);
            }
            render();

            if (justSolved) {
                triggerSolvedStageSequence(sessionVersion);
                return;
            }

            if (newlyCompletedColorIds.length) {
                let nextDelayMs = 0;
                newlyCompletedColorIds.forEach((colorId) => {
                    nextDelayMs = scheduleColorCompletionCelebration(colorId, nextDelayMs);
                });
            }

            persistRuntimeSnapshot();
        }

        function selectBoardCluster(row, col, gem) {
            const cluster = getConnectedGemCluster(row, col);
            if (isTutorialMap() && !appSettings.tutorialTapHintShown) {
                updateAppSettings({ tutorialTapHintShown: true }, { persist: false });
            }
            selected = { source: "board", cells: cluster, color: gem, anchor: { row, col } };
            setStatus(
                cluster.length > 1
                    ? `인접한 ${COLOR_PALETTE[gem].name} 보석 ${cluster.length}개를 한 번에 잡았어요. 보드의 빈 공간이나 하단 포켓으로 함께 옮길 수 있어요.`
                    : "보드의 보석을 선택했어요. 다른 칸이나 하단 포켓을 눌러 이동하세요."
            );
            void playPickupSound(cluster.length);
            scheduleRender();
        }

        function selectTrayCluster(index, gem) {
            const cluster = getConnectedTrayCluster(index);
            if (isTutorialMap() && !appSettings.tutorialTapHintShown) {
                updateAppSettings({ tutorialTapHintShown: true }, { persist: false });
            }
            selected = { source: "tray", indices: cluster, color: gem, anchor: index };
            setStatus(
                cluster.length > 1
                    ? `포켓에서 이어진 ${COLOR_PALETTE[gem].name} 보석 ${cluster.length}개를 함께 잡았어요.`
                    : "포켓의 보석을 선택했어요. 보드나 다른 포켓으로 옮길 수 있어요."
            );
            void playPickupSound(cluster.length);
            scheduleRender();
        }

        async function handleBoardClick(row, col) {
            if (isMagicTargetingMode()) {
                const selectedBounds = getMagicBoundsFromCell(row, col);
                setActionOverlay({
                    type: "magic",
                    bounds: selectedBounds
                });
                render();
                await sleep(12);
                await applyMagicToBounds(selectedBounds);
                return;
            }

            if (selected?.source === "board" && isSelected("board", row, col)) {
                clearSelection("선택을 해제했어요.");
                return;
            }

            if (solved || isAnimating || isStageTransitioning) return;
            if (isLockedCorrectGem(row, col)) return;

            const gem = boardState[row][col];

            if (!selected) {
                if (!gem) {
                    setStatus("이 칸은 비어 있어요. 다른 보석을 먼저 선택해 주세요.");
                    return;
                }

                selectBoardCluster(row, col, gem);
                return;
            }

            const activeSelection = selected;

            if (activeSelection.source === "board") {
                if (activeSelection.cells.length > 1) {
                    if (gem) {
                        selectBoardCluster(row, col, gem);
                        return;
                    }

                    if (!gem) {
                        const sourceCellKeys = new Set(
                            activeSelection.cells.map((cell) => toCellKey(cell.row, cell.col))
                        );
                        const nearestSlots = findNearestColorSlotPlacement(
                            activeSelection.cells,
                            row,
                            col,
                            activeSelection.color,
                            sourceCellKeys
                        );
                        if (nearestSlots) {
                            const nextSelection = createBoardSelection(
                                nearestSlots,
                                mapBoardAnchor(activeSelection.cells, nearestSlots, activeSelection.anchor),
                                activeSelection.color,
                                true
                            );
                            await animateBoardClusterToBoardSlots(activeSelection.cells, nearestSlots, nextSelection);
                            commitMove(
                                "클릭한 칸부터 연결된 빈칸 순서로 묶음 보석을 채웠어요.",
                                activeSelection.cells.length,
                                false,
                                nextSelection
                            );
                            return;
                        }

                        const partialSlots = findPartialColorSlotPlacement(
                            activeSelection.cells.length,
                            row,
                            col,
                            activeSelection.color,
                            sourceCellKeys
                        );
                        if (partialSlots) {
                            const prioritizedCells = prioritizeBoardCells(activeSelection.cells, activeSelection.anchor);
                            const movableCells = prioritizedCells.slice(0, partialSlots.length);
                            const movedCellKeys = new Set(movableCells.map((cell) => toCellKey(cell.row, cell.col)));
                            const remainingCells = activeSelection.cells.filter(
                                (cell) => !movedCellKeys.has(toCellKey(cell.row, cell.col))
                            );
                            const nextSelection = createBoardSelection(
                                remainingCells,
                                activeSelection.anchor,
                                activeSelection.color
                            );
                            await animateBoardClusterToBoardSlots(movableCells, partialSlots, nextSelection);
                            commitMove(
                                `연결된 빈칸에 보석 ${movableCells.length}개를 먼저 이어서 채웠어요.`,
                                movableCells.length,
                                false,
                                nextSelection
                            );
                            return;
                        }

                        if (canPlaceBoardCluster(activeSelection.cells, activeSelection.anchor, row, col, activeSelection.color)) {
                            const translatedCells = getTranslatedCells(
                                activeSelection.cells,
                                activeSelection.anchor,
                                row,
                                col
                            );
                            const nextSelection = createBoardSelection(
                                translatedCells,
                                { row, col },
                                activeSelection.color,
                                true
                            );
                            await animateBoardClusterMove(
                                activeSelection.cells,
                                activeSelection.anchor,
                                row,
                                col,
                                nextSelection
                            );
                            commitMove(
                                "인접한 같은 색 보석 묶음을 한꺼번에 옮겼어요.",
                                activeSelection.cells.length,
                                false,
                                nextSelection
                            );
                            return;
                        }

                        const nearestPlacement = findNearestBoardClusterPlacement(
                            activeSelection.cells,
                            activeSelection.anchor,
                            row,
                            col,
                            activeSelection.color,
                            sourceCellKeys
                        );
                        if (nearestPlacement) {
                            const translatedCells = getTranslatedCells(
                                activeSelection.cells,
                                activeSelection.anchor,
                                nearestPlacement.row,
                                nearestPlacement.col
                            );
                            const nextSelection = createBoardSelection(
                                translatedCells,
                                { row: nearestPlacement.row, col: nearestPlacement.col },
                                activeSelection.color,
                                true
                            );
                            await animateBoardClusterMove(
                                activeSelection.cells,
                                activeSelection.anchor,
                                nearestPlacement.row,
                                nearestPlacement.col,
                                nextSelection
                            );
                            commitMove(
                                "클릭한 연결 영역 안으로 묶음 보석을 이어서 옮겼어요.",
                                activeSelection.cells.length,
                                false,
                                nextSelection
                            );
                            return;
                        }

                        const anchorCell =
                            activeSelection.cells.find(
                                (cell) => cell.row === activeSelection.anchor.row && cell.col === activeSelection.anchor.col
                            ) || activeSelection.cells[0] || null;
                        if (anchorCell) {
                            if (!isMatchingTargetCell(row, col, activeSelection.color)) {
                                setStatus(getColorMismatchMessage(activeSelection.color, row, col));
                                return;
                            }
                            moveBoardCluster([anchorCell], anchorCell, row, col);
                            commitMove(
                                "묶음에서 보석 1개를 꺼내 빈 칸으로 옮겼어요.",
                                1,
                                true,
                                createBoardSelection(
                                    activeSelection.cells.filter(
                                        (cell) => cell.row !== anchorCell.row || cell.col !== anchorCell.col
                                    ),
                                    activeSelection.anchor,
                                    activeSelection.color
                                )
                            );
                            return;
                        }

                        setStatus("묶음 전체는 이 칸에 바로 놓을 수 없어요.");
                        return;
                    }

                    setStatus("여러 개가 함께 잡혀 있어요. 이 묶음은 빈 공간이나 하단 포켓으로 한 번에 옮길 수 있어요.");
                    return;
                }

                if (gem) {
                    selectBoardCluster(row, col, gem);
                    return;
                }

                if (!isMatchingTargetCell(row, col, activeSelection.color)) {
                    setStatus(getColorMismatchMessage(activeSelection.color, row, col));
                    return;
                }

                const translatedCells = getTranslatedCells(activeSelection.cells, activeSelection.anchor, row, col);
                moveBoardCluster(activeSelection.cells, activeSelection.anchor, row, col);
                const nextSelection = createBoardSelection(translatedCells, { row, col }, activeSelection.color);
                commitMove(
                    "보드의 보석을 빈 칸으로 옮겼어요.",
                    activeSelection.cells.length,
                    true,
                    nextSelection
                );
                return;
            }

            if (gem) {
                selectBoardCluster(row, col, gem);
                return;
            }

            const trayIndices = activeSelection.indices || [];
            const trayGem = trayState[trayIndices[0]];
            if (!isMatchingTargetCell(row, col, trayGem)) {
                setStatus(getColorMismatchMessage(trayGem, row, col));
                return;
            }

            if (trayIndices.length > 1) {
                const nearestSlots = findNearestColorSlotPlacement(trayIndices, row, col, trayGem);
                if (nearestSlots) {
                    const nextSelection = createBoardSelection(
                        nearestSlots,
                        mapBoardAnchor(
                            trayIndices.map((index) => ({ row: 0, col: index })),
                            nearestSlots,
                            { row: 0, col: activeSelection.anchor }
                        ),
                        trayGem,
                        true
                    );
                    await animateTrayClusterToBoardSlots(trayIndices, nearestSlots, nextSelection);
                    commitMove(
                        "포켓 묶음을 클릭한 칸부터 연결된 빈칸 순서로 채웠어요.",
                        trayIndices.length,
                        false,
                        nextSelection
                    );
                    return;
                }

                const partialSlots = findPartialColorSlotPlacement(trayIndices.length, row, col, trayGem);
                if (partialSlots) {
                    const prioritizedTrayIndices = prioritizeTrayIndices(trayIndices, activeSelection.anchor);
                    const movableTrayIndices = prioritizedTrayIndices.slice(0, partialSlots.length);
                    const movedTrayIndexSet = new Set(movableTrayIndices);
                    const remainingTrayIndices = trayIndices.filter((index) => !movedTrayIndexSet.has(index));
                    const nextSelection = createTraySelection(remainingTrayIndices, activeSelection.anchor, trayGem);
                    await animateTrayClusterToBoardSlots(movableTrayIndices, partialSlots, nextSelection);
                    commitMove(
                        `포켓의 보석 ${movableTrayIndices.length}개를 연결된 빈칸에 먼저 채웠어요.`,
                        movableTrayIndices.length,
                        false,
                        nextSelection
                    );
                    return;
                }

                const anchorTrayIndex =
                    trayIndices.find((index) => index === activeSelection.anchor) ?? trayIndices[0] ?? null;
                if (anchorTrayIndex != null) {
                    moveTrayToBoard(anchorTrayIndex, row, col, { triggerHaptic: true });
                    void playPlaceSound();
                    commitMove(
                        "포켓 묶음에서 보석 1개를 빈 칸으로 옮겼어요.",
                        1,
                        false,
                        createTraySelection(
                            trayIndices.filter((index) => index !== anchorTrayIndex),
                            activeSelection.anchor,
                            trayGem
                        )
                    );
                    return;
                }
            }

            moveTrayToBoard(trayIndices[0], row, col, { triggerHaptic: true });
            void playPlaceSound();
            commitMove(
                "포켓의 보석을 빈 칸으로 옮겼어요.",
                1,
                false,
                createBoardSelection([{ row, col }], { row, col }, trayGem)
            );
        }

        async function handleTrayClick(index) {
            if (isMagicTargetingMode()) {
                setStatus("매직은 보드에서 영역을 선택해 사용해 주세요.");
                return;
            }

            if (selected?.source === "tray" && isSelected("tray", index)) {
                clearSelection("선택을 해제했어요.");
                return;
            }

            if (solved || isAnimating || isStageTransitioning) return;

            const gem = trayState[index];
            const openedPocketIndices = getOpenedPocketIndexSet();
            const isOpenedPocket = isPocketOpened(index, openedPocketIndices);

            if (!selected) {
                if (!gem) {
                    if (!isOpenedPocket) {
                        setStatus("이 포켓은 아직 닫혀 있어요. 한 색상을 완성할 때마다 한 칸씩 열려요.");
                        return;
                    }
                    setStatus("이 포켓은 비어 있어요.");
                    return;
                }

                selectTrayCluster(index, gem);
                return;
            }

            const activeSelection = selected;

            if (activeSelection.source === "tray") {
                const trayIndices = activeSelection.indices || [];

                if (gem) {
                    selectTrayCluster(index, gem);
                    return;
                }

                if (!isOpenedPocket) {
                    setStatus("이 포켓은 아직 닫혀 있어요. 한 색상을 완성할 때마다 한 칸씩 열려요.");
                    return;
                }

                if (trayIndices.length === 1) {
                    swapTrayToTray(trayIndices[0], index);
                    void playPlaceSound();
                    commitMove("", 1, false, createTraySelection([index], index, activeSelection.color));
                    return;
                }

                const targetSlots = findTrayClusterPlacement(trayIndices, index);
                if (!targetSlots) {
                    return;
                }

                const nextSelection = createTraySelection(
                    targetSlots,
                    mapTrayAnchor(trayIndices, targetSlots, activeSelection.anchor),
                    activeSelection.color,
                    true
                );
                await animateTrayClusterMove(trayIndices, targetSlots, nextSelection);
                commitMove(
                    "",
                    trayIndices.length,
                    false,
                    nextSelection
                );
                return;
            }

            if (activeSelection.cells.length > 1) {
                if (gem) {
                    selectTrayCluster(index, gem);
                    return;
                }

                if (!isOpenedPocket) {
                    setStatus("이 포켓은 아직 닫혀 있어요. 한 색상을 완성할 때마다 한 칸씩 열려요.");
                    return;
                }

                const emptyTrayIndices = getEmptyTrayIndices();
                const orderedSlots = [index, ...emptyTrayIndices.filter((emptyIndex) => emptyIndex !== index)];
                const anchorCell =
                    activeSelection.cells.find(
                        (cell) => cell.row === activeSelection.anchor.row && cell.col === activeSelection.anchor.col
                    ) || activeSelection.cells[0] || null;
                const prioritizedCells = anchorCell
                    ? [anchorCell, ...activeSelection.cells.filter((cell) => cell.row !== anchorCell.row || cell.col !== anchorCell.col)]
                    : [...activeSelection.cells];

                if (orderedSlots.length < activeSelection.cells.length) {
                    const movableCells = prioritizedCells.slice(0, orderedSlots.length);
                    const movedCellKeys = new Set(movableCells.map((cell) => toCellKey(cell.row, cell.col)));
                    const remainingCells = activeSelection.cells.filter(
                        (cell) => !movedCellKeys.has(toCellKey(cell.row, cell.col))
                    );
                    const nextSelection = createBoardSelection(
                        remainingCells,
                        activeSelection.anchor,
                        activeSelection.color
                    );
                    await animateBoardClusterToTray(movableCells, orderedSlots, nextSelection);
                    commitMove(
                        `묶음에서 보석 ${movableCells.length}개를 포켓으로 옮겼어요.`,
                        movableCells.length,
                        false,
                        nextSelection
                    );
                    return;
                }

                const nextSelection = createTraySelection(
                    orderedSlots.slice(0, activeSelection.cells.length),
                    orderedSlots[0],
                    activeSelection.color,
                    true
                );
                await animateBoardClusterToTray(prioritizedCells, orderedSlots, nextSelection);
                commitMove(
                    `인접한 보석 ${activeSelection.cells.length}개를 포켓으로 한 번에 옮겼어요.`,
                    activeSelection.cells.length,
                    false,
                    nextSelection
                );
                return;
            }

            if (!gem) {
                if (!isOpenedPocket) {
                    setStatus("이 포켓은 아직 닫혀 있어요. 한 색상을 완성할 때마다 한 칸씩 열려요.");
                    return;
                }
                moveBoardToTray(activeSelection.cells[0].row, activeSelection.cells[0].col, index);
                void playPlaceSound(activeSelection.cells.length);
                commitMove(
                    "보드의 보석을 포켓으로 잠시 옮겼어요.",
                    activeSelection.cells.length,
                    false,
                    createTraySelection([index], index, activeSelection.color)
                );
                return;
            }

            selectTrayCluster(index, gem);
        }

        function resetGame(options = {}) {
            const {
                regenerateLevelStart = false,
                preserveStageClearOverlay = false,
                fastLevelStart = false,
                persistLevelStart = true,
                skipRender = false
            } = options;
            gameSessionVersion += 1;
            clearSolvedStageFailSafeTimer();
            if (!preserveStageClearOverlay) {
                clearStageClearTimers();
            }
            clearMagicDragState();
            isAnimating = false;
            isStageTransitioning = false;
            lastTouchActivationAt = 0;
            boardInteraction.suppressClickUntil = 0;
            boardInteraction.lastTapAt = 0;
            boardInteraction.lastTapX = 0;
            boardInteraction.lastTapY = 0;
            boardInteraction.touches.clear();
            boardInteraction.isTouchGestureActive = false;
            boardInteraction.isTouchPanning = false;
            boardInteraction.pinchStartDistance = 0;
            boardInteraction.pointerId = null;
            boardInteraction.isPointerDragging = false;
            boardInteraction.isPointerPanActive = false;

            if (
                regenerateLevelStart ||
                !currentLevelInitialState ||
                currentLevelInitialState.mapId !== ACTIVE_MAP?.id
            ) {
                currentLevelInitialState = buildCurrentLevelInitialState({
                    persistState: persistLevelStart,
                    fastMode: fastLevelStart
                });
            }

            ensureItemEconomyForMap(ACTIVE_MAP);
            boardState = cloneBoardSnapshot(currentLevelInitialState.boardState);
            trayState = [...currentLevelInitialState.trayState];
            cleanedSocketCells = new Set(currentLevelInitialState.cleanedSocketCells || []);
            syncActionChargesFromItemEconomy(ACTIVE_MAP);
            actionOverlayState = null;
            clearSparkles();
            clearCelebrationTimers();
            resetBoardTransform();
            resetTutorialGestureGuideState();
            selected = null;
            moves = 0;
            solved = false;
            completedColorIds = getCompletedColorIds();
            const shouldStartTutorialItemIntro =
                tutorialItemIntroState?.mapId === ACTIVE_MAP?.id &&
                ACTIVE_MAP?.id === "bear" &&
                !isTutorialMap() &&
                !skipRender;
            const introSessionVersion = shouldStartTutorialItemIntro ? gameSessionVersion : 0;
            const introState = shouldStartTutorialItemIntro ? tutorialItemIntroState : null;
            if (introState) {
                const tutorialIntroCharges = getDefaultActionCharges(ACTIVE_MAP);
                itemEconomyState = normalizeItemEconomyState(itemEconomyState);
                itemEconomyState.charges.magic = Math.max(
                    Number(itemEconomyState.charges.magic || 0),
                    Number(tutorialIntroCharges.magic || 0)
                );
                itemEconomyState.charges.clean = Math.max(
                    Number(itemEconomyState.charges.clean || 0),
                    Number(tutorialIntroCharges.clean || 0)
                );
                itemEconomyState.adUses.magic = 0;
                itemEconomyState.adUses.clean = 0;
                itemEconomyState.refill.magic.active = false;
                itemEconomyState.refill.magic.clearCount = 0;
                itemEconomyState.refill.clean.active = false;
                itemEconomyState.refill.clean.clearCount = 0;
                persistItemEconomyState(itemEconomyState);
                syncActionChargesFromItemEconomy(ACTIVE_MAP);
                introState.active = true;
                introState.displayCharges = {
                    magic: 0,
                    clean: 0
                };
            } else {
                tutorialItemIntroState = null;
            }
            setStatus(ACTIVE_MAP.startMessage || "배경색을 보면서 보석을 제자리로 정리해 보세요.");
            if (!skipRender) {
                render();
            }
            if (introState) {
                void (async () => {
                    await waitForNextPaint(2);
                    if (
                        tutorialItemIntroState !== introState ||
                        !isCurrentGameSession(introSessionVersion) ||
                        ACTIVE_MAP?.id !== "bear"
                    ) {
                        return;
                    }

                    await sleep(TUTORIAL_ITEM_INTRO_START_DELAY_MS);
                    const introSteps = [
                        ["magic", 1],
                        ["clean", 1],
                        ["magic", 2],
                        ["clean", 2],
                        ["magic", 3]
                    ];

                    for (const [itemType, nextCount] of introSteps) {
                        if (
                            tutorialItemIntroState !== introState ||
                            !isCurrentGameSession(introSessionVersion) ||
                            ACTIVE_MAP?.id !== "bear"
                        ) {
                            return;
                        }

                        introState.displayCharges = {
                            ...introState.displayCharges,
                            [itemType]: nextCount
                        };
                        render();
                        playPickupSound(nextCount);
                        await sleep(TUTORIAL_ITEM_INTRO_STEP_DELAY_MS);
                    }

                    if (
                        tutorialItemIntroState !== introState ||
                        !isCurrentGameSession(introSessionVersion) ||
                        ACTIVE_MAP?.id !== "bear"
                    ) {
                        return;
                    }

                    await sleep(TUTORIAL_ITEM_INTRO_END_DELAY_MS);
                    if (
                        tutorialItemIntroState !== introState ||
                        !isCurrentGameSession(introSessionVersion) ||
                        ACTIVE_MAP?.id !== "bear"
                    ) {
                        return;
                    }

                    void playColorCompleteSound(0);
                    tutorialItemIntroState = null;
                    syncActionChargesFromItemEconomy(ACTIVE_MAP);
                    render();
                })();
            }
            persistRuntimeSnapshot();
        }

        window.applyPersistedPixelAdminStageOverride = applyPersistedPixelAdminStageOverride;
        window.loadPersistedPixelAdminStageOverrides = loadPersistedPixelAdminStageOverrides;

        window.addEventListener("storage", (event) => {
            if (!event.key || !Array.isArray(MAP_DEFINITIONS) || !MAP_DEFINITIONS.length) {
                return;
            }

            if (event.key === PIXEL_ADMIN_STAGE_STORAGE_KEY) {
                pixelAdminStageStorageCache = null;

                const activeMapId = getCurrentMapDefinition()?.id || null;
                let activeMapDidChange = false;
                let previousPayload = {};
                let nextPayload = {};

                if (event.oldValue) {
                    previousPayload = JSON.parse(event.oldValue);
                }

                if (event.newValue) {
                    nextPayload = JSON.parse(event.newValue);
                }

                if (activeMapId) {
                    const previousEntry = previousPayload?.[activeMapId] || null;
                    const nextEntry = nextPayload?.[activeMapId] || null;
                    activeMapDidChange = JSON.stringify(previousEntry) !== JSON.stringify(nextEntry);
                }

                loadPersistedPixelAdminStageOverrides();
                rebuildRuntimeMapThemeOverrides();

                if (!activeMapDidChange || !ACTIVE_MAP) {
                    return;
                }

                syncActiveMap(currentMapIndex, {
                    syncPixelAdmin: false,
                    renderPixelAdmin: false,
                    prepareUpcomingMap: false
                });
                currentLevelInitialState = null;
                resetGame({
                    regenerateLevelStart: true,
                    fastLevelStart: true,
                    persistLevelStart: false
                });
                return;
            }

            if (event.key === PIXEL_ADMIN_STAGE_CATALOG_REFRESH_KEY) {
                if (!event.newValue) {
                    return;
                }

                try {
                    const refreshPayload = JSON.parse(event.newValue);
                    const stageEntry = refreshPayload?.stageEntry || null;
                    const stagePayload = refreshPayload?.stagePayload || null;
                    if (!stageEntry || !stagePayload) {
                        return;
                    }

                    const createdStageIndex = upsertRuntimeStageDefinition(stageEntry, stagePayload);
                    if (createdStageIndex < 0) {
                        return;
                    }

                    if (refreshPayload.activate) {
                        clearRuntimeSnapshot();
                        clearSolvedStageFailSafeTimer();
                        clearStageClearTimers();
                        clearCelebrationTimers();
                        isStageTransitioning = false;
                        selected = null;

                        void activateMapIndex(createdStageIndex, {
                            syncPixelAdmin: false,
                            renderPixelAdmin: false,
                            prepareUpcomingMap: false
                        }).then(() => {
                            currentLevelInitialState = null;
                            resetGame({
                                regenerateLevelStart: true,
                                fastLevelStart: true,
                                persistLevelStart: false
                            });
                        });
                        return;
                    }

                    const activeMapId = getCurrentMapDefinition()?.id || null;
                    if (activeMapId !== stageEntry.id) {
                        return;
                    }

                    syncActiveMap(currentMapIndex, {
                        syncPixelAdmin: false,
                        renderPixelAdmin: false,
                        prepareUpcomingMap: false
                    });
                    currentLevelInitialState = null;
                    resetGame({
                        regenerateLevelStart: true,
                        fastLevelStart: true,
                        persistLevelStart: false
                    });
                } catch (error) {
                    console.error("[Game] failed to apply stage catalog refresh", error);
                }
                return;
            }

            if (event.key !== CURRENT_MAP_STORAGE_KEY) {
                return;
            }

            const nextMapId = readPersistedCurrentMapId();
            const nextMapIndex = MAP_DEFINITIONS.findIndex((definition) => definition.id === nextMapId);
            if (nextMapIndex < 0 || nextMapIndex === currentMapIndex) {
                return;
            }

            clearRuntimeSnapshot();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            clearCelebrationTimers();
            isStageTransitioning = false;
            selected = null;

            void activateMapIndex(nextMapIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            }).then(() => {
                currentLevelInitialState = null;
                resetGame({
                    regenerateLevelStart: true,
                    fastLevelStart: true,
                    persistLevelStart: false
                });
            });
        });


        window.addEventListener("resize", () => {
            updateResponsiveLayout();
            scheduleTutorialOverlayRender();
        });

        window.visualViewport?.addEventListener("resize", () => {
            updateResponsiveLayout();
            scheduleTutorialOverlayRender();
        });

        window.visualViewport?.addEventListener("scroll", () => {
            updateResponsiveLayout();
            scheduleTutorialOverlayRender();
        });

        async function bootGame() {
            let titleMinimumVisiblePromise = Promise.resolve();
            let colorJewelUiPromise = Promise.resolve(false);

            try {
                if (window.location.protocol === "file:") {
                    window.location.replace("http://127.0.0.1:8000/");
                    return;
                }

                if (titleLoadingOverlayElement && titleSceneMountElement) {
                    titleLoadingOverlayElement.style.background = "#fffef6";
                    titleLoadingOverlayElement.classList.add("active");
                    titleLoadingOverlayElement.setAttribute("aria-hidden", "false");
                    titleSceneMountElement.replaceChildren();
                    titleSceneMountElement.setAttribute("aria-hidden", "false");
                    soundController?.warmup?.();
                    titleMinimumVisiblePromise = Promise.all([
                        (async () => {
                            await waitForNextPaint();
                            try {
                                const [SceneRenderer, titleContract] = await Promise.all([
                                    getSceneRendererCtor(),
                                    fetch(`./title.contract.json?v=${SCENE_CONTRACT_VERSION}`, {
                                        headers: NGROK_BYPASS_HEADERS
                                    }).then((response) => {
                                        if (!response.ok) {
                                            throw new Error(`title contract load failed: ${response.status}`);
                                        }
                                        return response.json();
                                    })
                                ]);

                                patchContractAssetPaths(titleContract);
                                if (Array.isArray(titleContract?.layers)) {
                                    titleContract.layers = titleContract.layers.filter((layer) => {
                                        const exportPath =
                                            typeof layer?.visual?.exportPath === "string"
                                                ? layer.visual.exportPath.toLowerCase()
                                                : "";
                                        return !exportPath.includes("circle1.png");
                                    });
                                }

                                const designWidth = titleContract?.viewport?.width || titleContract?.canvas?.width || 393;
                                const designHeight = titleContract?.viewport?.height || titleContract?.canvas?.height || 852;
                                const mountWidth = titleSceneMountElement.clientWidth || designWidth;
                                const mountHeight = titleSceneMountElement.clientHeight || designHeight;
                                const scale = Math.min(1, mountWidth / designWidth, mountHeight / designHeight);
                                const scaledWidth = Math.round(designWidth * scale);
                                const scaledHeight = Math.round(designHeight * scale);
                                const titleBackground = titleContract?.background || {};

                                if (titleBackground.type === "linear-gradient") {
                                    titleLoadingOverlayElement.style.background = `linear-gradient(${titleBackground.gradientAngle || 180}deg, ${titleBackground.color || "#fffef6"}, ${titleBackground.color2 || titleBackground.color || "#f7e3ab"})`;
                                } else {
                                    titleLoadingOverlayElement.style.background = titleBackground.color || "#fffef6";
                                }

                                const shell = document.createElement("div");
                                shell.className = "title-scene-shell";
                                shell.style.width = `${scaledWidth}px`;
                                shell.style.height = `${scaledHeight}px`;

                                const surface = document.createElement("div");
                                surface.className = "title-scene-surface";
                                surface.style.width = `${designWidth}px`;
                                surface.style.height = `${designHeight}px`;
                                surface.style.transform = `scale(${scale})`;

                                shell.appendChild(surface);
                                titleSceneMountElement.appendChild(shell);

                                titleSceneRenderer = new SceneRenderer(surface, {
                                    basePath: "./src/"
                                });
                                titleSceneRenderer.loadSync(titleContract);
                                titleSceneRenderer.show();

                                const titleSceneRootElement = surface.firstElementChild;
                                if (titleSceneRootElement) {
                                    titleSceneRootElement.style.top = "0";
                                    titleSceneRootElement.style.left = "0";
                                    titleSceneRootElement.style.right = "auto";
                                    titleSceneRootElement.style.bottom = "auto";
                                    titleSceneRootElement.style.pointerEvents = "none";
                                }

                                const titleLoaderElement = titleSceneRenderer.getElement("animation-5-png-6");
                                titleLoaderElement?.classList.add("title-scene-loader");

                                const titleSceneImages = [...surface.querySelectorAll("img")];
                                if (titleSceneImages.length) {
                                    await Promise.all(titleSceneImages.map((imageElement) => (
                                        imageElement.complete
                                            ? Promise.resolve()
                                            : new Promise((resolve) => {
                                                imageElement.addEventListener("load", resolve, { once: true });
                                                imageElement.addEventListener("error", resolve, { once: true });
                                            })
                                    )));
                                } else {
                                    await waitForNextPaint(2);
                                }

                                await waitForNextPaint(2);
                                await sleep(TITLE_READY_VISIBLE_MS);
                            } catch (error) {
                                titleSceneMountElement.replaceChildren();
                                titleSceneMountElement.setAttribute("aria-hidden", "true");
                                console.warn("[Boot] title scene skipped:", error);
                            }
                        })(),
                        sleep(TITLE_MINIMUM_VISIBLE_MS)
                    ]);

                    await waitForNextPaint(2);
                }

                const stageIndexResponse = await fetch(`./stage-data/index.json?v=${SCENE_CONTRACT_VERSION}`, {
                    cache: "no-store",
                    headers: NGROK_BYPASS_HEADERS
                });
                if (!stageIndexResponse.ok) {
                    throw new Error(`Stage index load failed: ${stageIndexResponse.status}`);
                }

                const stageIndexPayload = await stageIndexResponse.json();
                const stageEntries = Array.isArray(stageIndexPayload?.maps)
                    ? [...stageIndexPayload.maps].sort(
                        (left, right) => (Number(left?.sequence) || 0) - (Number(right?.sequence) || 0)
                    )
                    : [];

                if (!stageEntries.length) {
                    throw new Error("stage-data/index.json에 사용할 스테이지가 없습니다.");
                }

                MAP_DEFINITIONS = stageEntries.map((stageEntry) => createStageCatalogDefinition(stageEntry));
                loadPersistedPixelAdminStageOverrides();
                rebuildRuntimeMapThemeOverrides();

                if (!window.__pixelAdminWindowMode) {
                    colorJewelUiPromise = ensureColorJewelSceneUi();
                }

                const initialMapIndex = getInitialMapIndex();
                await activateMapIndex(initialMapIndex, {
                    syncPixelAdmin: false,
                    renderPixelAdmin: false,
                    prepareUpcomingMap: !window.__pixelAdminWindowMode
                });
                if (!window.__pixelAdminWindowMode) {
                    void getStageClearContract();
                }
                if (CAN_WRITE_SHARED_STAGE_STATE) {
                    try {
                        const sharedStageBridgeProbeController = typeof AbortController === "function"
                            ? new AbortController()
                            : null;
                        const sharedStageBridgeProbeTimeout = sharedStageBridgeProbeController
                            ? window.setTimeout(() => {
                                sharedStageBridgeProbeController.abort();
                            }, 800)
                            : null;
                        const sharedStageBridgeProbeResponse = await fetch(SHARED_STAGE_STATE_HEALTH_URL, {
                            cache: "no-store",
                            signal: sharedStageBridgeProbeController?.signal
                        });
                        if (sharedStageBridgeProbeTimeout) {
                            window.clearTimeout(sharedStageBridgeProbeTimeout);
                        }
                        sharedStageBridgeAvailable = sharedStageBridgeProbeResponse.ok;
                    } catch (error) {
                        sharedStageBridgeAvailable = false;
                        sharedCurrentMapId = null;
                        sharedPixelAdminStageStorageCache = null;
                    }
                } else {
                    sharedStageBridgeAvailable = false;
                }
                bridgeStageSyncSeenAt = Date.now();
                scheduleBridgeStageSyncPoll(BRIDGE_STAGE_SYNC_POLL_MS);
                if (sharedStageBridgeAvailable) {
                    scheduleSharedStageStatePoll(600);
                }

                if (window.__pixelAdminWindowMode) {
                    if (appElement) {
                        appElement.style.display = "none";
                    }
                    await ensurePixelAdminReady({ open: true });
                    return;
                }

                await colorJewelUiPromise;
                initializeBottomActionButtons();
                bindTapActivation(mobilePrevMapCheatElement, () => {
                    window.dispatchEvent(new KeyboardEvent("keydown", {
                        key: "ArrowLeft",
                        code: "ArrowLeft",
                        shiftKey: true,
                        bubbles: true,
                        cancelable: true
                    }));
                });
                bindTapActivation(restartFromFirstMapButtonElement, () => {
                    void window.goToFirstPlayableLevelCheat?.();
                });
                bindTapActivation(mobileNextMapCheatElement, () => {
                    window.dispatchEvent(new KeyboardEvent("keydown", {
                        key: "ArrowRight",
                        code: "ArrowRight",
                        shiftKey: true,
                        bubbles: true,
                        cancelable: true
                    }));
                });
                const restoredRuntimeSnapshot = IS_NGROK_HOST
                    ? false
                    : await restoreRuntimeSnapshot();
                pushLifecycleDebugEntry("runtime-restore", {
                    restored: restoredRuntimeSnapshot
                });
                if (!restoredRuntimeSnapshot) {
                    clearPersistedGameProgress();
                    clearRuntimeSnapshot();
                    resetGame({
                        regenerateLevelStart: true,
                        fastLevelStart: true
                    });
                }
                hasCompletedInitialBoot = true;
            } catch (error) {
                console.error("[Boot] UI initialization failed:", error);
            } finally {
                hasCompletedInitialBoot = true;
                await titleMinimumVisiblePromise;

                if (titleLoadingOverlayElement?.classList.contains("active")) {
                    titleLoadingOverlayElement.classList.remove("active");
                    await sleep(TITLE_FADE_OUT_MS);
                    titleLoadingOverlayElement.setAttribute("aria-hidden", "true");
                } else if (titleLoadingOverlayElement) {
                    titleLoadingOverlayElement.setAttribute("aria-hidden", "true");
                }

                if (titleLoadingOverlayElement) {
                    titleLoadingOverlayElement.style.background = "transparent";
                }

                if (titleSceneRenderer) {
                    titleSceneRenderer.hide();
                    titleSceneRenderer = null;
                }

                if (titleSceneMountElement) {
                    titleSceneMountElement.replaceChildren();
                    titleSceneMountElement.setAttribute("aria-hidden", "true");
                }

                window.requestAnimationFrame(() => {
                    initializeBoardGestures();
                });
            }
        }

        syncLifecycleDebugGlobals();
        bootLifecycleDebug();
        void bootGame();

const MAX_GRID_ROWS = 30;
const MAX_GRID_COLS = 30;
const CURRENT_MAP_STORAGE_KEY = "color_jewel_current_map_v1";
const RUNTIME_SNAPSHOT_STORAGE_KEY = "color_jewel_runtime_snapshot_v2";
const SCENE_CONTRACT_VERSION = "20260616-2";
const MAX_COLOR_SATURATION = 65;
const POCKET_SIZE = 24;
const DEFAULT_ACTION_CHARGES = Object.freeze({
    magic: 3,
    clean: 2,
    magnet: 0
});
const PALETTE_COLOR_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const CARDINAL_DIRECTIONS = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
];
const DEFAULT_THEME_VARS = {
    "--body-bg": "#fffef6",
    "--app-bg": "#fffef6",
    "--grid-bg": "rgba(148, 163, 184, 0.08)",
    "--grid-line": "rgba(226, 232, 240, 0.9)"
};

let MAP_DEFINITIONS = [];
let MAP_THEME_OVERRIDES = {};
let currentMapIndex = 0;
let ACTIVE_MAP = null;
let TARGET_MAP = null;
let ROWS = 0;
let COLS = 0;
let TARGET_POSITIONS = [];
let TARGET_COLOR_COUNTS = {};
let INITIAL_LAYOUT_ORDER = [];
let INITIAL_LAYOUT_INDEX = new Map();
let TARGET_NEIGHBOR_PAIRS = [];
let TOTAL_TARGET_CELLS = 0;
let POCKET_UNLOCK_RULE = {};
let DEFAULT_BOARD_CELL_SIZE = 36;
let DEFAULT_TRAY_CELL_SIZE = 40;
let boardState = [];
let trayState = Array.from({ length: POCKET_SIZE }, () => 0);
let selected = null;
let solved = false;
let isAnimating = false;
let isStageTransitioning = false;
let cleanedSocketCells = new Set();
let completedColorIds = new Set();
let actionCharges = { ...DEFAULT_ACTION_CHARGES };
let actionOverlayState = null;
let celebrationTimers = [];
let stageClearTimers = [];
let currentLevelInitialState = null;
let gameSessionVersion = 0;
let preparedNextMapIndex = -1;
let preparedNextMapVersion = 0;
let preparedNextMapConfig = null;
let preparedNextLevelInitialState = null;
let preparedPreviousMapIndex = -1;
let preparedPreviousMapVersion = 0;
let preparedPreviousMapConfig = null;
let preparedPreviousLevelInitialState = null;
let preparedNextMapTimer = null;
let runtimePaletteSignature = "";

const jewelImageCache = new Map();
const shadeColorCache = new Map();
const COLOR_PALETTE = {
    1: { name: "루비", color: "#DF766D" },
    2: { name: "허니", color: "#E3BE7C" },
    3: { name: "리프", color: "#59D77D" },
    4: { name: "하늘", color: "#86B7E5" },
    5: { name: "로즈", color: "#ECA9B5" },
    6: { name: "코코아", color: "#A9744F" },
    7: { name: "에스프레소", color: "#5A3728" },
    8: { name: "사과 기본색", color: "#D8544C" },
    9: { name: "사과 광택", color: "#DC675C" },
    10: { name: "사과 반짝임", color: "#E6E08D" }
};

Object.values(COLOR_PALETTE).forEach((colorMeta) => {
    colorMeta.color = normalizeHexColor(colorMeta.color) || colorMeta.color;
});

const DEFAULT_COLOR_PALETTE = Object.fromEntries(
    Object.entries(COLOR_PALETTE).map(([colorId, colorMeta]) => [colorId, { ...colorMeta }])
);

function createPixelMap(rows, cols, fill = 0) {
    return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

function clonePixelMap(sourceMap = []) {
    return sourceMap.map((row) => [...row]);
}

function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value) {
    if (!value) {
        return null;
    }

    const trimmed = String(value).trim();
    const shortMatch = trimmed.match(/^#?([0-9a-f]{3})$/i);
    if (shortMatch) {
        return `#${shortMatch[1]
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
            .toUpperCase()}`;
    }

    const fullMatch = trimmed.match(/^#?([0-9a-f]{6})$/i);
    return fullMatch ? `#${fullMatch[1].toUpperCase()}` : null;
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

function escapeJsString(value) {
    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

function scaleMap(sourceMap, factor) {
    return sourceMap.flatMap((row) => {
        const scaledRow = row.flatMap((cell) => Array(factor).fill(cell));
        return Array.from({ length: factor }, () => [...scaledRow]);
    });
}

function toCellKey(row, col) {
    return `${row}:${col}`;
}

function getMapColorCounts(sourceMap) {
    return sourceMap.reduce((counts, row) => {
        row.forEach((cell) => {
            if (cell) {
                counts[cell] = (counts[cell] || 0) + 1;
            }
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
            if (countDiff) {
                return countDiff;
            }
            return ((left + seed) % PALETTE_COLOR_IDS.length) - ((right + seed) % PALETTE_COLOR_IDS.length);
        })
        .slice(0, count);
}

function chooseSpreadSeeds(cells, count, seed = 0) {
    if (!cells.length) {
        return [];
    }

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
            if (!cell) {
                return;
            }

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

function invalidatePreparedMapCaches() {
    if (preparedNextMapTimer) {
        window.clearTimeout(preparedNextMapTimer);
        preparedNextMapTimer = null;
    }
    preparedNextMapIndex = -1;
    preparedNextMapVersion = 0;
    preparedNextMapConfig = null;
    preparedNextLevelInitialState = null;
    preparedPreviousMapIndex = -1;
    preparedPreviousMapVersion = 0;
    preparedPreviousMapConfig = null;
    preparedPreviousLevelInitialState = null;
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

    const stageResponse = await fetch(`./stage-data/${stageEntry.file}?v=${SCENE_CONTRACT_VERSION}`);
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
        if (typeof window.applyPersistedPixelAdminStageOverride === "function") {
            window.applyPersistedPixelAdminStageOverride(definition);
        }
        rebuildRuntimeMapThemeOverrides();
        return definition;
    }).catch((error) => {
        definition.__stageLoadPromise = null;
        throw error;
    });

    return definition.__stageLoadPromise;
}

async function activateMapIndex(nextMapIndex = 0, options = {}) {
    await ensureStageDefinitionLoaded(nextMapIndex);
    syncActiveMap(nextMapIndex, options);
    return currentMapIndex;
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

function readPersistedCurrentMapId() {
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
        window.localStorage.setItem(CURRENT_MAP_STORAGE_KEY, mapId);
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
            String(stageEntry?.file || "").replace(/\.json$/i, "") ||
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

function getRequestedMapId() {
    const requestedMapId = new URLSearchParams(window.location.search).get("mapId");
    return requestedMapId && requestedMapId.trim() ? requestedMapId.trim() : null;
}

function getInitialMapIndex() {
    const targetMapId = getRequestedMapId() || readPersistedCurrentMapId() || "shiba";
    const restoredIndex = MAP_DEFINITIONS.findIndex((definition) => definition.id === targetMapId);
    return restoredIndex >= 0 ? restoredIndex : 0;
}

function getFirstPlayableMapIndex() {
    const tutorialIndex = MAP_DEFINITIONS.findIndex((definition) => definition.id === "tutorial");
    return tutorialIndex >= 0 ? tutorialIndex : 0;
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
    const initialBoardState = initialBoardStateRef ? padMapToGrid(initialBoardStateRef, rows, cols).map : null;
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
            if (!targetMap[neighbor.row]?.[neighbor.col]) {
                return;
            }
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
    const initialLayoutOffsets = initialLayoutOrder.map((position, index) => ({
        index,
        row: position.row,
        col: position.col
    }));

    const config = {
        ...definition,
        displayName: getStageResolvedDisplayName(definition),
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

function getCurrentMapDefinition() {
    return MAP_DEFINITIONS[currentMapIndex];
}

function syncActiveMap(nextMapIndex = 0, options = {}) {
    const {
        syncPixelAdmin = true,
        renderPixelAdmin = true
    } = options;
    currentMapIndex = ((nextMapIndex % MAP_DEFINITIONS.length) + MAP_DEFINITIONS.length) % MAP_DEFINITIONS.length;
    const currentDefinition = MAP_DEFINITIONS[currentMapIndex];
    persistCurrentMapId(currentDefinition.id);
    applyMapTheme(currentDefinition.id);
    ACTIVE_MAP = buildMapConfig(currentDefinition);
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

    if (syncPixelAdmin && typeof window.syncPixelAdminWithActiveMap === "function") {
        window.syncPixelAdminWithActiveMap(false, renderPixelAdmin);
    }
}

function cloneBoardSnapshot(boardSnapshot = []) {
    return clonePixelMap(boardSnapshot);
}

function clampActionChargesSnapshot(charges) {
    return {
        magic: Math.max(0, Number(charges?.magic || 0)),
        clean: Math.max(0, Number(charges?.clean || 0)),
        magnet: Math.max(0, Number(charges?.magnet || 0))
    };
}

function clearRuntimeSnapshot() {
    try {
        window.sessionStorage.removeItem(RUNTIME_SNAPSHOT_STORAGE_KEY);
        return true;
    } catch (error) {
        return false;
    }
}

function clearPersistedGameProgress() {
    return clearRuntimeSnapshot();
}

function clearSparkles() {
    return false;
}

function clearCelebrationTimers() {
    celebrationTimers = [];
    return false;
}

function clearSolvedStageFailSafeTimer() {
    return false;
}

function clearStageClearTimers() {
    stageClearTimers = [];
    return false;
}

function getCompletedColorIds() {
    return new Set();
}

function checkSolved() {
    return false;
}

function setStatus() {
    return false;
}

function render() {
    return false;
}

function persistRuntimeSnapshot() {
    return false;
}

function resetGame() {
    return false;
}

function triggerSolvedStageSequence() {
    return false;
}

async function bootStandalonePixelAdmin() {
    const stageIndexResponse = await fetch(`./stage-data/index.json?v=${SCENE_CONTRACT_VERSION}`);
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
    rebuildRuntimeMapThemeOverrides();
    await activateMapIndex(getInitialMapIndex(), {
        syncPixelAdmin: false,
        renderPixelAdmin: false
    });

    if (typeof window.loadPersistedPixelAdminStageOverrides === "function" && !window.__pixelAdminOverridesLoaded) {
        window.loadPersistedPixelAdminStageOverrides();
    }
    if (typeof window.setPixelAdminOpen === "function") {
        window.setPixelAdminOpen(true);
    }
    document.body.dataset.adminReady = "true";
}

window.bootStandalonePixelAdmin = bootStandalonePixelAdmin;

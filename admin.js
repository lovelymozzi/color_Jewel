const pixelAdminWindowMode = new URLSearchParams(window.location.search).get("adminWindow") === "1";
window.__pixelAdminWindowMode = pixelAdminWindowMode;
const PIXEL_ADMIN_FORCE_FIRST_MAP_RESET_STORAGE_KEY = "color_jewel_force_first_map_reset_v1";
const PIXEL_ADMIN_RESET_TO_FIRST_QUERY_PARAM = "resetToFirstMap";

const pixelAdminMarkup = `
<div class="pixel-admin-launcher">
    <button class="pixel-admin-toggle" id="pixelAdminToggle" type="button" aria-controls="pixelAdmin" aria-expanded="false">
        픽셀 어드민
    </button>
    <button class="pixel-admin-popout" id="pixelAdminPopout" type="button" aria-label="Open the pixel admin in a new window">
        Pop-out
    </button>
</div>

<aside class="pixel-admin" id="pixelAdmin" aria-hidden="true">
    <div class="pixel-admin-resize-handle" id="pixelAdminResizeHandle" aria-hidden="true"></div>
    <div class="pixel-admin-header">
        <div>
            <p class="pixel-admin-eyebrow">ADMIN</p>
            <h2 class="pixel-admin-title">Pixel Map Editor</h2>
            <p class="pixel-admin-stage" id="pixelAdminStage">현재 스테이지 픽셀 맵</p>
        </div>
        <button class="pixel-admin-close" id="pixelAdminClose" type="button" aria-label="픽셀 어드민 닫기">닫기</button>
    </div>

    <label class="pixel-admin-field pixel-admin-stage-editor" for="pixelAdminTitleInput">
        <span class="pixel-admin-field-label">제목</span>
        <input class="pixel-admin-input" id="pixelAdminTitleInput" type="text" maxlength="24" placeholder="스테이지 제목" />
    </label>

    <section class="pixel-admin-stage-create" aria-labelledby="pixelAdminCreateStageHeading">
        <div class="pixel-admin-stage-create-heading">
            <p class="pixel-admin-stage-create-eyebrow">NEW STAGE</p>
            <h3 class="pixel-admin-stage-create-title" id="pixelAdminCreateStageHeading">이미지로 새 배경 스테이지 만들기</h3>
        </div>
        <div class="pixel-admin-stage-create-source" role="radiogroup" aria-label="생성 소스">
            <label class="pixel-admin-source-card">
                <input id="pixelAdminCreateStageSourceUpload" type="radio" name="pixelAdminCreateStageSource" value="upload" checked />
                <span class="pixel-admin-source-copy">
                    <strong>이미지 업로드</strong>
                    <small>파일 선택, 드래그 앤 드롭, 클립보드 붙여넣기</small>
                </span>
            </label>
            <label class="pixel-admin-source-card">
                <input id="pixelAdminCreateStageSourceLlm" type="radio" name="pixelAdminCreateStageSource" value="llm" />
                <span class="pixel-admin-source-copy">
                    <strong>로컬 LLM</strong>
                    <small>A1111 txt2img로 이미지를 만든 뒤 바로 스테이지화</small>
                </span>
            </label>
        </div>
        <div class="pixel-admin-field pixel-admin-stage-create-file">
            <span class="pixel-admin-field-label">이미지 파일</span>
            <div class="pixel-admin-stage-create-file-box" id="pixelAdminCreateStageFileBox" role="button" tabindex="0" aria-controls="pixelAdminCreateStageFile" aria-label="이미지 파일 선택 또는 클립보드 이미지 붙여넣기">
                <button class="pixel-admin-action pixel-admin-stage-create-file-button" id="pixelAdminCreateStageFileButton" type="button">파일 선택</button>
                <span class="pixel-admin-stage-create-file-name" id="pixelAdminCreateStageFileName">선택된 파일 없음</span>
                <input class="pixel-admin-file-input" id="pixelAdminCreateStageFile" type="file" accept="image/*" />
            </div>
        </div>
        <div class="pixel-admin-stage-create-llm" id="pixelAdminCreateStageLlmPanel" hidden>
            <div class="pixel-admin-stage-create-grid">
                <label class="pixel-admin-field" for="pixelAdminCreateStageLlmEndpoint">
                    <span class="pixel-admin-field-label">LLM Endpoint</span>
                    <input class="pixel-admin-input" id="pixelAdminCreateStageLlmEndpoint" type="text" value="http://127.0.0.1:7860" />
                </label>
                <label class="pixel-admin-field" for="pixelAdminCreateStageLlmSteps">
                    <span class="pixel-admin-field-label">LLM Steps</span>
                    <input class="pixel-admin-input" id="pixelAdminCreateStageLlmSteps" type="number" min="5" max="60" inputmode="numeric" value="20" />
                </label>
                <label class="pixel-admin-field pixel-admin-field-wide" for="pixelAdminCreateStageLlmPrompt">
                    <span class="pixel-admin-field-label">LLM Prompt</span>
                    <textarea class="pixel-admin-textarea" id="pixelAdminCreateStageLlmPrompt" rows="3" placeholder="예: baby lion pixel art, centered, transparent background"></textarea>
                </label>
                <label class="pixel-admin-field pixel-admin-field-wide" for="pixelAdminCreateStageLlmNegativePrompt">
                    <span class="pixel-admin-field-label">Negative Prompt</span>
                    <textarea class="pixel-admin-textarea" id="pixelAdminCreateStageLlmNegativePrompt" rows="2" placeholder="예: text, watermark, frame, border, blurry"></textarea>
                </label>
            </div>
        </div>
        <input id="pixelAdminCreateStageSourceTitle" type="hidden" />
        <input id="pixelAdminCreateStageTitle" type="hidden" />
        <div class="pixel-admin-stage-create-grid">
            <label class="pixel-admin-field" for="pixelAdminCreateStageId">
                <span class="pixel-admin-field-label">새 스테이지 ID</span>
                <input class="pixel-admin-input" id="pixelAdminCreateStageId" type="text" maxlength="32" placeholder="예: desert_fox" />
            </label>
            <label class="pixel-admin-field" for="pixelAdminCreateStageSequence">
                <span class="pixel-admin-field-label">순서 (비우면 자동)</span>
                <input class="pixel-admin-input" id="pixelAdminCreateStageSequence" type="number" min="1" max="999" inputmode="numeric" placeholder="자동" />
            </label>
            <label class="pixel-admin-field" for="pixelAdminCreateStageColors">
                <span class="pixel-admin-field-label">색상 수</span>
                <input class="pixel-admin-input" id="pixelAdminCreateStageColors" type="number" min="2" max="12" inputmode="numeric" value="10" />
            </label>
        </div>
        <div class="pixel-admin-stage-create-options">
            <label class="pixel-admin-check">
                <input id="pixelAdminCreateStageGrid" type="checkbox" />
                <span>격자 이미지를 직접 읽기</span>
            </label>
            <label class="pixel-admin-check">
                <input id="pixelAdminCreateStageDither" type="checkbox" checked />
                <span>디더링 유지</span>
            </label>
            <label class="pixel-admin-field" for="pixelAdminCreateStageBgMode">
                <span class="pixel-admin-field-label">배경 처리</span>
                <select class="pixel-admin-input" id="pixelAdminCreateStageBgMode">
                    <option value="auto">모서리 색 자동 제거</option>
                    <option value="none">배경 유지</option>
                    <option value="hex">특정 HEX 제거</option>
                </select>
            </label>
            <label class="pixel-admin-field" for="pixelAdminCreateStageBgColor">
                <span class="pixel-admin-field-label">배경 HEX</span>
                <input class="pixel-admin-input" id="pixelAdminCreateStageBgColor" type="text" maxlength="7" placeholder="#FFFFFF" />
            </label>
        </div>
        <div class="pixel-admin-stage-create-actions">
            <button class="pixel-admin-action pixel-admin-stage-create-button" id="pixelAdminCreateStage" type="button">미리보기 불러오기</button>
            <button class="pixel-admin-action pixel-admin-stage-create-button" id="pixelAdminCommitStage" type="button">최종 맵 저장</button>
            <button class="pixel-admin-action pixel-admin-stage-create-button" id="pixelAdminCancelStagePreview" type="button">미리보기 취소</button>
        </div>
        <p class="pixel-admin-stage-create-note" id="pixelAdminCreateStageNote">이미지 업로드나 로컬 LLM 생성 결과를 새 정식 스테이지로 저장할 수 있어요. LLM은 A1111 로컬 서버가 켜져 있어야 합니다.</p>
    </section>

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
    <p class="pixel-admin-note" id="pixelAdminMessage">분리된 어드민 창에서 스테이지를 편집할 수 있습니다.</p>
</aside>
`;

if (!document.getElementById("pixelAdminToggle")) {
    document.body.insertAdjacentHTML("beforeend", pixelAdminMarkup);
}

if (pixelAdminWindowMode) {
    document.body.classList.add("pixel-admin-window-mode");
}

const PIXEL_ADMIN_UNDO_LIMIT = 60;

const PIXEL_ADMIN_AUTO_SAVE_DELAY_MS = 500;

function getSharedStageStateSyncPayload(storagePayload = readPixelAdminStageStorage()) {
            const activeMapId =
                pixelAdminState.currentMapId ||
                getCurrentMapDefinition()?.id ||
                null;
            const rawActiveOverride =
                activeMapId &&
                storagePayload?.[activeMapId] &&
                typeof storagePayload[activeMapId] === "object" &&
                !Array.isArray(storagePayload[activeMapId])
                    ? storagePayload[activeMapId]
                    : null;
            const activeOverride = rawActiveOverride
                ? {
                    overrideVersion: rawActiveOverride.overrideVersion,
                    displayName: rawActiveOverride.displayName,
                    map: rawActiveOverride.map,
                    palette: rawActiveOverride.palette
                }
                : null;

            return {
                currentMapId: activeMapId,
                activeOverrideMapId: activeOverride ? activeMapId : null,
                activeOverride
            };
        }

        function syncSharedStageState(storagePayload = readPixelAdminStageStorage()) {
            if (!CAN_WRITE_SHARED_STAGE_STATE) {
                return;
            }

            void fetch(SHARED_STAGE_STATE_BRIDGE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(getSharedStageStateSyncPayload(storagePayload))
            }).catch((error) => {
                console.error("[PixelAdmin] failed to sync shared stage state", error);
            });
        }

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

        function romanizePixelAdminStageTitle(value) {
            const normalizedValue = normalizeStageDisplayName(value).normalize("NFC");
            if (!normalizedValue) {
                return "";
            }

            const exactTranslations = {
                "무당벌레": "Ladybug",
                "아기 사자": "Baby Lion",
                "아기사자": "Baby Lion",
                "시바견": "Shiba",
                "당근": "Carrot",
                "바다거북": "Sea Turtle",
                "보물상자": "Treasure Chest",
                "마법모자": "Magic Hat"
            };
            const exactMatch = exactTranslations[normalizedValue.replace(/\s+/g, " ").trim()];
            if (exactMatch) {
                return normalizeStageDisplayName(exactMatch);
            }

            const leadRomanization = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
            const vowelRomanization = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
            const tailRomanization = ["", "k", "k", "ks", "n", "nj", "nh", "t", "l", "lk", "lm", "lb", "ls", "lt", "lp", "lh", "m", "p", "ps", "t", "t", "ng", "t", "t", "k", "t", "p", "h"];

            let romanized = "";
            for (const character of normalizedValue) {
                const codePoint = character.charCodeAt(0);
                if (codePoint >= 0xac00 && codePoint <= 0xd7a3) {
                    const syllableIndex = codePoint - 0xac00;
                    const leadIndex = Math.floor(syllableIndex / 588);
                    const vowelIndex = Math.floor((syllableIndex % 588) / 28);
                    const tailIndex = syllableIndex % 28;
                    romanized += `${leadRomanization[leadIndex]}${vowelRomanization[vowelIndex]}${tailRomanization[tailIndex]}`;
                    continue;
                }

                romanized += /[a-z0-9]/i.test(character) ? character : " ";
            }

            return normalizeStageDisplayName(
                romanized
                    .replace(/[^a-z0-9]+/gi, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .replace(/\b[a-z]/g, (match) => match.toUpperCase())
            );
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
                "諛곌꼍?됱쓣 蹂대㈃??蹂댁꽍???쒖옄由щ줈 ?뺣━??蹂댁꽭??";
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
                    syncSharedStageState({});
                    return true;
                }

                window.localStorage.setItem(
                    PIXEL_ADMIN_STAGE_STORAGE_KEY,
                    JSON.stringify(storagePayload)
                );
                pixelAdminStageStorageCache = storagePayload;
                syncSharedStageState(storagePayload);
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

        function applyPersistedPixelAdminStageOverride(definition) {
            if (!definition?.id || !isStageDefinitionLoaded(definition)) {
                return false;
            }

            const storagePayload = readPixelAdminStageStorage();
            const override = storagePayload[definition.id];
            if (!override || typeof override !== "object") {
                return false;
            }

            let didMutateStorage = false;
            if ((Number(override.overrideVersion) || 1) !== getStageOverrideVersion(definition)) {
                delete storagePayload[definition.id];
                didMutateStorage = true;
            } else {
                const normalizedMap = normalizeStoredPixelAdminMap(override.map);
                if (!normalizedMap) {
                    delete storagePayload[definition.id];
                    didMutateStorage = true;
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

            if (pixelAdminState.createStagePreview) {
                return true;
            }

            if (!pixelAdminState.isDirty && !pixelAdminState.exportIsDirty) {
                return true;
            }

            try {
                syncPixelAdminDraftFromExportInput();
            } catch (error) {
                if (showFailureMessage) {
                    pixelAdminState.message = error.message || "?먮룞 ??μ뿉 ?ㅽ뙣?덉뼱??";
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
                pixelAdminState.message = "?먮룞 ??μ뿉 ?ㅽ뙣?덉뼱??";
                renderPixelAdmin();
            }

            return false;
        }

        function schedulePixelAdminAutoSave(delayMs = PIXEL_ADMIN_AUTO_SAVE_DELAY_MS) {
            clearPixelAdminAutoSaveTimer();

            if (pixelAdminState.createStagePreview || !pixelAdminState.currentMapId || !pixelAdminState.draftMap) {
                return;
            }

            pixelAdminAutoSaveTimer = window.setTimeout(() => {
                pixelAdminAutoSaveTimer = null;
                persistPixelAdminDraftState();
            }, delayMs);
        }

        function getPixelAdminCreateStageRequestDraft() {
            const requestedSequence = Math.max(0, Number(pixelAdminCreateStageSequenceElement?.value) || 0);
            const rawDisplayName = requestedSequence
                ? String(pixelAdminCreateStageTitleElement?.value || "").replace(
                      new RegExp(`^\\s*0*${requestedSequence}(?:\\s*[._-]\\s*|\\s+)`),
                      ""
                  )
                : pixelAdminCreateStageTitleElement?.value || "";
            const displayName = normalizeStageDisplayName(rawDisplayName || pixelAdminState.draftDisplayName || "");
            const stageId = normalizePixelAdminGeneratedStageId(
                pixelAdminCreateStageIdElement?.value,
                displayName
            );
            return {
                createSource: pixelAdminCreateStageSourceLlmElement?.checked ? "llm" : "upload",
                imageFile: pixelAdminCreateStageFileElement?.files?.[0] || null,
                requestedSequence,
                displayName,
                stageId,
                backgroundHex: normalizeHexColor(pixelAdminCreateStageBgColorElement?.value || ""),
                backgroundMode: String(pixelAdminCreateStageBgModeElement?.value || "auto"),
            };
        }

        function loadPixelAdminCreateStagePreview(stageEntry, stagePayload, warningMessage = "") {
            const previewMap = normalizeStoredPixelAdminMap(stagePayload?.imageMap);
            if (!previewMap) {
                throw new Error("미리보기 맵 데이터를 읽지 못했어요.");
            }

            const previewPalette = Object.fromEntries(
                Object.entries(stagePayload?.palette || {})
                    .map(([colorId, color]) => [
                        Number(colorId),
                        {
                            color: normalizeHexColor(typeof color === "string" ? color : color?.color) || "#CCCCCC"
                        }
                    ])
                    .filter(([colorId, colorMeta]) => Number.isFinite(colorId) && colorId > 0 && colorMeta.color)
            );
            const previewOrigin = pixelAdminState.createStagePreview?.origin || {
                currentMapId: pixelAdminState.currentMapId,
                draftMap: clonePixelMap(pixelAdminState.draftMap || []),
                draftPalette: clonePaletteMeta(pixelAdminState.draftPalette || {}),
                draftDisplayName: pixelAdminState.draftDisplayName || "",
                selectedColorId: pixelAdminState.selectedColorId,
                isDirty: pixelAdminState.isDirty,
                exportIsDirty: pixelAdminState.exportIsDirty,
                exportNeedsRefresh: pixelAdminState.exportNeedsRefresh
            };

            clearPixelAdminAutoSaveTimer();
            pixelAdminState.createStagePreview = {
                origin: previewOrigin,
                stageEntry: { ...(stageEntry || {}) }
            };
            pixelAdminState.draftMap = clonePixelMap(previewMap);
            pixelAdminState.draftPalette = clonePaletteMeta(previewPalette);
            pixelAdminState.draftDisplayName = normalizeStageDisplayName(
                stageEntry?.displayNameNumbered || stageEntry?.displayName || stagePayload?.displayName || ""
            );
            pixelAdminState.undoStack = [];
            pixelAdminInteraction.strokeSnapshot = null;
            pixelAdminState.selectedColorId = getResolvedPixelAdminSelection(
                pixelAdminState.currentMapId,
                0,
                pixelAdminState.draftMap,
                pixelAdminState.draftPalette
            );
            pixelAdminState.isDirty = false;
            pixelAdminState.exportIsDirty = false;
            pixelAdminState.exportNeedsRefresh = true;
            if (pixelAdminState.createStagePreview && pixelAdminCreateStageTitleElement) {
                pixelAdminCreateStageTitleElement.value = pixelAdminState.draftDisplayName;
                if (pixelAdminCreateStageIdElement && !pixelAdminCreateStageIdElement.dataset.userEdited) {
                    pixelAdminCreateStageIdElement.value = normalizePixelAdminGeneratedStageId("", pixelAdminState.draftDisplayName);
                }
            }
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.createStageStatus = warningMessage
                ? `${stageEntry?.displayNameNumbered || stageEntry?.displayName || "새 맵"} 미리보기를 불러왔어요. ${warningMessage}`
                : `${stageEntry?.displayNameNumbered || stageEntry?.displayName || "새 맵"} 미리보기를 불러왔어요. 하단 격자를 수정한 뒤 최종 맵 저장을 눌러 주세요.`;
            pixelAdminState.message = "새 맵 미리보기입니다. 하단 격자를 수정한 뒤 최종 맵 저장을 눌러 주세요.";
            if (pixelAdminCreateStageTitleElement) {
                pixelAdminCreateStageTitleElement.value =
                    stageEntry?.displayNameNumbered || stageEntry?.displayName || pixelAdminCreateStageTitleElement.value;
            }
            if (pixelAdminCreateStageIdElement) {
                pixelAdminCreateStageIdElement.value = stageEntry?.id || pixelAdminCreateStageIdElement.value;
            }
            if (pixelAdminCreateStageSequenceElement && stageEntry?.sequence) {
                pixelAdminCreateStageSequenceElement.value = String(stageEntry.sequence);
            }
            renderPixelAdmin();
        }

        function cancelPixelAdminCreateStagePreview() {
            const previewSession = pixelAdminState.createStagePreview;
            pixelAdminState.createStagePreview = null;
            clearPixelAdminAutoSaveTimer();

            if (!previewSession?.origin?.draftMap?.length) {
                syncPixelAdminWithActiveMap(true, false);
                pixelAdminState.deferHeavyRender = true;
                pixelAdminState.createStageStatus = "새 맵 미리보기를 취소했어요.";
                pixelAdminState.message = "현재 스테이지 편집으로 돌아왔어요.";
                renderPixelAdmin();
                return;
            }

            pixelAdminState.currentMapId = previewSession.origin.currentMapId;
            pixelAdminState.draftMap = clonePixelMap(previewSession.origin.draftMap);
            pixelAdminState.draftPalette = clonePaletteMeta(previewSession.origin.draftPalette);
            pixelAdminState.draftDisplayName = previewSession.origin.draftDisplayName || "";
            pixelAdminState.selectedColorId = previewSession.origin.selectedColorId || 0;
            pixelAdminState.isDirty = previewSession.origin.isDirty === true;
            pixelAdminState.exportIsDirty = previewSession.origin.exportIsDirty === true;
            pixelAdminState.exportNeedsRefresh = previewSession.origin.exportNeedsRefresh !== false;
            pixelAdminState.undoStack = [];
            pixelAdminInteraction.strokeSnapshot = null;
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.createStageStatus = "새 맵 미리보기를 취소했어요.";
            pixelAdminState.message = "현재 스테이지 편집으로 돌아왔어요.";
            renderPixelAdmin();
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
const PIXEL_ADMIN_STAGE_BRIDGE_URL_CANDIDATES = window.location.protocol === "file:"
    ? ["http://127.0.0.1:8765"]
    : Array.from(new Set([window.location.origin, "http://127.0.0.1:8765"]));
const PIXEL_ADMIN_STAGE_BRIDGE_HEADERS = window.location.hostname.includes("ngrok")
    ? { "ngrok-skip-browser-warning": "true" }
    : {};
const PIXEL_ADMIN_STAGE_CATALOG_REFRESH_KEY = "color_jewel_stage_catalog_refresh_v1";

const pixelAdminElement = document.getElementById("pixelAdmin");
        const pixelAdminToggleElement = document.getElementById("pixelAdminToggle");
        const pixelAdminCloseElement = document.getElementById("pixelAdminClose");
        const pixelAdminStageElement = document.getElementById("pixelAdminStage");
        const pixelAdminTitleInputElement = document.getElementById("pixelAdminTitleInput");
        const pixelAdminCreateStageSourceUploadElement = document.getElementById("pixelAdminCreateStageSourceUpload");
        const pixelAdminCreateStageSourceLlmElement = document.getElementById("pixelAdminCreateStageSourceLlm");
        const pixelAdminCreateStageFileElement = document.getElementById("pixelAdminCreateStageFile");
        const pixelAdminCreateStageFileBoxElement = document.getElementById("pixelAdminCreateStageFileBox");
        const pixelAdminCreateStageFileButtonElement = document.getElementById("pixelAdminCreateStageFileButton");
        const pixelAdminCreateStageFileNameElement = document.getElementById("pixelAdminCreateStageFileName");
        const pixelAdminCreateStageLlmPanelElement = document.getElementById("pixelAdminCreateStageLlmPanel");
        const pixelAdminCreateStageLlmEndpointElement = document.getElementById("pixelAdminCreateStageLlmEndpoint");
        const pixelAdminCreateStageLlmStepsElement = document.getElementById("pixelAdminCreateStageLlmSteps");
        const pixelAdminCreateStageLlmPromptElement = document.getElementById("pixelAdminCreateStageLlmPrompt");
        const pixelAdminCreateStageLlmNegativePromptElement = document.getElementById("pixelAdminCreateStageLlmNegativePrompt");
        const pixelAdminCreateStageSourceTitleElement = document.getElementById("pixelAdminCreateStageSourceTitle");
        const pixelAdminCreateStageTitleElement = document.getElementById("pixelAdminCreateStageTitle");
        const pixelAdminCreateStageIdElement = document.getElementById("pixelAdminCreateStageId");
        const pixelAdminCreateStageSequenceElement = document.getElementById("pixelAdminCreateStageSequence");
        const pixelAdminCreateStageColorsElement = document.getElementById("pixelAdminCreateStageColors");
        const pixelAdminCreateStageGridElement = document.getElementById("pixelAdminCreateStageGrid");
        const pixelAdminCreateStageDitherElement = document.getElementById("pixelAdminCreateStageDither");
        const pixelAdminCreateStageBgModeElement = document.getElementById("pixelAdminCreateStageBgMode");
        const pixelAdminCreateStageBgColorElement = document.getElementById("pixelAdminCreateStageBgColor");
        const pixelAdminCreateStageElement = document.getElementById("pixelAdminCreateStage");
        const pixelAdminCommitStageElement = document.getElementById("pixelAdminCommitStage");
        const pixelAdminCancelStagePreviewElement = document.getElementById("pixelAdminCancelStagePreview");
        const pixelAdminCreateStageNoteElement = document.getElementById("pixelAdminCreateStageNote");
        const pixelAdminCreateStagePanelElement = pixelAdminCreateStageNoteElement?.closest?.(".pixel-admin-stage-create") || null;
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
const pixelAdminPopoutElement = document.getElementById("pixelAdminPopout");

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
            createStageBusy: false,
            createStagePreview: null,
            createStageStatus:
                "이미지 업로드나 로컬 LLM 생성 결과를 새 정식 스테이지로 저장할 수 있어요. LLM은 A1111 로컬 서버가 켜져 있어야 합니다.",
            message: "분리된 어드민 창에서 스테이지를 편집할 수 있습니다."
        };
window.__pixelAdminState = pixelAdminState;
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
                return "吏?곌컻";
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

        function normalizePixelAdminGeneratedStageId(value, fallback = "") {
            return String(value || fallback || "")
                .replace(/^\s*\d{1,3}(?:\s*[._-]\s*|\s+)/, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .replace(/_+/g, "_")
                .slice(0, 32);
        }

        function getPixelAdminSuggestedStageTitleFromFileName(fileName, sequence = "") {
            const baseTitle = normalizeStageDisplayName(
                String(fileName || "")
                    .replace(/\.[^.]+$/, "")
                    .replace(/[_-]+/g, " ")
                    .replace(/^\s*\d{1,3}(?:\s*[._-]\s*|\s+)/, "")
            );
            const normalizedSequence = Math.max(0, Number(sequence) || 0);
            if (!baseTitle || !normalizedSequence) {
                return baseTitle;
            }

            return normalizeStageDisplayName(`${String(normalizedSequence).padStart(2, "0")}. ${baseTitle}`);
        }

        function readPixelAdminFileAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    const result = String(reader.result || "");
                    const commaIndex = result.indexOf(",");
                    resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
                });
                reader.addEventListener("error", () => {
                    reject(reader.error || new Error("이미지 파일을 읽지 못했어요."));
                });
                reader.readAsDataURL(file);
            });
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
            if (currentSelection === 0) {
                return 0;
            }

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
                throw new Error("?붾젅??肄붾뱶 ?뺤떇???댄빐?섏? 紐삵뻽?댁슂.");
            }

            entryMatches.forEach((match) => {
                const colorId = Number(match[1]);
                if (colorId === 0) {
                    throw new Error("C0? 鍮덉뭏 ?꾩슜?댁뿉?? 諛앹? ?곸뿭??C1 ?댁긽???됱긽?쇰줈 ?ｌ뼱 二쇱꽭??");
                }
                const normalized = normalizeHexColor(match[2]);
                if (!normalized) {
                    throw new Error(`C${colorId} ?됱긽? 6?먮━ HEX?ъ빞 ?댁슂.`);
                }
                palette[colorId] = { color: normalized };
            });

            return palette;
        }

        function parsePixelAdminMatrixBlock(block) {
            const rowMatches = [...block.matchAll(/\[([^\[\]]*?)\]/g)];

            if (!rowMatches.length) {
                throw new Error("留ㅽ듃由?뒪 ?됱쓣 李얠? 紐삵뻽?댁슂.");
            }

            const rows = rowMatches.map((match) => {
                const row = match[1]
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                    .map((value) => {
                        if (!/^-?\d+$/.test(value)) {
                            throw new Error(`?レ옄媛 ?꾨땶 ????덉뼱?? ${value}`);
                        }
                        return Number(value);
                    });

                if (!row.length) {
                    throw new Error("鍮꾩뼱 ?덈뒗 ?됱씠 ?덉뼱??");
                }

                return row;
            });

            const columnCount = rows[0].length;
            if (rows.some((row) => row.length !== columnCount)) {
                throw new Error("紐⑤뱺 ?됱쓽 移??섍? 媛숈븘???댁슂.");
            }

            if (rows.length > MAX_GRID_ROWS || columnCount > MAX_GRID_COLS) {
                throw new Error(`留ㅽ듃由?뒪媛 ?덈Т 而ㅼ슂. 理쒕? ${MAX_GRID_ROWS}x${MAX_GRID_COLS}源뚯? 媛?ν빐??`);
            }

            return rows;
        }

        function parsePixelAdminExport(text, mapId) {
            const source = String(text || "").trim();
            if (!source) {
                throw new Error("肄붾뱶 李쎌씠 鍮꾩뼱 ?덉뼱??");
            }

            const paletteMatch = source.match(/const\s+[A-Z0-9_]+_PALETTE\s*=\s*\{([\s\S]*?)\};/);
            const matrixName = getPixelAdminExportName(mapId);
            const matrixMatch =
                source.match(new RegExp(`const\\s+${matrixName}\\s*=\\s*\\[([\\s\\S]*?)\\];`)) ||
                source.match(/const\s+[A-Z0-9_]+\s*=\s*\[([\s\S]*?)\];/);

            if (!matrixMatch) {
                throw new Error("留ㅽ듃由?뒪 const 釉붾줉??李얠? 紐삵뻽?댁슂.");
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
            pixelAdminState.message = `${getDefaultPixelAdminColorLabel(pixelAdminState.currentMapId, colorId)} ?됱긽???섏젙?덉뼱??`;
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
            pixelAdminState.message = "?ㅽ뀒?댁? ?쒕ぉ???섏젙?덉뼱?? ?좎떆 ???먮룞 ??λ맗?덈떎.";
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
            pixelAdminState.message = `C${nextColorId} ?됱긽???붾젅?몄뿉 異붽??덉뼱??`;
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
                ? `C${colorId} ?됱긽????젣?섍퀬 ${erasedCellCount}媛????鍮꾩썱?댁슂.`
                : `C${colorId} ?됱긽???붾젅?몄뿉????젣?덉뼱??`;
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
            pixelAdminState.message = "분리된 어드민 창에서 스테이지를 편집할 수 있습니다.";
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
            if (pixelAdminWindowMode) {
                renderPixelAdmin();
                return;
            }
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
            setPixelAdminOpen(pixelAdminWindowMode ? true : !pixelAdminState.isOpen);
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
                void goToFirstPlayableLevelCheat();
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
                `${rowIndex + 1}??${colIndex + 1}??${getPixelAdminColorLabel(mapId, colorId, paletteMeta)} ?쎌?`
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
            const nextMessage = `${rowIndex + 1}??${colIndex + 1}?댁쓣 ${getPixelAdminColorLabel(
                pixelAdminState.currentMapId,
                colorId,
                pixelAdminState.draftPalette
            )}濡?移좏뻽?댁슂.`;
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
                pixelAdminState.message = error.message || "肄붾뱶 ?댁슜???곸슜?섏? 紐삵뻽?댁슂.";
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
            flushPendingPixelAdminStageStorage();
            syncActiveMap(currentMapIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            if (pixelAdminWindowMode) {
                syncPixelAdminWithActiveMap(true, false);
                pixelAdminState.isDirty = false;
                pixelAdminState.exportIsDirty = false;
                pixelAdminState.deferHeavyRender = true;
                pixelAdminState.message = didPersist
                    ? "????쎈?????筌?뗀苡??? ?遺얠쟿??癰궰野껋럩沅?????怨몄뒠??랁????館六??곸뒄."
                    : "????쎈?????筌?뗀苡??? ?遺얠쟿??癰궰野껋럩沅?????怨몄뒠???筌????關肉????쎈솭??됰선??";
                renderPixelAdmin();
                return;
            }
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
                ? "???ㅽ뀒?댁???罹붾쾭?ㅼ? ?붾젅??蹂寃쎌궗??쓣 ?곸슜?섍퀬 ??ν뻽?댁슂."
                : "???ㅽ뀒?댁???罹붾쾭?ㅼ? ?붾젅??蹂寃쎌궗??쓣 ?곸슜?덉?留???μ뿉???ㅽ뙣?덉뼱??";
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
            flushPendingPixelAdminStageStorage();
            syncActiveMap(currentMapIndex, {
                syncPixelAdmin: false,
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            if (pixelAdminWindowMode) {
                syncPixelAdminWithActiveMap(true, false);
                pixelAdminState.exportIsDirty = false;
                pixelAdminState.deferHeavyRender = true;
                pixelAdminState.message = "湲곕낯 罹붾쾭?ㅼ? ?붾젅?몃줈 蹂듭썝?덉뼱??";
                renderPixelAdmin();
                return;
            }
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

        async function goToMapIndexFromAdmin(nextMapIndex, options = {}) {
            const {
                message = "",
                preparedDirection = null
            } = options;

            persistPixelAdminDraftState({ shouldRender: false });
            clearRuntimeSnapshot();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            clearCelebrationTimers();
            isStageTransitioning = false;
            selected = null;
            await activateMapIndex(nextMapIndex, {
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });

            if (
                preparedDirection === "next" &&
                preparedNextMapIndex === nextMapIndex &&
                preparedNextMapVersion === getStageOverrideVersion(getCurrentMapDefinition()) &&
                preparedNextLevelInitialState?.mapId === ACTIVE_MAP?.id
            ) {
                currentLevelInitialState = {
                    mapId: preparedNextLevelInitialState.mapId,
                    rows: preparedNextLevelInitialState.rows,
                    cols: preparedNextLevelInitialState.cols,
                    boardState: cloneBoardSnapshot(preparedNextLevelInitialState.boardState),
                    trayState: [...preparedNextLevelInitialState.trayState],
                    cleanedSocketCells: [...(preparedNextLevelInitialState.cleanedSocketCells || [])],
                    actionCharges: clampActionChargesSnapshot(preparedNextLevelInitialState.actionCharges)
                };
            } else if (
                preparedDirection === "previous" &&
                preparedPreviousMapIndex === nextMapIndex &&
                preparedPreviousMapVersion === getStageOverrideVersion(getCurrentMapDefinition()) &&
                preparedPreviousLevelInitialState?.mapId === ACTIVE_MAP?.id
            ) {
                currentLevelInitialState = {
                    mapId: preparedPreviousLevelInitialState.mapId,
                    rows: preparedPreviousLevelInitialState.rows,
                    cols: preparedPreviousLevelInitialState.cols,
                    boardState: cloneBoardSnapshot(preparedPreviousLevelInitialState.boardState),
                    trayState: [...preparedPreviousLevelInitialState.trayState],
                    cleanedSocketCells: [...(preparedPreviousLevelInitialState.cleanedSocketCells || [])],
                    actionCharges: clampActionChargesSnapshot(preparedPreviousLevelInitialState.actionCharges)
                };
            } else {
                currentLevelInitialState = null;
            }

            if (pixelAdminWindowMode) {
                syncPixelAdminWithActiveMap(true, false);
                pixelAdminState.deferHeavyRender = true;
                pixelAdminState.message =
                    message ||
                    `?꾩옱 ?ㅽ뀒?댁?瑜?${getMapDisplayName(getCurrentMapDefinition().id)}濡??대룞?덉뼱??`;
                renderPixelAdmin();
                return;
            }
            pixelAdminState.pendingGameReset = null;
            resetGame({
                regenerateLevelStart: !currentLevelInitialState,
                fastLevelStart: !currentLevelInitialState,
                persistLevelStart: false
            });
            syncPixelAdminWithActiveMap(true, false);
            pixelAdminState.deferHeavyRender = true;
            pixelAdminState.message =
                message ||
                `현재 스테이지를 ${getMapDisplayName(getCurrentMapDefinition().id)}로 이동했어요.`;
            renderPixelAdmin();
        }

        async function createPixelAdminStageFromImage() {
            const createSource = pixelAdminCreateStageSourceLlmElement?.checked ? "llm" : "upload";
            const imageFile = pixelAdminCreateStageFileElement?.files?.[0] || null;
            if (createSource !== "llm" && !imageFile) {
                pixelAdminState.createStageStatus = "먼저 이미지 파일을 골라 주세요.";
                renderPixelAdmin();
                return;
            }
            if (createSource === "llm" && !String(pixelAdminCreateStageLlmPromptElement?.value || "").trim()) {
                pixelAdminState.createStageStatus = "LLM 프롬프트를 입력해 주세요.";
                renderPixelAdmin();
                return;
            }

            const requestedSequence = Math.max(0, Number(pixelAdminCreateStageSequenceElement?.value) || 0);
            const displayName = normalizeStageDisplayName(
                requestedSequence
                    ? String(pixelAdminCreateStageTitleElement?.value || "").replace(
                          new RegExp(`^\\s*0*${requestedSequence}(?:\\s*[._-]\\s*|\\s+)`),
                          ""
                      )
                    : pixelAdminCreateStageTitleElement?.value || ""
            );
            if (!displayName) {
                pixelAdminState.createStageStatus = "제목을 입력해 주세요.";
                renderPixelAdmin();
                return;
            }

            const stageId = normalizePixelAdminGeneratedStageId(
                pixelAdminCreateStageIdElement?.value,
                displayName
            );
            if (!stageId) {
                pixelAdminState.createStageStatus = "새 스테이지 ID는 영문/숫자로 만들어 주세요.";
                renderPixelAdmin();
                return;
            }

            const backgroundHex = normalizeHexColor(pixelAdminCreateStageBgColorElement?.value || "");
            const backgroundMode = String(pixelAdminCreateStageBgModeElement?.value || "auto");
            if (backgroundMode === "hex" && !backgroundHex) {
                pixelAdminState.createStageStatus = "HEX 배경 제거를 쓰려면 #RRGGBB 값을 넣어 주세요.";
                renderPixelAdmin();
                return;
            }

            pixelAdminState.createStageBusy = true;
            pixelAdminState.createStageStatus =
                createSource === "llm"
                    ? "로컬 LLM으로 이미지를 만들고 새 스테이지 파일을 만드는 중이에요."
                    : "이미지를 픽셀화하고 새 스테이지 파일을 만드는 중이에요.";
            renderPixelAdmin();

            try {
                const imageBase64 = createSource === "llm" ? "" : await readPixelAdminFileAsBase64(imageFile);
                const requestBody = JSON.stringify({
                    sourceType: createSource,
                    imageName: imageFile?.name || "",
                    imageBase64,
                    displayName,
                    stageId,
                    sequence: pixelAdminCreateStageSequenceElement?.value || "",
                    colors: pixelAdminCreateStageColorsElement?.value || 10,
                    grid: createSource === "llm" ? false : pixelAdminCreateStageGridElement?.checked === true,
                    dither: pixelAdminCreateStageDitherElement?.checked !== false,
                    bgMode: backgroundMode,
                    bgColor: backgroundHex,
                    llmEndpoint: pixelAdminCreateStageLlmEndpointElement?.value || "",
                    llmPrompt: pixelAdminCreateStageLlmPromptElement?.value || "",
                    llmNegativePrompt: pixelAdminCreateStageLlmNegativePromptElement?.value || "",
                    llmSteps: pixelAdminCreateStageLlmStepsElement?.value || 20
                });
                let responsePayload = null;
                let lastBridgeError = null;
                for (const bridgeUrl of PIXEL_ADMIN_STAGE_BRIDGE_URL_CANDIDATES) {
                    try {
                        const response = await fetch(`${bridgeUrl}/api/create-stage-from-image`, {
                            method: "POST",
                            headers: {
                                ...PIXEL_ADMIN_STAGE_BRIDGE_HEADERS,
                                "Content-Type": "application/json"
                            },
                            body: requestBody
                        });
                        const responseContentType = String(response.headers.get("Content-Type") || "");
                        if (!responseContentType.includes("application/json")) {
                            throw new Error(`Bridge request returned ${response.status} without JSON.`);
                        }
                        responsePayload = await response.json();
                        if (!response.ok || !responsePayload?.ok) {
                            throw new Error(responsePayload?.error || `釉뚮━吏 ?붿껌???ㅽ뙣?덉뼱?? (${response.status})`);
                        }
                        lastBridgeError = null;
                        break;
                    } catch (error) {
                        lastBridgeError = error;
                    }
                }
                if (lastBridgeError?.message === "Failed to fetch") {
                    lastBridgeError = new Error(
                        "이미지 업로드용 로컬 변환 서버에 연결하지 못했어요. 127.0.0.1:7860과는 무관하고, `autoplay_http_server.py`로 페이지를 열었는지 또는 `run_stage_image_bridge.ps1` 브리지가 켜져 있는지 확인해 주세요."
                    );
                }
                if (lastBridgeError) {
                    throw new Error(
                        lastBridgeError?.message === "Failed to fetch"
                            ? "이미지 업로드 API에 연결하지 못했어요. `autoplay_http_server.py`로 페이지를 열었는지, 또는 `run_stage_image_bridge.ps1` 브리지가 켜져 있는지 확인해 주세요."
                            : lastBridgeError?.message || "이미지 업로드 API 요청에 실패했어요."
                    );
                }
                if (false) {
                const response = await fetch(`${PIXEL_ADMIN_STAGE_BRIDGE_URL}/api/create-stage-from-image`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sourceType: createSource,
                        imageName: imageFile?.name || "",
                        imageBase64,
                        displayName,
                        stageId,
                        sequence: pixelAdminCreateStageSequenceElement?.value || "",
                        colors: pixelAdminCreateStageColorsElement?.value || 10,
                        grid: createSource === "llm" ? false : pixelAdminCreateStageGridElement?.checked === true,
                        dither: pixelAdminCreateStageDitherElement?.checked !== false,
                        bgMode: backgroundMode,
                        bgColor: backgroundHex,
                        llmEndpoint: pixelAdminCreateStageLlmEndpointElement?.value || "",
                        llmPrompt: pixelAdminCreateStageLlmPromptElement?.value || "",
                        llmNegativePrompt: pixelAdminCreateStageLlmNegativePromptElement?.value || "",
                        llmSteps: pixelAdminCreateStageLlmStepsElement?.value || 20
                    })
                });
                const responsePayload = await response.json();
                if (!response.ok || !responsePayload?.ok) {
                    throw new Error(responsePayload?.error || `브리지 요청이 실패했어요. (${response.status})`);
                }
                }

                const createdStageEntry = responsePayload.stageEntry;
                const createdStagePayload = responsePayload.stagePayload;
                const createdStageWarning =
                    typeof responsePayload.warning === "string" && responsePayload.warning.trim()
                        ? responsePayload.warning.trim()
                        : "";
                const createdStageIndex = upsertRuntimeStageDefinition(createdStageEntry, createdStagePayload);
                if (createdStageIndex < 0) {
                    throw new Error("새 스테이지를 런타임 목록에 추가하지 못했어요.");
                }

                window.localStorage.setItem(
                    PIXEL_ADMIN_STAGE_CATALOG_REFRESH_KEY,
                    JSON.stringify({
                        at: Date.now(),
                        stageEntry: createdStageEntry,
                        stagePayload: createdStagePayload,
                        activate: true
                    })
                );

                pixelAdminState.createStageStatus = `${createdStageEntry.displayNameNumbered} 스테이지를 만들었어요. 바로 열어볼게요.`;
                pixelAdminState.createStageStatus = createdStageWarning
                    ? `${createdStageEntry.displayNameNumbered} 스테이지를 만들었어요. ${createdStageWarning}`
                    : pixelAdminState.createStageStatus;
                pixelAdminCreateStageFileElement.value = "";
                if (pixelAdminCreateStageFileNameElement) {
                    pixelAdminCreateStageFileNameElement.textContent = "선택된 파일 없음";
                }
                await goToMapIndexFromAdmin(createdStageIndex, {
                    message: `${createdStageEntry.displayNameNumbered} 스테이지를 만들고 바로 열었어요.`
                });
            } catch (error) {
                pixelAdminState.createStageStatus =
                    error?.message ||
                    "새 스테이지 생성에 실패했어요. 브리지가 켜져 있는지 확인해 주세요.";
                renderPixelAdmin();
            } finally {
                pixelAdminState.createStageBusy = false;
                renderPixelAdmin();
            }
        }

        async function previewPixelAdminCreateStage() {
            const createStageRequest = getPixelAdminCreateStageRequestDraft();
            if (createStageRequest.createSource !== "llm" && !createStageRequest.imageFile) {
                pixelAdminState.createStageStatus = "먼저 이미지 파일을 골라 주세요.";
                renderPixelAdmin();
                return;
            }
            if (
                createStageRequest.createSource === "llm" &&
                !String(pixelAdminCreateStageLlmPromptElement?.value || "").trim()
            ) {
                pixelAdminState.createStageStatus = "LLM 프롬프트를 입력해 주세요.";
                renderPixelAdmin();
                return;
            }
            if (!createStageRequest.displayName) {
                pixelAdminState.createStageStatus = "제목을 입력해 주세요.";
                renderPixelAdmin();
                return;
            }
            if (!createStageRequest.stageId) {
                pixelAdminState.createStageStatus = "새 스테이지 ID는 영문/숫자로 만들어 주세요.";
                renderPixelAdmin();
                return;
            }
            if (createStageRequest.backgroundMode === "hex" && !createStageRequest.backgroundHex) {
                pixelAdminState.createStageStatus = "HEX 배경 제거를 쓰려면 #RRGGBB 값을 넣어 주세요.";
                renderPixelAdmin();
                return;
            }

            pixelAdminState.createStageBusy = true;
            pixelAdminState.createStageStatus =
                createStageRequest.createSource === "llm"
                    ? "로컬 LLM으로 이미지를 만들고 미리보기를 준비하는 중이에요."
                    : "이미지를 픽셀화해서 미리보기를 준비하는 중이에요.";
            renderPixelAdmin();

            try {
                const imageBase64 =
                    createStageRequest.createSource === "llm"
                        ? ""
                        : await readPixelAdminFileAsBase64(createStageRequest.imageFile);
                const requestBody = JSON.stringify({
                    sourceType: createStageRequest.createSource,
                    imageName: createStageRequest.imageFile?.name || "",
                    imageBase64,
                    displayName: createStageRequest.displayName,
                    stageId: createStageRequest.stageId,
                    sequence: pixelAdminCreateStageSequenceElement?.value || "",
                    colors: pixelAdminCreateStageColorsElement?.value || 10,
                    grid:
                        createStageRequest.createSource === "llm"
                            ? false
                            : pixelAdminCreateStageGridElement?.checked === true,
                    dither: pixelAdminCreateStageDitherElement?.checked !== false,
                    bgMode: createStageRequest.backgroundMode,
                    bgColor: createStageRequest.backgroundHex,
                    llmEndpoint: pixelAdminCreateStageLlmEndpointElement?.value || "",
                    llmPrompt: pixelAdminCreateStageLlmPromptElement?.value || "",
                    llmNegativePrompt: pixelAdminCreateStageLlmNegativePromptElement?.value || "",
                    llmSteps: pixelAdminCreateStageLlmStepsElement?.value || 20
                });
                let responsePayload = null;
                let lastBridgeError = null;
                for (const bridgeUrl of PIXEL_ADMIN_STAGE_BRIDGE_URL_CANDIDATES) {
                    try {
                        const response = await fetch(`${bridgeUrl}/api/preview-stage-from-image`, {
                            method: "POST",
                            headers: {
                                ...PIXEL_ADMIN_STAGE_BRIDGE_HEADERS,
                                "Content-Type": "application/json"
                            },
                            body: requestBody
                        });
                        const responseContentType = String(response.headers.get("Content-Type") || "");
                        if (!responseContentType.includes("application/json")) {
                            throw new Error(`Bridge request returned ${response.status} without JSON.`);
                        }
                        responsePayload = await response.json();
                        if (!response.ok || !responsePayload?.ok) {
                            throw new Error(responsePayload?.error || `Bridge request failed (${response.status})`);
                        }
                        lastBridgeError = null;
                        break;
                    } catch (error) {
                        lastBridgeError = error;
                    }
                }
                if (lastBridgeError?.message === "Failed to fetch") {
                    lastBridgeError = new Error(
                        "이미지 업로드용 로컬 변환 서버에 연결하지 못했어요. 127.0.0.1:7860과는 무관하고, `autoplay_http_server.py`로 페이지를 열었는지 또는 `run_stage_image_bridge.ps1` 브리지가 켜져 있는지 확인해 주세요."
                    );
                }
                if (lastBridgeError) {
                    throw new Error(
                        lastBridgeError?.message === "Failed to fetch"
                            ? "이미지 업로드 API에 연결하지 못했어요. `autoplay_http_server.py`로 페이지를 열었는지, 또는 `run_stage_image_bridge.ps1` 브리지가 켜져 있는지 확인해 주세요."
                            : lastBridgeError?.message || "이미지 미리보기 API 요청에 실패했어요."
                    );
                }
                if (false) {
                const response = await fetch(`${PIXEL_ADMIN_STAGE_BRIDGE_URL}/api/preview-stage-from-image`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        sourceType: createStageRequest.createSource,
                        imageName: createStageRequest.imageFile?.name || "",
                        imageBase64,
                        displayName: createStageRequest.displayName,
                        stageId: createStageRequest.stageId,
                        sequence: pixelAdminCreateStageSequenceElement?.value || "",
                        colors: pixelAdminCreateStageColorsElement?.value || 10,
                        grid:
                            createStageRequest.createSource === "llm"
                                ? false
                                : pixelAdminCreateStageGridElement?.checked === true,
                        dither: pixelAdminCreateStageDitherElement?.checked !== false,
                        bgMode: createStageRequest.backgroundMode,
                        bgColor: createStageRequest.backgroundHex,
                        llmEndpoint: pixelAdminCreateStageLlmEndpointElement?.value || "",
                        llmPrompt: pixelAdminCreateStageLlmPromptElement?.value || "",
                        llmNegativePrompt: pixelAdminCreateStageLlmNegativePromptElement?.value || "",
                        llmSteps: pixelAdminCreateStageLlmStepsElement?.value || 20
                    })
                });
                const responsePayload = await response.json();
                if (!response.ok || !responsePayload?.ok) {
                    throw new Error(responsePayload?.error || `Bridge request failed (${response.status})`);
                }
                }

                loadPixelAdminCreateStagePreview(
                    responsePayload.stageEntry,
                    responsePayload.stagePayload,
                    typeof responsePayload.warning === "string" ? responsePayload.warning.trim() : ""
                );
            } catch (error) {
                pixelAdminState.createStageStatus =
                    error?.message || "미리보기를 만들지 못했어요. 브리지가 켜져 있는지 확인해 주세요.";
                renderPixelAdmin();
            } finally {
                pixelAdminState.createStageBusy = false;
                renderPixelAdmin();
            }
        }

        async function commitPixelAdminCreateStagePreview() {
            if (!pixelAdminState.createStagePreview || !pixelAdminState.draftMap?.length) {
                pixelAdminState.createStageStatus = "먼저 미리보기를 불러와 주세요.";
                renderPixelAdmin();
                return;
            }

            const createStageRequest = getPixelAdminCreateStageRequestDraft();
            if (!createStageRequest.displayName) {
                pixelAdminState.createStageStatus = "제목을 입력해 주세요.";
                renderPixelAdmin();
                return;
            }
            if (!createStageRequest.stageId) {
                pixelAdminState.createStageStatus = "새 스테이지 ID는 영문/숫자로 만들어 주세요.";
                renderPixelAdmin();
                return;
            }

            const draftPalettePayload = Object.fromEntries(
                Object.entries(pixelAdminState.draftPalette || {})
                    .map(([colorId, colorMeta]) => [
                        String(colorId),
                        normalizeHexColor(typeof colorMeta === "string" ? colorMeta : colorMeta?.color)
                    ])
                    .filter(([, color]) => color)
            );

            pixelAdminState.createStageBusy = true;
            pixelAdminState.createStageStatus = "현재 미리보기를 새 맵으로 저장하는 중이에요.";
            renderPixelAdmin();

            try {
                const requestBody = JSON.stringify({
                    displayName: createStageRequest.displayName,
                    stageId: createStageRequest.stageId,
                    sequence: pixelAdminCreateStageSequenceElement?.value || "",
                    imageMap: pixelAdminState.draftMap,
                    palette: draftPalettePayload
                });
                let responsePayload = null;
                let lastBridgeError = null;
                for (const bridgeUrl of PIXEL_ADMIN_STAGE_BRIDGE_URL_CANDIDATES) {
                    try {
                        const response = await fetch(`${bridgeUrl}/api/create-stage-from-draft`, {
                            method: "POST",
                            headers: {
                                ...PIXEL_ADMIN_STAGE_BRIDGE_HEADERS,
                                "Content-Type": "application/json"
                            },
                            body: requestBody
                        });
                        const responseContentType = String(response.headers.get("Content-Type") || "");
                        if (!responseContentType.includes("application/json")) {
                            throw new Error(`Bridge request returned ${response.status} without JSON.`);
                        }
                        responsePayload = await response.json();
                        if (!response.ok || !responsePayload?.ok) {
                            throw new Error(responsePayload?.error || `Bridge request failed (${response.status})`);
                        }
                        lastBridgeError = null;
                        break;
                    } catch (error) {
                        lastBridgeError = error;
                    }
                }
                if (lastBridgeError?.message === "Failed to fetch") {
                    lastBridgeError = new Error(
                        "스테이지 저장용 로컬 변환 서버에 연결하지 못했어요. 127.0.0.1:7860과는 무관하고, `autoplay_http_server.py`로 페이지를 열었는지 또는 `run_stage_image_bridge.ps1` 브리지가 켜져 있는지 확인해 주세요."
                    );
                }
                if (lastBridgeError) {
                    throw new Error(
                        lastBridgeError?.message === "Failed to fetch"
                            ? "이미지 업로드 API에 연결하지 못했어요. `autoplay_http_server.py`로 페이지를 열었는지, 또는 `run_stage_image_bridge.ps1` 브리지가 켜져 있는지 확인해 주세요."
                            : lastBridgeError?.message || "스테이지 저장 API 요청에 실패했어요."
                    );
                }
                if (false) {
                const response = await fetch(`${PIXEL_ADMIN_STAGE_BRIDGE_URL}/api/create-stage-from-draft`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        displayName: createStageRequest.displayName,
                        stageId: createStageRequest.stageId,
                        sequence: pixelAdminCreateStageSequenceElement?.value || "",
                        imageMap: pixelAdminState.draftMap,
                        palette: draftPalettePayload
                    })
                });
                const responsePayload = await response.json();
                if (!response.ok || !responsePayload?.ok) {
                    throw new Error(responsePayload?.error || `Bridge request failed (${response.status})`);
                }
                }

                const createdStageEntry = responsePayload.stageEntry;
                const createdStagePayload = responsePayload.stagePayload;
                const createdStageIndex = upsertRuntimeStageDefinition(createdStageEntry, createdStagePayload);
                if (createdStageIndex < 0) {
                    throw new Error("새 스테이지를 런타임 목록에 추가하지 못했어요.");
                }

                window.localStorage.setItem(
                    PIXEL_ADMIN_STAGE_CATALOG_REFRESH_KEY,
                    JSON.stringify({
                        at: Date.now(),
                        stageEntry: createdStageEntry,
                        stagePayload: createdStagePayload,
                        activate: true
                    })
                );

                pixelAdminState.createStagePreview = null;
                pixelAdminState.isDirty = false;
                pixelAdminState.exportIsDirty = false;
                pixelAdminState.exportNeedsRefresh = true;
                pixelAdminState.createStageStatus = `${createdStageEntry.displayNameNumbered} 스테이지를 저장했어요. 바로 열어볼게요.`;
                pixelAdminCreateStageFileElement.value = "";
                if (pixelAdminCreateStageFileNameElement) {
                    pixelAdminCreateStageFileNameElement.textContent = "선택된 파일 없음";
                }
                await goToMapIndexFromAdmin(createdStageIndex, {
                    message: `${createdStageEntry.displayNameNumbered} 스테이지를 저장하고 바로 열었어요.`
                });
            } catch (error) {
                pixelAdminState.createStageStatus =
                    error?.message || "새 스테이지 저장에 실패했어요. 브리지가 켜져 있는지 확인해 주세요.";
                renderPixelAdmin();
            } finally {
                pixelAdminState.createStageBusy = false;
                renderPixelAdmin();
            }
        }

        function goToNextLevelFromAdmin() {
            const nextMapIndex = (currentMapIndex + 1) % MAP_DEFINITIONS.length;
            void goToMapIndexFromAdmin(nextMapIndex, {
                preparedDirection: "next",
                message: `다음 레벨로 이동했어요. 현재 스테이지는 ${getMapDisplayName(MAP_DEFINITIONS[nextMapIndex]?.id)}입니다.`
            });
        }

        function goToPreviousLevelFromAdmin() {
            const previousMapIndex =
                ((currentMapIndex - 1) % MAP_DEFINITIONS.length + MAP_DEFINITIONS.length) % MAP_DEFINITIONS.length;
            void goToMapIndexFromAdmin(previousMapIndex, {
                preparedDirection: "previous",
                message: `이전 레벨로 이동했어요. 현재 스테이지는 ${getMapDisplayName(MAP_DEFINITIONS[previousMapIndex]?.id)}입니다.`
            });
        }

        async function goToFirstPlayableLevelCheat() {
            const targetMapIndex = getFirstPlayableMapIndex();
            const targetDefinition = MAP_DEFINITIONS[targetMapIndex] || null;

            clearRuntimeSnapshot();
            clearSolvedStageFailSafeTimer();
            clearStageClearTimers();
            clearCelebrationTimers();
            isStageTransitioning = false;
            selected = null;
            try {
                window.localStorage.setItem(PIXEL_ADMIN_FORCE_FIRST_MAP_RESET_STORAGE_KEY, "1");
            } catch (error) {
                // Ignore storage write failures and continue with the local reset.
            }
            if (targetDefinition?.id) {
                persistCurrentMapId(targetDefinition.id);
            }
            const resetUrl = new URL(window.location.href);
            resetUrl.searchParams.set(PIXEL_ADMIN_RESET_TO_FIRST_QUERY_PARAM, "1");
            window.location.replace(resetUrl.toString());
        }

        async function copyPixelAdminExport() {
            if (!pixelAdminExportElement?.value) {
                return;
            }

            try {
                await navigator.clipboard.writeText(pixelAdminExportElement.value);
                pixelAdminState.message = "留ㅽ듃由?뒪瑜??대┰蹂대뱶??蹂듭궗?덉뼱??";
            } catch (error) {
                pixelAdminExportElement.focus();
                pixelAdminExportElement.select();
                document.execCommand("copy");
                pixelAdminState.message = "吏곸젒 蹂듭궗?????덈룄濡??대낫?닿린 ?띿뒪?몃? ?좏깮?덉뼱??";
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
            const createStagePreviewActive = !!pixelAdminState.createStagePreview;

            pixelAdminStageElement.textContent = `${draftDisplayName} - ${rows} x ${cols}`;
            pixelAdminHelpElement.textContent = shouldDeferHeavyRender
                ? "스테이지를 불러오는 중이에요. 코드와 팔레트, 그리드는 잠시 후 다시 그려집니다."
                : "제목, 캔버스, 팔레트를 직접 수정할 수 있어요. 마우스 휠로 확대/축소하고 HEX는 # 없이 6자리만 넣어도 됩니다.";
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
            const createStageSource = pixelAdminCreateStageSourceLlmElement?.checked ? "llm" : "upload";
            if (pixelAdminCreateStageFileBoxElement?.parentElement) {
                pixelAdminCreateStageFileBoxElement.parentElement.hidden = createStageSource !== "upload";
            }
            if (pixelAdminCreateStageLlmPanelElement) {
                pixelAdminCreateStageLlmPanelElement.hidden = createStageSource !== "llm";
            }
            if (pixelAdminCreateStageLlmEndpointElement) {
                pixelAdminCreateStageLlmEndpointElement.disabled = createStageSource !== "llm";
            }
            if (pixelAdminCreateStageLlmStepsElement) {
                pixelAdminCreateStageLlmStepsElement.disabled = createStageSource !== "llm";
            }
            if (pixelAdminCreateStageLlmPromptElement) {
                pixelAdminCreateStageLlmPromptElement.disabled = createStageSource !== "llm";
            }
            if (pixelAdminCreateStageLlmNegativePromptElement) {
                pixelAdminCreateStageLlmNegativePromptElement.disabled = createStageSource !== "llm";
            }
            if (pixelAdminCreateStageNoteElement) {
                pixelAdminCreateStageNoteElement.textContent = pixelAdminState.createStageStatus;
            }
            if (pixelAdminCreateStageElement) {
                pixelAdminCreateStageElement.disabled = pixelAdminState.createStageBusy;
            }
            if (pixelAdminCommitStageElement) {
                pixelAdminCommitStageElement.disabled = pixelAdminState.createStageBusy || !createStagePreviewActive;
            }
            if (pixelAdminCancelStagePreviewElement) {
                pixelAdminCancelStagePreviewElement.disabled = pixelAdminState.createStageBusy || !createStagePreviewActive;
            }
            if (pixelAdminCreateStageGridElement) {
                pixelAdminCreateStageGridElement.disabled = createStageSource === "llm";
            }
            if (pixelAdminCreateStageBgColorElement) {
                pixelAdminCreateStageBgColorElement.disabled = pixelAdminCreateStageBgModeElement?.value !== "hex";
            }
            if (pixelAdminApplyElement) {
                pixelAdminApplyElement.disabled = createStagePreviewActive;
            }
            if (pixelAdminReloadElement) {
                pixelAdminReloadElement.disabled = createStagePreviewActive;
            }
            if (pixelAdminRestoreElement) {
                pixelAdminRestoreElement.disabled = createStagePreviewActive;
            }
            if (pixelAdminStageClearElement) {
                pixelAdminStageClearElement.disabled = createStagePreviewActive;
            }
            if (pixelAdminPreviousLevelElement) {
                pixelAdminPreviousLevelElement.disabled = createStagePreviewActive;
            }
            if (pixelAdminNextLevelElement) {
                pixelAdminNextLevelElement.disabled = createStagePreviewActive;
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
                        pixelAdminState.message = `${getPixelAdminColorLabel(mapId, colorId, paletteMeta)}??瑜? ?좏깮?덉뼱??`;
                        renderPixelAdmin();
                    });

                    swatchCard.appendChild(swatch);

                    if (removableColor) {
                        const deleteButton = document.createElement("button");
                        deleteButton.type = "button";
                        deleteButton.className = "pixel-admin-swatch-delete";
                        deleteButton.textContent = "x";
                        deleteButton.setAttribute("aria-label", `${getPixelAdminColorLabel(mapId, colorId, paletteMeta)} ?됱긽 ??젣`);
                        deleteButton.title = `${getPixelAdminColorLabel(mapId, colorId, paletteMeta)} ??젣`;
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
                pixelAdminState.message = "?대룞?대굹 ?꾪솚???앸궃 ?ㅼ뿉 ?ㅽ뀒?댁? ?대━?대? ?뚮윭 二쇱꽭??";
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
            setStatus("?꾩옱 ?ㅽ뀒?댁?瑜?利됱떆 ?대━?댄뻽?댁슂.");
            render();

            if (solved) {
                pixelAdminState.message = "?꾩옱 ?ㅽ뀒?댁?瑜??대━?댄뻽?댁슂.";
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

        pixelAdminPopoutElement?.addEventListener("click", () => {
            const popupUrl = new URL("./a/", document.baseURI || window.location.href);
            popupUrl.searchParams.set("adminWindow", "1");
            const activeMapId = getCurrentMapDefinition()?.id;
            if (activeMapId) {
                popupUrl.searchParams.set("mapId", activeMapId);
            }
            const popupWindow = window.open(
                popupUrl.toString(),
                "color-jewel-admin",
                "popup=yes,width=760,height=960,resizable=yes,scrollbars=yes"
            );
            popupWindow?.focus();
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
            if (pixelAdminWindowMode) {
                flushPendingPixelAdminStageStorage();
                window.close();
                if (!window.closed) {
                    setPixelAdminOpen(false);
                }
                return;
            }

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
            const normalizedSourceTitle = normalizeStageDisplayName(event.target.value);
            const romanizedSourceTitle = romanizePixelAdminStageTitle(normalizedSourceTitle);
            const requestedSequence = Math.max(0, Number(pixelAdminCreateStageSequenceElement?.value) || 0);
            const autoDisplayName = romanizedSourceTitle
                ? normalizeStageDisplayName(
                      requestedSequence
                          ? `${String(requestedSequence).padStart(2, "0")}. ${romanizedSourceTitle}`
                          : romanizedSourceTitle
                  )
                : "";

            if (pixelAdminCreateStageSourceTitleElement) {
                pixelAdminCreateStageSourceTitleElement.value = normalizedSourceTitle;
                pixelAdminCreateStageSourceTitleElement.dataset.userEdited = normalizedSourceTitle ? "true" : "";
            }
            if (
                pixelAdminCreateStageTitleElement &&
                (!pixelAdminCreateStageTitleElement.dataset.userEdited || !String(pixelAdminCreateStageTitleElement.value || "").trim())
            ) {
                pixelAdminCreateStageTitleElement.value = autoDisplayName;
            }
            if (
                pixelAdminCreateStageIdElement &&
                (!pixelAdminCreateStageIdElement.dataset.userEdited || !String(pixelAdminCreateStageIdElement.value || "").trim())
            ) {
                pixelAdminCreateStageIdElement.value = normalizePixelAdminGeneratedStageId("", romanizedSourceTitle);
            }
        });

        [pixelAdminCreateStageSourceUploadElement, pixelAdminCreateStageSourceLlmElement].forEach((sourceElement) => {
            sourceElement?.addEventListener("change", () => {
                if (pixelAdminCreateStageSourceLlmElement?.checked && pixelAdminCreateStageGridElement) {
                    pixelAdminCreateStageGridElement.checked = false;
                }
                pixelAdminState.createStageStatus = pixelAdminCreateStageSourceLlmElement?.checked
                    ? "로컬 LLM 모드예요. 이때만 A1111 endpoint와 프롬프트를 사용해요."
                    : "이미지 업로드 모드예요. 127.0.0.1:7860 LLM endpoint와는 연결하지 않아요.";
                renderPixelAdmin();
            });
        });

        pixelAdminCreateStageFileElement?.addEventListener("change", () => {
            const selectedFile = pixelAdminCreateStageFileElement.files?.[0] || null;
            if (pixelAdminCreateStageFileNameElement) {
                pixelAdminCreateStageFileNameElement.textContent = selectedFile?.name || "선택된 파일 없음";
            }
            if (!selectedFile) {
                return;
            }

            const suggestedTitle = getPixelAdminSuggestedStageTitleFromFileName(
                selectedFile.name,
                ""
            );
            const romanizedSuggestedTitle = romanizePixelAdminStageTitle(suggestedTitle);
            const requestedSequence = Math.max(0, Number(pixelAdminCreateStageSequenceElement?.value) || 0);
            const autoDisplayName = romanizedSuggestedTitle
                ? normalizeStageDisplayName(
                      requestedSequence
                          ? `${String(requestedSequence).padStart(2, "0")}. ${romanizedSuggestedTitle}`
                          : romanizedSuggestedTitle
                  )
                : getPixelAdminSuggestedStageTitleFromFileName(
                      selectedFile.name,
                      pixelAdminCreateStageSequenceElement?.value || ""
                  );
            if (
                pixelAdminCreateStageSourceTitleElement &&
                !pixelAdminCreateStageSourceTitleElement.dataset.userEdited
            ) {
                pixelAdminCreateStageSourceTitleElement.value = suggestedTitle;
            }
            if (
                pixelAdminCreateStageTitleElement &&
                !pixelAdminCreateStageTitleElement.dataset.userEdited
            ) {
                pixelAdminCreateStageTitleElement.value = autoDisplayName;
            }
            if (
                pixelAdminCreateStageIdElement &&
                !pixelAdminCreateStageIdElement.dataset.userEdited
            ) {
                pixelAdminCreateStageIdElement.value = normalizePixelAdminGeneratedStageId("", romanizedSuggestedTitle || suggestedTitle || selectedFile.name);
            }
            pixelAdminState.createStageStatus = `${selectedFile.name} 이미지를 새 스테이지 재료로 골랐어요.`;
            renderPixelAdmin();
        });

        pixelAdminCreateStageFileButtonElement?.addEventListener("click", () => {
            if (pixelAdminCreateStageSourceLlmElement?.checked) {
                return;
            }
            pixelAdminCreateStageFileElement?.click();
        });

        pixelAdminCreateStageFileBoxElement?.addEventListener("click", async (event) => {
            if (pixelAdminCreateStageSourceLlmElement?.checked) {
                return;
            }
            if (event.target === pixelAdminCreateStageFileButtonElement || event.target?.closest?.("#pixelAdminCreateStageFileButton")) {
                return;
            }

            event.preventDefault();
            if (!navigator.clipboard?.read || typeof DataTransfer === "undefined" || typeof File === "undefined") {
                pixelAdminState.createStageStatus =
                    "이 브라우저에서는 클릭으로 클립보드 이미지를 붙여넣지 못해요. 파일 선택 버튼을 사용해 주세요.";
                renderPixelAdmin();
                return;
            }

            try {
                const clipboardItems = await navigator.clipboard.read();
                let clipboardImageBlob = null;
                let clipboardImageType = "";

                clipboardItems.some((item) => {
                    const imageType = item.types.find((type) => type.startsWith("image/")) || "";
                    if (!imageType) {
                        return false;
                    }

                    clipboardImageType = imageType;
                    clipboardImageBlob = item.getType(imageType);
                    return true;
                });

                const resolvedClipboardImageBlob = await clipboardImageBlob;
                if (!resolvedClipboardImageBlob || !clipboardImageType) {
                    pixelAdminState.createStageStatus =
                        "클립보드에서 이미지를 찾지 못했어요. 이미지를 복사한 뒤 다시 클릭해 주세요.";
                    renderPixelAdmin();
                    return;
                }

                const fileExtension = clipboardImageType
                    .replace(/^image\//, "")
                    .replace(/[^a-z0-9]+/gi, "")
                    .toLowerCase();
                const clipboardFile = new File(
                    [resolvedClipboardImageBlob],
                    `clipboard-image.${fileExtension === "jpeg" ? "jpg" : fileExtension || "png"}`,
                    { type: clipboardImageType }
                );
                const clipboardTransfer = new DataTransfer();
                clipboardTransfer.items.add(clipboardFile);
                pixelAdminCreateStageFileElement.files = clipboardTransfer.files;
                pixelAdminCreateStageFileElement.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (error) {
                console.error("[PixelAdmin] failed to read clipboard image", error);
                pixelAdminState.createStageStatus =
                    error?.name === "NotAllowedError"
                        ? "브라우저에서 클립보드 읽기를 허용해 주세요."
                        : error?.message || "클립보드 이미지를 붙여넣지 못했어요.";
                renderPixelAdmin();
            }
        });

        pixelAdminCreateStageFileBoxElement?.addEventListener("keydown", async (event) => {
            if (pixelAdminCreateStageSourceLlmElement?.checked) {
                return;
            }
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();
            pixelAdminCreateStageFileBoxElement.click();
        });

        pixelAdminCreateStageTitleElement?.addEventListener("input", (event) => {
            const normalizedTitle = normalizeStageDisplayName(event.target.value);
            event.target.value = normalizedTitle;
            event.target.dataset.userEdited = normalizedTitle ? "true" : "";
            if (!pixelAdminCreateStageIdElement) {
                return;
            }

            if (!pixelAdminCreateStageIdElement.dataset.userEdited) {
                pixelAdminCreateStageIdElement.value = normalizePixelAdminGeneratedStageId("", normalizedTitle);
            }
        });

        pixelAdminCreateStageSourceTitleElement?.addEventListener("input", (event) => {
            const normalizedSourceTitle = normalizeStageDisplayName(event.target.value);
            const romanizedSourceTitle = romanizePixelAdminStageTitle(normalizedSourceTitle);
            const requestedSequence = Math.max(0, Number(pixelAdminCreateStageSequenceElement?.value) || 0);
            const autoDisplayName = romanizedSourceTitle
                ? normalizeStageDisplayName(
                      requestedSequence
                          ? `${String(requestedSequence).padStart(2, "0")}. ${romanizedSourceTitle}`
                          : romanizedSourceTitle
                  )
                : "";

            event.target.value = normalizedSourceTitle;
            event.target.dataset.userEdited = normalizedSourceTitle ? "true" : "";

            if (pixelAdminCreateStageTitleElement && !pixelAdminCreateStageTitleElement.dataset.userEdited) {
                pixelAdminCreateStageTitleElement.value = autoDisplayName;
            }
            if (pixelAdminCreateStageIdElement && !pixelAdminCreateStageIdElement.dataset.userEdited) {
                pixelAdminCreateStageIdElement.value = normalizePixelAdminGeneratedStageId("", romanizedSourceTitle);
            }
        });

        pixelAdminCreateStageSequenceElement?.addEventListener("input", (event) => {
            if (!pixelAdminCreateStageTitleElement || pixelAdminCreateStageTitleElement.dataset.userEdited) {
                return;
            }

            const requestedSequence = Math.max(0, Number(event.target.value) || 0);
            const sourceTitle = normalizeStageDisplayName(pixelAdminCreateStageSourceTitleElement?.value || "");
            const romanizedSourceTitle = romanizePixelAdminStageTitle(sourceTitle);
            const selectedFile = pixelAdminCreateStageFileElement?.files?.[0] || null;
            const suggestedTitle = romanizedSourceTitle
                ? normalizeStageDisplayName(
                      requestedSequence
                          ? `${String(requestedSequence).padStart(2, "0")}. ${romanizedSourceTitle}`
                          : romanizedSourceTitle
                  )
                : getPixelAdminSuggestedStageTitleFromFileName(
                      selectedFile?.name || pixelAdminCreateStageTitleElement.value,
                      event.target.value
                  );
            pixelAdminCreateStageTitleElement.value = suggestedTitle;
            if (pixelAdminCreateStageIdElement && !pixelAdminCreateStageIdElement.dataset.userEdited) {
                pixelAdminCreateStageIdElement.value = normalizePixelAdminGeneratedStageId("", romanizedSourceTitle || suggestedTitle);
            }
        });

        pixelAdminCreateStageIdElement?.addEventListener("input", (event) => {
            const normalizedStageId = normalizePixelAdminGeneratedStageId(event.target.value);
            event.target.value = normalizedStageId;
            event.target.dataset.userEdited = normalizedStageId ? "true" : "";
        });

        pixelAdminCreateStageBgColorElement?.addEventListener("input", (event) => {
            const sanitized = String(event.target.value || "")
                .toUpperCase()
                .replace(/[^0-9A-F#]/g, "")
                .replace(/(?!^)#/g, "")
                .slice(0, 7);
            event.target.value = sanitized.startsWith("#") || !sanitized ? sanitized : `#${sanitized}`;
        });

        pixelAdminCreateStageBgModeElement?.addEventListener("change", () => {
            renderPixelAdmin();
        });

        pixelAdminCreateStageElement?.addEventListener("click", () => {
            void previewPixelAdminCreateStage();
        });

        pixelAdminCommitStageElement?.addEventListener("click", () => {
            void commitPixelAdminCreateStagePreview();
        });

        pixelAdminCancelStagePreviewElement?.addEventListener("click", () => {
            cancelPixelAdminCreateStagePreview();
        });

        ["dragenter", "dragover"].forEach((eventName) => {
            pixelAdminCreateStagePanelElement?.addEventListener(eventName, (event) => {
                if (pixelAdminCreateStageSourceLlmElement?.checked) {
                    return;
                }
                event.preventDefault();
                if (!event.dataTransfer) {
                    return;
                }

                event.dataTransfer.dropEffect = "copy";
                pixelAdminCreateStagePanelElement.classList.add("drag-over");
            });
        });

        ["dragleave", "dragend"].forEach((eventName) => {
            pixelAdminCreateStagePanelElement?.addEventListener(eventName, (event) => {
                if (pixelAdminCreateStageSourceLlmElement?.checked) {
                    return;
                }
                if (
                    event.type === "dragleave" &&
                    pixelAdminCreateStagePanelElement?.contains(event.relatedTarget)
                ) {
                    return;
                }

                pixelAdminCreateStagePanelElement.classList.remove("drag-over");
            });
        });

        pixelAdminCreateStagePanelElement?.addEventListener("drop", (event) => {
            if (pixelAdminCreateStageSourceLlmElement?.checked) {
                return;
            }
            event.preventDefault();
            pixelAdminCreateStagePanelElement.classList.remove("drag-over");

            const droppedFiles = event.dataTransfer?.files;
            const droppedImageFile = droppedFiles?.[0] || null;
            if (!droppedImageFile) {
                pixelAdminState.createStageStatus = "드롭된 파일을 찾지 못했어요.";
                renderPixelAdmin();
                return;
            }

            if (!String(droppedImageFile.type || "").startsWith("image/")) {
                pixelAdminState.createStageStatus = "이미지 파일만 드롭할 수 있어요.";
                renderPixelAdmin();
                return;
            }

            if (pixelAdminCreateStageFileElement) {
                try {
                    pixelAdminCreateStageFileElement.files = droppedFiles;
                } catch (error) {
                    pixelAdminState.createStageStatus = "이 브라우저에서는 드롭한 파일을 바로 연결하지 못했어요. 클릭해서 다시 골라 주세요.";
                    renderPixelAdmin();
                    return;
                }

                pixelAdminCreateStageFileElement.dispatchEvent(new Event("change", { bubbles: true }));
            }
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

});

window.applyPersistedPixelAdminStageOverride = applyPersistedPixelAdminStageOverride;
window.loadPersistedPixelAdminStageOverrides = loadPersistedPixelAdminStageOverrides;
window.syncPixelAdminWithActiveMap = syncPixelAdminWithActiveMap;
window.setPixelAdminOpen = setPixelAdminOpen;
window.togglePixelAdmin = togglePixelAdmin;
window.goToFirstPlayableLevelCheat = goToFirstPlayableLevelCheat;
window.__pixelAdminLoaded = true;

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

window.addEventListener("storage", (event) => {
    if (!event.key) {
        return;
    }

    if (event.key === PIXEL_ADMIN_STAGE_STORAGE_KEY) {
        pixelAdminStageStorageCache = null;
        if (!Array.isArray(MAP_DEFINITIONS) || !MAP_DEFINITIONS.length) {
            return;
        }

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

        if (activeMapDidChange) {
            syncActiveMap(currentMapIndex, {
                renderPixelAdmin: false,
                prepareUpcomingMap: false
            });
            if (pixelAdminWindowMode) {
                if (pixelAdminState.isOpen) {
                    syncPixelAdminWithActiveMap(true, true);
                }
                return;
            }
            currentLevelInitialState = null;
            resetGame({
                regenerateLevelStart: true,
                fastLevelStart: true,
                persistLevelStart: false
            });
        }

        if (pixelAdminState.isOpen) {
            syncPixelAdminWithActiveMap(true, true);
        }
        return;
    }

    if (event.key === PIXEL_ADMIN_STAGE_CATALOG_REFRESH_KEY) {
        if (!event.newValue || !Array.isArray(MAP_DEFINITIONS)) {
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
                pixelAdminState.createStageStatus = `${stageEntry.displayNameNumbered || stageEntry.file} 스테이지가 추가되어 바로 이동했어요.`;
                void goToMapIndexFromAdmin(createdStageIndex, {
                    message: `${stageEntry.displayNameNumbered || stageEntry.file} 스테이지를 불러왔어요.`
                });
                return;
            }

            if (pixelAdminState.isOpen) {
                syncPixelAdminWithActiveMap(true, true);
            }
        } catch (error) {
            console.error("[PixelAdmin] failed to apply created stage refresh", error);
        }
        return;
    }

    if (event.key !== CURRENT_MAP_STORAGE_KEY || !Array.isArray(MAP_DEFINITIONS) || !MAP_DEFINITIONS.length) {
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
        renderPixelAdmin: false,
        prepareUpcomingMap: false
    }).then(() => {
        if (pixelAdminWindowMode) {
            if (pixelAdminState.isOpen) {
                syncPixelAdminWithActiveMap(true, true);
            }
            return;
        }
        currentLevelInitialState = null;
        resetGame({
            regenerateLevelStart: true,
            fastLevelStart: true,
            persistLevelStart: false
        });

        if (pixelAdminState.isOpen) {
            syncPixelAdminWithActiveMap(true, true);
        }
    });
});

document.addEventListener("freeze", () => {
    flushPendingPixelAdminStageStorage();
});


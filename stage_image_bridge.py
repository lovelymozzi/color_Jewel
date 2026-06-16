from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import tempfile
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
PIXEL_ART_ROOT = ROOT_DIR.parent / "pixel_art-main"
STAGE_DIR = ROOT_DIR / "stage-data"
INDEX_PATH = STAGE_DIR / "index.json"
DEFAULT_PORT = 8765
START_MESSAGE = "{title} 스테이지예요. 색을 맞춰 그림을 완성해 보세요."
MAX_COLORS = 12
MAX_SIZE = 30


if str(PIXEL_ART_ROOT) not in sys.path:
    sys.path.insert(0, str(PIXEL_ART_ROOT))

from convert import convert, convert_grid  # noqa: E402


def normalize_display_name(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()[:24]


def normalize_stage_id(value: str, fallback: str) -> str:
    source = str(value or fallback or "").strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "_", source).strip("_")
    if not normalized:
        raise ValueError("스테이지 ID를 만들 수 없어요. 영문/숫자 이름을 넣어 주세요.")
    return normalized[:32]


def parse_positive_int(value: object, *, default: int, minimum: int = 1, maximum: int | None = None) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default

    if parsed < minimum:
        parsed = minimum
    if maximum is not None and parsed > maximum:
        parsed = maximum
    return parsed


def read_stage_index() -> dict:
    if not INDEX_PATH.exists():
        return {"maps": []}

    with INDEX_PATH.open("r", encoding="utf-8") as index_file:
        parsed = json.load(index_file)

    maps = parsed.get("maps")
    if not isinstance(maps, list):
        raise ValueError("stage-data/index.json 형식이 올바르지 않아요.")
    return {"maps": maps}


def write_stage_index(payload: dict) -> None:
    STAGE_DIR.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_stage_entry(*, sequence: int, stage_id: str, display_name: str, file_name: str) -> dict:
    return {
        "sequence": sequence,
        "id": stage_id,
        "displayName": display_name,
        "displayNameNumbered": f"{sequence:02d}. {display_name}",
        "file": file_name,
    }


def build_stage_payload_from_map(
    *,
    image_map: list[list[int]],
    palette: dict[str, str],
    sequence: int,
    stage_id: str,
    display_name: str,
    export_name: str,
) -> dict:
    theme_override_palette = {"0": "#FFFFFF", **palette}
    return {
        "sequence": sequence,
        "exportName": export_name,
        "displayNameNumbered": f"{sequence:02d}. {display_name}",
        "id": stage_id,
        "displayName": display_name,
        "scale": 1,
        "startMessageTemplate": START_MESSAGE,
        "sourceRefs": {
            "baseImageMap": f"UPLOADED_{export_name.upper()}_IMAGE_MAP",
            "initialBoardState": None,
            "initialTrayState": None,
        },
        "pocketUnlock": {
            "initialOpenCount": 12,
            "completedColorsPerUnlock": 1,
            "pocketsPerUnlock": 1,
        },
        "imageMap": image_map,
        "palette": palette,
        "themeOverridePalette": theme_override_palette,
    }


def decode_image_to_tempfile(image_name: str, image_base64: str) -> Path:
    if not image_base64:
        raise ValueError("이미지 데이터가 비어 있어요.")

    suffix = Path(image_name or "upload.png").suffix or ".png"
    image_bytes = base64.b64decode(image_base64)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        temp_file.write(image_bytes)
        return Path(temp_file.name)
    finally:
        temp_file.close()


def request_a1111_image(*, endpoint: str, prompt: str, negative_prompt: str, steps: int) -> str:
    normalized_endpoint = str(endpoint or "http://127.0.0.1:7860").strip().rstrip("/")
    if not normalized_endpoint:
        normalized_endpoint = "http://127.0.0.1:7860"

    request_body = json.dumps(
        {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": 384,
            "height": 384,
            "steps": steps,
            "cfg_scale": 7,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        f"{normalized_endpoint}/sdapi/v1/txt2img",
        data=request_body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore").strip()
        raise ValueError(detail or f"A1111 요청이 실패했어요. ({error.code})") from error
    except urllib.error.URLError as error:
        raise ValueError(f"A1111 서버에 연결하지 못했어요: {error.reason or error}") from error

    images = payload.get("images")
    if not isinstance(images, list) or not images or not str(images[0]).strip():
        raise ValueError("A1111이 이미지를 돌려주지 않았어요.")
    return str(images[0]).strip()


def resolve_stage_metadata(
    request_payload: dict,
    *,
    fallback_id_source: str,
    validate_uniqueness: bool = True,
) -> tuple[dict, list[dict]]:
    display_name = normalize_display_name(request_payload.get("displayName"))
    if not display_name:
        raise ValueError("관리용 이름을 입력해 주세요.")

    stage_id = normalize_stage_id(request_payload.get("stageId"), fallback_id_source)
    stage_index = read_stage_index()
    stage_entries = list(stage_index["maps"])

    if validate_uniqueness and any(str(entry.get("id") or "").strip().lower() == stage_id for entry in stage_entries):
        raise ValueError(f"이미 '{stage_id}' ID를 쓰는 스테이지가 있어요.")

    sequence = parse_positive_int(
        request_payload.get("sequence"),
        default=max(
            (parse_positive_int(entry.get("sequence"), default=0, minimum=0) for entry in stage_entries),
            default=0,
        ) + 1,
        minimum=1,
    )
    if validate_uniqueness and any(
        parse_positive_int(entry.get("sequence"), default=0, minimum=0) == sequence
        for entry in stage_entries
    ):
        raise ValueError(f"이미 {sequence}번 순서를 쓰는 스테이지가 있어요.")

    export_name = f"{sequence:02d}_{stage_id}"
    file_name = f"{export_name}.json"
    stage_path = STAGE_DIR / file_name
    if validate_uniqueness and stage_path.exists():
        raise ValueError(f"이미 '{file_name}' 파일이 있어요.")

    return (
        {
            "display_name": display_name,
            "stage_id": stage_id,
            "sequence": sequence,
            "export_name": export_name,
            "file_name": file_name,
            "stage_path": stage_path,
        },
        stage_entries,
    )


def convert_art_to_payload(art, metadata: dict) -> dict:
    legend_order = list(art.legend.keys())
    color_ids = {char: index + 1 for index, char in enumerate(legend_order)}
    image_map = [
        [0 if char == "." else color_ids[char] for char in row]
        for row in art.rows
    ]
    palette = {
        str(index + 1): art.legend[char]
        for index, char in enumerate(legend_order)
    }
    return build_stage_payload_from_map(
        image_map=image_map,
        palette=palette,
        sequence=metadata["sequence"],
        stage_id=metadata["stage_id"],
        display_name=metadata["display_name"],
        export_name=metadata["export_name"],
    )


def validate_art(art, *, max_colors: int) -> None:
    if len(art.legend) > max_colors:
        raise ValueError(f"[{art.name}] uses {len(art.legend)} colors > max {max_colors}")
    if "." in art.legend:
        raise ValueError(f"[{art.name}] '.' is reserved for transparency; remove it from the legend")
    for char, code in art.legend.items():
        if len(char) != 1:
            raise ValueError(f"[{art.name}] legend key {char!r} must be 1 char")
        if not (isinstance(code, str) and code.startswith("#") and len(code) in (4, 7, 9)):
            raise ValueError(f"[{art.name}] bad color code {code!r} for {char!r}")

    row_count = len(art.rows)
    column_count = len(art.rows[0]) if art.rows else 0
    if not row_count or not column_count:
        raise ValueError(f"[{art.name}] has no pixel rows")
    if row_count > MAX_SIZE or column_count > MAX_SIZE:
        raise ValueError(f"[{art.name}] size {column_count}x{row_count} exceeds {MAX_SIZE}x{MAX_SIZE}")

    allowed = set(art.legend) | {"."}
    for y, row in enumerate(art.rows):
        if len(row) != column_count:
            raise ValueError(f"[{art.name}] row {y} has width {len(row)}, expected {column_count}")
        bad = set(row) - allowed
        if bad:
            raise ValueError(f"[{art.name}] row {y} has chars {sorted(bad)} not in legend")


def build_preview_from_image_request(request_payload: dict) -> dict:
    source_type = str(request_payload.get("sourceType") or "upload").strip().lower()
    image_name = str(request_payload.get("imageName") or "").strip()
    image_base64 = str(request_payload.get("imageBase64") or "").strip()
    llm_prompt = str(request_payload.get("llmPrompt") or "").strip()
    llm_negative_prompt = str(request_payload.get("llmNegativePrompt") or "").strip()
    llm_endpoint = str(request_payload.get("llmEndpoint") or "").strip()
    llm_steps = parse_positive_int(request_payload.get("llmSteps"), default=20, minimum=5, maximum=60)

    if source_type == "llm":
        if not llm_prompt:
            raise ValueError("LLM 프롬프트를 입력해 주세요.")
        image_name = image_name or "llm-generated.png"
        image_base64 = request_a1111_image(
            endpoint=llm_endpoint,
            prompt=llm_prompt,
            negative_prompt=llm_negative_prompt,
            steps=llm_steps,
        )
    elif not image_base64:
        raise ValueError("이미지 데이터가 비어 있어요.")

    metadata, _stage_entries = resolve_stage_metadata(
        request_payload,
        fallback_id_source=Path(image_name or request_payload.get("displayName") or "stage").stem,
        validate_uniqueness=False,
    )

    colors = parse_positive_int(request_payload.get("colors"), default=10, minimum=2, maximum=MAX_COLORS)
    use_grid = request_payload.get("grid") is True and source_type != "llm"
    use_dither = request_payload.get("dither") is not False
    background_mode = str(request_payload.get("bgMode") or "auto").strip().lower()
    background_hex = str(request_payload.get("bgColor") or "").strip()
    if background_mode == "hex":
        background_setting = background_hex or "auto"
    elif background_mode in {"auto", "none"}:
        background_setting = background_mode
    else:
        background_setting = "auto"

    temp_path = decode_image_to_tempfile(image_name, image_base64)
    conversion_warning = None
    try:
        if use_grid:
            try:
                art, (width, height) = convert_grid(str(temp_path), colors=colors)
                if width > MAX_SIZE or height > MAX_SIZE:
                    raise ValueError(f"격자 감지 결과가 {width}x{height}여서 최대 30x30을 넘어요.")
            except ValueError as error:
                if "could not detect a grid" not in str(error).lower():
                    raise
                art = convert(
                    str(temp_path),
                    size=MAX_SIZE,
                    colors=colors,
                    dither=use_dither,
                    bg=background_setting,
                )
                conversion_warning = "격자를 찾지 못해 resize mode로 자동 변환했어요."
        else:
            art = convert(
                str(temp_path),
                size=MAX_SIZE,
                colors=colors,
                dither=use_dither,
                bg=background_setting,
            )
    finally:
        temp_path.unlink(missing_ok=True)

    art.name = metadata["export_name"]
    validate_art(art, max_colors=colors)
    stage_payload = convert_art_to_payload(art, metadata)
    stage_entry = build_stage_entry(
        sequence=metadata["sequence"],
        stage_id=metadata["stage_id"],
        display_name=metadata["display_name"],
        file_name=metadata["file_name"],
    )
    return {
        "stageEntry": stage_entry,
        "stagePayload": stage_payload,
        "warning": conversion_warning,
    }


def normalize_stage_image_map(raw_map: object) -> list[list[int]]:
    if not isinstance(raw_map, list) or not raw_map:
        raise ValueError("저장할 맵 데이터가 비어 있어요.")

    rows: list[list[int]] = []
    for row in raw_map:
        if not isinstance(row, list) or not row:
            raise ValueError("맵 행 데이터 형식이 올바르지 않아요.")
        parsed_row: list[int] = []
        for cell in row:
            parsed_cell = int(cell)
            if parsed_cell < 0:
                raise ValueError("맵 셀 값은 0 이상이어야 해요.")
            parsed_row.append(parsed_cell)
        rows.append(parsed_row)

    column_count = len(rows[0])
    if any(len(row) != column_count for row in rows):
        raise ValueError("맵은 모든 행 길이가 같아야 해요.")
    if len(rows) > MAX_SIZE or column_count > MAX_SIZE:
        raise ValueError(f"맵 크기가 너무 커요. 최대 {MAX_SIZE}x{MAX_SIZE}까지 가능해요.")
    return rows


def normalize_stage_palette(raw_palette: object, image_map: list[list[int]]) -> dict[str, str]:
    if not isinstance(raw_palette, dict):
        raise ValueError("팔레트 데이터 형식이 올바르지 않아요.")

    used_color_ids = sorted({cell for row in image_map for cell in row if cell})
    palette: dict[str, str] = {}
    for color_id in used_color_ids:
        raw_value = raw_palette.get(str(color_id), raw_palette.get(color_id))
        color = str(raw_value or "").strip().upper()
        if not re.fullmatch(r"#[0-9A-F]{6}", color):
            raise ValueError(f"팔레트 C{color_id} 색상값이 올바르지 않아요.")
        palette[str(color_id)] = color
    return palette


def create_stage_from_draft_request(request_payload: dict) -> dict:
    metadata, stage_entries = resolve_stage_metadata(
        request_payload,
        fallback_id_source=normalize_display_name(request_payload.get("displayName")) or "stage",
    )
    image_map = normalize_stage_image_map(request_payload.get("imageMap"))
    palette = normalize_stage_palette(request_payload.get("palette"), image_map)
    if len(palette) > MAX_COLORS:
        raise ValueError(f"팔레트 색상 수가 너무 많아요. 최대 {MAX_COLORS}색만 저장할 수 있어요.")

    stage_payload = build_stage_payload_from_map(
        image_map=image_map,
        palette=palette,
        sequence=metadata["sequence"],
        stage_id=metadata["stage_id"],
        display_name=metadata["display_name"],
        export_name=metadata["export_name"],
    )
    stage_entry = build_stage_entry(
        sequence=metadata["sequence"],
        stage_id=metadata["stage_id"],
        display_name=metadata["display_name"],
        file_name=metadata["file_name"],
    )
    stage_entries.append(stage_entry)
    stage_entries.sort(key=lambda entry: parse_positive_int(entry.get("sequence"), default=0, minimum=0))

    STAGE_DIR.mkdir(parents=True, exist_ok=True)
    metadata["stage_path"].write_text(json.dumps(stage_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_stage_index({"maps": stage_entries})

    return {
        "stageEntry": stage_entry,
        "stagePayload": stage_payload,
        "stagePath": str(metadata["stage_path"]),
    }


def create_stage_from_request(request_payload: dict) -> dict:
    preview_payload = build_preview_from_image_request(request_payload)
    stage_entry = preview_payload["stageEntry"]
    stage_payload = preview_payload["stagePayload"]
    stage_path = STAGE_DIR / stage_entry["file"]
    stage_index = read_stage_index()
    stage_entries = list(stage_index["maps"])
    stage_entries.append(stage_entry)
    stage_entries.sort(key=lambda entry: parse_positive_int(entry.get("sequence"), default=0, minimum=0))

    STAGE_DIR.mkdir(parents=True, exist_ok=True)
    stage_path.write_text(json.dumps(stage_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_stage_index({"maps": stage_entries})

    return {
        **preview_payload,
        "stagePath": str(stage_path),
    }


class StageImageBridgeHandler(BaseHTTPRequestHandler):
    server_version = "ColorJewelStageImageBridge/1.0"

    def _send_json(self, payload: dict, *, status: int = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send_json({"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") == "/health":
            self._send_json(
                {
                    "ok": True,
                    "pixelArtRoot": str(PIXEL_ART_ROOT),
                    "stageDir": str(STAGE_DIR),
                    "indexPath": str(INDEX_PATH),
                }
            )
            return

        self._send_json({"ok": False, "error": "not found"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802
        route = self.path.rstrip("/")
        if route not in {
            "/api/create-stage-from-image",
            "/api/preview-stage-from-image",
            "/api/create-stage-from-draft",
        }:
            self._send_json({"ok": False, "error": "not found"}, status=HTTPStatus.NOT_FOUND)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            request_payload = json.loads(raw_body.decode("utf-8"))
            if route == "/api/preview-stage-from-image":
                response_payload = build_preview_from_image_request(request_payload)
                response_status = HTTPStatus.OK
            elif route == "/api/create-stage-from-draft":
                response_payload = create_stage_from_draft_request(request_payload)
                response_status = HTTPStatus.CREATED
            else:
                response_payload = create_stage_from_request(request_payload)
                response_status = HTTPStatus.CREATED
        except Exception as error:  # Let the caller see the actual failure.
            self._send_json(
                {
                    "ok": False,
                    "error": str(error),
                },
                status=HTTPStatus.BAD_REQUEST,
            )
            return

        self._send_json({"ok": True, **response_payload}, status=response_status)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), StageImageBridgeHandler)
    print(f"[stage-image-bridge] listening on http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

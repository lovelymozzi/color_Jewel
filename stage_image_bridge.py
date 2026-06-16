from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import tempfile
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


def build_stage_payload(*, art, sequence: int, stage_id: str, display_name: str, export_name: str) -> dict:
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


def create_stage_from_request(request_payload: dict) -> dict:
    display_name = normalize_display_name(request_payload.get("displayName"))
    if not display_name:
        raise ValueError("관리용 이름을 입력해 주세요.")

    image_name = str(request_payload.get("imageName") or "").strip()
    image_base64 = str(request_payload.get("imageBase64") or "").strip()
    fallback_id_source = Path(image_name or display_name).stem
    stage_id = normalize_stage_id(request_payload.get("stageId"), fallback_id_source)

    stage_index = read_stage_index()
    stage_entries = list(stage_index["maps"])

    if any(str(entry.get("id") or "").strip().lower() == stage_id for entry in stage_entries):
        raise ValueError(f"이미 '{stage_id}' ID를 쓰는 스테이지가 있어요.")

    sequence = parse_positive_int(
        request_payload.get("sequence"),
        default=max((parse_positive_int(entry.get("sequence"), default=0, minimum=0) for entry in stage_entries), default=0) + 1,
        minimum=1,
    )
    if any(parse_positive_int(entry.get("sequence"), default=0, minimum=0) == sequence for entry in stage_entries):
        raise ValueError(f"이미 {sequence}번 순서를 쓰는 스테이지가 있어요.")

    export_name = f"{sequence:02d}_{stage_id}"
    file_name = f"{export_name}.json"
    stage_path = STAGE_DIR / file_name
    if stage_path.exists():
        raise ValueError(f"이미 '{file_name}' 파일이 있어요.")

    colors = parse_positive_int(request_payload.get("colors"), default=10, minimum=2, maximum=MAX_COLORS)
    use_grid = request_payload.get("grid") is True
    use_dither = request_payload.get("dither") is not False
    background_mode = str(request_payload.get("bgMode") or "auto").strip().lower()
    background_hex = str(request_payload.get("bgColor") or "").strip()

    temp_path = decode_image_to_tempfile(image_name, image_base64)
    try:
        if use_grid:
            art, (width, height) = convert_grid(str(temp_path), colors=colors)
            if width > 30 or height > 30:
                raise ValueError(f"격자 감지 결과가 {width}x{height}라서 최대 30x30을 넘어요.")
        else:
            if background_mode == "hex":
                background_setting = background_hex or "auto"
            elif background_mode in {"auto", "none"}:
                background_setting = background_mode
            else:
                background_setting = "auto"
            art = convert(
                str(temp_path),
                size=30,
                colors=colors,
                dither=use_dither,
                bg=background_setting,
            )

        art.name = export_name
        art.validate(size=len(art.rows), max_colors=colors)
        stage_payload = build_stage_payload(
            art=art,
            sequence=sequence,
            stage_id=stage_id,
            display_name=display_name,
            export_name=export_name,
        )
    finally:
        temp_path.unlink(missing_ok=True)

    stage_entry = {
        "sequence": sequence,
        "id": stage_id,
        "displayName": display_name,
        "displayNameNumbered": f"{sequence:02d}. {display_name}",
        "file": file_name,
    }
    stage_entries.append(stage_entry)
    stage_entries.sort(key=lambda entry: parse_positive_int(entry.get("sequence"), default=0, minimum=0))

    STAGE_DIR.mkdir(parents=True, exist_ok=True)
    stage_path.write_text(json.dumps(stage_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_stage_index({"maps": stage_entries})

    return {
        "stageEntry": stage_entry,
        "stagePayload": stage_payload,
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
        if self.path.rstrip("/") != "/api/create-stage-from-image":
            self._send_json({"ok": False, "error": "not found"}, status=HTTPStatus.NOT_FOUND)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            request_payload = json.loads(raw_body.decode("utf-8"))
            response_payload = create_stage_from_request(request_payload)
        except Exception as error:  # Let the caller see the actual failure.
            self._send_json(
                {
                    "ok": False,
                    "error": str(error),
                },
                status=HTTPStatus.BAD_REQUEST,
            )
            return

        self._send_json({"ok": True, **response_payload}, status=HTTPStatus.CREATED)


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

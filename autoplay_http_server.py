import json
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from stage_image_bridge import (
    PIXEL_ART_ROOT,
    STAGE_DIR,
    INDEX_PATH,
    MISSING,
    build_preview_from_image_request,
    create_stage_from_draft_request,
    create_stage_from_request,
    write_shared_state,
)


ROOT_DIR = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000


class NoCacheRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if self.path.rstrip("/") == "/health":
            body = json.dumps(
                {
                    "ok": True,
                    "pixelArtRoot": str(PIXEL_ART_ROOT),
                    "stageDir": str(STAGE_DIR),
                    "indexPath": str(INDEX_PATH),
                },
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()

    def do_POST(self):
        route = self.path.rstrip("/")
        if route not in {
            "/api/create-stage-from-image",
            "/api/preview-stage-from-image",
            "/api/create-stage-from-draft",
            "/api/save-shared-state",
        }:
            super().do_POST()
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length)
            request_payload = json.loads(raw_body.decode("utf-8"))
            if route == "/api/save-shared-state":
                response_payload = {
                    "sharedState": write_shared_state(
                        current_map_id=request_payload.get("currentMapId"),
                        active_override_map_id=request_payload.get("activeOverrideMapId"),
                        active_override=request_payload.get("activeOverride", MISSING),
                        overrides=request_payload.get("overrides"),
                    )
                }
                response_status = HTTPStatus.OK
            elif route == "/api/preview-stage-from-image":
                response_payload = build_preview_from_image_request(request_payload)
                response_status = HTTPStatus.OK
            elif route == "/api/create-stage-from-draft":
                response_payload = create_stage_from_draft_request(request_payload)
                response_status = HTTPStatus.CREATED
            else:
                response_payload = create_stage_from_request(request_payload)
                response_status = HTTPStatus.CREATED

            body = json.dumps({"ok": True, **response_payload}, ensure_ascii=False).encode("utf-8")
            self.send_response(response_status)
        except Exception as error:
            body = json.dumps(
                {
                    "ok": False,
                    "error": str(error),
                },
                ensure_ascii=False,
            ).encode("utf-8")
            self.send_response(HTTPStatus.BAD_REQUEST)

        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    handler = partial(NoCacheRequestHandler, directory=str(ROOT_DIR))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

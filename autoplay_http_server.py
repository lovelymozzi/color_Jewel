from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000


class NoCacheRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    handler = partial(NoCacheRequestHandler, directory=str(ROOT_DIR))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

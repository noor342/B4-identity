"""Simple dev server with caching disabled."""
import http.server, functools

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

if __name__ == "__main__":
    with http.server.HTTPServer(("", 8000), NoCacheHandler) as s:
        print("\n  ✦  B4 Portfolio running at  http://localhost:8000\n")
        s.serve_forever()

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import ssl

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        print(f"Proxying GET request to n8n POST...")
        url = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f'
        
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(url, data=b'{"source":"proxy_get"}', method='POST')
        req.add_header('Content-Type', 'application/json')
        
        try:
            with urllib.request.urlopen(req, context=ctx) as f:
                data = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
                print("Successfully proxied data from n8n")
        except Exception as e:
            print(f"Proxy error: {e}")
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(str(e).encode())

    # Keep do_POST and do_OPTIONS just in case
    def do_POST(self):
        self.do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

print("Starting Improved Proxy Server on port 8001...")
HTTPServer(('0.0.0.0', 8001), ProxyHandler).serve_forever()

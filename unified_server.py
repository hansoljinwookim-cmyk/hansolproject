import http.server
import urllib.request
import ssl
import sys
import os
import json
import socketserver
import time

# --- Robust Proxy Settings ---
N8N_WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f'

class UnifiedHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/get-data'):
            self.proxy_to_n8n()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/get-data'):
            self.proxy_to_n8n()
        else:
            super().do_POST()

    def proxy_to_n8n(self):
        print(f">>> [INVINCIBLE PROXY] Request received from dashboard.", flush=True)
        
        # Robust SSL Context (bypass all cert errors)
        ctx = ssl._create_unverified_context()
        
        max_retries = 3
        last_error = ""
        
        for attempt in range(max_retries):
            try:
                print(f">>> Attempt {attempt + 1}/{max_retries} to fetch from n8n...", flush=True)
                payload = json.dumps({"action": "fetch_data", "timestamp": time.time()}).encode('utf-8')
                req = urllib.request.Request(N8N_WEBHOOK_URL, data=payload, method='POST')
                req.add_header('Content-Type', 'application/json')
                req.add_header('User-Agent', 'Dashboard-Engine/3.0')
                
                with urllib.request.urlopen(req, context=ctx, timeout=60) as response:
                    data = response.read()
                    print(f">>> Success! Received {len(data)} bytes from n8n.", flush=True)
                    if len(data) == 0:
                        raise Exception("Received 0 bytes from n8n")
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(data)
                    return # Exit after success
            except Exception as e:
                last_error = str(e)
                print(f">>> Attempt {attempt + 1} failed: {last_error}", flush=True)
                time.sleep(1) # Wait before retry
        
        # If all retries failed
        print(f">>> [CRITICAL] All proxy attempts failed. Last error: {last_error}", flush=True)
        print(">>> Falling back to last_response.json", flush=True)
        try:
            with open('last_response.json', 'rb') as f:
                fallback_data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(fallback_data)
        except Exception as fallback_e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Data Load Failed after retries", "detail": last_error}).encode('utf-8'))

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == "__main__":
    port = 8080
    http.server.SimpleHTTPRequestHandler.extensions_map.update({
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
    })
    server = ThreadedHTTPServer(('0.0.0.0', port), UnifiedHandler)
    print(f"--- [INVINCIBLE ENGINE START] ---", flush=True)
    print(f"Listening on port {port} (0.0.0.0)", flush=True)
    server.serve_forever()

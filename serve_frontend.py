#!/usr/bin/env python3
"""
Simple HTTP server to serve the built frontend files
Run this to serve the frontend at http://192.168.1.18:3000
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Change to the dist directory where built files are
dist_path = Path(__file__).parent / "dist"
os.chdir(dist_path)

PORT = 3000
HOST = "0.0.0.0"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    print(f"Serving frontend at http://{HOST}:{PORT}")
    print(f"Frontend files from: {dist_path.absolute()}")
    print("Press Ctrl+C to stop")
    
    with socketserver.TCPServer((HOST, PORT), MyHTTPRequestHandler) as httpd:
        print(f"Serving at http://192.168.1.18:{PORT}")
        httpd.serve_forever()

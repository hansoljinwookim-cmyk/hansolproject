import subprocess
import time
import sys
import os

def run_invincible_system():
    print("--- DOUBLE WATCHDOG: Starting Invincible Dashboard & Tunnel System ---")
    
    server_process = None
    tunnel_process = None
    
    while True:
        try:
            # 1. Check Server
            if server_process is None or server_process.poll() is not None:
                print("--- WATCHDOG: Starting/Restarting Server... ---")
                server_process = subprocess.Popen([sys.executable, "unified_server.py"], cwd=os.getcwd())
            
            # 2. Check Tunnel
            if tunnel_process is None or tunnel_process.poll() is not None:
                print("--- WATCHDOG: Starting/Restarting Tunnel... ---")
                with open("cf_watchdog.txt", "a") as log:
                    tunnel_process = subprocess.Popen(["./cf.exe", "tunnel", "--protocol", "http2", "--url", "http://127.0.0.1:8080"], 
                                                   cwd=os.getcwd(), stdout=log, stderr=log)
            
        except Exception as e:
            print(f"--- WATCHDOG ERROR: {e} ---")
        
        time.sleep(10) # Check every 10 seconds

if __name__ == "__main__":
    run_invincible_system()

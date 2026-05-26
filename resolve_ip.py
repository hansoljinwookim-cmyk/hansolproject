import socket
import os

def get_ip(hostname):
    try:
        ip = socket.gethostbyname(hostname)
        return ip
    except Exception as e:
        return str(e)

host = "desktop-q3rmt5i.tail25a848.ts.net"
print(f"Resolving {host}...")
print(f"IP: {get_ip(host)}")

# Try alternative names
print(f"Resolving desktop-q3rmt5i...")
print(f"IP: {get_ip('desktop-q3rmt5i')}")

import json
import re

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
app_js_path = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

# Read the entire log as a string to avoid line-splitting issues with large JSONs
with open(log_path, 'r', encoding='utf-8') as f:
    full_log = f.read()

# Find the specific step content using regex to find the largest "CodeContent" block near step 1552
matches = re.findall(r'"CodeContent":\s*"(.*?)(?<!\\)"', full_log, re.DOTALL)
if matches:
    # Get the longest match which is likely our 62KB app.js
    longest_code = max(matches, key=len)
    
    # Unescape common JSON escaped chars
    code = longest_code.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\')
    
    with open(app_js_path, 'w', encoding='utf-8') as app_f:
        app_f.write(code)
    print(f">>> app.js RESTORED. Size: {len(code)} bytes.")
else:
    print(">>> No CodeContent found in logs.")

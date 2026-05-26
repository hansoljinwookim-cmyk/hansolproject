import json

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
app_path = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'
deadline = "2026-05-12T23:30:00Z"

last_good = None
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('created_at', '') > deadline:
                break
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    args = tc.get('args', {})
                    if 'app.js' in args.get('TargetFile', '') and args.get('CodeContent'):
                        last_good = args['CodeContent']
        except:
            continue

if last_good:
    # Handle the raw string from JSON properly
    # The string already contains literal \n, \t, etc.
    # Python's write will handle them if we just write the string
    # unless it was doubly escaped. 
    # Let's try a direct write first, and if it's still one line, we split it.
    
    # Actually, the best way is to use json.loads on a dummy object
    code = json.loads('{"c":' + json.dumps(last_good) + '}')['c']
    
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f">>> app.js Rollback Success. Lines: {len(code.splitlines())}")
else:
    print(">>> Error: Could not find pre-8:30AM code.")

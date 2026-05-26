import json
import os

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
deadline = "2026-05-12T23:30:00Z"

def find_early_version(target_filename):
    print(f"Searching for {target_filename} before {deadline}...")
    last_good = None
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('created_at', '') > deadline:
                    continue # Keep looking for the last one before deadline, or just break if we want the absolute first
                
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        args = tc.get('args', {})
                        target = args.get('TargetFile', '') or args.get('AbsolutePath', '')
                        if target_filename in target:
                            content = args.get('CodeContent')
                            if content:
                                last_good = content
                                print(f"Found version at {data.get('created_at')}, size: {len(content)}")
            except:
                continue
    return last_good

app_code = find_early_version('app.js')
if app_code:
    with open('app_restored_v3.js', 'w', encoding='utf-8') as f:
        f.write(app_code.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\'))
    print("Saved app_restored_v3.js")

style_code = find_early_version('styles.css')
if style_code:
    with open('styles_restored_v3.css', 'w', encoding='utf-8') as f:
        f.write(style_code.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\'))
    print("Saved styles_restored_v3.css")

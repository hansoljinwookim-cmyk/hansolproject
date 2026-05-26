import json
import os

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
base_dir = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard'
deadline = "2026-05-12T23:30:00Z"

def recover():
    results = {}
    with open(log_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        print(f"Total lines: {len(lines)}")
        for line in reversed(lines):
            try:
                data = json.loads(line)
                ts = data.get('created_at', '')
                if ts > deadline:
                    continue
                
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        args = tc.get('args', {})
                        # Check write_to_file
                        target = args.get('TargetFile', '') or args.get('AbsolutePath', '')
                        content = args.get('CodeContent')
                        
                        if not target: continue
                        
                        filename = os.path.basename(target)
                        if filename in ['app.js', 'styles.css', 'index.html'] and filename not in results:
                            if content:
                                results[filename] = content
                                print(f"Found {filename} (write_to_file) at {ts}")
            except:
                continue
            if len(results) == 3: break

    for filename, content in results.items():
        path = os.path.join(base_dir, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\'))
        print(f"Restored {filename}")

if __name__ == "__main__":
    recover()

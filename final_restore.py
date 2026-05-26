import json
import os

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
base_dir = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard'

# Deadline: Pre-8:30AM KST today (May 13)
deadline = "2026-05-12T23:30:00Z"

def recover_830am_version():
    results = {}
    
    with open(log_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for line in reversed(lines):
            try:
                data = json.loads(line)
                if data.get('created_at', '') > deadline:
                    continue
                
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        args = tc.get('args', {})
                        target = args.get('TargetFile', '') or args.get('AbsolutePath', '')
                        content = args.get('CodeContent')
                        if not content: continue
                        
                        filename = os.path.basename(target)
                        if filename in ['app.js', 'styles.css', 'index.html'] and filename not in results:
                            results[filename] = content
                            print(f"Found {filename} from {data.get('created_at')}")
                
                if len(results) == 3:
                    break
            except:
                continue
    
    for filename, content in results.items():
        path = os.path.join(base_dir, filename)
        with open(path, 'w', encoding='utf-8') as f:
            # Clean up JSON escaped characters
            cleaned = content.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\')
            f.write(cleaned)
        print(f">>> {filename} RESTORED.")

if __name__ == "__main__":
    recover_830am_version()

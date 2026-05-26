import json
import os

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
styles_path = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\styles.css'

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    if 'styles.css' in line and ('view_file' in line or 'write_to_file' in line):
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                args = data['tool_calls'][0]['args']
                content = args.get('CodeContent') or args.get('content')
            elif 'content' in data:
                content = data['content']
            
            if content and len(content) > 2000: # Look for the large CSS
                # Handle the specific format of the view_file output in logs
                if 'Showing lines 1 to 615' in content:
                    # Strip line numbers
                    clean_lines = []
                    for cl in content.split('\n'):
                        if ':' in cl:
                            clean_lines.append(cl.split(':', 1)[1].lstrip())
                    content = '\n'.join(clean_lines)
                
                with open(styles_path, 'w', encoding='utf-8') as sf:
                    sf.write(content)
                print(f">>> styles.css RESTORED. Length: {len(content)}")
                break
        except:
            continue

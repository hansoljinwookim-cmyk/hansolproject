import json
import os

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
app_path = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'
styles_path = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\styles.css'

# Deadline: Pre-8:30AM KST today (May 13)
deadline = "2026-05-12T23:30:00Z"

def recover_white_version():
    app_code = None
    style_code = None
    
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('created_at', '') > deadline:
                    break
                
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        args = tc.get('args', {})
                        target = args.get('TargetFile', '') or args.get('AbsolutePath', '')
                        content = args.get('CodeContent')
                        if not content: continue
                        
                        if 'app.js' in target:
                            app_code = content
                        if 'styles.css' in target:
                            # Verify if it's the WHITE version (look for background-color: white or similar)
                            if 'background' in content.lower() and ('white' in content.lower() or '#fff' in content.lower()):
                                style_code = content
            except:
                continue
    
    if app_code:
        with open(app_path, 'w', encoding='utf-8') as f:
            f.write(app_code.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\'))
        print(">>> app.js (Morning Version) Restored.")
        
    if style_code:
        with open(styles_path, 'w', encoding='utf-8') as f:
            f.write(style_code.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\'))
        print(">>> styles.css (WHITE Version) Restored.")
    else:
        # Fallback: Find ANY style write before the deadline
        pass

recover_white_version()

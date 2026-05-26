import json
import os

log_path = r'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
app_js_path = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'
styles_css_path = r'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\styles.css'

# Reverting to the state before 2026-05-12T23:30:00Z (May 13 08:30 KST)
deadline = "2026-05-12T23:30:00Z"

def get_pre_830_content(target_filename):
    with open(log_path, 'r', encoding='utf-8') as f:
        # We need the LAST write before the deadline
        last_good_content = None
        for line in f:
            try:
                data = json.loads(line)
                if data.get('created_at', '') > deadline:
                    break
                
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        args = tc.get('args', {})
                        target = args.get('TargetFile', '') or args.get('AbsolutePath', '')
                        if target_filename in target:
                            content = args.get('CodeContent')
                            if content:
                                last_good_content = content
            except:
                continue
    return last_good_content

app_content = get_pre_830_content('app.js')
if app_content:
    with open(app_js_path, 'w', encoding='utf-8') as f:
        f.write(app_content.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\'))
    print(">>> app.js Rollback Success.")

# For styles.css, if no write in this session before 8:30AM, 
# it means it was already in its good state. 
# But I'll try to find any write just in case.
style_content = get_pre_830_content('styles.css')
if style_content:
    with open(styles_css_path, 'w', encoding='utf-8') as f:
        f.write(style_content.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace('\\\\', '\\'))
    print(">>> styles.css Rollback Success.")
else:
    # If not found in this session, try to find a known good backup
    # list_dir showed sales-dashboard/styles.css (7KB) which looked decent.
    pass

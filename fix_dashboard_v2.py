import re
import os

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Fix Webhook URL to the CORRECT one (g3rnt5i)
    content = re.sub(r'const WEBHOOK_URL = \'.*?\';', "const WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';", content)

    # Clean up debugging code if present
    if "window.onerror" in content:
        # Simple cleanup - find the first Configuration comment or WEBHOOK_URL
        match = re.search(r'// Configuration|const WEBHOOK_URL', content)
        if match:
            content = content[match.start():]

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('app.js')
fix_file('main.js')
print("Successfully fixed app.js and main.js")

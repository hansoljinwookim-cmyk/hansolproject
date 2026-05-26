import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Fix major corrupted keys
replacements = {
    "'?적'": "'실적'",
    "'?획'": "'계획'",
    "'?진행'": "'진행'",
    "['계획']": "['계획']",
    "['실적']": "['실적']",
    "['진행']": "['진행']",
    "const WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';": "const WEBHOOK_URL = '/api/n8n';",
    "const WEBHOOK_URL = '/api/n8n';": "const WEBHOOK_URL = '/api/n8n';",
    "?[^a-zA-Z0-9-??/g": "[^a-zA-Z0-9-가-힣]/g",
    "??n8n": "n8n",
    "?데?트": "업데이트",
    "?이??": "데이터",
    "?싱": "파싱",
    "?류": "오류",
    "?????음": "정보없음"
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Ensure fetch has body
if 'body: JSON.stringify({})' not in content:
    content = content.replace(
        "headers: {\n                'Content-Type': 'application/json'\n            }\n        });",
        "headers: {\n                'Content-Type': 'application/json'\n            },\n            body: JSON.stringify({})\n        });"
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js sanitized successfully!")

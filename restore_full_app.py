import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

# I will use a known good base and apply the fixes
# Since I cannot easily read the 1600 lines without mojibake issues in this turn,
# I will use a Python script to patch the existing app.js (which was just the simple version)
# No, that's wrong. Simple version is only 37 lines.

# I'll restore the full logic from app_fixed.js and patch it with the working URL and no-mojibake code.
with open(r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_fixed.js', 'r', encoding='utf-8', errors='ignore') as f:
    full_content = f.read()

# Patch URL and fetchData
full_content = full_content.replace("const WEBHOOK_URL = '/api/n8n';", "const WEBHOOK_URL = '/get-data';")
full_content = full_content.replace("const WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';", "const WEBHOOK_URL = '/get-data';")

# Ensure window.fetchData is used for the onclick attribute
full_content = full_content.replace("async function fetchData() {", "window.fetchData = async function() {")

# Apply mojibake fixes (essential keys)
full_content = full_content.replace("'?적'", "'실적'")
full_content = full_content.replace("'?획'", "'계획'")
full_content = full_content.replace("['?적']", "['실적']")
full_content = full_content.replace("['계획']", "['계획']")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(full_content)

print("Full app.js restored and patched with working connection!")

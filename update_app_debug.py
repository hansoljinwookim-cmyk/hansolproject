import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Update URL
content = content.replace("const WEBHOOK_URL = '/api/n8n';", "const WEBHOOK_URL = '/get-data';")

# Add Debug Alert to fetchData
if "alert('데이터 요청 시작!');" not in content:
    content = content.replace(
        "async function fetchData() {\n    showLoading(true);",
        "async function fetchData() {\n    alert('데이터 요청 시작!');\n    showLoading(true);"
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js updated with /get-data and alert!")

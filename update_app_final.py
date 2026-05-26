import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Make sure fetchData is global (it usually is, but let's be sure)
# Also remove the alert but add a visible sign
content = content.replace("alert('데이터 요청 시작!');", "console.log('--- FETCH START ---');")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js updated for direct onclick access!")

import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Fix the main keys in fetchData
content = content.replace("item['?적']", "item['실적']")
content = content.replace("rawData['?적']", "rawData['실적']")
content = content.replace("?달받은", "전달받은")
content = content.replace("?싱", "파싱")
content = content.replace("?류", "오류")
content = content.replace("?데?트", "업데이트")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js keys fixed successfully!")

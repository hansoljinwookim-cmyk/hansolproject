import os
import re

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Remove the accidentally pasted URL
content = content.replace("http://localhost:8001/check.txt", "")

# 2. Fix the syntax error on line 711 (and surrounding)
content = content.replace("'억 : '0'", "'억' : '0'")
content = content.replace("`+${formatNumber(endMonthActual)}억';", "'+' + formatNumber(endMonthActual) + '억';")
content = content.replace("`${ sign }${ formatNumber(growth) }억';", "sign + formatNumber(growth) + '억';")

# 3. Fix the broken title and mojibake
content = re.sub(r'text: `\?업\?원\?기여\?\?,', "text: '영업사원 기여도',", content)
content = re.sub(r'text: `\$\{teamName\.replace\(\'컨테\?너\', \'\'\)\} \$\{monthStr\} \?성 \?황`,', "text: teamName + ' ' + monthStr + ' 달성현황',", content)

# 4. Ensure window.onload is at the top
if 'window.onload' not in content:
    header = """alert("대시보드 엔진 가동 중... (파일 로드 성공)");
window.onload = function() { fetchData(); };
"""
    content = header + content

# 5. Save the clean version to BOTH files
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

with open(r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_new.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("SURGERY SUCCESSFUL!")

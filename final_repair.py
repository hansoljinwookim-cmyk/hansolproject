import re

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Fix known syntax errors
    content = content.replace("'억 : '0'", "'억' : '0'")
    content = content.replace("`+${formatNumber(endMonthActual)}억';", "'+' + formatNumber(endMonthActual) + '억';")
    content = content.replace("`${ sign }${ formatNumber(growth) }억';", "sign + formatNumber(growth) + '억';")
    content = re.sub(r'text: `\?업\?원\?기여\?\?,', "text: '영업사원 기여도',", content)
    content = re.sub(r'text: `\$\{teamName\.replace\(\'컨테\?너\', \'\'\)\} \$\{monthStr\} \?성 \?황`,', "text: teamName + ' ' + monthStr + ' 달성현황',", content)
    
    # Fix the top of the file to include window.onload
    if 'window.onload' not in content:
        header = """alert("대시보드 엔진 가동 중... (파일 로드 성공)");
window.onload = function() { fetchData(); };
"""
        content = header + content

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('app.js')
import shutil
shutil.copy('app.js', 'app_new.js')
print("REPAIR COMPLETED!")

import re
import os

def fix_content(text):
    fixes = {
        '??': '실적',
        '?업?원': '영업사원',
        '?체 ?': '전체 팀',
        '?체 ?원': '전체 사원',
        '?의진행?태': '품의진행상태',
        '?년계약': '다년계약',
        '?이??': '데이터',
        '?원': '억원',
        '?함': '포함',
        '?간': '연간',
        '?계': '합계',
        '?성': '달성',
        '?황': '현황',
        '?데?트': '업데이트',
        '?보': '정보',
        '?음': '없음',
        '?패': '실패',
        '?도': '기여도',
        '?라?더': '슬라이더',
        '?기': '가져오기',
        '?플': '샘플',
        '?달': '전달',
        '?인': '확인',
        '?정': '확정',
        '?주': '수주',
        '?속': '소속',
        '?당': '담당',
        '?트': '포트',
        '?출': '수출',
        '?소': '장소',
        '?의': '품의'
    }
    for k, v in fixes.items():
        text = text.replace(k, v)
    return text

source_file = 'app_fixed.js' if os.path.exists('app_fixed.js') else 'app.js'

with open(source_file, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Fix Webhook URL
content = re.sub(r'const WEBHOOK_URL = \'.*?\';', "const WEBHOOK_URL = 'https://desktop-q3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';", content)

# Fix mojibake
content = fix_content(content)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed main.js")

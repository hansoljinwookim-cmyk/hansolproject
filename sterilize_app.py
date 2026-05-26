import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Comprehensive Mojibake Fix
replacements = {
    "'?적'": "'실적'",
    "'?획'": "'계획'",
    "'?진행'": "'진행'",
    "'?간 ?계'": "'연간 누계'",
    "'?체 ?'": "'전체 팀'",
    "'?체 ?원'": "'전체 사원'",
    "'?업?원'": "'영업사원'",
    "'?당??'": "'담당자'",
    "'?업'": "'사업'",
    "'?소'": "'장소'",
    "'?트'": "'포트'",
    "'??'": "'실적'",
    "'?출??'": "'수출입'",
    "'?의진행?태'": "'협의진행상태'",
    "'?태'": "'상태'",
    "'진행?태'": "'진행상태'",
    "'?년계약'": "'다년계약'",
    "?? + new Intl": "'-' + new Intl",
    "'?라?더'": "'슬라이더'",
    "'??'": "'실적'",
    "'?업진행?황'": "'영업진행현황'",
    "'?당 ???적 증감'": "'전달 대비 실적 증감'",
    "'?적 ?주 ?계'": "'실적 수주 합계'",
    "'?간'": "'연간'",
    "'컨테?너?업1?'": "'컨테이너영업1팀'",
    "'컨테?너?업2?'": "'컨테이너영업2팀'",
    "'컨테?너?업3?'": "'컨테이너영업3팀'",
    "(`${i}??`)": "(`${i}월`)",
    "opt.value = `${i}??;": "opt.value = `${i}월`;",
    "opt.textContent = `${ i }??;": "opt.textContent = `${i}월`;",
    "'?이?? 불러?는???패?습?다'": "'데이터를 불러오는데 실패했습니다'",
    "rawData['?적']": "rawData['실적']",
    "item['?적']": "item['실적']",
    "item['?획']": "item['계획']",
    "?[^a-zA-Z0-9-??/g": "[^a-zA-Z0-9-가-힣]/g",
    "??n8n": "n8n",
    "WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';": "WEBHOOK_URL = '/api/n8n';",
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Fix double-question mark units
content = content.replace("??'", "억'")
content = content.replace("??;", "억';")
content = content.replace("??`", "억`")
content = content.replace("'??", "'억")

# Final fix for any missed ? in keys
content = content.replace("'실? 적'", "'실적'")
content = content.replace("'계? 획'", "'계획'")
content = content.replace("'진? 행'", "'진행'")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Full app.js sterilization complete!")

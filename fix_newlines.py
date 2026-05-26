import sys

replacements = {
    "// table_to_sheet瑜??ъ슜?섏뿬 而ㅼ뒪?€ ???덈퉬 吏€??    const ws = XLSX.utils.table_to_sheet(table);": "// table_to_sheet\n    const ws = XLSX.utils.table_to_sheet(table);",
    "prevMonday.setDate(reportingThursday.getDate() - 3); // 紐⑹슂??- 3??= ?붿슂??    const prevFriday = new Date(reportingThursday);": "prevMonday.setDate(reportingThursday.getDate() - 3); // 월요일\n    const prevFriday = new Date(reportingThursday);",
    "// ?ㅼ쓬 二쇱감 ?띿뒪?몄뿉??泥?以꾩쓣 李얠븘 吏꾪븳 ?뚮???蹂쇰뱶泥대줈 媛먯떥湲?        if (curr) {": "// 다음 주차 텍스트에서 첫 줄을 볼드로 감싸기\n        if (curr) {"
}

def fix():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    for k, v in replacements.items():
        if k in content:
            content = content.replace(k, v)
        else:
            print(f"Warning: Could not find '{k}'")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Comment syntax fix applied successfully.")

if __name__ == '__main__':
    fix()

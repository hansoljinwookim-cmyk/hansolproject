from pyjsparser import parse

with open('app.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

try:
    parse(js_code)
    print("Syntax OK")
except Exception as e:
    print(f"Syntax Error: {e}")

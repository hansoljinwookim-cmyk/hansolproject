import sys

def fix():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    if content.startswith('\ufeff'):
        content = content[1:]
        
    try:
        # Encode to cp949 but ignore errors for unmappable chars
        original_bytes = content.encode('cp949', errors='ignore')
        fixed_content = original_bytes.decode('utf-8', errors='ignore')
        
        with open('app_fixed.js', 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print("Fixed successfully.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    fix()

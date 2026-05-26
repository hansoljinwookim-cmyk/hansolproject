import sys

def find_unclosed_backtick(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    in_backtick = False
    start_line = -1
    
    for i, line in enumerate(lines):
        # Count backticks ignoring escaped ones \`
        # Also, this is a naive check. Let's just find all backticks.
        idx = 0
        while idx < len(line):
            if line[idx] == '`':
                # check if escaped
                escaped = False
                k = idx - 1
                while k >= 0 and line[k] == '\\':
                    escaped = not escaped
                    k -= 1
                if not escaped:
                    in_backtick = not in_backtick
                    if in_backtick:
                        start_line = i + 1
            idx += 1
            
    if in_backtick:
        print(f"Unclosed backtick started around line {start_line}")
    else:
        print("Backticks are balanced.")

if __name__ == '__main__':
    find_unclosed_backtick('app.js')

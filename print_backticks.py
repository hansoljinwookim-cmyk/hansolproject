import sys

def print_backticks(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    count = 0
    for i, line in enumerate(lines):
        for char in line:
            if char == '`':
                count += 1
                print(f"Backtick {count} found at line {i+1}")

if __name__ == '__main__':
    print_backticks('app.js')

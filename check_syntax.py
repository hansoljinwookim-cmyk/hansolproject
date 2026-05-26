import sys

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

backtick_count = content.count('`')
print(f"Total backticks: {backtick_count}")
if backtick_count % 2 != 0:
    print("Warning: Odd number of backticks found!")

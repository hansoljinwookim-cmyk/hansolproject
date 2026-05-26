import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'a', encoding='utf-8') as f:
    f.write("\n\n// Final safety bind to ensure the button works\n")
    f.write("document.addEventListener('DOMContentLoaded', () => {\n")
    f.write("    const btn = document.getElementById('updateBtn');\n")
    f.write("    if (btn) {\n")
    f.write("        console.log('Update button found and bound');\n")
    f.write("        btn.onclick = (e) => {\n")
    f.write("            e.preventDefault();\n")
    f.write("            console.log('Update button clicked!');\n")
    f.write("            fetchData();\n")
    f.write("        };\n")
    f.write("    }\n")
    f.write("});\n")

print("Safety bind added to app.js!")

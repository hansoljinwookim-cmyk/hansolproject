import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Add global state if missing
if "let dashboardData" not in content:
    header = "let dashboardData = { plan: [], actual: [], progress: [] };\nlet charts = { monthly: null, person: null, teamPlan: null, personActual: null };\n\n"
    content = header + content

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Global state added to app.js!")

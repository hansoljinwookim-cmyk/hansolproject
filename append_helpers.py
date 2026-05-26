import os

app_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'
fixed_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_fixed.js'

with open(fixed_path, 'r', encoding='utf-8', errors='ignore') as f:
    fixed_content = f.read()

# Extract only the helper functions and rendering logic
# We skip the initialization and fetchData parts at the top
start_marker = "function formatNumber"
if start_marker in fixed_content:
    helpers = fixed_content[fixed_content.find(start_marker):]
    
    with open(app_path, 'a', encoding='utf-8') as f:
        f.write("\n\n// --- RESTORED RENDERING LOGIC ---\n")
        f.write(helpers)

print("Rendering logic appended to app.js!")

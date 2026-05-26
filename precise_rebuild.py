import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

# Final precise mapping based on USER provided keys
new_map_item = """
function mapItem(item) {
    const row = item.json ? item.json : item;
    
    // Exact mapping from User's information
    // Progress (진행): customer_name / team_name / sales_rep / prev_week_status / curr_week_plan
    // Plan (계획): Teamname / SalesPerson / TargetMonth / TargetAmount
    // Actual (실적): Teamname / ClientName / SalesPerson / WorkLocation / PORT / TradeType / Region / 
    //                 ConfirmedAmount / ProposalAmount / AmountGap / Revenue / SalesYear / SalesWeek / 
    //                 Status / DelayReason / MultYearContract / Complete / Lv3 / Lv2 / Lv1 / Total

    return {
        ...row,
        // Common UI fields
        SalesPerson: row.SalesPerson || row.sales_rep || '미정',
        Teamname: (row.Teamname || row.team_name || ' - ').trim(),
        ClientName: row.ClientName || row.customer_name || '미정',
        
        // Amount mapping: Use 'Total' for Actual, 'TargetAmount' for Plan
        Amount: Number(String(row.Total || row.TargetAmount || row.ConfirmedAmount || 0).replace(/[^0-9.-]/g, '')),
        CalculatedAmount: Number(String(row.Total || row.ConfirmedAmount || 0).replace(/[^0-9.-]/g, '')),
        
        // Month mapping: Use 'SalesWeek' for Actual Month as per user, 'TargetMonth' for Plan
        Month: row.SalesWeek || row.TargetMonth || '-',
        SalesMonth: row.SalesWeek || row.TargetMonth || '-',
        
        // Special fields
        MultiYearContract: row.MultYearContract || row.MultiYearContract || '-',
        Complete: Number(String(row.Complete || 0).replace(/[^0-9.-]/g, '')),
        Lv3: Number(String(row.Lv3 || 0).replace(/[^0-9.-]/g, '')),
        Lv2: Number(String(row.Lv2 || 0).replace(/[^0-9.-]/g, '')),
        Lv1: Number(String(row.Lv1 || 0).replace(/[^0-9.-]/g, ''))
    };
}
"""

# Rebuild the whole app.js with ALL functions restored and PRECISE mapping
import re

# 1. Restore the full logic but with patched functions
with open(r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_fixed.js', 'r', encoding='utf-8', errors='ignore') as f:
    full_content = f.read()

# Replace the mapping function
full_content = re.sub(r'function mapItem\(item\) \{.*?\}', new_map_item, full_content, flags=re.DOTALL)
# Ensure URL is correct
full_content = full_content.replace("const WEBHOOK_URL = '/api/n8n';", "const WEBHOOK_URL = '/get-data';")
full_content = full_content.replace("const WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';", "const WEBHOOK_URL = '/get-data';")
# Ensure global access
full_content = full_content.replace("async function fetchData() {", "window.fetchData = async function() {")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(full_content)

print("App.js precisely mapped and fully restored!")

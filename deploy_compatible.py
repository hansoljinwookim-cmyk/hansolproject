import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

# Compatible Mapping: Preserve ALL original keys and add dashboard aliases
compatible_logic = """
function mapItem(item) {
    const row = item.json ? item.json : item;
    
    // 1. Convert any possible amount field to number
    const toNum = (v) => Number(String(v || 0).replace(/[^0-9.-]/g, ''));
    
    const amt = toNum(row.Total || row.TargetAmount || row.ConfirmedAmount || row.ProposalAmount || 0);
    const mon = row.SalesWeek || row.TargetMonth || '-';
    
    // 2. Return object with BOTH original keys and normalized aliases
    return {
        ...row,
        // Aliases for dashboard compatibility
        Amount: amt,
        CalculatedAmount: amt,
        SalesMonth: mon,
        Month: mon,
        // Ensure core fields used in rendering exist
        TargetAmount: row.TargetAmount || amt,
        Total: row.Total || amt,
        ConfirmedAmount: row.ConfirmedAmount || amt,
        SalesPerson: row.SalesPerson || row.sales_rep || '미정',
        Teamname: (row.Teamname || row.team_name || ' - ').trim(),
        ClientName: row.ClientName || row.customer_name || '미정'
    };
}

function processFetchedData(rawData) {
    console.log("--- COMPATIBLE DNA DETECTION START ---");
    let plan = [];
    let actual = [];
    let progress = [];

    const analyzeArray = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return;
        const first = arr[0].json ? arr[0].json : arr[0];
        const keys = Object.keys(first);
        
        if (keys.includes('Total') || keys.includes('SalesWeek') || keys.includes('ConfirmedAmount')) {
            actual = arr;
        } else if (keys.includes('TargetAmount') || keys.includes('TargetMonth')) {
            plan = arr;
        } else if (keys.includes('customer_name') || keys.includes('prev_week_status') || keys.includes('sales_rep')) {
            progress = arr;
        }
    };

    const findArrays = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        Object.values(obj).forEach(val => {
            if (Array.isArray(val)) analyzeArray(val);
            else if (val && typeof val === 'object') findArrays(val);
        });
    };

    if (Array.isArray(rawData)) {
        rawData.forEach(item => findArrays(item));
    } else {
        findArrays(rawData);
    }

    dashboardData.plan = plan.map(mapItem);
    dashboardData.actual = actual.map(mapItem);
    dashboardData.progress = progress.map(mapItem);
    
    const msg = `데이터 분석 완료!\\n계획: ${dashboardData.plan.length}건\\n실적: ${dashboardData.actual.length}건\\n진행: ${dashboardData.progress.length}건`;
    console.log(msg);
    alert(msg); // VISUAL CONFIRMATION FOR USER
    
    populateFilters();
    updateDashboard();
}
"""

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace processFetchedData and mapItem with the compatible version
import re
content = re.sub(r'function processFetchedData\(.*?\}', compatible_logic, content, flags=re.DOTALL)
content = re.sub(r'function mapItem\(.*?\}', '', content, flags=re.DOTALL) # Removed as it's now inside compatible_logic

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("COMPATIBLE app.js deployed!")

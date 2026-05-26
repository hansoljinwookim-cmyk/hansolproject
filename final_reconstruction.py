import os

# 1. Start with the clean original base
with open(r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_fixed.js', 'r', encoding='utf-8', errors='ignore') as f:
    base_content = f.read()

# 2. Define the core invincible functions
core_functions = """
const WEBHOOK_URL = '/get-data';

window.fetchData = async function() {
    console.log("--- INVINCIBLE FETCH START ---");
    const info = document.getElementById('lastUpdateInfo');
    const overlay = document.getElementById('loadingOverlay');
    
    if (info) info.textContent = "데이터 분석 중...";
    if (overlay) overlay.classList.remove('hidden');

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch_data' })
        });

        if (!response.ok) throw new Error('서버 응답 오류: ' + response.status);

        const rawData = await response.json();
        console.log("수신 데이터:", rawData);
        
        processFetchedData(rawData);

        if (info) info.textContent = "업데이트 완료 (" + new Date().toLocaleTimeString() + ")";
    } catch (error) {
        console.error("Critical Error:", error);
        alert("오류 발생: " + error.message);
    } finally {
        if (overlay) overlay.classList.add('hidden');
    }
};

function processFetchedData(rawData) {
    console.log("--- DNA TRAWL START ---");
    let plan = [];
    let actual = [];
    let progress = [];

    const trawl = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (let key in obj) {
            const val = obj[key];
            if (Array.isArray(val) && val.length > 0) {
                const first = val[0].json ? val[0].json : val[0];
                const fKeys = Object.keys(first).join(',').toLowerCase();
                
                if (fKeys.includes('total') || fKeys.includes('salesweek') || fKeys.includes('confirmed')) {
                    actual = val;
                } else if (fKeys.includes('targetamount') || fKeys.includes('targetmonth')) {
                    plan = val;
                } else if (fKeys.includes('customer_name') || fKeys.includes('prev_week_status') || fKeys.includes('sales_rep')) {
                    progress = val;
                }
            } else if (val && typeof val === 'object') {
                trawl(val);
            }
        }
    };

    trawl(rawData);

    // Hard Mapping with Compatibility
    dashboardData.plan = plan.map(mapItem);
    dashboardData.actual = actual.map(mapItem);
    dashboardData.progress = progress.map(mapItem);
    
    const msg = `분석 완료!\\n계획: ${dashboardData.plan.length}건, 실적: ${dashboardData.actual.length}건, 진행: ${dashboardData.progress.length}건`;
    console.log(msg);
    alert(msg); // MUST SHOW THIS
    
    populateFilters();
    updateDashboard();
}

function mapItem(item) {
    const row = item.json ? item.json : item;
    const toNum = (v) => Number(String(v || 0).replace(/[^0-9.-]/g, ''));
    const amt = toNum(row.Total || row.TargetAmount || row.ConfirmedAmount || row.ProposalAmount || 0);
    const mon = row.SalesWeek || row.TargetMonth || '-';
    
    return {
        ...row,
        Amount: amt,
        CalculatedAmount: amt,
        Month: mon,
        SalesMonth: mon,
        TargetAmount: row.TargetAmount || amt,
        Total: row.Total || amt,
        ConfirmedAmount: row.ConfirmedAmount || amt,
        SalesPerson: row.SalesPerson || row.sales_rep || '미정',
        Teamname: (row.Teamname || row.team_name || ' - ').trim(),
        ClientName: row.ClientName || row.customer_name || '미정',
        MultYearContract: row.MultYearContract || row.MultiYearContract || row['다년계약'] || '-'
    };
}
"""

# 3. Clean up the base content (strip old versions of these functions)
import re
base_content = re.sub(r'const WEBHOOK_URL = .*?;', '', base_content)
base_content = re.sub(r'async function fetchData\(.*?\}', '', base_content, flags=re.DOTALL)
base_content = re.sub(r'function processFetchedData\(.*?\}', '', base_content, flags=re.DOTALL)
base_content = re.sub(r'function mapItem\(.*?\}', '', base_content, flags=re.DOTALL)

# 4. Assemble the final file
header = "let dashboardData = { plan: [], actual: [], progress: [] };\\nlet charts = { monthly: null, person: null, teamPlan: null, personActual: null };\\n"

# Remove any existing global declarations from base_content to avoid duplicates
base_content = base_content.replace("let dashboardData = { plan: [], actual: [], progress: [] };", "")
base_content = base_content.replace("let charts = { monthly: null, person: null, teamPlan: null, personActual: null };", "")

final_app = header + core_functions + "\\n" + base_content

# 5. Write to app.js
with open(r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js', 'w', encoding='utf-8') as f:
    f.write(final_app)

print("FINAL PERFECT app.js CREATED!")

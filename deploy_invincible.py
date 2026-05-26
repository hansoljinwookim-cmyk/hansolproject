import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

# Ultra-robust logic using Unicode escapes to prevent mojibake and intelligent data extraction
new_logic = """
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
        console.log("수신된 로우 데이터:", rawData);
        
        processFetchedData(rawData);

        if (info) info.textContent = "업데이트 완료 (" + new Date().toLocaleTimeString() + ")";
    } catch (error) {
        console.error("Critical Error:", error);
        alert("데이터 처리 중 오류 발생: " + error.message);
    } finally {
        if (overlay) overlay.classList.add('hidden');
    }
};

function processFetchedData(rawData) {
    let plan = [];
    let actual = [];
    let progress = [];

    // Intelligent Data Finder: Search for keys regardless of structure
    const searchData = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        // Check for specific keys using Unicode to avoid mojibake
        // 계획: \\uacc4\\ud68d, 실적: \\uc2e4\\uc801, 진행: \\uc9c4\\ud589
        const keys = Object.keys(obj);
        for (let key of keys) {
            const val = obj[key];
            if (Array.isArray(val)) {
                if (key === '계획' || key === 'plan' || key.includes('\\uacc4\\ud68d')) plan = val;
                if (key === '실적' || key === 'actual' || key.includes('\\uc2e4\\uc801')) actual = val;
                if (key === '진행' || key === 'progress' || key.includes('\\uc9c4\\ud589')) progress = val;
            } else if (typeof val === 'object') {
                searchData(val); // Recursive search
            }
        }
    };

    if (Array.isArray(rawData)) {
        rawData.forEach(item => searchData(item));
    } else {
        searchData(rawData);
    }

    console.log("Extracted -> Plan:", plan.length, "Actual:", actual.length, "Progress:", progress.length);

    if (plan.length === 0 && actual.length === 0) {
        console.warn("No data found in response. Check n8n keys.");
    }

    dashboardData.plan = plan.map(mapItem);
    dashboardData.actual = actual.map(mapItem);
    dashboardData.progress = progress.map(mapItem);
    
    populateFilters();
    updateDashboard();
}

function mapItem(item) {
    const row = item.json ? item.json : item;
    
    // Amount Mapping: Total (Actual), TargetAmount (Plan)
    let amt = row.Total || row.TargetAmount || row.ConfirmedAmount || row.ProposalAmount || 0;
    amt = Number(String(amt).replace(/[^0-9.-]/g, ''));

    // Month Mapping: SalesWeek (Actual), TargetMonth (Plan)
    let mon = row.SalesWeek || row.TargetMonth || '-';
    
    // MultiYear Mapping: MultYearContract (User provided)
    let isMulti = row.MultYearContract || row.MultiYearContract || row['다년계약'] || '-';

    return {
        ...row,
        SalesPerson: row.SalesPerson || row.sales_rep || '미정',
        Teamname: (row.Teamname || row.team_name || ' - ').trim(),
        ClientName: row.ClientName || row.customer_name || '미정',
        Amount: amt,
        CalculatedAmount: amt,
        Month: mon,
        SalesMonth: mon,
        MultiYearContract: isMulti,
        Complete: Number(String(row.Complete || 0).replace(/[^0-9.-]/g, '')),
        Lv3: Number(String(row.Lv3 || 0).replace(/[^0-9.-]/g, '')),
        Lv2: Number(String(row.Lv2 || 0).replace(/[^0-9.-]/g, '')),
        Lv1: Number(String(row.Lv1 || 0).replace(/[^0-9.-]/g, ''))
    };
}
"""

# Re-read the full app_fixed.js to restore UI functions
with open(r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_fixed.js', 'r', encoding='utf-8', errors='ignore') as f:
    full_content = f.read()

# Patched sections
import re
# Remove old fetchData, processFetchedData, mapItem
full_content = re.sub(r'const WEBHOOK_URL = .*?;', '', full_content)
full_content = re.sub(r'async function fetchData\(.*?\}', '', full_content, flags=re.DOTALL)
full_content = re.sub(r'function processFetchedData\(.*?\}', '', full_content, flags=re.DOTALL)
full_content = re.sub(r'function mapItem\(.*?\}', '', full_content, flags=re.DOTALL)

# Prepend new logic
final_app = new_logic + "\\n" + full_content

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_app)

print("Invincible app.js deployed!")

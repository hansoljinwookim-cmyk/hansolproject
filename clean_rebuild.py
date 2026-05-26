import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'
fixed_base_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_fixed.js'

# The core robust logic
core_logic = """
const WEBHOOK_URL = '/get-data';

window.fetchData = async function() {
    console.log("--- CLEAN FETCH START ---");
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
        alert("오류 발생: " + error.message);
    } finally {
        if (overlay) overlay.classList.add('hidden');
    }
};

function processFetchedData(rawData) {
    console.log("--- DNA DETECTION START ---");
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
    
    console.log("매핑 완료 -> 계획:", dashboardData.plan.length, "실적:", dashboardData.actual.length, "진행:", dashboardData.progress.length);
    
    populateFilters();
    updateDashboard();
}

function mapItem(item) {
    const row = item.json ? item.json : item;
    let amt = Number(String(row.Total || row.TargetAmount || row.ConfirmedAmount || row.ProposalAmount || 0).replace(/[^0-9.-]/g, ''));
    let mon = row.SalesWeek || row.TargetMonth || '-';
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

# Read the helpers from the original file (everything after 'function formatNumber')
with open(fixed_base_path, 'r', encoding='utf-8', errors='ignore') as f:
    full_content = f.read()

start_marker = "function formatNumber"
if start_marker in full_content:
    helpers = full_content[full_content.find(start_marker):]
    
    header = "let dashboardData = { plan: [], actual: [], progress: [] };\\nlet charts = { monthly: null, person: null, teamPlan: null, personActual: null };\\n"
    
    final_content = header + core_logic + "\\n" + helpers
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_content)

print("CLEAN app.js REBUILT!")

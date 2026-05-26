import os
import re

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_new.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Fix the messy quotes in MomGrowth (lines 584, 588 etc)
content = content.replace("`+${formatNumber(endMonthActual)}억';", "'+' + formatNumber(endMonthActual) + '억';")
content = content.replace("`${ sign }${ formatNumber(growth) }억';", "sign + formatNumber(growth) + '억';")

# 2. Fix the broken title on line 755
content = re.sub(r'text: `\?업\?원\?기여\?\?,', "text: '영업사원 기여도',", content)

# 3. Fix the broken formatter on line 711 (again, just to be sure)
content = re.sub(r"formatter: \(value\) => value > 0 \? formatNumber\(value, true\) \+ '억' : '0'", "formatter: (value) => value > 0 ? formatNumber(value, true) + '억' : '0'", content)

# 4. Global cleanup of broken template literals (anything ending with ??)
content = re.sub(r'`([^`]*)\?\?,', r"'\1',", content)

# 5. Restore core DNA trawl (make sure it's intact at the top)
# I will rewrite the top of the file to be 100% clean
header = """alert("대시보드 엔진 가동 중... (파일 로드 성공)");
let dashboardData = { plan: [], actual: [], progress: [] };
let charts = { monthly: null, person: null, teamPlan: null, personActual: null };
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
    let plan = []; let actual = []; let progress = [];
    const trawl = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (let key in obj) {
            const val = obj[key];
            if (Array.isArray(val) && val.length > 0) {
                const first = val[0].json ? val[0].json : val[0];
                const fKeys = Object.keys(first).join(',').toLowerCase();
                if (fKeys.includes('total') || fKeys.includes('salesweek') || fKeys.includes('confirmed')) actual = val;
                else if (fKeys.includes('targetamount') || fKeys.includes('targetmonth')) plan = val;
                else if (fKeys.includes('customer_name') || fKeys.includes('prev_week_status') || fKeys.includes('sales_rep')) progress = val;
            } else if (val && typeof val === 'object') trawl(val);
        }
    };
    trawl(rawData);
    dashboardData.plan = plan.map(mapItem);
    dashboardData.actual = actual.map(mapItem);
    dashboardData.progress = progress.map(mapItem);
    const msg = `분석 완료! 계획: ${dashboardData.plan.length}건, 실적: ${dashboardData.actual.length}건, 진행: ${dashboardData.progress.length}건`;
    alert(msg);
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
        Amount: amt, CalculatedAmount: amt, Month: mon, SalesMonth: mon,
        TargetAmount: row.TargetAmount || amt, Total: row.Total || amt, ConfirmedAmount: row.ConfirmedAmount || amt,
        SalesPerson: row.SalesPerson || row.sales_rep || '미정',
        Teamname: (row.Teamname || row.team_name || ' - ').trim(),
        ClientName: row.ClientName || row.customer_name || '미정'
    };
}
"""

# Strip all old fetchData, processFetchedData, mapItem
content = re.sub(r'alert\("대시보드 엔진.*?\);', '', content)
content = re.sub(r'window\.fetchData = async function.*?};', '', content, flags=re.DOTALL)
content = re.sub(r'function processFetchedData\(.*?\}', '', content, flags=re.DOTALL)
content = re.sub(r'function mapItem\(.*?\}', '', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(header + "\\n" + content)

print("ULTIMATE SYNTAX FIX COMPLETED!")

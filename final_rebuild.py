import os

# 1. Load the original full logic
with open(r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app_fixed.js', 'r', encoding='utf-8', errors='ignore') as f:
    full_content = f.read()

# 2. Patch the connectivity part with the working logic
working_fetch_data = """
const WEBHOOK_URL = '/get-data';

window.fetchData = async function() {
    console.log("--- FETCH START ---");
    const info = document.getElementById('lastUpdateInfo');
    const overlay = document.getElementById('loadingOverlay');
    
    if (info) info.textContent = "데이터 요청 중...";
    if (overlay) overlay.classList.remove('hidden');

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch_data' })
        });

        if (!response.ok) throw new Error('서버 응답 오류: ' + response.status);

        const rawData = await response.json();
        console.log("데이터 수신 성공:", rawData);
        
        processFetchedData(rawData);

        if (info) info.textContent = "업데이트 완료 (" + new Date().toLocaleTimeString() + ")";
    } catch (error) {
        console.error("오류:", error);
        alert("오류 발생: " + error.message);
    } finally {
        if (overlay) overlay.classList.add('hidden');
    }
};

function processFetchedData(rawData) {
    let planData = null;
    let actualData = null;
    let progressData = null;
    let lastModifyingUser = '정보없음';
    let modifiedTime = null;

    if (Array.isArray(rawData)) {
        rawData.forEach(item => {
            if (item['계획'] || item['plan']) planData = item['계획'] || item['plan'];
            if (item['실적'] || item['actual']) actualData = item['실적'] || item['actual'];
            if (item['진행'] || item['progress']) progressData = item['진행'] || item['progress'];
            if (item.lastModifyingUser && item.lastModifyingUser.displayName) lastModifyingUser = item.lastModifyingUser.displayName;
            if (item.modifiedTime) modifiedTime = item.modifiedTime;
        });
    } else {
        planData = rawData.plan || rawData['계획'];
        actualData = rawData.actual || rawData['실적'];
        progressData = rawData.progress || rawData['진행'];
    }

    if (!planData || !actualData) {
        alert("데이터 구조를 분석할 수 없습니다. 계획 또는 실적 데이터가 누락되었습니다.");
        return;
    }

    dashboardData.plan = planData.map(mapItem);
    dashboardData.actual = actualData.map(mapItem);
    dashboardData.progress = (progressData || []).map(mapItem);
    
    populateFilters();
    updateDashboard();
}

function mapItem(item) {
    const row = item.json ? item.json : item;
    const findKey = (searchKeys) => {
        const keys = Object.keys(row);
        for (let k of keys) {
            const cleanK = k.replace(/[^a-zA-Z0-9-가-힣]/g, '').toLowerCase();
            const cleanSearchKeys = searchKeys.map(sk => sk.replace(/[^a-zA-Z0-9-가-힣]/g, '').toLowerCase());
            if (cleanSearchKeys.includes(cleanK)) return row[k];
        }
        return undefined;
    };

    return {
        ...row,
        SalesPerson: findKey(['salesperson', 'sales_rep', '영업사원', '담당자']) || '미정',
        Teamname: (findKey(['teamname', 'team_name', '팀명', '팀 명', '소 속']) || ' - ').trim(),
        ClientName: findKey(['clientname', 'customer_name', 'client', '업체', '고객 명']) || row.ClientName,
        CalculatedAmount: Number(String(findKey(['complete', '정정', '정정금액', 'proposal_amount', 'amount', '실적', '금액']) || 0).replace(/[^0-9.-]/g, '')),
        SalesMonth: findKey(['salesmonth', 'sales_month', 'targetmonth', 'target_month', '판매월', '월']) || '-',
        MultiYearContract: findKey(['multiyearcontract', 'multi_year', '다년계약', '계약'])
    };
}
"""

# 3. Strip old fetchData and initialization from full_content
# We keep everything from "function formatNumber" onwards
start_marker = "function formatNumber"
if start_marker in full_content:
    helpers = full_content[full_content.find(start_marker):]
    
    # Also keep global state definitions but update them
    state = "let dashboardData = { plan: [], actual: [], progress: [] };\\nlet charts = { monthly: null, person: null, teamPlan: null, personActual: null };\\n"
    
    final_content = working_fetch_data + "\\n" + helpers
    
    with open(r'c:\\Users\\Admin\\.gemini\\antigravity\\scratch\\ContainerSalesDashboard\\app.js', 'w', encoding='utf-8') as f:
        f.write(final_content)

print("Full app.js rebuilt perfectly!")

import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

# The ultimate "Trawl" logic: Grabs ANY array and tries to use it as data
trawl_logic = """
function processFetchedData(rawData) {
    console.log("--- ULTIMATE TRAWL START ---");
    let plan = [];
    let actual = [];
    let progress = [];
    let totalArraysFound = 0;

    // Deep search for any arrays
    const trawl = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        for (let key in obj) {
            const val = obj[key];
            if (Array.isArray(val) && val.length > 0) {
                totalArraysFound++;
                console.log(`[Trawl] 주머니 발견: ${key} (크기: ${val.length})`);
                
                const first = val[0].json ? val[0].json : val[0];
                const fKeys = Object.keys(first).join(',').toLowerCase();
                
                // Detect by content
                if (fKeys.includes('total') || fKeys.includes('salesweek') || fKeys.includes('confirmed')) {
                    actual = val;
                    console.log("-> '실적'으로 판명됨");
                } else if (fKeys.includes('targetamount') || fKeys.includes('targetmonth')) {
                    plan = val;
                    console.log("-> '계획'으로 판명됨");
                } else if (fKeys.includes('customer_name') || fKeys.includes('prev_week_status') || fKeys.includes('sales_rep')) {
                    progress = val;
                    console.log("-> '진행'으로 판명됨");
                }
            } else if (val && typeof val === 'object') {
                trawl(val);
            }
        }
    };

    trawl(rawData);

    const statusMsg = `분석 결과:\\n- 총 발견된 데이터 묶음: ${totalArraysFound}개\\n- 매핑된 계획: ${plan.length}건\\n- 매핑된 실적: ${actual.length}건\\n- 매핑된 진행: ${progress.length}건\\n\\n확인을 누르면 대시보드를 그립니다.`;
    alert(statusMsg);

    dashboardData.plan = plan.map(mapItem);
    dashboardData.actual = actual.map(mapItem);
    dashboardData.progress = progress.map(mapItem);
    
    populateFilters();
    updateDashboard();
}
"""

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace processFetchedData with the Trawl version
import re
content = re.sub(r'function processFetchedData\(.*?\}', trawl_logic, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ULTIMATE TRAWL app.js deployed!")

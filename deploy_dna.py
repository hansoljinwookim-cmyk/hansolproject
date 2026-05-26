import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

# DNA-based Data Detection: Detect sets based on their fields, not their names!
dna_logic = """
function processFetchedData(rawData) {
    console.log("--- DNA-BASED DETECTION START ---");
    let plan = [];
    let actual = [];
    let progress = [];

    const analyzeArray = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return;
        const first = arr[0].json ? arr[0].json : arr[0];
        const keys = Object.keys(first);
        console.log("배열 분석 중 (컬럼들):", keys);

        // Actual DNA: Has Total, SalesWeek, ConfirmedAmount, etc.
        if (keys.includes('Total') || keys.includes('SalesWeek') || keys.includes('ConfirmedAmount')) {
            console.log("-> DNA 일치: '실적' 데이터 감지됨 (" + arr.length + "건)");
            actual = arr;
        } 
        // Plan DNA: Has TargetAmount, TargetMonth
        else if (keys.includes('TargetAmount') || keys.includes('TargetMonth')) {
            console.log("-> DNA 일치: '계획' 데이터 감지됨 (" + arr.length + "건)");
            plan = arr;
        }
        // Progress DNA: Has customer_name, sales_rep, prev_week_status
        else if (keys.includes('customer_name') || keys.includes('prev_week_status') || keys.includes('sales_rep')) {
            console.log("-> DNA 일치: '진행' 데이터 감지됨 (" + arr.length + "건)");
            progress = arr;
        }
    };

    const findArrays = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        Object.values(obj).forEach(val => {
            if (Array.isArray(val)) {
                analyzeArray(val);
            } else if (typeof val === 'object') {
                findArrays(val);
            }
        });
    };

    if (Array.isArray(rawData)) {
        rawData.forEach(item => {
            if (Array.isArray(item)) analyzeArray(item);
            else findArrays(item);
        });
    } else {
        findArrays(rawData);
    }

    dashboardData.plan = plan.map(mapItem);
    dashboardData.actual = actual.map(mapItem);
    dashboardData.progress = progress.map(mapItem);
    
    console.log("최종 매핑 완료 -> 계획:", dashboardData.plan.length, "실적:", dashboardData.actual.length, "진행:", dashboardData.progress.length);
    
    populateFilters();
    updateDashboard();
}
"""

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Replace processFetchedData with the DNA version
import re
content = re.sub(r'function processFetchedData\(.*?\}', dna_logic, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("DNA-based app.js deployed!")

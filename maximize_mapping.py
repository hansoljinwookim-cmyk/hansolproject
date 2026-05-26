import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Update mapFields to be even more aggressive and log the keys if possible
new_map_fields = """
    const mapFields = (item) => {
        const row = item.json ? item.json : item;
        const keys = Object.keys(row);
        
        const findKey = (searchKeys) => {
            for (let k of keys) {
                const cleanK = k.replace(/[^a-zA-Z0-9-가-힣]/g, '').toLowerCase();
                const cleanSearchKeys = searchKeys.map(sk => sk.replace(/[^a-zA-Z0-9-가-힣]/g, '').toLowerCase());
                if (cleanSearchKeys.includes(cleanK)) return row[k];
            }
            return undefined;
        };
        
        // Aggressive searching for ANY number-like fields if 'complete' etc are not found
        let amountValue = findKey(['complete', '정정', '정정금액', 'proposal_amount', 'amount', '실적', '금액', 'sum', 'total', '수주실적', '수주금액']);
        
        if (amountValue === undefined) {
            // Try to find the first field that contains a large number
            for (let k of keys) {
                if (typeof row[k] === 'number' && row[k] > 1000) {
                    amountValue = row[k];
                    break;
                }
            }
        }

        const monthValue = findKey(['salesmonth', 'sales_month', 'targetmonth', 'target_month', '판매월', '월', 'month']) || '-';
        const teamValue = findKey(['teamname', 'team_name', '팀명', '팀 명', '소 속', '부서']) || ' - ';
        const personValue = findKey(['salesperson', 'sales_rep', '영업사원', '담당자', '성명']) || '미정';

        return {
            ...row,
            SalesPerson: personValue,
            Teamname: String(teamValue).trim(),
            Amount: Number(String(amountValue || 0).replace(/[^0-9.-]/g, '')) || 0,
            Month: monthValue
        };
    };
"""

import re
content = re.sub(r'const mapFields = \(item\) => \{.*?    \};', new_map_fields, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js mapping maximized!")

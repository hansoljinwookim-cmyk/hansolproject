import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Update mapFields to be much more aggressive in finding keys
new_map_fields = """
    const mapFields = (item) => {
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
        
        // Find amount using all possible variants
        const amountValue = findKey(['complete', '정정', '정정금액', 'proposal_amount', 'amount', '실적', '금액', 'sum', 'total']) || 0;
        const monthValue = findKey(['salesmonth', 'sales_month', 'targetmonth', 'target_month', '판매월', '월', 'month']) || '-';
        const teamValue = findKey(['teamname', 'team_name', '팀명', '팀 명', '소 속', '부서']) || ' - ';
        const personValue = findKey(['salesperson', 'sales_rep', '영업사원', '담당자', '성명']) || '미정';

        return {
            ...row,
            SalesPerson: personValue,
            Teamname: String(teamValue).trim(),
            Amount: Number(String(amountValue).replace(/[^0-9.-]/g, '')) || 0,
            Month: monthValue
        };
    };
"""

# Replace the old mapFields in the lightweight app.js
import re
content = re.sub(r'const mapFields = \(item\) => \{.*?    \};', new_map_fields, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js mapping enhanced!")

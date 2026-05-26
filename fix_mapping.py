import os

file_path = r'c:\Users\Admin\.gemini\antigravity\scratch\ContainerSalesDashboard\app.js'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Replace the mapping block (approx lines 280-288)
new_mapping = [
    "            row.SalesPerson = findKey(['salesperson', 'sales_rep', '영업사원', '담당자']) || '미정';\n",
    "            row.Teamname = (findKey(['teamname', 'team_name', '팀명', '팀 명', '소 속']) || ' - ').trim();\n",
    "            row.ClientName = findKey(['clientname', 'customer_name', 'client', '업체', '고객 명']) || row.ClientName;\n",
    "            row.PORT = findKey(['port', 'port_name', '포트', '항구']) || row.PORT;\n",
    "            row.TradeType = findKey(['tradetype', 'trade_type', '수출입', '구분']) || row.TradeType;\n",
    "            row.WorkLocation = findKey(['worklocation', 'work_location', '사업', '장소']) || row.WorkLocation;\n",
    "            row.Region = findKey(['region', 'region_name', '권역', '지역']) || row.Region;\n",
    "            row.Status = findKey(['status', 'current_status', '협의진행상태', '상태', '진행상태']) || row.Status;\n",
    "            row.MultiYearContract = findKey(['multiyearcontract', 'multi_year', '다년계약', '계약']) || row.MultiYearContract;\n"
]

# Find the start of the mapping block
start_idx = -1
for i, line in enumerate(lines):
    if "row.SalesPerson = findKey" in line:
        start_idx = i
        break

if start_idx != -1:
    # Replace 9 lines starting from start_idx
    lines[start_idx:start_idx+9] = new_mapping

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("app.js mapping fixed successfully!")

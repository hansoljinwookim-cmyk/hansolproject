import re

with open('app.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# The fetchData function starts at `async function fetchData() {`
# and ends at the line before `function showLoading(show) {`
start_idx = content.find("async function fetchData() {")
end_idx = content.find("function showLoading(show) {")

if start_idx != -1 and end_idx != -1:
    new_fetch_data = """async function fetchData() {
    showLoading(true);
    try {
        const url = WEBHOOK_URL + '?t=' + new Date().getTime();
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Network response was not ok');

        let rawData;
        try {
            const textResponse = await response.text();
            if (!textResponse || textResponse.trim() === "") {
                throw new Error("n8n으로부터 전달받은 데이터가 완전히 비어있습니다. n8n 웹훅 노드의 'Respond to Webhook' 노드 설정을 확인해주세요.");
            }
            rawData = JSON.parse(textResponse);
        } catch (e) {
            console.error("데이터 파싱 오류:", e);
            throw new Error(`n8n 데이터 오류: ${e.message}`);
        }

        console.log("✅ n8n으로부터 받은 원본 데이터:", rawData);

        let planData = null;
        let actualData = null;
        let progressData = null;
        let lastModifyingUser = '알 수 없음';
        let modifiedTime = null;

        if (Array.isArray(rawData)) {
            rawData.forEach(item => {
                if (item['계획']) planData = item['계획'];
                if (item['plan']) planData = item['plan'];
                if (item['실적']) actualData = item['실적'];
                if (item['actual']) actualData = item['actual'];
                if (item['진행']) progressData = item['진행'];

                if (item.lastModifyingUser && item.lastModifyingUser.displayName) {
                    lastModifyingUser = item.lastModifyingUser.displayName;
                }
                if (item.modifiedTime) {
                    modifiedTime = item.modifiedTime;
                }
            });
        } else {
            planData = rawData.plan || rawData['계획'];
            actualData = rawData.actual || rawData['실적'];
            progressData = rawData.progress || rawData['진행'];
            if (rawData.lastModifyingUser && rawData.lastModifyingUser.displayName) {
                lastModifyingUser = rawData.lastModifyingUser.displayName;
            }
            if (rawData.modifiedTime) {
                modifiedTime = rawData.modifiedTime;
            }
        }

        const updateInfoEl = document.getElementById('lastUpdateInfo');
        if (updateInfoEl) {
            if (modifiedTime) {
                const date = new Date(modifiedTime);
                const kstDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (9 * 60 * 60 * 1000));

                const yyyy = kstDate.getFullYear();
                const mm = String(kstDate.getMonth() + 1).padStart(2, '0');
                const dd = String(kstDate.getDate()).padStart(2, '0');
                const hh = String(kstDate.getHours()).padStart(2, '0');
                const min = String(kstDate.getMinutes()).padStart(2, '0');

                updateInfoEl.textContent = `최근 업데이트: ${yyyy}-${mm}-${dd} ${hh}:${min} (${lastModifyingUser})`;
            } else {
                updateInfoEl.textContent = `최근 업데이트 정보 없음`;
            }
        }

        if (!planData || !actualData) {
            console.error("데이터 구조 분석 오류.", rawData);
            throw new Error('Invalid data format received');
        }

        dashboardData.plan = planData.map(item => item.json ? item.json : item);
        if (progressData) {
            dashboardData.progress = progressData.map(item => item.json ? item.json : item);
        } else {
            dashboardData.progress = [];
        }

        function safeNumber(val) {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return Number(String(val).replace(/,/g, '')) || 0;
        }

        dashboardData.actual = actualData.map(item => {
            const row = item.json ? item.json : item;

            const findKey = (searchKeys) => {
                const keys = Object.keys(row);
                for (let k of keys) {
                    const cleanK = k.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
                    const cleanSearchKeys = searchKeys.map(sk => sk.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase());
                    if (cleanSearchKeys.includes(cleanK)) return row[k];
                }
                return undefined;
            };

            let rawMonth = findKey(['salesmonth', 'salesweek', '수주월', '수주주차', 'month', 'targetmonth']);
            let monthStr = String(rawMonth || '');
            if (monthStr && monthStr.trim() !== 'undefined' && monthStr.trim() !== '') {
                const match = monthStr.match(/(\d+)/);
                if (match) {
                    row.SalesMonth = match[1] + '월';
                } else {
                    row.SalesMonth = monthStr;
                }
            } else {
                row.SalesMonth = '-';
            }

            const complete = safeNumber(findKey(['complete', '확정', '확정금액']));
            const lv3 = safeNumber(findKey(['lv3', 'lv3금액', 'level3']));
            const lv2 = safeNumber(findKey(['lv2', 'lv2금액', 'level2']));
            const lv1 = safeNumber(findKey(['lv1', 'lv1금액', 'level1']));

            let legacyActual = safeNumber(row.ProposalAmount);
            if (legacyActual === 0 && safeNumber(row.ConfirmedAmount) > 0) {
                legacyActual = safeNumber(row.ConfirmedAmount);
            }

            if (complete === 0 && lv3 === 0 && lv2 === 0 && lv1 === 0 && legacyActual > 0) {
                row.CalculatedAmount = legacyActual;
                row.Complete = legacyActual;
                row.Lv3 = 0;
                row.Lv2 = 0;
                row.Lv1 = 0;
            } else {
                row.CalculatedAmount = complete + lv3 + lv2 + lv1;
                row.Complete = complete;
                row.Lv3 = lv3;
                row.Lv2 = lv2;
                row.Lv1 = lv1;
            }

            row.SalesPerson = findKey(['salesperson', '영업사원', '담당자']) || '미정';
            row.Teamname = (findKey(['teamname', '팀명', '영업팀', '소속']) || '-').trim();
            row.ClientName = findKey(['clientname', 'client', '청구처', '고객사']) || row.ClientName;
            row.PORT = findKey(['port', '포트', '항구']) || row.PORT;
            row.TradeType = findKey(['tradetype', '수출입', '구분']) || row.TradeType;
            row.WorkLocation = findKey(['worklocation', '작업지', '장소']) || row.WorkLocation;
            row.Region = findKey(['region', '권역', '지역']) || row.Region;
            row.Status = findKey(['status', '품의진행상태', '상태', '진행상태']) || row.Status;
            row.MultiYearContract = findKey(['multiyearcontract', '다년계약', '계약']) || row.MultiYearContract;

            return row;
        });

        populateFilters();
        updateDashboard();

    } catch (error) {
        console.error('Error fetching data:', error);
        alert('데이터를 불러오는데 실패했습니다: ' + error.message);
    } finally {
        showLoading(false);
    }
}
"""
    content = content[:start_idx] + new_fetch_data + content[end_idx:]

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully.")

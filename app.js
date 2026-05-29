// --- Configuration ---
const WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';

// --- Global State ---
let dashboardData = { plan: [], actual: [], progress: [] };
let charts = { monthly: null, teamPlan: null, personActual: null };
let currentDrilldownTeam = '';
let currentDrilldownPerson = '';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchData();
});

function setupEventListeners() {
    // Nav & Filters
    document.getElementById('updateBtn')?.addEventListener('click', fetchData);
    document.getElementById('teamFilter')?.addEventListener('change', updateDashboard);
    document.getElementById('personFilter')?.addEventListener('change', updateDashboard);
    document.getElementById('excludeMultiYearToggle')?.addEventListener('change', updateDashboard);
    // Moved downloadDashboardBtn listener to Exports section

    // Tab Switching
    document.getElementById('progressClientSearch')?.addEventListener('input', filterAndRenderProgressTable);
    document.getElementById('progressPersonSearch')?.addEventListener('input', filterAndRenderProgressTable);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-tab');
            if (!targetId) return; // Ignore buttons without data-tab like PDF download
            document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById('dashboardView').classList.toggle('hidden', targetId !== 'dashboardView');
            document.getElementById('progressView').classList.toggle('hidden', targetId !== 'progressView');
            document.getElementById('reportView').classList.toggle('hidden', targetId !== 'reportView');
        });
    });

    // Dual Sliders
    const startSlider = document.getElementById('kpiStartMonthSlider');
    const endSlider = document.getElementById('kpiEndMonthSlider');

    const updateSliderDisplay = (e) => {
        let s = parseInt(startSlider.value);
        let eVal = parseInt(endSlider.value);

        // 교차(중첩) 방지 로직
        if (s > eVal) {
            if (e.target.id === 'kpiStartMonthSlider') {
                s = eVal; startSlider.value = eVal;
            } else {
                eVal = s; endSlider.value = s;
            }
        }

        document.getElementById('startMonthBadge').textContent = `${s}월`;
        document.getElementById('endMonthBadge').textContent = `${eVal}월`;
        document.getElementById('kpiCumulativeMonthDisplay').textContent = s === eVal ? `${s}월` : `${s}월 ~ ${eVal}월`;
        updateDashboard();
    };

    startSlider?.addEventListener('input', updateSliderDisplay);
    endSlider?.addEventListener('input', updateSliderDisplay);

    // Detail Filters
    document.getElementById('detailSearchInput')?.addEventListener('input', () => renderDrillDownDetail(currentDrilldownTeam, dashboardData.actual, currentDrilldownPerson));
    document.getElementById('detailMonthFilter')?.addEventListener('change', () => renderDrillDownDetail(currentDrilldownTeam, dashboardData.actual, currentDrilldownPerson));
    document.getElementById('detailStatusFilter')?.addEventListener('change', () => renderDrillDownDetail(currentDrilldownTeam, dashboardData.actual, currentDrilldownPerson));

    document.getElementById('downloadDashboardBtn')?.addEventListener('click', () => exportElementToPDF('dashboardView', '컨테이너_수주실적_대시보드.pdf', 'landscape'));

    // Exports
    document.getElementById('exportExcelBtn')?.addEventListener('click', () => exportTableToExcel('drilldownDetailTable', '영업상세내역.xlsx'));
    document.getElementById('exportPdfBtn')?.addEventListener('click', () => exportElementToPDF('drilldownDetailContainer', '영업상세내역.pdf', 'landscape'));
    document.getElementById('exportProgressExcelBtn')?.addEventListener('click', () => exportTableToExcel('progressTable', '주차별영업현황.xlsx'));
    document.getElementById('exportProgressPdfBtn')?.addEventListener('click', () => exportElementToPDF('progressView', '주차별영업현황.pdf', 'landscape'));

    document.getElementById('reportMonthFilter')?.addEventListener('change', updateDashboard);
    document.getElementById('exportReportExcelBtn')?.addEventListener('click', () => exportWeeklyReportExcel('주간업무보고.xlsx'));
    document.getElementById('exportReportPdfBtn')?.addEventListener('click', () => exportElementToPDF('reportView', '주간업무보고.pdf', 'landscape'));

    // Chatbot
    document.getElementById('chatbotToggle')?.addEventListener('click', () => {
        const win = document.getElementById('chatbotWindow');
        win.classList.toggle('hidden');
        if (!win.classList.contains('hidden')) document.getElementById('chatbotInput').focus();
    });
    document.getElementById('chatbotClose')?.addEventListener('click', () => document.getElementById('chatbotWindow').classList.add('hidden'));
    document.getElementById('chatbotMaximize')?.addEventListener('click', () => {
        const win = document.getElementById('chatbotWindow');
        win.classList.toggle('fullscreen');
        const icon = document.getElementById('chatbotMaximize').querySelector('i');
        icon.className = win.classList.contains('fullscreen') ? 'fas fa-compress' : 'fas fa-expand';
    });
    document.getElementById('chatbotSend')?.addEventListener('click', handleChatInput);
    document.getElementById('chatbotInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatInput();
    });
}


async function fetchData() {
    showLoading(true);
    try {
        const payload = { action: "fetch_data", timestamp: Date.now() };
        const response = await fetch(WEBHOOK_URL + '?t=' + Date.now(), { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const rawData = await response.json();

        if (!rawData) throw new Error('Data is empty');

        let plan = [], actual = [], progress = [];
        let modifiedTime = null, lastUser = '-';

        if (Array.isArray(rawData)) {
            rawData.forEach(item => {
                if (item.계획 || item.plan) plan = item.계획 || item.plan;
                if (item.실적 || item.actual) actual = item.실적 || item.actual;
                if (item.진행 || item.progress) progress = item.진행 || item.progress;
                if (item.modifiedTime) modifiedTime = item.modifiedTime;
                if (item.lastModifyingUser?.displayName) lastUser = item.lastModifyingUser.displayName;
            });
        }
        let maxUpdatedAt = 0;
        const scanForTime = (arr) => {
            if (!Array.isArray(arr)) return;
            arr.forEach(row => {
                const dataObj = row.json ? row.json : row;
                const t = dataObj.updatedAt || dataObj.modifiedTime || dataObj.updated_at;
                if (t) {
                    const time = new Date(t).getTime();
                    if (time > maxUpdatedAt) maxUpdatedAt = time;
                }
            });
        };
        
        scanForTime(plan);
        scanForTime(actual);
        scanForTime(progress);

        if (modifiedTime) {
            const time = new Date(modifiedTime).getTime();
            if (time > maxUpdatedAt) maxUpdatedAt = time;
        }

        if (maxUpdatedAt > 0) {
            const d = new Date(maxUpdatedAt);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const dataLastModEl = document.getElementById('dataLastModified');
            if (dataLastModEl) dataLastModEl.textContent = `데이터 최종 수정: ${year}-${month}-${day} ${hh}:${mm}`;
        } else {
            const dataLastModEl = document.getElementById('dataLastModified');
            if (dataLastModEl) dataLastModEl.textContent = `데이터 최종 수정: 알 수 없음`;
        }

        if (modifiedTime) {
            const d = new Date(new Date(modifiedTime).getTime() + 9 * 3600000);
            document.getElementById('lastUpdateInfo').textContent = `최근 업데이트: ${d.toISOString().slice(0, 16).replace('T', ' ')} (${lastUser})`;
        } else {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            document.getElementById('lastUpdateInfo').textContent = `최근 업데이트: ${year}-${month}-${day} ${hh}:${mm} (사용자 업데이트)`;
        }

        const mapRow = (row, isActual = false) => {
            const data = row.json ? row.json : row;
            const find = (keys) => {
                for (let k of Object.keys(data)) {
                    const ck = k.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
                    if (keys.map(sk => sk.toLowerCase()).includes(ck)) return data[k];
                }
            };
            const toN = (v) => Number(String(v || 0).replace(/[^0-9.-]/g, '')) || 0;
            const monthRaw = find(['salesmonth', 'targetmonth', 'salesweek', '수주월', '월']);
            const monthInt = parseInt(String(monthRaw || '').replace(/[^0-9]/g, '')) || 0;

            const complete = toN(find(['complete', '품의완료', '확정금액']));
            const lv3 = toN(find(['lv3', 'level3']));
            const lv2 = toN(find(['lv2', 'level2']));
            const lv1 = toN(find(['lv1', 'level1']));
            const amt = toN(find(['targetamount', 'amount', 'confirmedamount', '실적금액', '계획금액', '합계']));

            // For actuals, we MUST sum the statuses. For plan, we use the amount.
            const calculated = isActual ? (complete + lv3 + lv2 + lv1) : amt;

            return {
                ...data,
                MonthInt: monthInt,
                SalesMonth: monthInt ? `${monthInt}월` : '-',
                Teamname: (find(['teamname', 'team_name', '팀명', '소속']) || '미지정').trim(),
                SalesPerson: find(['salesperson', '영업사원', '담당자', 'sales_rep']) || '미정',
                ClientName: find(['clientname', 'customer_name', '화주', '청구처', '업체']) || '-',
                Status: find(['status', '품의진행상태', '진행상태']) || '-',
                MultiYearContract: find(['multiyearcontract', '다년계약']) || '-',
                PORT: find(['port', '포트']) || '-',
                TradeType: find(['tradetype', '수출입']) || '-',
                WorkLocation: find(['worklocation', '작업지']) || '-',
                Region: find(['region', '권역']) || '-',
                DelayReason: find(['delayreason', '계약지연사유등특이사항', '계약 지연사유 등 특이사항', '계약지연사유', '특이사항', '지연사유']) || '-',
                Complete: complete,
                Lv3: lv3,
                Lv2: lv2,
                Lv1: lv1,
                CalculatedAmount: calculated || 0
            };
        };

        dashboardData.plan = plan.map(r => mapRow(r, false));
        dashboardData.actual = actual.map(r => mapRow(r, true));
        dashboardData.progress = progress.map(r => mapRow(r, false));

        populateFilters();
        updateDashboard();
    } catch (err) {
        console.error(err);
        alert("데이터 로드 실패: " + err.message + "\n" + err.stack);
    } finally {
        showLoading(false);
    }
}

function updateDashboard() {
    const team = document.getElementById('teamFilter').value;
    const person = document.getElementById('personFilter').value;
    const startMonth = parseInt(document.getElementById('kpiStartMonthSlider').value);
    const endMonth = parseInt(document.getElementById('kpiEndMonthSlider').value);
    const excludeMultiYear = document.getElementById('excludeMultiYearToggle')?.checked;

    const filterFn = (item) => {
        if (team !== 'all' && !item.Teamname.includes(team)) return false;
        if (person !== 'all' && item.SalesPerson !== person) return false;
        return true;
    };

    const processActual = (data) => data.map(a => {
        let amt = a.CalculatedAmount || 0;
        let c = a.Complete || 0, l3 = a.Lv3 || 0, l2 = a.Lv2 || 0, l1 = a.Lv1 || 0;
        if (excludeMultiYear) {
            const m = String(a.MultiYearContract).match(/[0-9.]+/);
            const years = m ? parseFloat(m[0]) : 1;
            if (years > 1) {
                const f = 1 / years;
                amt *= f; c *= f; l3 *= f; l2 *= f; l1 *= f;
            }
        }
        return { ...a, CalculatedAmount: amt, Complete: c, Lv3: l3, Lv2: l2, Lv1: l1 };
    });

    const adjActual = processActual(dashboardData.actual.filter(filterFn));
    const adjPlan = dashboardData.plan.filter(filterFn);

    const mActual = adjActual.filter(a => a.MonthInt >= startMonth && a.MonthInt <= endMonth);
    const mPlan = adjPlan.filter(p => p.MonthInt >= startMonth && p.MonthInt <= endMonth);

    renderKPIs(mPlan, mActual, startMonth, endMonth, adjActual, excludeMultiYear);
    renderMatrixTable(adjPlan, adjActual, startMonth, endMonth);
    renderMonthlyChart(adjPlan, adjActual, startMonth, endMonth);
    renderMonthComparisonSection(adjPlan, adjActual, startMonth, endMonth);
    filterAndRenderProgressTable();
    renderWeeklyReport();
}

function renderKPIs(plan, actual, startMonth, endMonth, allActual, isExcluded) {
    const p = plan.reduce((s, c) => s + c.CalculatedAmount, 0);
    const a = actual.reduce((s, c) => s + c.CalculatedAmount, 0);
    const rate = p > 0 ? (a / p * 100).toFixed(1) : 0;
    const gap = a - p;

    document.getElementById('kpiTargetAmount').textContent = formatNumber(p, true) + '억';

    const confirmedEl = document.getElementById('kpiConfirmedAmount');
    if (isExcluded) {
        confirmedEl.innerHTML = `${formatNumber(a, true)}억 <span style="font-size: 0.8rem; font-weight: normal; color: #64748b; display: block; margin-top: 4px;">(다년계약분 제외)</span>`;
    } else {
        const multiYearPortion = actual.reduce((s, item) => {
            const total = item.CalculatedAmount || 0;
            const m = String(item.MultiYearContract).match(/[0-9.]+/);
            const years = m ? parseFloat(m[0]) : 1;
            if (years > 1) {
                const thisYear = total / years;
                return s + (total - thisYear);
            }
            return s;
        }, 0);
        confirmedEl.innerHTML = `${formatNumber(a, true)}억 <span style="font-size: 0.8rem; font-weight: normal; color: #64748b; display: block; margin-top: 4px;">(${formatNumber(multiYearPortion, true)}억 다년계약분 포함)</span>`;
    }

    const gapEl = document.getElementById('kpiGapAmount');
    gapEl.textContent = formatNumber(gap, true) + '억';
    gapEl.style.color = gap < 0 ? 'red' : 'inherit';

    document.getElementById('kpiAchievementRate').textContent = rate + '%';

    // 전월 대비 증감: 종료 월(endMonth) 기준의 해당 월 단일 실적과 그 이전 달(endMonth-1) 단일 실적의 비교로 유지
    const endA = allActual.filter(it => it.MonthInt === endMonth).reduce((s, c) => s + c.CalculatedAmount, 0);
    const prevA = allActual.filter(it => it.MonthInt === endMonth - 1).reduce((s, c) => s + c.CalculatedAmount, 0);
    const growth = endA - prevA;
    const growthEl = document.getElementById('kpiMomGrowth');
    growthEl.textContent = (growth >= 0 ? '+' : '') + formatNumber(growth, true) + '억';
    growthEl.style.color = growth < 0 ? 'red' : (growth > 0 ? '#10b981' : 'inherit');
}

function renderMatrixTable(plan, actual, startMonth, endMonth) {
    const thead = document.querySelector('#matrixTable thead tr');
    let theadHtml = '<th rowspan="2" style="width:50px;">구분</th><th rowspan="2" style="width:120px;">팀명</th>';
    for (let m = 1; m <= 12; m++) {
        const isForecast = m > endMonth;
        theadHtml += `<th style="width:65px; ${isForecast ? 'color:#94a3b8;' : ''}">${m}월${isForecast ? '<br><span style="font-size:0.6rem;">(전망)</span>' : ''}</th>`;
    }
    theadHtml += '<th rowspan="2" style="width:90px;">조회기간 합계</th>';
    thead.innerHTML = theadHtml;

    const tbody = document.querySelector('#matrixTable tbody');
    tbody.innerHTML = '';
    const teams = ['컨테이너영업1팀', '컨테이너영업2팀', '컨테이너영업3팀', 'TCS'];
    const cats = [
        { id: 'plan', label: '계획' },
        { id: 'actual', label: '실적' },
        { id: 'gap', label: '차질' }
    ];

    cats.forEach(cat => {
        teams.forEach((team, idx) => {
            const tr = document.createElement('tr');
            let catCell = idx === 0 ? `<td rowspan="5" class="cat-header" style="background-color:#f8fafc; border-right: 1px solid #e2e8f0; width:50px;">${cat.label}</td>` : '';
            let html = `${catCell}<td style="text-align:left; font-weight:600; padding-left: 10px; width:120px;">${team}</td>`;
            let rowTotal = 0;
            for (let m = 1; m <= 12; m++) {
                const val = getVal(cat.id, team, m, plan, actual);
                const isInRange = m >= startMonth && m <= endMonth;
                if (isInRange) rowTotal += val;
                const color = (cat.id === 'gap' && val < 0) ? 'color:red;' : '';
                const bg = isInRange ? 'background-color:#eff6ff;' : 'background-color:#fff;';
                html += `<td style="${color} ${bg} width:65px; border-right: 1px solid #f1f5f9;">${val ? formatNumber(val, true) : '-'}</td>`;
            }
            const totalColor = (cat.id === 'gap' && rowTotal < 0) ? 'color:red;' : '';
            html += `<td class="row-total" style="${totalColor}; font-weight:700; background-color:#f8fafc; width:90px;">${formatNumber(rowTotal, true)}</td>`;
            tr.innerHTML = html;
            tbody.appendChild(tr);
        });

        // Sum row for category
        const trSum = document.createElement('tr');
        trSum.className = 'sum-row';
        trSum.style.backgroundColor = '#f0f9ff';
        let htmlSum = `<td style="font-weight:800; background-color:#eef2ff; width:120px;">${cat.label} 계</td>`;
        let totalSum = 0;
        for (let m = 1; m <= 12; m++) {
            const val = getVal(cat.id, 'all', m, plan, actual);
            const isInRange = m >= startMonth && m <= endMonth;
            if (isInRange) totalSum += val;
            const color = (cat.id === 'gap' && val < 0) ? 'color:red;' : '';
            const bg = isInRange ? 'background-color:#e0e7ff;' : '';
            htmlSum += `<td style="${color} font-weight:800; ${bg} width:65px;">${val ? formatNumber(val, true) : '-'}</td>`;
        }
        const totalSumColor = (cat.id === 'gap' && totalSum < 0) ? 'color:red;' : '';
        htmlSum += `<td style="${totalSumColor}; font-weight:900; background-color:#eef2ff; width:90px;">${formatNumber(totalSum, true)}</td>`;
        trSum.innerHTML = htmlSum;
        tbody.appendChild(trSum);
    });
}

function getVal(type, team, month, plan, actual) {
    const match = (it) => (team === 'all' || it.Teamname.includes(team)) && it.MonthInt === month;
    const p = plan.filter(match).reduce((s, c) => s + (c.CalculatedAmount || 0), 0);
    const a = actual.filter(match).reduce((s, c) => s + (c.CalculatedAmount || 0), 0);
    if (type === 'plan') return p;
    if (type === 'actual') return a;
    return a - p;
}

function renderMonthlyChart(plan, actual, startMonth, endMonth) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const labels = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

    // 차트는 1~12월을 모두 표시하되, 선택된 범위 밖의 값은 그리지 않음 (null 처리)
    const pData = labels.map((_, i) => {
        const m = i + 1;
        return (m >= startMonth && m <= endMonth) ? getVal('plan', 'all', m, plan, actual) : null;
    });
    const aData = labels.map((_, i) => {
        const m = i + 1;
        return (m >= startMonth && m <= endMonth) ? getVal('actual', 'all', m, plan, actual) : null;
    });

    if (charts.monthly) charts.monthly.destroy();
    charts.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: '계획', data: pData, borderColor: '#94a3b8', tension: 0.3, fill: false },
                { label: '실적', data: aData, borderColor: '#3b82f6', borderWidth: 3, tension: 0.3, fill: true, backgroundColor: 'rgba(59,130,246,0.1)' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    align: 'top',
                    anchor: 'end',
                    formatter: (v) => v ? formatNumber(v, true) : '',
                    font: { size: 13, weight: 'bold' },
                    color: (ctx) => ctx.dataset.label === '실적' ? '#3b82f6' : '#64748b'
                },
                legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12, weight: 'bold' } } }
            },
            scales: {
                x: { ticks: { font: { size: 12, weight: 'bold' } } },
                y: { ticks: { font: { size: 11 } } }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderMonthComparisonSection(plan, actual, globalStartMonth, globalEndMonth) {
    const teamSel = document.getElementById('sectionTeamSelector');
    const cumSel = document.getElementById('sectionCumMonthSelector');
    const singleSel = document.getElementById('sectionSingleMonthSelector');

    if (teamSel.options.length === 0) {
        teamSel.add(new Option('컨테이너 전체', 'all'));
        ['컨테이너영업1팀', '컨테이너영업2팀', '컨테이너영업3팀', 'TCS'].forEach(t => teamSel.add(new Option(t, t)));
        
        cumSel.add(new Option('선택', 'none'));
        for(let i=1; i<=12; i++) cumSel.add(new Option(`${i}월 누계`, i));
        
        singleSel.add(new Option('선택', 'none'));
        for(let i=1; i<=12; i++) singleSel.add(new Option(`${i}월`, i));
        singleSel.add(new Option('연간 전체 합계', 'all'));

        cumSel.value = globalEndMonth;
    }

    const applyFilters = () => {
        let sMonth = 1;
        let eMonth = 12;
        
        if (cumSel.value !== 'none') {
            eMonth = parseInt(cumSel.value);
            sMonth = 1;
        } else if (singleSel.value !== 'none') {
            if (singleSel.value === 'all') {
                sMonth = 1;
                eMonth = 12;
            } else {
                sMonth = parseInt(singleSel.value);
                eMonth = parseInt(singleSel.value);
            }
        } else {
            // Both are none, default to global slider
            sMonth = 1;
            eMonth = globalEndMonth;
        }

        renderMonthComparisonCharts(plan, actual, teamSel.value, sMonth, eMonth);
        renderDrillDownSummary(plan, actual, sMonth, eMonth);
    };

    const upCum = () => {
        if (cumSel.value !== 'none') singleSel.value = 'none';
        applyFilters();
    };

    const upSingle = () => {
        if (singleSel.value !== 'none') cumSel.value = 'none';
        applyFilters();
    };

    teamSel.onchange = applyFilters;
    cumSel.onchange = upCum;
    singleSel.onchange = upSingle;

    applyFilters();
}

function renderMonthComparisonCharts(plan, actual, team, startMonth, endMonth) {
    const match = (it) => {
        const teamMatch = team === 'all' || it.Teamname.includes(team);
        if (!teamMatch) return false;
        return it.MonthInt >= startMonth && it.MonthInt <= endMonth;
    };
    const pVal = plan.filter(match).reduce((s, c) => s + c.CalculatedAmount, 0);
    const aVal = actual.filter(match).reduce((s, c) => s + c.CalculatedAmount, 0);

    const maxVal = Math.max(pVal, aVal, 10) * 1.2;

    const tpCtx = document.getElementById('teamPlanChart').getContext('2d');
    if (charts.teamPlan) charts.teamPlan.destroy();
    charts.teamPlan = new Chart(tpCtx, {
        type: 'bar',
        data: { labels: ['계획', '실적'], datasets: [{ data: [pVal, aVal], backgroundColor: ['#cbd5e1', '#3b82f6'], barThickness: 45 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: '계획 대비 수주실적', font: { size: 11 } },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (v) => formatNumber(v, true) + '억',
                    font: { size: 15, weight: 'bold' }
                }
            },
            scales: {
                y: { beginAtZero: true, max: maxVal, grid: { display: false }, ticks: { font: { size: 11 } } },
                x: { ticks: { font: { size: 13, weight: 'bold' } } }
            }
        },
        plugins: [ChartDataLabels]
    });

    const personMap = {};
    const filteredActual = actual.filter(match);
    filteredActual.forEach(a => { const p = a.SalesPerson; personMap[p] = (personMap[p] || 0) + a.CalculatedAmount; });
    const sorted = Object.keys(personMap).sort((a, b) => personMap[b] - personMap[a]);
    const totalActual = Object.values(personMap).reduce((s, c) => s + c, 0);

    const paCtx = document.getElementById('personActualChart').getContext('2d');
    if (charts.personActual) charts.personActual.destroy();
    charts.personActual = new Chart(paCtx, {
        type: 'bar',
        data: {
            labels: sorted,
            datasets: [{
                data: sorted.map(p => personMap[p]),
                backgroundColor: '#3b82f6',
                borderColor: sorted.map((p, i) => i < 2 ? '#002D5B' : '#3b82f6'),
                borderWidth: sorted.map((p, i) => i < 2 ? 3 : 0),
                barThickness: 35
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const personName = sorted[idx];
                    renderDrillDownDetail(team, dashboardData.actual, personName);
                    document.getElementById('drilldownDetailContainer').scrollIntoView({ behavior: 'smooth' });
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: '영업사원별 기여도', font: { size: 11 } },
                datalabels: {
                    anchor: 'end', align: 'top',
                    formatter: (v) => {
                        const pct = totalActual > 0 ? ((v / totalActual) * 100).toFixed(1) : 0;
                        return `${formatNumber(v, true)}억 (${pct}%)`;
                    },
                    font: { size: 13, weight: 'bold' }
                }
            },
            scales: {
                y: { beginAtZero: true, max: maxVal, grid: { display: false }, ticks: { display: false } },
                x: { ticks: { font: { size: 12, weight: 'bold' } } }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderDrillDownSummary(plan, actual, startMonth, endMonth) {
    const match = (it) => it.MonthInt >= startMonth && it.MonthInt <= endMonth;

    const mPlan = plan.filter(match);
    const mActual = actual.filter(match);

    const tbody = document.querySelector('#drilldownSummaryTable tbody');
    tbody.innerHTML = '';
    const teams = ['컨테이너영업1팀', '컨테이너영업2팀', '컨테이너영업3팀', 'TCS'];
    let tP = 0, tA = 0;

    teams.forEach(team => {
        const teamPlanData = mPlan.filter(it => it.Teamname.includes(team));
        const teamActualData = mActual.filter(it => it.Teamname.includes(team));
        const p = teamPlanData.reduce((s, c) => s + c.CalculatedAmount, 0);
        const a = teamActualData.reduce((s, c) => s + c.CalculatedAmount, 0);
        tP += p; tA += a;
        const rate = p > 0 ? (a / p * 100).toFixed(1) : 0;

        const tr = document.createElement('tr');
        tr.className = 'team-row';
        tr.innerHTML = `
            <td style="text-align:left; padding-left: 1.5rem; font-weight:700;"><i class="fas fa-plus-square toggle-icon" style="color:var(--primary-color); margin-right:8px;"></i> (+) ${team}</td>
            <td style="text-align:center; font-weight:600;">${formatNumber(p, true)}억</td>
            <td style="text-align:center; font-weight:600; color:var(--primary-color);">${formatNumber(a, true)}억</td>
            <td style="text-align:center; color:${(a - p) < 0 ? 'red' : 'inherit'}; font-weight:600;">${formatNumber(a - p, true)}억</td>
            <td style="text-align:center; font-weight:700;">${rate}%</td>
        `;

        tr.onclick = (e) => {
            const icon = tr.querySelector('.toggle-icon');
            const isExpanded = icon.classList.contains('fa-minus-square');

            // Remove existing person rows for this team
            document.querySelectorAll(`.person-row-${team.replace(/ /g, '')}`).forEach(r => r.remove());

            if (!isExpanded) {
                icon.classList.replace('fa-plus-square', 'fa-minus-square');
                const persons = [...new Set(teamActualData.map(it => it.SalesPerson))].sort();
                persons.forEach(person => {
                    const pp = teamPlanData.filter(it => it.SalesPerson === person).reduce((s, c) => s + c.CalculatedAmount, 0);
                    const pa = teamActualData.filter(it => it.SalesPerson === person).reduce((s, c) => s + c.CalculatedAmount, 0);
                    const pr = pp > 0 ? (pa / pp * 100).toFixed(1) : 0;

                    const ptr = document.createElement('tr');
                    ptr.className = `person-row person-row-${team.replace(/ /g, '')}`;
                    ptr.style.backgroundColor = '#fcfcfc';
                    ptr.innerHTML = `
                        <td style="text-align:left; padding-left: 3rem; color:#64748b; font-size:0.85rem;">└ ${person}</td>
                        <td style="text-align:center; font-size:0.85rem;">${formatNumber(pp, true)}억</td>
                        <td style="text-align:center; font-size:0.85rem; color:#3b82f6;">${formatNumber(pa, true)}억</td>
                        <td style="text-align:center; font-size:0.85rem; color:${(pa - pp) < 0 ? 'red' : 'inherit'}">${formatNumber(pa - pp, true)}억</td>
                        <td style="text-align:center; font-size:0.85rem;">${pr}%</td>
                    `;
                    ptr.onclick = (ev) => {
                        ev.stopPropagation();
                        renderDrillDownDetail(team, actual, startMonth, endMonth, person);
                    };
                    tr.after(ptr);
                });
            }
        };

        tbody.appendChild(tr);
    });

    const trTotal = document.createElement('tr');
    trTotal.style.backgroundColor = '#f1f5f9';
    trTotal.style.borderTop = '2px solid #cbd5e1';
    trTotal.innerHTML = `
        <td style="text-align:center; padding: 12px; font-weight: 800; color: #1e293b;">총 합계</td>
        <td style="text-align:center; color: #1e293b; font-weight: 800;">${formatNumber(tP, true)}억</td>
        <td style="text-align:center; color: var(--primary-color); font-weight: 800;">${formatNumber(tA, true)}억</td>
        <td style="text-align:center; color: ${(tA - tP) < 0 ? 'red' : '#1e293b'}; font-weight: 800;">${formatNumber(tA - tP, true)}억</td>
        <td style="text-align:center; color: #1e293b; font-weight: 900; font-size: 1.1rem;">${tP > 0 ? (tA / tP * 100).toFixed(1) : 0}%</td>
    `;
    trTotal.onclick = () => renderDrillDownDetail('전체', actual, startMonth, endMonth);
    tbody.appendChild(trTotal);

    const tbl = document.getElementById('drilldownSummaryTable');
    tbl.onclick = (e) => {
        if (!e.target.closest('tr') || e.target.closest('tr').rowIndex === 0) return;
        if (!e.target.closest('.team-row') && !e.target.closest('.person-row')) return;
        if (e.target.closest('.person-row')) return;
        const r = e.target.closest('.team-row');
        const team = r.cells[0].textContent.replace('(+)', '').replace('(-)', '').trim();
        renderDrillDownDetail(team, actual, startMonth, endMonth);
    };
}

function renderDrillDownDetail(team, actual, startMonth, endMonth, person = null) {
    currentDrilldownTeam = team;
    currentDrilldownPerson = person;
    document.getElementById('drilldownDetailContainer').style.display = 'block';
    const titleEl = document.getElementById('drilldownTeamName');
    titleEl.textContent = person ? `${team} (${person})` : team;

    const tbody = document.querySelector('#drilldownDetailTable tbody');
    tbody.innerHTML = '';

    const search = (document.getElementById('detailSearchInput')?.value || '').toLowerCase();
    
    const cumSel = document.getElementById('detailCumMonthSelector');
    const singleSel = document.getElementById('detailSingleMonthSelector');
    
    if (cumSel && cumSel.options.length === 0) {
        cumSel.add(new Option('선택', 'none'));
        for(let i=1; i<=12; i++) cumSel.add(new Option(`${i}월 누계`, i));
        
        singleSel.add(new Option('선택', 'none'));
        for(let i=1; i<=12; i++) singleSel.add(new Option(`${i}월`, i));
        singleSel.add(new Option('연간 전체 합계', 'all'));
        
        cumSel.value = endMonth; // default to global endMonth when first initialized
    }
    
    const applyFilters = () => renderDrillDownDetail(currentDrilldownTeam, actual, startMonth, endMonth, currentDrilldownPerson);
    
    if (cumSel && !cumSel.onchange) {
        cumSel.onchange = () => {
            if (cumSel.value !== 'none') singleSel.value = 'none';
            applyFilters();
        };
    }
    if (singleSel && !singleSel.onchange) {
        singleSel.onchange = () => {
            if (singleSel.value !== 'none') cumSel.value = 'none';
            applyFilters();
        };
    }

    let sMonth = 1;
    let eMonth = 12;
    if (cumSel && cumSel.value !== 'none') {
        eMonth = parseInt(cumSel.value);
        sMonth = 1;
    } else if (singleSel && singleSel.value !== 'none') {
        if (singleSel.value === 'all') {
            sMonth = 1;
            eMonth = 12;
        } else {
            sMonth = parseInt(singleSel.value);
            eMonth = parseInt(singleSel.value);
        }
    } else {
        sMonth = 1;
        eMonth = endMonth;
    }

    const statusF = document.getElementById('detailStatusFilter')?.value || 'all';

    let filtered = actual.filter(a => {
        if (team !== '전체' && !a.Teamname.includes(team)) return false;
        if (person && a.SalesPerson !== person) return false;
        
        if (a.MonthInt < sMonth || a.MonthInt > eMonth) return false;

        if (statusF !== 'all' && (a.Status === statusF || (statusF === '전망' && a.Status === '진행중'))) {
            // Match
        } else if (statusF !== 'all') {
            return false;
        }

        if (search) {
            const txt = `${a.SalesPerson} ${a.ClientName} ${a.PORT} ${a.Status} ${a.TradeType} ${a.WorkLocation} ${a.Region}`.toLowerCase();
            if (!txt.includes(search)) return false;
        }

        if (search) {
            const txt = `${a.SalesPerson} ${a.ClientName} ${a.PORT} ${a.Status} ${a.TradeType} ${a.WorkLocation} ${a.Region}`.toLowerCase();
            if (!txt.includes(search)) return false;
        }

        // 수주실적이 없는 데이터(금액이 0인 데이터) 제외
        if ((a.CalculatedAmount || 0) === 0) return false;

        return true;
    });

    filtered.sort((a, b) => a.SalesPerson.localeCompare(b.SalesPerson));
    const spans = {};
    filtered.forEach(a => spans[a.SalesPerson] = (spans[a.SalesPerson] || 0) + 1);

    let lastP = '';
    let totalComplete = 0, totalLv3 = 0, totalLv2 = 0, totalLv1 = 0, totalCalculated = 0;

    filtered.forEach(row => {
        totalComplete += row.Complete || 0;
        totalLv3 += row.Lv3 || 0;
        totalLv2 += row.Lv2 || 0;
        totalLv1 += row.Lv1 || 0;
        totalCalculated += row.CalculatedAmount || 0;

        const tr = document.createElement('tr');
        let pCell = '';
        if (row.SalesPerson !== lastP) {
            const team = row.Teamname.replace('컨테이너', '');
            pCell = `<td rowspan="${spans[row.SalesPerson]}" style="vertical-align:middle; text-align:center; background-color:#f8fafc;">
                        <div style="font-size:0.7rem; color:#64748b;">${team}</div>
                        <div style="font-size:1.0rem; font-weight:800; color:var(--primary-color);">${row.SalesPerson}</div>
                     </td>`;
            lastP = row.SalesPerson;
        }

        const f = (n) => n === 0 ? '-' : formatNumber(n);

        tr.innerHTML = `
            ${pCell}
            <td style="text-align:center;">${row.ClientName}</td>
            <td style="text-align:center;">${row.PORT}</td>
            <td style="text-align:center;">${row.TradeType}</td>
            <td style="text-align:center;">${row.WorkLocation}</td>
            <td style="text-align:center;">${row.Region}</td>
            <td style="text-align:center;">${row.SalesMonth}</td>
            <td style="text-align:center;">${row.Status === '진행중' ? '전망' : row.Status}</td>
            <td style="text-align:center;">${row.MultiYearContract}</td>
            <td>${f(row.Complete)}</td>
            <td>${f(row.Lv3)}</td>
            <td>${f(row.Lv2)}</td>
            <td>${f(row.Lv1)}</td>
            <td style="font-weight:700; color:var(--primary-color);">${f(row.CalculatedAmount)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Add Total Row to Footer (Append to tbody for html2canvas compatibility)
    const f = (n) => n === 0 ? '-' : formatNumber(n);
    const trTotal = document.createElement('tr');
    trTotal.style.backgroundColor = '#f1f5f9';
    trTotal.style.borderTop = '2px solid #cbd5e1';
    trTotal.innerHTML = `
        <td colspan="9" style="text-align:center; padding: 12px; font-weight: 800; color: #1e293b;">합계</td>
        <td style="text-align:right; color: var(--primary-color); font-weight: 800;">${f(totalComplete)}</td>
        <td style="text-align:right; font-weight: 800;">${f(totalLv3)}</td>
        <td style="text-align:right; font-weight: 800;">${f(totalLv2)}</td>
        <td style="text-align:right; font-weight: 800;">${f(totalLv1)}</td>
        <td style="text-align:right; color: var(--primary-color); font-weight: 900; font-size: 1.1rem;">${f(totalCalculated)}</td>
    `;
    tbody.appendChild(trTotal);

    const tfoot = document.getElementById('detailTableFooter');
    if (tfoot) tfoot.innerHTML = ''; // Clear existing tfoot to avoid duplication

    document.getElementById('drilldownDetailContainer').scrollIntoView({ behavior: 'smooth' });
}

function filterAndRenderProgressTable() {
    const teamFilter = document.getElementById('teamFilter').value;
    const personFilter = document.getElementById('personFilter').value;
    
    const clientSearch = (document.getElementById('progressClientSearch')?.value || '').toLowerCase().trim();
    const personSearch = (document.getElementById('progressPersonSearch')?.value || '').toLowerCase().trim();

    const filtered = dashboardData.progress.filter(it => {
        const row = it.json ? it.json : it;
        const find = (keys) => {
            const clean = (s) => String(s || '').replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
            const targetKeys = keys.map(clean);
            for (let k of Object.keys(row)) {
                if (targetKeys.includes(clean(k))) return row[k];
            }
            return null;
        };

        const client = find(['customer_name', 'clientname', '화주', '업체']) || '-';
        const team = find(['team_name', 'teamname', '팀명', '팀구분']) || '-';
        const rep = find(['sales_rep', 'salesperson', '영업사원', '담당자']) || '미정';

        // Apply global filters
        if (teamFilter !== 'all' && teamFilter !== '전체 팀') {
            if (teamFilter === 'TCS' && team.toUpperCase() !== 'TCS') return false;
            if (teamFilter !== 'TCS' && !team.includes(teamFilter.replace('팀', ''))) return false;
        }
        if (personFilter !== 'all' && personFilter !== '전체 사원' && rep !== personFilter) return false;

        // Apply local search filters
        if (clientSearch && !client.toLowerCase().includes(clientSearch)) return false;
        if (personSearch && !rep.toLowerCase().includes(personSearch)) return false;

        return true;
    });

    renderProgressTable(filtered);
}

function renderProgressTable(data) {
    const tbody = document.getElementById('progressTableBody');
    tbody.innerHTML = '';
    data.forEach(it => {
        const row = it.json ? it.json : it;
        const find = (keys) => {
            const clean = (s) => String(s || '').replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
            const targetKeys = keys.map(clean);
            for (let k of Object.keys(row)) {
                if (targetKeys.includes(clean(k))) return row[k];
            }
            return null;
        };

        const client = find(['customer_name', 'clientname', '화주', '업체']) || '-';
        const team = find(['team_name', 'teamname', '팀명', '팀구분']) || '-';
        const rep = find(['sales_rep', 'salesperson', '영업사원', '담당자']) || '미정';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center; font-weight:600;">${client}</td>
            <td style="text-align:center;">${team}</td>
            <td style="text-align:center;">${rep}</td>
            <td style="text-align:left; white-space:pre-wrap; padding: 15px; font-size:0.85rem; line-height:1.5;">${row.prev_week_status || find(['prev_week_status', '이전주차', 'pastweek', 'status_past']) || '-'}</td>
            <td style="text-align:left; white-space:pre-wrap; padding: 15px; font-size:0.85rem; line-height:1.5; background-color: #fefce8; border-left: 3px solid #fde68a;" class="highlight-cell">
                ${row.curr_week_plan || find(['curr_week_plan', '다음주차', 'nextweek', 'plan_next']) || '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleChatInput() {
    const input = document.getElementById('chatbotInput');
    const msg = input.value.trim(); if (!msg) return;
    const container = document.getElementById('chatbotMessages');

    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.textContent = msg;
    container.appendChild(userDiv);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.className = 'message bot';
        botDiv.id = 'ai_msg_' + Date.now();

        const totalActual = dashboardData.actual.reduce((s, c) => s + c.CalculatedAmount, 0);
        const totalPlan = dashboardData.plan.reduce((s, c) => s + c.CalculatedAmount, 0);
        const rate = totalPlan > 0 ? (totalActual / totalPlan * 100).toFixed(1) : 0;

        let response = "";
        let chartConfig = null;
        const canvasId = 'chart_' + Date.now();

        // 1. 특정 키워드(청구처/영업사원) 탐색
        let specificLookup = null;
        let lookupType = '';
        const cleanMsg = msg.replace(/\s/g, '');

        for (const d of dashboardData.actual) {
            if (d.ClientName && d.ClientName.trim() !== '' && cleanMsg.includes(d.ClientName.replace(/\s/g, ''))) {
                specificLookup = d; lookupType = 'Client'; break;
            }
            if (d.SalesPerson && d.SalesPerson.trim() !== '' && cleanMsg.includes(d.SalesPerson.replace(/\s/g, ''))) {
                specificLookup = d; lookupType = 'Person'; break;
            }
        }

        const isChartRequest = msg.includes('그래프') || msg.includes('차트') || msg.includes('그려') || msg.includes('보여줘');

        if (specificLookup && !isChartRequest) {
            let analysis = `<div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 15px; font-size: 0.95rem; line-height: 1.6; text-align: left; border-radius: 4px;">`;
            analysis += `<b style="color:#6d28d9;"><i class="fas fa-robot"></i> 생성형 AI 답변:</b><br><br>`;

            if (lookupType === 'Client') {
                const team = specificLookup.Teamname;
                const person = specificLookup.SalesPerson;
                const status = specificLookup.Status || '진행중';
                const totalClientAmt = dashboardData.actual.filter(a => a.ClientName === specificLookup.ClientName).reduce((sum, a) => sum + a.CalculatedAmount, 0);

                analysis += `질문하신 <b>${specificLookup.ClientName}</b> 청구처에 대한 데이터를 확인했습니다.<br>`;
                analysis += `해당 화주는 <b>${team}</b> 소속 <b>${person}</b> 사원이 주 담당으로 관리하고 있습니다.<br>`;
                analysis += `현재 누적 수주 실적은 <b>${formatNumber(totalClientAmt, true)}억</b> 규모이며, 품의 상태는 <b>'${status}'</b> 단계로 파악됩니다.<br><br>`;
                analysis += `<span style="color:#64748b; font-size:0.85rem;">💡 <i>"이 업체의 담당자별 차트를 그려줘"</i> 또는 <i>"${team}의 전체 실적을 보여줘"</i> 와 같이 요청하시면 즉시 차트로 시각화해 드립니다.</span>`;
            } else {
                const person = specificLookup.SalesPerson;
                const team = specificLookup.Teamname;
                const myData = dashboardData.actual.filter(a => a.SalesPerson === person);
                const totalPersonAmt = myData.reduce((sum, a) => sum + a.CalculatedAmount, 0);
                const clientCount = new Set(myData.map(a => a.ClientName)).size;

                analysis += `<b>${team} ${person}</b> 사원에 대한 실적 분석 결과입니다.<br>`;
                analysis += `현재 총 <b>${clientCount}</b>개의 주요 청구처를 담당하고 있으며, 누적 수주 실적은 <b>${formatNumber(totalPersonAmt, true)}억</b>을 기록 중입니다.<br><br>`;
                analysis += `<span style="color:#64748b; font-size:0.85rem;">💡 <i>"${person} 사원의 청구처별 실적 차트 그려줘"</i> 라고 요청하시면 상세 분포를 확인하실 수 있습니다.</span>`;
            }
            analysis += `</div>`;
            response = `<div style="font-family: 'Pretendard', sans-serif;">${analysis}</div>`;
        }
        else if (isChartRequest) {
            // 그룹핑 기준 파악
            let targetGroup = 'Teamname';
            let groupLabel = '팀별';

            if (msg.includes('사원') || msg.includes('담당')) { targetGroup = 'SalesPerson'; groupLabel = '영업사원별'; }
            else if (msg.includes('청구처') || msg.includes('고객') || msg.includes('화주') || msg.includes('업체')) { targetGroup = 'ClientName'; groupLabel = '청구처별'; }
            else if (msg.includes('항구') || msg.includes('포트') || msg.includes('port')) { targetGroup = 'PORT'; groupLabel = 'PORT별'; }
            else if (msg.includes('지역') || msg.includes('권역')) { targetGroup = 'Region'; groupLabel = '지역별'; }
            else if (msg.includes('팀') || msg.includes('부서')) { targetGroup = 'Teamname'; groupLabel = '팀별'; }

            // 차트 타입 파악
            let chartType = 'bar';
            let chartIcon = 'fa-chart-bar';
            if (msg.includes('원형') || msg.includes('파이')) { chartType = 'pie'; chartIcon = 'fa-chart-pie'; }
            else if (msg.includes('선') || msg.includes('라인') || msg.includes('추이')) { chartType = 'line'; chartIcon = 'fa-chart-line'; }

            // 고급 필터링 적용
            let filteredData = dashboardData.actual;
            let filterContext = '';

            if (msg.includes('영업1팀') || msg.includes('1팀')) { filteredData = filteredData.filter(d => d.Teamname.includes('1팀')); filterContext = '영업1팀의 '; }
            else if (msg.includes('영업2팀') || msg.includes('2팀')) { filteredData = filteredData.filter(d => d.Teamname.includes('2팀')); filterContext = '영업2팀의 '; }
            else if (msg.includes('영업3팀') || msg.includes('3팀')) { filteredData = filteredData.filter(d => d.Teamname.includes('3팀')); filterContext = '영업3팀의 '; }
            else if (msg.includes('TCS') || msg.toLowerCase().includes('tcs')) { filteredData = filteredData.filter(d => d.Teamname.includes('TCS')); filterContext = 'TCS팀의 '; }

            if (specificLookup && lookupType === 'Person') {
                filteredData = filteredData.filter(d => d.SalesPerson === specificLookup.SalesPerson);
                filterContext += `${specificLookup.SalesPerson} 사원의 `;
            }

            // 데이터 집계
            const aggData = {};
            let total = 0;
            filteredData.forEach(d => {
                if (d.CalculatedAmount > 0) {
                    const key = d[targetGroup] || '기타';
                    aggData[key] = (aggData[key] || 0) + d.CalculatedAmount;
                    total += d.CalculatedAmount;
                }
            });

            // Top 10 정렬 (원형그래프는 Top 8)
            const limit = chartType === 'pie' ? 8 : 10;
            const sorted = Object.entries(aggData).sort((a, b) => b[1] - a[1]).slice(0, limit);

            if (sorted.length === 0) {
                response = `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 15px; font-size: 0.9rem;">분석할 수주 실적 데이터가 존재하지 않습니다. 조건을 다시 확인해 주세요.</div>`;
            } else {
                const colors = ['#002D5B', '#00509E', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#E0F2FE', '#F0F9FF'];
                const topItem = sorted[0];
                const topPct = total > 0 ? ((topItem[1] / total) * 100).toFixed(1) : 0;

                let analysis = `<div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 15px; font-size: 0.95rem; line-height: 1.6; text-align: left; border-radius: 4px;">`;
                analysis += `<b style="color:#6d28d9;"><i class="fas fa-robot"></i> 생성형 AI 인사이트:</b><br><br>`;
                analysis += `요청하신 <b>${filterContext}${groupLabel}</b> 분석 결과입니다. 현재 <b>${topItem[0]}</b> 항목이 ${formatNumber(topItem[1], true)}억(${topPct}%)으로 1위를 기록하며 해당 그룹 내 실적을 견인 중입니다. 상위 ${sorted.length}개 항목이 전체의 큰 비중을 차지하고 있습니다.</div>`;

                let tableHTML = `<table style="width:100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                tableHTML += `<tr style="background:#002D5B; color:white;"><th style="padding:8px; text-align:center;">순위</th><th style="padding:8px; text-align:left;">${groupLabel.replace('별', '')}</th><th style="padding:8px; text-align:right;">실적 (억)</th><th style="padding:8px; text-align:right;">비중</th></tr>`;
                sorted.forEach((item, idx) => {
                    const pct = total > 0 ? ((item[1] / total) * 100).toFixed(1) : 0;
                    tableHTML += `<tr style="background:${idx % 2 === 0 ? '#fff' : '#f8fafc'}; border-bottom:1px solid #e2e8f0;">
                        <td style="padding:8px; text-align:center; font-weight:bold; color:#64748b;">${idx + 1}</td>
                        <td style="padding:8px; text-align:left; font-weight:600;">${item[0]}</td>
                        <td style="padding:8px; text-align:right; color:#002D5B; font-weight:bold;">${formatNumber(item[1], true)}</td>
                        <td style="padding:8px; text-align:right;">${pct}%</td>
                    </tr>`;
                });
                tableHTML += `</table>`;

                const canvasHeight = chartType === 'pie' ? '300px' : '250px';

                response = `<div style="font-family: 'Pretendard', sans-serif;">
                    <h3 style="color:#002D5B; margin-top:0; border-bottom: 2px solid #e2e8f0; padding-bottom:10px; text-align: left;"><i class="fas ${chartIcon}"></i> ${filterContext}${groupLabel} 수주실적 리포트 (Top ${limit})</h3>
                    ${analysis}
                    <div style="width:100%; height:${canvasHeight}; margin: 0 auto; background:#fff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <canvas id="${canvasId}"></canvas>
                    </div>
                    ${tableHTML}
                </div>`;

                chartConfig = {
                    type: chartType,
                    data: {
                        labels: sorted.map(i => i[0]),
                        datasets: [{
                            label: '수주금액 (억)',
                            data: sorted.map(i => i[1]),
                            backgroundColor: chartType === 'pie' ? colors : '#3B82F6',
                            borderColor: chartType === 'pie' ? '#ffffff' : '#3B82F6',
                            borderWidth: chartType === 'pie' ? 2 : 2,
                            borderRadius: chartType === 'bar' ? 4 : 0,
                            fill: chartType === 'line' ? true : false,
                            tension: chartType === 'line' ? 0.4 : 0
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: chartType !== 'pie' ? {
                            y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#e2e8f0' } },
                            x: { grid: { display: false } }
                        } : undefined,
                        plugins: {
                            legend: { display: chartType === 'pie', position: 'right' },
                            datalabels: {
                                anchor: chartType === 'pie' ? 'center' : 'end',
                                align: chartType === 'pie' ? 'center' : 'top',
                                color: chartType === 'pie' ? '#ffffff' : '#002D5B',
                                font: { weight: 'bold', size: 11 },
                                formatter: (v, ctx) => {
                                    if (chartType === 'pie') {
                                        const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                        return sum > 0 ? (v * 100 / sum).toFixed(1) + "%" : "0%";
                                    } else {
                                        return formatNumber(v, true);
                                    }
                                }
                            }
                        }
                    },
                    plugins: [ChartDataLabels]
                };
            }
        }
        else if (msg.includes('실적') || msg.includes('요약') || msg.includes('분석')) {
            response = `📊 **데이터 분석 리포트**<br>현재 전체 실적은 **${formatNumber(totalActual, true)}억**이며, 목표 대비 달성률은 **${rate}%**입니다.<br>원형그래프나 막대그래프 생성을 요청해 보세요!`;
        }
        else {
            response = `<div style="background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 15px; font-size: 0.95rem; line-height: 1.6;"><b style="color:#6d28d9;"><i class="fas fa-robot"></i> 생성형 AI 어시스턴트:</b><br><br>질문하신 내용의 의도를 파악하기 어렵습니다.<br>특정 업체의 담당자가 궁금하시다면 업체의 이름을 정확히 입력해 주시거나, <i>"영업1팀의 청구처별 실적 막대그래프 그려줘"</i> 와 같이 구체적인 데이터를 요청해 보세요!</div>`;
        }

        // 다운로드 버튼 추가
        response += `<br><div style="text-align:right;"><button onclick="exportElementToPDF('${botDiv.id}', 'AI_분석_리포트.pdf', 'portrait')" class="btn-action" style="margin-top:10px; font-size:12px; padding:6px 12px; border-radius:4px;"><i class="fas fa-download"></i> 리포트 PDF 다운로드</button></div>`;

        botDiv.innerHTML = response;
        container.appendChild(botDiv);
        container.scrollTop = container.scrollHeight;

        if (chartConfig) {
            new Chart(document.getElementById(canvasId), chartConfig);
        }
    }, 800);
}

function showLoading(show) { document.getElementById('loadingOverlay').classList.toggle('hidden', !show); }
function formatNumber(n, noD = false) {
    const val = n || 0;
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: noD ? 0 : 1 }).format(absVal);
    return val < 0 ? `-${formatted}` : formatted;
}

function f1(val) {
    if (val === 0) return '-';
    return Number(val).toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function populateFilters() {
    const teams = [...new Set(dashboardData.actual.map(a => a.Teamname))].sort();
    const persons = [...new Set(dashboardData.actual.map(a => a.SalesPerson))].sort();
    const tF = document.getElementById('teamFilter'), pF = document.getElementById('personFilter');
    tF.innerHTML = '<option value="all">전체 팀</option>'; pF.innerHTML = '<option value="all">전체 사원</option>';
    teams.forEach(t => tF.add(new Option(t, t))); persons.forEach(p => pF.add(new Option(p, p)));
}
async function exportTableToExcel(id, name) {
    const table = document.getElementById(id);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    const rows = Array.from(table.rows);
    const grid = []; // Excel 셀 점유 확인용 2D 배열

    rows.forEach((htmlRow, rowIndex) => {
        if (htmlRow.classList.contains('filter-row')) return;
        if (!grid[rowIndex]) grid[rowIndex] = [];

        let colIndex = 0;
        Array.from(htmlRow.cells).forEach((htmlCell) => {
            // 이미 점유된 컬럼 건너뛰기
            while (grid[rowIndex][colIndex]) {
                colIndex++;
            }

            const rs = htmlCell.rowSpan || 1;
            const cs = htmlCell.colSpan || 1;
            const excelRow = worksheet.getRow(rowIndex + 1);
            const excelCell = excelRow.getCell(colIndex + 1);

            excelCell.value = htmlCell.innerText.trim();

            // 병합 처리
            if (rs > 1 || cs > 1) {
                worksheet.mergeCells(rowIndex + 1, colIndex + 1, rowIndex + rs, colIndex + cs);
                for (let r = 0; r < rs; r++) {
                    for (let c = 0; c < cs; c++) {
                        if (!grid[rowIndex + r]) grid[rowIndex + r] = [];
                        grid[rowIndex + r][colIndex + c] = true;
                    }
                }
            } else {
                grid[rowIndex][colIndex] = true;
            }

            // 스타일 적용 (헤더 vs 데이터)
            if (htmlRow.parentElement.tagName === 'THEAD' || htmlRow.classList.contains('sum-row')) {
                excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002D5B' } };
                excelCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            } else {
                // Zebra striping (순수 데이터 행 기준)
                if (rowIndex % 2 === 0) {
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
            }

            excelCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            excelCell.border = {
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };

            colIndex += cs;
        });
    });

    // 컬럼 너비 자동 조정
    worksheet.columns.forEach(col => { col.width = 18; });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
}

async function exportWeeklyReportExcel(name) {
    const workbook = new ExcelJS.Workbook();
    
    const tables = [
        { id: 'reportTable', name: '주간업무보고' },
        { id: 'preApprovalTable', name: '품의전 확정' },
        { id: 'validationTable', name: '수주실적 검증' },
        { id: 'multiYearTable', name: '다년계약 현황' }
    ];

    tables.forEach(t => {
        const table = document.getElementById(t.id);
        if (!table) return;
        const worksheet = workbook.addWorksheet(t.name);
        const rows = Array.from(table.rows);
        const grid = [];
        
        rows.forEach((htmlRow, rowIndex) => {
            if (htmlRow.classList.contains('filter-row')) return;
            if (!grid[rowIndex]) grid[rowIndex] = [];
            let colIndex = 0;
            Array.from(htmlRow.cells).forEach((htmlCell) => {
                while (grid[rowIndex][colIndex]) colIndex++;
                const rs = htmlCell.rowSpan || 1;
                const cs = htmlCell.colSpan || 1;
                const excelRow = worksheet.getRow(rowIndex + 1);
                const excelCell = excelRow.getCell(colIndex + 1);
                
                // input/contenteditable 인 경우 텍스트를 제대로 가져옴
                let cellText = htmlCell.innerText.trim();
                if (htmlCell.tagName === 'INPUT') cellText = htmlCell.value.trim();
                excelCell.value = cellText;
                
                if (rs > 1 || cs > 1) {
                    worksheet.mergeCells(rowIndex + 1, colIndex + 1, rowIndex + rs, colIndex + cs);
                    for (let r = 0; r < rs; r++) {
                        for (let c = 0; c < cs; c++) {
                            if (!grid[rowIndex + r]) grid[rowIndex + r] = [];
                            grid[rowIndex + r][colIndex + c] = true;
                        }
                    }
                } else {
                    grid[rowIndex][colIndex] = true;
                }
                
                if (htmlRow.parentElement.tagName === 'THEAD' || htmlRow.classList.contains('sum-row') || (htmlCell.parentElement.parentElement && htmlCell.parentElement.parentElement.tagName === 'TFOOT')) {
                    excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002D5B' } };
                    excelCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                } else {
                    if (rowIndex % 2 === 0) excelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
                excelCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                excelCell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                };
                colIndex += cs;
            });
        });
        worksheet.columns.forEach(col => { col.width = 18; });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
}

async function exportElementToPDF(id, name, orientation = 'landscape') {
    const targetElement = document.getElementById(id);
    if (!targetElement) return;

    const hiddenElements = [];

    // 타겟 요소 내의 불필요한 컨트롤 숨김
    const hideSelectors = ['.control-section', '.btn-action', '.premium-search', 'select', 'label.toggle-switch', '.toggle-label'];
    hideSelectors.forEach(sel => {
        targetElement.querySelectorAll(sel).forEach(el => {
            hiddenElements.push({ el: el, display: el.style.display });
            el.style.display = 'none';
        });
    });

    // 100% 확실한 페이지 분할을 위해 수동 페이지 브레이크 엘리먼트 주입
    let manualPageBreak = null;
    if (id === 'dashboardView') {
        const chartsContainer = document.querySelector('.charts-container');
        if (chartsContainer) {
            manualPageBreak = document.createElement('div');
            manualPageBreak.className = 'custom-page-break';
            chartsContainer.parentNode.insertBefore(manualPageBreak, chartsContainer);
        }
    }

    const targetWidth = '1550px'; // 모든 리포트를 A3 가로에 맞게 강제 1550px 적용

    // html2canvas의 정상적인 페이지 브레이크 계산을 위해 레이아웃을 보존하는 안전한 스타일 주입
    const style = document.createElement('style');
    style.innerHTML = `
        #${id} {
            display: block !important;
            width: ${targetWidth} !important; /* 강제 너비 지정 */
            padding: 20px !important;
            margin: 0 !important; /* 가운데 정렬로 인한 왼쪽 짤림 완벽 방지 */
            background: #ffffff !important;
            box-sizing: border-box !important;
        }
        /* 스크롤로 인해 잘리는 현상만 방지 */
        .table-wrapper {
            overflow: visible !important;
            max-height: none !important;
        }
        /* 불필요한 자동 줄바꿈(중부/n권 등) 방지 */
        .data-table th, .data-table td {
            white-space: nowrap !important;
            word-break: keep-all !important;
        }
        /* 주차별 영업진행현황 표는 긴 글자가 많으므로 예외적으로 자동 줄바꿈 허용 */
        #progressTable th, #progressTable td {
            white-space: pre-wrap !important;
            word-break: normal !important;
        }
        /* 페이지 짤림 방지 */
        .card, .chart-card, .kpi-card, tr, thead, tbody, th, td {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }
        /* AI 리포트 다운로드 버튼은 출력 시 숨김 */
        #${id} button {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // 스크롤 버그 방지
    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);

    // CSS 강제 적용 및 렌더링 안정화 대기
    await new Promise(resolve => setTimeout(resolve, 800));

    const opt = {
        margin: [5, 5, 5, 5], // 여백을 줄여 우측 짤림 방지
        filename: name,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollY: 0,
            scrollX: 0
        },
        pagebreak: { mode: ['css', 'legacy'], before: ['.custom-page-break'], avoid: ['.card', '.chart-card', '.kpi-card', 'tr', 'thead', 'tbody'] }, // 정확한 페이지 분할 지정
        jsPDF: { unit: 'mm', format: 'a3', orientation: orientation }
    };

    try {
        await html2pdf().set(opt).from(targetElement).save();
    } catch (err) {
        console.error('PDF Export Error:', err);
        alert('PDF 저장 중 오류가 발생했습니다.\n' + (err.message || '알 수 없는 오류'));
    } finally {
        // 스타일 롤백
        document.head.removeChild(style);

        // 숨겼던 요소 복구
        while (hiddenElements.length > 0) {
            const item = hiddenElements.pop();
            item.el.style.display = item.display;
        }

        // 주입했던 수동 페이지 브레이크 제거
        if (manualPageBreak && manualPageBreak.parentNode) {
            manualPageBreak.parentNode.removeChild(manualPageBreak);
        }

        window.scrollTo(originalScrollX, originalScrollY);
    }
}

function renderWeeklyReport() {
    const selectedMonth = parseInt(document.getElementById('reportMonthFilter').value);
    
    document.getElementById('reportCurrentMonthHeader').textContent = `당월(${selectedMonth}월)`;
    document.getElementById('reportCurrentMonthLv3Header').textContent = `당월누계(${selectedMonth}월) Lv3`;

    const teams = ["1팀", "2팀", "3팀", "TCS", "합계"];
    const fixedData = {
        "1팀": { prev: 542, target: 451 },
        "2팀": { prev: 137, target: 274 },
        "3팀": { prev: 301, target: 276 },
        "TCS": { prev: 0, target: 100 },
        "합계": { prev: 980, target: 1100 }
    };

    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';

    let sumCurrPlan = 0, sumCurrAct = 0, sumCumPlan = 0, sumCumAct = 0, sumCurrLv3 = 0;

    teams.forEach(team => {
        const isTotal = team === "합계";
        const f = fixedData[team];

        let currPlan = 0, currAct = 0, cumPlan = 0, cumAct = 0, currLv3 = 0;
        let lv3Details = [];

        if (!isTotal) {
            dashboardData.plan.forEach(p => {
                if (p.Teamname.includes(team)) {
                    if (p.MonthInt === selectedMonth) currPlan += p.CalculatedAmount || 0;
                    if (p.MonthInt <= selectedMonth) cumPlan += p.CalculatedAmount || 0;
                }
            });

            dashboardData.actual.forEach(a => {
                if (a.Teamname.includes(team)) {
                    if (a.MonthInt === selectedMonth) {
                        currAct += a.Complete || 0; 
                    }
                    if (a.MonthInt <= selectedMonth) {
                        cumAct += a.Complete || 0; 
                        currLv3 += a.Lv3 || 0;
                        if ((a.Lv3 || 0) > 0) {
                            lv3Details.push(`${a.ClientName}(${f1(a.Lv3)})`);
                        }
                    }
                }
            });

            sumCurrPlan += currPlan;
            sumCurrAct += currAct;
            sumCumPlan += cumPlan;
            sumCumAct += cumAct;
            sumCurrLv3 += currLv3;
        } else {
            currPlan = sumCurrPlan;
            currAct = sumCurrAct;
            cumPlan = sumCumPlan;
            cumAct = sumCumAct;
            currLv3 = sumCurrLv3;
        }

        const tr = document.createElement('tr');
        if (isTotal) {
            tr.style.fontWeight = 'bold';
            tr.style.backgroundColor = '#e2e8f0';
        }

        const formatDash = (val) => val === 0 ? '-' : formatNumber(val, true);

        tr.innerHTML = `
            <td>${team}</td>
            <td>${f.prev}</td>
            <td>${formatNumber(f.target)}</td>
            <td>${formatDash(currPlan)}</td>
            <td>${formatDash(currAct)}</td>
            <td>${formatDash(cumPlan)}</td>
            <td>${formatDash(cumAct)}</td>
            <td>${isTotal ? f1(currLv3) : f1(currLv3)}</td>
            <td style="text-align: left; font-size: 0.85rem; line-height: 1.4;">${isTotal ? '-' : lv3Details.join('<br>')}</td>
        `;
        tbody.appendChild(tr);
    });

    // 수주실적 검증 표
    const valTbody = document.getElementById('validationTableBody');
    valTbody.innerHTML = '';
    
    const regions = ["수도권", "중부권", "영남권", "총액"];
    let valData = {
        "수도권": { pre: 0, done: 0 },
        "중부권": { pre: 0, done: 0 },
        "영남권": { pre: 0, done: 0 },
        "총액": { pre: 0, done: 0 }
    };

    let multiYearTotal = 0;

    let preAppTotal = 0;
    const preAppRows = [];
    let preAppMultiTotal = 0;

    dashboardData.actual.forEach(a => {
        if (a.MonthInt <= selectedMonth) {
            let r = (a.Region || '').trim();
            if (r.includes('수도')) r = '수도권';
            else if (r.includes('중부') || r.includes('호남') || r.includes('충청')) r = '중부권';
            else if (r.includes('영남') || r.includes('경북') || r.includes('경남') || r.includes('부산')) r = '영남권';
            else r = '수도권'; 
            
            if (valData[r]) {
                const doneAmt = a.Complete || 0;
                const preAmt = a.Lv3 || 0;
                
                valData[r].done += doneAmt;
                valData["총액"].done += doneAmt;
                valData[r].pre += preAmt;
                valData["총액"].pre += preAmt;
            }

            const m = String(a.MultiYearContract).match(/[0-9.]+/);
            const years = m ? parseFloat(m[0]) : 0;
            if (years > 1) {
                // 검증표 다년계약 계산 시 Complete + Lv3 기준
                const conf = (a.Complete || 0) + (a.Lv3 || 0);
                const oneYear = conf / years;
                multiYearTotal += (conf - oneYear);
            }

            // 수주 품의전 확정 거래선 (Lv3가 존재하는 경우)
            const lv3Amt = a.Lv3 || 0;
            if (lv3Amt > 0) {
                preAppTotal += lv3Amt;
                let amtDisplay = f1(lv3Amt);
                if (years > 1) {
                    const preMulti = lv3Amt - (lv3Amt / years);
                    preAppMultiTotal += preMulti;
                    amtDisplay += `(${years}년)`;
                }
                preAppRows.push(`
                    <tr>
                        <td style="text-align: left;">${a.ClientName}</td>
                        <td>${a.Teamname.replace('컨테이너영업', '').trim()}</td>
                        <td contenteditable="true" style="cursor: text;">${selectedMonth}월</td>
                        <td contenteditable="true" style="text-align: left; cursor: text;">${a.DelayReason || '-'}</td>
                        <td>${amtDisplay}</td>
                    </tr>
                `);
            }
        }
    });

    const preAppTbody = document.getElementById('preApprovalTableBody');
    if (preAppTbody) {
        preAppTbody.innerHTML = preAppRows.join('');
        document.getElementById('preApprovalTotal').textContent = f1(preAppTotal);
        document.getElementById('preApprovalSum').textContent = f1(preAppTotal);
        document.getElementById('preApprovalMultiTotal').textContent = f1(multiYearTotal);
        const netTotal = valData["총액"].done + valData["총액"].pre - multiYearTotal;
        document.getElementById('preApprovalNetTotal').textContent = f1(netTotal);
    }

    regions.forEach(r => {
        const d = valData[r];
        const tot = d.pre + d.done;
        const tr = document.createElement('tr');
        if (r === "총액") tr.style.fontWeight = 'bold';
        tr.innerHTML = `
            <td>${r}</td>
            <td>${f1(d.pre)}</td>
            <td>${f1(d.done)}</td>
            <td style="color: ${r === '총액' ? '#ef4444' : 'inherit'};">${f1(tot)}</td>
        `;
        valTbody.appendChild(tr);
    });

    const valExcl = valData["총액"].pre + valData["총액"].done - multiYearTotal;
    document.getElementById('validationExcludingMultiYear').textContent = f1(valExcl);

    // 다년계약 현황 표
    const multiTbody = document.getElementById('multiYearTableBody');
    multiTbody.innerHTML = '';

    let sum1Y = 0, sumMultiY = 0;
    const multiRows = [];

    dashboardData.actual.forEach(a => {
        if (a.MonthInt <= selectedMonth) {
            const m = String(a.MultiYearContract).match(/[0-9.]+/);
            const years = m ? parseFloat(m[0]) : 0;
            if (years > 1) {
                const conf = (a.Complete || 0) + (a.Lv3 || 0);
                const oneY = conf / years;
                const multiY = conf - oneY;
                
                sum1Y += oneY;
                sumMultiY += multiY;

                multiRows.push(`
                    <tr>
                        <td style="text-align: left;">${a.ClientName}</td>
                        <td>${years}</td>
                        <td>${f1(conf)}</td>
                        <td>${f1(oneY)}</td>
                        <td style="color: #ef4444;">${f1(multiY)}</td>
                        <td>${a.Status}</td>
                    </tr>
                `);
            }
        }
    });

    multiRows.forEach(rowHTML => {
        const tr = document.createElement('tr');
        tr.innerHTML = rowHTML;
        multiTbody.appendChild(tr);
    });

    const sumTr = document.createElement('tr');
    sumTr.style.fontWeight = 'bold';
    sumTr.style.backgroundColor = '#f1f5f9';
    sumTr.innerHTML = `
        <td colspan="3" style="text-align: right; padding-right: 20px;">총 합계</td>
        <td>${f1(sum1Y)}</td>
        <td style="color: #ef4444;">${f1(sumMultiY)}</td>
        <td></td>
    `;
    multiTbody.appendChild(sumTr);
}
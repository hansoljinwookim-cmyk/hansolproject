window.onload = function() { fetchData(); };
let dashboardData = { plan: [], actual: [], progress: [] };
let charts = { monthly: null, person: null, teamPlan: null, personActual: null };

// Unified server proxy endpoint
const WEBHOOK_URL = '/get-data';

window.fetchData = async function () {
    console.log("--- INVINCIBLE FETCH START ---");
    const info = document.getElementById('lastUpdateInfo');
    const overlay = document.getElementById('loadingOverlay');

    if (info) info.textContent = "n8n 응답 수신 중...";
    if (overlay) overlay.classList.remove('hidden');

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch_data' })
        });

        if (!response.ok) throw new Error('서버 응답 오류: ' + response.status);

        const rawData = await response.json();
        console.log("수신 데이터:", rawData);

        processFetchedData(rawData);

        if (info) info.textContent = "업데이트 완료 (" + new Date().toLocaleTimeString() + ")";
    } catch (error) {
        console.error("Critical Error:", error);
        if (info) info.textContent = "업데이트 오류";
        alert("오류 발생: " + error.message);
    } finally {
        if (overlay) overlay.classList.add('hidden');
    }
};

function processFetchedData(rawData) {
    console.log("--- DATA ANALYSIS START ---");
    let plan = [];
    let actual = [];
    let progress = [];

    const checkArray = (val) => {
        if (!Array.isArray(val) || val.length === 0) return false;
        
        // Extract keys from first item (handling n8n .json wrapper if present)
        const first = val[0].json ? val[0].json : val[0];
        if (typeof first !== 'object') return false;
        
        const fKeys = Object.keys(first).join(',').toLowerCase();
        console.log("Found array with keys:", fKeys);

        if (fKeys.includes('total') || fKeys.includes('salesweek') || fKeys.includes('confirmed')) {
            actual = val;
            return true;
        } else if (fKeys.includes('targetamount') || fKeys.includes('targetmonth')) {
            plan = val;
            return true;
        } else if (fKeys.includes('customer_name') || fKeys.includes('prev_week_status') || fKeys.includes('sales_rep')) {
            progress = val;
            return true;
        }
        return false;
    };

    const trawl = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        
        // If it's an array, check it directly
        if (Array.isArray(obj)) {
            if (checkArray(obj)) return;
            // If it's an array of objects, trawl each object
            obj.forEach(item => trawl(item));
        } else {
            // If it's an object, check its properties
            for (let key in obj) {
                const val = obj[key];
                if (Array.isArray(val)) {
                    if (checkArray(val)) continue;
                }
                if (val && typeof val === 'object') {
                    trawl(val);
                }
            }
        }
    };

    trawl(rawData);

    dashboardData.plan = plan.map(mapItem);
    dashboardData.actual = actual.map(mapItem);
    dashboardData.progress = progress.map(mapItem);

    console.log("Analysis Finished:", dashboardData);
    
    populateFilters();
    updateDashboard();
}

function mapItem(item) {
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

    const toNum = (v) => Number(String(v || 0).replace(/[^0-9.-]/g, ''));
    
    const amt = toNum(findKey(['total', 'targetamount', 'confirmedamount', 'proposalamount', '실적금액', '계획금액']) || 0);
    const mon = findKey(['salesweek', 'targetmonth', 'salesmonth', '수주월', '월']) || '-';

    return {
        ...row,
        Amount: amt,
        CalculatedAmount: amt,
        Month: mon,
        SalesMonth: mon,
        SalesPerson: findKey(['salesperson', 'sales_rep', '영업사원', '담당자']) || '미정',
        Teamname: (findKey(['teamname', 'team_name', '팀명', '소속']) || ' - ').trim(),
        ClientName: findKey(['clientname', 'customer_name', '화주', '업체', '고객사']) || '미정',
        Status: findKey(['status', 'current_status', '진행상태', '상태']) || '-',
        MultiYearContract: findKey(['multiyearcontract', 'multi_year', '다년계약']) || '-'
    };
}

// Global State for Charts
Chart.defaults.color = '#1e293b';
Chart.defaults.borderColor = '#e2e8f0';
Chart.defaults.font.family = "'Pretendard', 'Malgun Gothic', sans-serif";

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchData();
});

function setupEventListeners() {
    document.getElementById('updateBtn').addEventListener('click', fetchData);
    document.getElementById('teamFilter').addEventListener('change', updateDashboard);
    document.getElementById('personFilter').addEventListener('change', updateDashboard);

    const multiYearToggle = document.getElementById('excludeMultiYearToggle');
    if (multiYearToggle) {
        multiYearToggle.addEventListener('change', updateDashboard);
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#dashboardView, #progressView').forEach(v => v.style.display = 'none');
            const targetId = e.currentTarget.getAttribute('data-tab');
            e.currentTarget.classList.add('active');
            document.getElementById(targetId).style.display = 'block';
        });
    });

    document.getElementById('chatbotToggle').addEventListener('click', () => {
        document.getElementById('chatbotWindow').classList.toggle('hidden');
    });
    document.getElementById('chatbotClose').addEventListener('click', () => {
        document.getElementById('chatbotWindow').classList.add('hidden');
    });

    document.getElementById('chatbotSend').addEventListener('click', handleChatInput);
    document.getElementById('chatbotInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatInput();
    });

    const downloadDashboardBtn = document.getElementById('downloadDashboardBtn');
    if (downloadDashboardBtn) downloadDashboardBtn.addEventListener('click', downloadDashboardPDF);

    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportDetailToExcel);

    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportDetailToPDF);

    const exportProgressExcelBtn = document.getElementById('exportProgressExcelBtn');
    if (exportProgressExcelBtn) exportProgressExcelBtn.addEventListener('click', exportProgressToExcel);

    const exportProgressPdfBtn = document.getElementById('exportProgressPdfBtn');
    if (exportProgressPdfBtn) exportProgressPdfBtn.addEventListener('click', exportProgressToPDF);
}

function formatNumber(amount, noDecimals = false) {
    const fractionDigits = noDecimals ? 0 : 1;
    return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: fractionDigits }).format(amount || 0);
}

function populateFilters() {
    const teams = new Set();
    const persons = new Set();
    dashboardData.actual.forEach(item => {
        if (item.Teamname) teams.add(item.Teamname);
        if (item.SalesPerson) persons.add(item.SalesPerson);
    });

    const teamFilter = document.getElementById('teamFilter');
    const personFilter = document.getElementById('personFilter');
    teamFilter.innerHTML = '<option value="all">전체 팀</option>';
    personFilter.innerHTML = '<option value="all">전체 사원</option>';

    Array.from(teams).sort().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t; teamFilter.appendChild(opt);
    });
    Array.from(persons).sort().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p; opt.textContent = p; personFilter.appendChild(opt);
    });
}

function getFilteredData() {
    const selectedTeam = document.getElementById('teamFilter').value;
    const selectedPerson = document.getElementById('personFilter').value;
    const slider = document.getElementById('kpiCumulativeSlider');
    const selectedMonth = slider ? parseInt(slider.value) : 12;

    let filteredActual = dashboardData.actual;
    let filteredPlan = dashboardData.plan;
    let filteredProgress = dashboardData.progress || [];

    if (selectedTeam !== 'all') {
        filteredActual = filteredActual.filter(item => item.Teamname === selectedTeam);
        filteredPlan = filteredPlan.filter(item => item.Teamname === selectedTeam);
        filteredProgress = filteredProgress.filter(item => (item.team_name || item.Teamname || '').includes(selectedTeam));
    }
    if (selectedPerson !== 'all') {
        filteredActual = filteredActual.filter(item => item.SalesPerson === selectedPerson);
        filteredPlan = filteredPlan.filter(item => item.SalesPerson === selectedPerson);
    }

    filteredActual = filteredActual.filter(item => {
        const m = parseInt(String(item.SalesMonth).replace(/[^0-9]/g, '')) || 12;
        return m <= selectedMonth;
    });

    return { plan: filteredPlan, actual: filteredActual, progress: filteredProgress, selectedMonth };
}

function updateDashboard() {
    const { plan, actual, progress, selectedMonth } = getFilteredData();
    renderKPIs(plan, actual, selectedMonth);
    renderMonthlyChart(plan, actual);
    renderMatrixTable(plan, actual);
    renderProgressTable(progress);
    renderDrillDownSummary(plan, actual);
}

function renderKPIs(plan, actual, endMonth) {
    let cPlan = 0, cActual = 0;
    plan.forEach(p => {
        const m = parseInt(String(p.TargetMonth).replace(/[^0-9]/g, ''));
        if (m <= endMonth) cPlan += (p.Amount || 0);
    });
    actual.forEach(a => {
        const m = parseInt(String(a.SalesMonth).replace(/[^0-9]/g, ''));
        if (m <= endMonth) cActual += (a.Amount || 0);
    });
    const rate = cPlan > 0 ? (cActual / cPlan * 100).toFixed(1) : 0;
    document.getElementById('kpiTargetAmount').textContent = formatNumber(cPlan, true) + '억';
    document.getElementById('kpiConfirmedAmount').textContent = formatNumber(cActual, true) + '억';
    document.getElementById('kpiAchievementRate').textContent = rate + '%';
}

function renderMonthlyChart(planData, actualData) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const months = Array.from({length: 12}, (_, i) => `${i+1}월`);
    const planSeries = Array(12).fill(0);
    const actualSeries = Array(12).fill(0);

    planData.forEach(p => {
        const m = parseInt(String(p.TargetMonth).replace(/[^0-9]/g, ''));
        if (m >= 1 && m <= 12) planSeries[m-1] += (p.Amount || 0);
    });
    actualData.forEach(a => {
        const m = parseInt(String(a.SalesMonth).replace(/[^0-9]/g, ''));
        if (m >= 1 && m <= 12) actualSeries[m-1] += (a.Amount || 0);
    });

    if (charts.monthly) charts.monthly.destroy();
    charts.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                { label: '계획', data: planSeries, borderColor: '#94a3b8', tension: 0.3 },
                { label: '실적', data: actualSeries, borderColor: '#3b82f6', borderWidth: 3, tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false } } }
    });
}

function renderMatrixTable(planData, actualData) {
    const tbody = document.querySelector('#matrixTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const teams = ['컨테이너영업1팀', '컨테이너영업2팀', '컨테이너영업3팀', 'TCS'];
    
    teams.forEach(team => {
        const row = document.createElement('tr');
        let html = `<td>실적</td><td>${team}</td>`;
        let yearTotal = 0;
        for (let m = 1; m <= 12; m++) {
            const val = actualData.filter(a => a.Teamname === team && parseInt(String(a.SalesMonth).replace(/[^0-9]/g, '')) === m)
                                  .reduce((sum, curr) => sum + (curr.Amount || 0), 0);
            html += `<td>${formatNumber(val, true)}</td>`;
            yearTotal += val;
        }
        html += `<td>${formatNumber(yearTotal, true)}</td>`;
        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

function renderProgressTable(progressData) {
    const tbody = document.getElementById('progressTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    progressData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.ClientName || '-'}</td>
            <td>${item.Teamname || '-'}</td>
            <td>${item.SalesPerson || '-'}</td>
            <td>${item.prev_week_status || '-'}</td>
            <td>${item.curr_week_plan || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderDrillDownSummary(planData, actualData) {
    const tbody = document.querySelector('#drilldownSummaryTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const teams = Array.from(new Set(actualData.map(a => a.Teamname))).sort();
    
    teams.forEach(team => {
        const actual = actualData.filter(a => a.Teamname === team).reduce((s, c) => s + (c.Amount || 0), 0);
        const tr = document.createElement('tr');
        tr.className = 'clickable-row';
        tr.innerHTML = `<td>${team}</td><td>-</td><td>${formatNumber(actual, true)}</td><td>-</td>`;
        tr.onclick = () => {
            document.getElementById('drilldownDetailContainer').style.display = 'block';
            document.getElementById('drilldownTeamName').textContent = team;
            renderDrillDownDetail(team, actualData);
        };
        tbody.appendChild(tr);
    });
}

function renderDrillDownDetail(team, data) {
    const tbody = document.querySelector('#drilldownDetailTable tbody');
    tbody.innerHTML = '';
    const filtered = data.filter(a => a.Teamname === team);
    filtered.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.SalesPerson}</td><td>${row.ClientName}</td><td>${row.PORT || '-'}</td>
            <td>${row.TradeType || '-'}</td><td>${row.WorkLocation || '-'}</td><td>${row.Region || '-'}</td>
            <td>${row.SalesMonth}</td><td>${row.Status}</td><td>${row.MultiYearContract}</td>
            <td>${formatNumber(row.Complete || 0)}</td><td>${formatNumber(row.Lv3 || 0)}</td>
            <td>${formatNumber(row.Lv2 || 0)}</td><td>${formatNumber(row.Lv1 || 0)}</td>
            <td>${formatNumber(row.Amount)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function handleChatInput() {
    const input = document.getElementById('chatbotInput');
    const msg = input.value.trim();
    if (!msg) return;
    const chatMsg = document.createElement('div');
    chatMsg.className = 'message user';
    chatMsg.textContent = msg;
    document.getElementById('chatbotMessages').appendChild(chatMsg);
    input.value = '';
}

function downloadDashboardPDF() { window.print(); }
function exportDetailToExcel() { alert('Excel 내보내기 기능 준비 중'); }
function exportDetailToPDF() { window.print(); }
function exportProgressToExcel() { alert('Excel 내보내기 기능 준비 중'); }
function exportProgressToPDF() { window.print(); }

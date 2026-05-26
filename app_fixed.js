// Configuration
const WEBHOOK_URL = 'https://desktop-g3rnt5i.tail25a848.ts.net/webhook/bfb197f8-2f32-484e-877b-2cb676b86b0f';

// Global State
let dashboardData = {
    plan: [],
    actual: [],
    progress: []
};
let charts = {
    monthly: null,
    person: null,
    teamPlan: null,
    personActual: null
};

// Chart.js Default Config for Corporate White Mode
Chart.defaults.color = '#1e293b';
Chart.defaults.borderColor = '#e2e8f0';
Chart.defaults.font.family = "'Pretendard', 'Malgun Gothic', sans-serif";

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchData();
});

function setupEventListeners() {
    // Update Button
    document.getElementById('updateBtn').addEventListener('click', fetchData);

    // Filter Change
    document.getElementById('teamFilter').addEventListener('change', updateDashboard);
    document.getElementById('personFilter').addEventListener('change', updateDashboard);

    // Multi-year Contract Toggle
    const multiYearToggle = document.getElementById('excludeMultiYearToggle');
    if (multiYearToggle) {
        multiYearToggle.addEventListener('change', () => {
            // Re-render dashboard specifically to update matrix table
            updateDashboard();
        });
    }

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('#dashboardView, #progressView').forEach(v => v.style.display = 'none');

            const targetId = e.currentTarget.getAttribute('data-tab');
            e.currentTarget.classList.add('active');
            document.getElementById(targetId).style.display = 'block';
        });
    });



    // Chatbot Toggle
    const chatbotWindow = document.getElementById('chatbotWindow');
    document.getElementById('chatbotToggle').addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
        if (!chatbotWindow.classList.contains('hidden')) {
            document.getElementById('chatbotInput').focus();
        }
    });
    document.getElementById('chatbotClose').addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
    });

    const chatbotMaximize = document.getElementById('chatbotMaximize');
    if (chatbotMaximize) {
        chatbotMaximize.addEventListener('click', () => {
            chatbotWindow.classList.toggle('fullscreen');
            const icon = chatbotMaximize.querySelector('i');
            if (chatbotWindow.classList.contains('fullscreen')) {
                icon.className = 'fas fa-compress';
            } else {
                icon.className = 'fas fa-expand';
            }
        });
    }

    // Chatbot Input
    const chatInput = document.getElementById('chatbotInput');
    const chatSend = document.getElementById('chatbotSend');

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatInput();
    });
    chatSend.addEventListener('click', handleChatInput);

    // Export Buttons
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

    // Drilldown Search & Filter
    const applyDrilldownFilter = () => {
        if (currentDrilldownContext) {
            renderDrillDownDetail(currentDrilldownContext.teamName, currentDrilldownContext.actualData, currentDrilldownContext.filterPersonName, true);
        }
    };
    const detailSearchInput = document.getElementById('detailSearchInput');
    if (detailSearchInput) detailSearchInput.addEventListener('input', applyDrilldownFilter);
    const detailMonthFilter = document.getElementById('detailMonthFilter');
    if (detailMonthFilter) detailMonthFilter.addEventListener('change', applyDrilldownFilter);
    const detailStatusFilter = document.getElementById('detailStatusFilter');
    if (detailStatusFilter) detailStatusFilter.addEventListener('change', applyDrilldownFilter);
}

let currentDrilldownContext = null;

async function fetchData() {
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
                throw new Error("n8n?로???달받? ?이?? ?전??비어?습?다. n8n ?크?로?의 'Respond to Webhook' ?드 ?정???인?주?요.");
            }
            rawData = JSON.parse(textResponse);
        } catch (e) {
            console.error("?이???싱 ?류:", e);
            throw new Error(`n8n ?이???류: ${e.message}\n(n8n?서 ?이?? ?정?면??Respond ?드 ?락?었거나 비정?적???태?반환?고 ?는 ?????요?니??)`);
        }

        console.log("??n8n?로??받? ?본 ?이??", rawData);

        let planData = null;
        let actualData = null;
        let progressData = null;
        let lastModifyingUser = '?????음';
        let modifiedTime = null;

        // ?달?주???플 ?이???태: [ { "계획": [...] }, { "?적": [...] } ]
        if (Array.isArray(rawData)) {
            rawData.forEach(item => {
                if (item['계획']) planData = item['계획'];
                if (item['plan']) planData = item['plan'];
                if (item['?적']) actualData = item['?적'];
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
            actualData = rawData.actual || rawData['?적'];
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

                updateInfoEl.textContent = `최근 ?데?트: ${yyyy}-${mm}-${dd} ${hh}:${min} (${lastModifyingUser})`;
            } else {
                updateInfoEl.textContent = `최근 ?데?트 ?보 ?음`;
            }
        }

        // Validation
        if (!planData || !actualData) {
            console.error("?이??구조 분석 ?류. 계획 ?는 ?적 ?이?? 찾을 ???습?다. ?제 받? ?이??", rawData);
            throw new Error('Invalid data format received');
        }

        // n8n ?이??구조 ??? { json: { ... } } ?태??경우 ?맹??json)?추출
        dashboardData.plan = planData.map(item => item.json ? item.json : item);
        if (progressData) {
            dashboardData.progress = progressData.map(item => item.json ? item.json : item);
        } else {
            dashboardData.progress = [];
            console.warn("주차??업진행?황(진행) ?이?? ?습?다.");
        }


        function safeNumber(val) {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return Number(String(val).replace(/,/g, '')) || 0;
        }

        // Data processing for Actual
        dashboardData.actual = actualData.map(item => {
            const row = item.json ? item.json : item;

            const findKey = (searchKeys) => {
                const keys = Object.keys(row);
                for (let k of keys) {
                    const cleanK = k.replace(/[^a-zA-Z0-9-??/g, '').toLowerCase();
                    const cleanSearchKeys = searchKeys.map(sk => sk.replace(/[^a-zA-Z0-9-??/g, '').toLowerCase());
                    if (cleanSearchKeys.includes(cleanK)) return row[k];
                }
                return undefined;
            };

            // Extract month from SalesWeek or SalesMonth (e.g. "4?? -> "4??)
            let rawMonth = findKey(['salesmonth', 'salesweek', '?주??, ' ? 주주차', 'month', 'targetmonth']);
            let monthStr = String(rawMonth || '');
            if (monthStr && monthStr.trim() !== 'undefined' && monthStr.trim() !== '') {
                const match = monthStr.match(/(\d+)/);
                if (match) {
                    row.SalesMonth = match[1] + '??;
                } else {
                    row.SalesMonth = monthStr;
                }
            } else {
                row.SalesMonth = '-';
            }

            // Calculate exact actual amount from new fields
            const complete = safeNumber(findKey(['complete', '?정', '?정금액']));
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

            // Map UI fields
            row.SalesPerson = findKey(['salesperson', '?업?원', '?당??]) || '미정';
            row.Teamname = (findKey(['teamname', '??, ' ? 업 ?', ' ? 속']) || ' - ').trim();
            row.ClientName = findKey(['clientname', 'client', '??, '고객 ??]) || row.ClientName;
            row.PORT = findKey(['port', '?트', '??']) || row.PORT;
            row.TradeType = findKey(['tradetype', '?출??, '구분']) || row.TradeType;
            row.WorkLocation = findKey(['worklocation', '?업', '?소']) || row.WorkLocation;
            row.Region = findKey(['region', '권역', '??]) || row.Region;
            row.Status = findKey(['status', '?의진행?태', '?태', '진행?태']) || row.Status;
            row.MultiYearContract = findKey(['multiyearcontract', '?년계약', '계약']) || row.MultiYearContract;

            return row;
        });

        populateFilters();
        updateDashboard();


    } catch (error) {
        console.error('Error fetching data:', error);
        alert('?이?? 불러?는???패?습?다: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function formatNumber(amount, noDecimals = false) {
    const fractionDigits = noDecimals ? 0 : 1;
    if (amount < 0) {
        return '?? + new Intl.NumberFormat('ko - KR', { maximumFractionDigits: fractionDigits }).format(Math.abs(amount));
    }
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

    // Reset keeping first option
    teamFilter.innerHTML = '<option value="all">?체 ?</option>';
    personFilter.innerHTML = '<option value="all">?체 ?원</option>';

    Array.from(teams).sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamFilter.appendChild(option);
    });

    Array.from(persons).sort().forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        personFilter.appendChild(option);
    });
}

function getFilteredData() {
    const selectedTeam = document.getElementById('teamFilter').value;
    const selectedPerson = document.getElementById('personFilter').value;

    // ?라?더 ??기
    const slider = document.getElementById('kpiCumulativeSlider');
    const selectedMonth = slider ? parseInt(slider.value) : 12;

    let filteredActual = dashboardData.actual;
    let filteredPlan = dashboardData.plan;
    let filteredProgress = dashboardData.progress || [];

    if (selectedTeam !== 'all') {
        filteredActual = filteredActual.filter(item => item.Teamname === selectedTeam);
        filteredPlan = filteredPlan.filter(item => item.Teamname === selectedTeam);
        filteredProgress = filteredProgress.filter(item => (item.team_name || item.?구분 || '').includes(selectedTeam));
    }

    if (selectedPerson !== 'all') {
        filteredActual = filteredActual.filter(item => item.SalesPerson === selectedPerson);
        filteredPlan = filteredPlan.filter(item => item.SalesPerson === selectedPerson);
        filteredProgress = filteredProgress.filter(item => (item.sales_rep || item.? 업 ? 원 || '').includes(selectedPerson));
    }

    // ?별 ?계???터?(?월 ?계 기?)
    // 주간보고(progress)??주차?기?????터링에???외
    filteredActual = filteredActual.filter(item => {
        const itemMonth = parseInt((item.SalesMonth || '').replace(/[^0-9]/g, '')) || 12;
        return itemMonth <= selectedMonth;
    });

    const excludeMultiYear = document.getElementById('excludeMultiYearToggle')?.checked;

    let adjustedActual = filteredActual;
    if (excludeMultiYear) {
        adjustedActual = filteredActual.map(item => {
            if (item.MultiYearContract) {
                const years = parseInt(String(item.MultiYearContract).replace(/[^0-9]/g, ''));
                if (years > 1) {
                    const factor = 1 / years;
                    return {
                        ...item,
                        CalculatedAmount: (item.CalculatedAmount || 0) * factor,
                        Complete: (item.Complete || 0) * factor,
                        Lv3: (item.Lv3 || 0) * factor,
                        Lv2: (item.Lv2 || 0) * factor,
                        Lv1: (item.Lv1 || 0) * factor
                    };
                }
            }
            return item;
        });
    }

    filteredPlan = filteredPlan.filter(item => {
        // plan? TargetMonth ?태 ("4??)??어?거??TargetMonth ?는 경우??처리
        const monthStr = item.TargetMonth || item.SalesMonth || '';
        const itemMonth = parseInt(String(monthStr).replace(/[^0-9]/g, '')) || 12;
        return itemMonth <= selectedMonth;
    });

    return { plan: filteredPlan, actual: adjustedActual, rawActual: filteredActual, progress: filteredProgress, selectedMonth };
}


function updateDashboard() {
    const { plan, actual, rawActual, progress, selectedMonth } = getFilteredData();

    // ?업진행?황 ?이??데?트
    renderProgressTable(progress);

    // 1. Calculate and Render KPIs
    const slider = document.getElementById('kpiCumulativeSlider');
    // renderKPIs?????으로도 ?을 처리??? ?? ?터링된 ?이?? ?어?selectedMonth???각??처리???임
    renderKPIs(plan, rawActual, selectedMonth);

    if (slider && !slider.dataset.listenerAdded) {
        slider.dataset.listenerAdded = 'true';
        slider.addEventListener('input', (e) => {
            const endMonth = parseInt(e.target.value);
            const display = document.getElementById('kpiCumulativeMonthDisplay');
            if (display) {
                display.textContent = endMonth === 12 ? '12???계 (?간)' : `${endMonth}???계`;
            }
            // ?라?더 ????체 ??보???데?트!
            updateDashboard();
        });
    }

    // 2. Render Charts & Tables
    renderMonthlyChart(plan, actual);
    renderMonthComparisonSection(plan, actual);
    renderMatrixTable(plan, actual);
    renderDrillDownSummary(plan, actual);
}

function renderKPIs(plan, actual, endMonth) {
    let cumulativePlan = 0;
    let cumulativeActual = 0;
    let futureMultiYearAmount = 0;

    // For MoM (?당 ???적 증감)
    let endMonthActual = 0;
    let prevMonthActual = 0;

    plan.forEach(p => {
        if (!p.TargetMonth) return;
        const m = parseInt(p.TargetMonth);
        if (m <= endMonth) {
            cumulativePlan += (Number(p.TargetAmount) || 0);
        }
    });

    actual.forEach(a => {
        if (!a.SalesMonth) return;
        const m = parseInt(a.SalesMonth);
        if (m <= endMonth) {
            let amount = a.CalculatedAmount || 0;
            cumulativeActual += amount;

            if (a.MultiYearContract) {
                const years = parseInt(String(a.MultiYearContract).replace(/[^0-9]/g, ''));
                if (years > 1) {
                    const thisYearPortion = amount / years;
                    futureMultiYearAmount += (amount - thisYearPortion);
                }
            }
        }
        if (m === endMonth) {
            endMonthActual += (a.CalculatedAmount || 0);
        } else if (m === endMonth - 1) {
            prevMonthActual += (a.CalculatedAmount || 0);
        }
    });

    const achievementRate = cumulativePlan > 0 ? (cumulativeActual / cumulativePlan * 100).toFixed(1) : 0;

    let momGrowthText = "-";
    if (endMonth === 1) {
        momGrowthText = `+${formatNumber(endMonthActual)}??;
    } else {
        const growth = endMonthActual - prevMonthActual;
        const sign = growth >= 0 ? "+" : "";
        momGrowthText = `${ sign }${ formatNumber(growth) }??;
    }

    document.getElementById('kpiTargetAmount').textContent = formatNumber(cumulativePlan, true) + '??;

    // ?적 ?주 ?계 ?기 방식 ? ?체금액 (?년계약 ?외?
    const confirmedEl = document.getElementById('kpiConfirmedAmount');
    if (futureMultiYearAmount > 0) {
        confirmedEl.innerHTML = `${formatNumber(cumulativeActual, true)}??<span style="font-size: 1.1rem; color: #64748b; font-weight: 500;">(?년계약 ${formatNumber(futureMultiYearAmount, true)}???함)</span>`;
    } else {
        confirmedEl.textContent = formatNumber(cumulativeActual, true) + '??;
    }

    document.getElementById('kpiAchievementRate').textContent = `${achievementRate}%`;
    document.getElementById('kpiMomGrowth').textContent = momGrowthText;
}

let lastSelectedMonth = null;
let lastSelectedTeam = null;

function renderMonthComparisonSection(plan, actual) {
    const monthSelector = document.getElementById('monthSelector');
    const teamSelector = document.getElementById('sectionTeamSelector');
    if (!monthSelector || !teamSelector) return;

    if (monthSelector.options.length <= 1) {
        // Init Month
        for (let i = 1; i <= 12; i++) {
            const opt = document.createElement('option');
            opt.value = `${i}??;
            opt.textContent = `${ i }??;
            monthSelector.appendChild(opt);
        }

        // Init Team
        const teams = ['TCS', '컨테?너?업1?', '컨테?너?업2?', '컨테?너?업3?'];
        teams.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            teamSelector.appendChild(opt);
        });

        // Set Default: ?간 ?계, 컨테?너?업1?
        monthSelector.value = '?간 ?계';
        teamSelector.value = '컨테?너?업1?';

        lastSelectedMonth = monthSelector.value;
        lastSelectedTeam = teamSelector.value;

        const handleChange = () => {
            lastSelectedMonth = monthSelector.value;
            lastSelectedTeam = teamSelector.value;
            const { plan, actual } = getFilteredData();
            renderMonthComparisonCharts(plan, actual, lastSelectedMonth, lastSelectedTeam);
        };

        monthSelector.addEventListener('change', handleChange);
        teamSelector.addEventListener('change', handleChange);
    }

    const currentMonth = lastSelectedMonth || monthSelector.value;
    const currentTeam = lastSelectedTeam || teamSelector.value;
    renderMonthComparisonCharts(plan, actual, currentMonth, currentTeam);
}

function renderMonthComparisonCharts(planData, actualData, monthStr, teamName) {
    const teamPlanCtx = document.getElementById('teamPlanChart');
    const personActualCtx = document.getElementById('personActualChart');
    if (!teamPlanCtx || !personActualCtx) return;

    // 1. Calculate Team Plan and Actual for the selected month
    let teamPlan = 0;
    const isYearly = monthStr === '?간 ?계';

    planData.forEach(p => {
        if ((isYearly || p.TargetMonth === monthStr) && (p.Teamname || '-') === teamName) {
            teamPlan += (Number(p.TargetAmount) || 0);
        }
    });

    let teamActual = 0;
    const personMap = {};
    actualData.forEach(a => {
        if ((isYearly || a.SalesMonth === monthStr) && (a.Teamname || '-') === teamName) {
            const amt = a.CalculatedAmount || 0;
            teamActual += amt;
            const person = a.SalesPerson || '미정';
            personMap[person] = (personMap[person] || 0) + amt;
        }
    });

    // Destroy old charts
    if (charts.teamPlan) charts.teamPlan.destroy();
    if (charts.personActual) charts.personActual.destroy();

    const maxYValue = Math.max(teamPlan, teamActual) * 1.15;
    const labelPrefix = monthStr === '?간 ?계' ? '?간' : monthStr;

    // Chart 1: Team Plan vs Actual
    charts.teamPlan = new Chart(teamPlanCtx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: [`${labelPrefix} 목표`, `${labelPrefix} ?적`],
            datasets: [{
                data: [teamPlan, teamActual],
                backgroundColor: ['rgba(148, 163, 184, 0.7)', 'rgba(59, 130, 246, 0.8)'],
                borderColor: ['rgba(148, 163, 184, 1)', 'rgba(59, 130, 246, 1)'],
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: `${teamName.replace('컨테?너', '')} ${monthStr} ?성 ?황`, font: { size: 14 } },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    font: { weight: 'bold' },
                    formatter: (value) => value > 0 ? formatNumber(value, true) + '?? : '0'
                }
            },
            scales: {
                y: { beginAtZero: true, max: maxYValue, display: false },
                x: { grid: { display: false } }
            }
        },
        plugins: [ChartDataLabels]
    });

    // Chart 2: Person Actual
    const persons = Object.keys(personMap).sort((a, b) => personMap[b] - personMap[a]);
    const actualValues = persons.map(p => personMap[p]);

    charts.personActual = new Chart(personActualCtx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: persons,
            datasets: [{
                data: actualValues,
                backgroundColor: actualValues.map((_, i) => i < 2 ? 'rgba(59, 130, 246, 0.95)' : 'rgba(59, 130, 246, 0.3)'),
                borderColor: actualValues.map((_, i) => i < 2 ? '#f59e0b' : 'rgba(59, 130, 246, 0.5)'),
                borderWidth: actualValues.map((_, i) => i < 2 ? 2 : 1),
                borderRadius: 4,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, activeEls) => {
                if (activeEls.length > 0) {
                    const personIndex = activeEls[0].index;
                    const personName = charts.personActual.data.labels[personIndex];
                    const { actual } = getFilteredData();
                    renderDrillDownDetail(teamName, actual, personName);
                    const container = document.getElementById('drilldownDetailContainer');
                    if (container) container.scrollIntoView({ behavior: 'smooth' });
                }
            },
            plugins: {
                legend: { display: false },
                title: {
                    display: true, text: `?업?원?기여??, font: { size: 14 } },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: 'var(--accent-primary)',
                    font: { weight: 'bold', size: 11 },
                    formatter: (value) => {
                        if (value === 0) return '';
                        const pct = teamActual > 0 ? Math.round((value / teamActual) * 100) : 0;
                        return `${ formatNumber(value, true) } ?? (${ pct } %)`;
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, max: maxYValue, display: false },
                x: { grid: { display: false }, ticks: { autoSkip: false } }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderMonthlyChart(planData, actualData) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');

    // Group by month
    const monthsMap = new Map();

    planData.forEach(p => {
        const m = p.TargetMonth;
        if (!m) return;
        if (!monthsMap.has(m)) monthsMap.set(m, { plan: 0, actual: 0 });
        monthsMap.get(m).plan += Number(p.TargetAmount) || 0;
    });

    actualData.forEach(a => {
        const m = a.SalesMonth;
        if (!m) return;
        if (!monthsMap.has(m)) monthsMap.set(m, { plan: 0, actual: 0 });
        monthsMap.get(m).actual += (a.CalculatedAmount || 0);
    });

    // Ensure months 1 to 12 are represented
    for (let i = 1; i <= 12; i++) {
        if (!monthsMap.has(`${ i }??)) {
        monthsMap.set(`${i}??, { plan: 0, actual: 0 });
        }
    }

    // Sort months numerically
    const sortedMonths = Array.from(monthsMap.keys()).sort((a, b) => parseInt(a) - parseInt(b));
    const planSeries = sortedMonths.map(m => monthsMap.get(m).plan);
    const actualSeries = sortedMonths.map(m => monthsMap.get(m).actual);

    if (charts.monthly) charts.monthly.destroy();

    charts.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [
                {
                    label: '계획',
                    data: planSeries,
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    borderColor: 'rgba(148, 163, 184, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(148, 163, 184, 1)',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: '?적',
                    data: actualSeries,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointRadius: 4,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'line'
                    }
                },
                datalabels: {
                    align: 'top',
                    anchor: 'end',
                    color: function (context) {
                        return context.dataset.borderColor;
                    },
                    font: { weight: 'bold' },
                    formatter: function (value) {
                        return value === 0 ? '' : formatNumber(value, true);
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + formatNumber(context.raw, true);
                        }
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function renderMatrixTable(planData, actualData) {
    const tbody = document.querySelector('#matrixTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const teams = ['TCS', '컨테?너?업1?', '컨테?너?업2?', '컨테?너?업3?'];

    // Initialize data structure
    const dataMap = {
        '계획': {}, '?적': {}, 'GAP': {}
    };
    ['계획', '?적', 'GAP'].forEach(cat => {
        [...teams, '?계'].forEach(team => {
            dataMap[cat][team] = Array(12).fill(0);
        });
    });

    // Populate Plan
    planData.forEach(p => {
        let team = p.Teamname;
        const mStr = p.TargetMonth;
        if (mStr && teams.includes(team)) {
            const mIdx = parseInt(mStr) - 1;
            if (mIdx >= 0 && mIdx < 12) {
                dataMap['계획'][team][mIdx] += Number(p.TargetAmount) || 0;
            }
        }
    });

    // Populate Actual
    actualData.forEach(a => {
        let team = a.Teamname;
        const mStr = a.SalesMonth;
        if (mStr && teams.includes(team)) {
            const mIdx = parseInt(mStr) - 1;
            if (mIdx >= 0 && mIdx < 12) {
                let amount = a.CalculatedAmount || 0;
                dataMap['?적'][team][mIdx] += amount;
            }
        }
    });

    // Calculate Totals and GAPs
    for (let m = 0; m < 12; m++) {
        let planSum = 0, actualSum = 0;
        teams.forEach(team => {
            planSum += dataMap['계획'][team][m];
            actualSum += dataMap['?적'][team][m];

            dataMap['GAP'][team][m] = dataMap['?적'][team][m] - dataMap['계획'][team][m];
        });
        dataMap['계획']['?계'][m] = planSum;
        dataMap['?적']['?계'][m] = actualSum;
        dataMap['GAP']['?계'][m] = actualSum - planSum;
    }

    // Render Rows
    const categories = [
        { name: '계획', label: '계획' },
        { name: '?적', label: '?적' },
        { name: 'GAP', label: 'GAP' }
    ];

    categories.forEach(cat => {
        [...teams, '?계'].forEach((team, idx) => {
            const tr = document.createElement('tr');

            let catCell = '';
            if (idx === 0) {
                catCell = `< td rowspan = "5" style = "font-weight:bold; background-color:var(--bg-card); vertical-align:middle;" > ${ cat.label }</td > `;
            }

            let baseStyle = '';
            if (cat.name === '계획') baseStyle = 'background-color: #ffffff;';
            if (cat.name === '?적') baseStyle = 'background-color: #f0f9ff;';
            if (cat.name === 'GAP') baseStyle = 'background-color: #f8fafc;';

            let style = team === '?계' ? `${ baseStyle } font - weight: bold; ` : baseStyle;
            let totalStyle = team === '?계' ? `font - weight: bold; background - color: #e2e8f0; ` : `${ baseStyle } font - weight: bold; `;

            let rowHtml = `${ catCell } <td style="${style}">${team}</td>`;
            let yearTotal = 0;

            for (let m = 0; m < 12; m++) {
                const val = dataMap[cat.name][team][m];
                yearTotal += val;

                let cellClass = '';
                let cellStyle = style;
                if (cat.name === 'GAP' && val < 0) {
                    cellClass = 'bg-danger-light';
                    cellStyle = style + ' color: #ef4444; font-weight: 600;';
                }
                rowHtml += `< td class="${cellClass}" style = "${cellStyle}" > ${ formatNumber(val, true) }</td > `;
            }

            let totalClass = (cat.name === 'GAP' && yearTotal < 0) ? 'bg-danger-light' : '';
            let finalTotalStyle = (cat.name === 'GAP' && yearTotal < 0) ? totalStyle + ' color: #ef4444; font-weight: 600;' : totalStyle + ' color: var(--accent-primary);';
            rowHtml += `< td class="${totalClass}" style = "${finalTotalStyle}" > ${ formatNumber(yearTotal, true) }</td > `;

            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });
    });
}

function renderDrillDownSummary(planData, actualData) {
    const tbody = document.querySelector('#drilldownSummaryTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const summaryMap = {};
    let totalPlan = 0;
    let totalActual = 0;

    planData.forEach(p => {
        const team = p.Teamname || '-';
        if (!summaryMap[team]) summaryMap[team] = { plan: 0, actual: 0, persons: {} };
        const pAmt = Number(p.TargetAmount) || 0;
        summaryMap[team].plan += pAmt;
        totalPlan += pAmt;

        const person = p.SalesPerson || '미정';
        if (!summaryMap[team].persons[person]) {
            summaryMap[team].persons[person] = { plan: 0, actual: 0 };
        }
        summaryMap[team].persons[person].plan += pAmt;
    });

    actualData.forEach(a => {
        const team = a.Teamname || '-';
        if (!summaryMap[team]) summaryMap[team] = { plan: 0, actual: 0, persons: {} };
        const aAmt = (a.CalculatedAmount || 0);
        summaryMap[team].actual += aAmt;
        totalActual += aAmt;

        const person = a.SalesPerson || '미정';
        if (!summaryMap[team].persons[person]) {
            summaryMap[team].persons[person] = { plan: 0, actual: 0 };
        }
        summaryMap[team].persons[person].actual += aAmt;
    });

    Object.keys(summaryMap).sort().forEach(team => {
        const plan = summaryMap[team].plan;
        const actual = summaryMap[team].actual;
        const rate = plan > 0 ? ((actual / plan) * 100).toFixed(1) : 0;
        const persons = summaryMap[team].persons;
        const hasPersons = Object.keys(persons).length > 0;

        const tr = document.createElement('tr');
        tr.className = 'clickable-row';

        const toggleIcon = hasPersons ? `< button class="person-toggle-btn" style = "background:none; border:none; cursor:pointer; font-size:1.1rem; color:var(--accent-secondary); margin-right:8px; width:20px; text-align:center;" title = "?업?원?보기" > <i class="fas fa-plus-square"></i></button > ` : ` < span style = "display:inline-block; width:28px;" ></span > `;

        tr.innerHTML = `
            < td style = "text-align: left; border-bottom: none; vertical-align: middle;" >
                <div style="display: flex; align-items: center; justify-content: flex-start;">
                    ${toggleIcon} <span style="cursor:pointer;" class="team-name-text">${team}</span>
                </div>
            </td >
            <td>${formatNumber(plan, true)}</td>
            <td>${formatNumber(actual, true)}</td>
            <td>${rate}%</td>
        `;

        // The sub-rows
        const subRows = [];
        if (hasPersons) {
            Object.keys(persons).sort((a, b) => persons[b].actual - persons[a].actual).forEach(person => {
                const pActual = persons[person].actual;
                const pPlan = persons[person].plan || 0;
                const pRate = pPlan > 0 ? ((pActual / pPlan) * 100).toFixed(1) : (pActual > 0 ? '100.0' : '0');
                const subTr = document.createElement('tr');
                subTr.className = 'clickable-row person-sub-row';
                subTr.style.display = 'none';
                subTr.style.backgroundColor = '#f8fafc';
                subTr.innerHTML = `
            < td style = "padding-left: 3.5rem; color: var(--text-secondary); text-align: left;" >?? <strong>${person}</strong></td >
                    <td style="color: var(--text-secondary);">${pPlan > 0 ? formatNumber(pPlan, true) : '-'}</td>
                    <td style="color: var(--text-primary); font-weight:500;">${formatNumber(pActual, true)}</td>
                    <td style="color: var(--text-secondary);">${pRate}%</td>
        `;

                subTr.addEventListener('click', () => {
                    renderDrillDownDetail(team, actualData, person);
                    const container = document.getElementById('drilldownDetailContainer');
                    if (container) container.scrollIntoView({ behavior: 'smooth' });
                });
                subRows.push(subTr);
            });
        }

        const teamNameText = tr.querySelector('.team-name-text');
        teamNameText.addEventListener('click', () => {
            renderDrillDownDetail(team, actualData);
            const container = document.getElementById('drilldownDetailContainer');
            if (container) container.scrollIntoView({ behavior: 'smooth' });
        });

        const toggleBtn = tr.querySelector('.person-toggle-btn');
        if (toggleBtn) {
            let expanded = false;
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                expanded = !expanded;
                toggleBtn.innerHTML = expanded ? '<i class="fas fa-minus-square"></i>' : '<i class="fas fa-plus-square"></i>';
                subRows.forEach(sr => {
                    sr.style.display = expanded ? 'table-row' : 'none';
                });
            });
        }

        tbody.appendChild(tr);
        subRows.forEach(sr => tbody.appendChild(sr));
    });

    const totalRate = totalPlan > 0 ? ((totalActual / totalPlan) * 100).toFixed(1) : 0;
    const trTotal = document.createElement('tr');
    trTotal.className = 'clickable-row';
    trTotal.style.fontWeight = 'bold';
    trTotal.style.backgroundColor = '#f8fafc';
    trTotal.innerHTML = `
            < td style = "color: var(--accent-primary);" >? 체  ?/td>
                < td style = "color: var(--accent-primary);" > ${ formatNumber(totalPlan, true) }</td >
        <td style="color: var(--accent-primary);">${formatNumber(totalActual, true)}</td>
        <td style="color: var(--accent-primary);">${totalRate}%</td>
        `;
    trTotal.addEventListener('click', () => {
        renderDrillDownDetail('?체 ?, actualData);
    });
    tbody.appendChild(trTotal);
}

function renderDrillDownDetail(teamName, actualData, filterPersonName = null, isFromFilter = false) {
    if (!isFromFilter) {
        currentDrilldownContext = { teamName, actualData, filterPersonName };
        const detailSearchInput = document.getElementById('detailSearchInput');
        if (detailSearchInput) detailSearchInput.value = '';
        const detailMonthFilter = document.getElementById('detailMonthFilter');
        if (detailMonthFilter) detailMonthFilter.value = 'all';
        const detailStatusFilter = document.getElementById('detailStatusFilter');
        if (detailStatusFilter) detailStatusFilter.value = 'all';
    }

    const container = document.getElementById('drilldownDetailContainer');
    const titleSpan = document.getElementById('drilldownTeamName');
    const tbody = document.querySelector('#drilldownDetailTable tbody');

    container.style.display = 'block';
    titleSpan.textContent = filterPersonName ? `${ teamName } - ${ filterPersonName } ` : teamName;
    tbody.innerHTML = '';

    const searchWord = (document.getElementById('detailSearchInput')?.value || '').toLowerCase().trim();
    const filterMonth = document.getElementById('detailMonthFilter')?.value || 'all';
    const filterStatus = document.getElementById('detailStatusFilter')?.value || 'all';

    let filtered = actualData.filter(a => {
        if (teamName !== '?체 ? && (a.Teamname || '-') !== teamName) return false;
        if (!a.ClientName || String(a.ClientName).trim() === '') return false;
        if (a.CalculatedAmount === 0) return false;
        if (filterPersonName && (a.SalesPerson || '미정') !== filterPersonName) return false;

        // Apply UI Filters
        if (filterMonth !== 'all' && a.SalesMonth !== filterMonth) return false;
        if (filterStatus !== 'all' && (a.Status || '') !== filterStatus) return false;

        if (searchWord) {
            const searchableText = `${ a.SalesPerson || '' } ${ a.ClientName || '' } ${ a.PORT || '' } ${ a.TradeType || '' } ${ a.WorkLocation || '' } ${ a.Region || '' } ${ a.Status || '' } ${ a.MultiYearContract || '' } `.toLowerCase();
            if (!searchableText.includes(searchWord)) return false;
        }

        return true;
    });

    filtered.sort((a, b) => {
        const tA = a.Teamname || '-';
        const tB = b.Teamname || '-';
        if (teamName === '?체 ? && tA !== tB) return tA.localeCompare(tB);

        const pA = a.SalesPerson || '미정';
        const pB = b.SalesPerson || '미정';

        if (pA === '미정' && pB !== '미정') return 1;
        if (pA !== '미정' && pB === '미정') return -1;

        if (pA !== pB) return pA.localeCompare(pB);
        return (b.CalculatedAmount || 0) - (a.CalculatedAmount || 0);
    });

    let currentPerson = null;
    const spans = {};
    filtered.forEach(row => {
        const p = row.SalesPerson || '미정';
        const t = row.Teamname || '-';
        const key = teamName === '?체 ? ? `${ t }_${ p } ` : p;
        spans[key] = (spans[key] || 0) + 1;
    });

    let sumComplete = 0;
    let sumLv3 = 0;
    let sumLv2 = 0;
    let sumLv1 = 0;
    let sumTotal = 0;

    filtered.forEach(row => {
        sumComplete += row.Complete || 0;
        sumLv3 += row.Lv3 || 0;
        sumLv2 += row.Lv2 || 0;
        sumLv1 += row.Lv1 || 0;
        sumTotal += row.CalculatedAmount || 0;

        const tr = document.createElement('tr');
        const p = row.SalesPerson || '미정';
        const t = row.Teamname || '-';
        const key = teamName === '?체 ? ? `${ t }_${ p } ` : p;

        let displayPerson = p;
        if (teamName === '?체 ?) {
            displayPerson = `< span style = "font-size:0.85em;color:var(--text-secondary);" > [${ t.replace('컨테?너', '') }]</span > <br />${ p } `;
        }

        let personCell = '';
        if (key !== currentPerson) {
            personCell = `< td rowspan = "${spans[key]}" style = "vertical-align:middle; font-weight:bold; background-color:#f8fafc; text-align:center;" > ${ displayPerson }</td > `;
            currentPerson = key;
        }

        tr.innerHTML = `
            ${ personCell }
            <td>${row.ClientName || '-'}</td>
            <td>${row.PORT || '-'}</td>
            <td>${row.TradeType || '-'}</td>
            <td>${row.WorkLocation || '-'}</td>
            <td>${row.Region || '-'}</td>
            <td>${row.SalesMonth || row.SalesWeek || '-'}</td>
            <td>${row.Status || '-'}</td>
            <td>${row.MultiYearContract || '-'}</td>
            <td style="color: var(--accent-primary); font-weight: 500;">${formatNumber(row.Complete)}</td>
            <td style="color: var(--accent-primary); font-weight: 500;">${formatNumber(row.Lv3)}</td>
            <td style="color: var(--accent-primary); font-weight: 500;">${formatNumber(row.Lv2)}</td>
            <td style="color: var(--accent-primary); font-weight: 500;">${formatNumber(row.Lv1)}</td>
            <td style="color: var(--accent-primary); font-weight: bold;">${formatNumber(row.CalculatedAmount)}</td>
        `;
        tbody.appendChild(tr);
    });

    if (filtered.length > 0) {
        const trTotal = document.createElement('tr');
        trTotal.style.fontWeight = 'bold';
        trTotal.style.backgroundColor = '#e2e8f0';
        trTotal.innerHTML = `
            < td colspan = "9" style = "text-align:center;" >?계</td >
            <td style="color: var(--accent-primary);">${formatNumber(sumComplete)}</td>
            <td style="color: var(--accent-primary);">${formatNumber(sumLv3)}</td>
            <td style="color: var(--accent-primary);">${formatNumber(sumLv2)}</td>
            <td style="color: var(--accent-primary);">${formatNumber(sumLv1)}</td>
            <td style="color: var(--accent-primary);">${formatNumber(sumTotal)}</td>
        `;
        tbody.appendChild(trTotal);
    }
}

// --- AI Chatbot Logic ---

function handleChatInput() {
    const inputEl = document.getElementById('chatbotInput');
    const text = inputEl.value.trim();
    if (!text) return;

    // Add user message
    addChatMessage('user', text);
    inputEl.value = '';

    // Process intent and generate response
    setTimeout(() => {
        processChatQuery(text);
    }, 500); // Simulate thinking
}

function addChatMessage(sender, text) {
    const messagesEl = document.getElementById('chatbotMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${ sender } `;
    msgDiv.textContent = text;
    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return msgDiv; // Return element in case we want to append canvas
}

function processChatQuery(query) {
    const { actual: baseActual } = getFilteredData();

    // Basic NLP Simulation
    const isPieChart = /?형|?이|?넛|비중/.test(query);
    const isLineChart = /??추세|?인/.test(query);
    let chartType = 'bar';
    if (isPieChart) chartType = 'pie';
    if (isLineChart) chartType = 'line';

    // Extract team names from query
    const teams = Array.from(new Set(baseActual.map(i => i.Teamname).filter(Boolean)));
    const mentionedTeam = teams.find(team => {
        const shortName = team.replace('컨테?너', '');
        return query.includes(team) || (shortName !== team && query.includes(shortName));
    });

    // Extract person names from query
    const persons = Array.from(new Set(baseActual.map(i => i.SalesPerson).filter(Boolean)));
    const mentionedPerson = persons.find(person => query.includes(person));

    let filteredActual = baseActual;
    let contextName = '?체';

    if (mentionedTeam) {
        filteredActual = filteredActual.filter(i => i.Teamname === mentionedTeam);
        contextName = mentionedTeam;
    }
    if (mentionedPerson) {
        filteredActual = filteredActual.filter(i => (i.SalesPerson || '미정') === mentionedPerson);
        contextName = mentionedPerson;
    }

    if (filteredActual.length === 0) {
        addChatMessage('bot', `? 청 ? 신 조건 ??? 치 ? 는 ? 적 ? 이 ?  ? ? 습 ? 다.`);
        return;
    }

    // Decide dimension
    let dimension = 'Teamname';
    let dimensionName = '??;
    if (mentionedTeam || query.includes('?원') || query.includes('개인')) {
        dimension = 'SalesPerson';
        dimensionName = '?업?원?;
    }
    if (query.includes('?별') || query.includes('추이') || query.includes('??)) {
        dimension = 'SalesMonth';
        dimensionName = '?별';
    }
    if (query.includes('??) || query.includes('고객') || query.includes('?체') || query.includes('?주')) {
        dimension = 'ClientName';
        dimensionName = '?주?;
    }

    // Aggregate Data
    const aggregated = {};
    let totalAmount = 0;
    filteredActual.forEach(item => {
        const key = item[dimension] || '기?';
        const amt = item.CalculatedAmount || 0;
        if (!aggregated[key]) aggregated[key] = 0;
        aggregated[key] += amt;
        totalAmount += amt;
    });

    const sortedLabels = Object.keys(aggregated).sort((a, b) => aggregated[b] - aggregated[a]);
    const topKey = sortedLabels.length > 0 ? sortedLabels[0] : '';
    const topAmount = topKey ? aggregated[topKey] : 0;
    const topPct = totalAmount > 0 ? Math.round((topAmount / totalAmount) * 100) : 0;

    // Generate highly varied, intelligent-sounding text
    const greetings = [
        "분석???료?습?다.",
        "?청?신 ?이?? 바탕?로 ?출???사?트?니??",
        "?주?적 ?이?? ?층 분석?습?다.",
        "???이 AI 모델??기반?로 ?주?적??분석??결과?니??",
        "조회?신 조건??????적 분석 리포?입?다."
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    let responseText = `??** [AI 분석 리포 ??**\n\n${ greeting } ** ${ contextName } ? 적 **??** ${ dimensionName } ** 기 ?? 로 분석 ?? 보았 ? 니 ?? `;
    if (totalAmount > 0) {
        responseText += `\n\n ?? 주?? ** ${ formatNumber(totalAmount, true) } ??*? 로 집계 ? 었 ? 며, ??  ?** ${ topKey } **?? ) ** ${ formatNumber(topAmount, true) } ??? 체 ?? ${ topPct } %)**? 로 ??? 심 ? 인 비중 ?? 차?? 고 ? 습 ? 다. `;
        if (sortedLabels.length > 1) {
            const secondKey = sortedLabels[1];
            const secondAmt = aggregated[secondKey];
            const secondPct = Math.round((secondAmt / totalAmount) * 100);
            responseText += `? 어 ??** ${ secondKey } **?? ) ** ${ formatNumber(secondAmt, true) } ?? ${ secondPct } %)**?? 기록 ? 며  ??  ? ? 르 ?? 습 ? 다. `;
        }
        if (sortedLabels.length > 3) {
            responseText += ` ???? 위 ??  ?? 간의 격차 ??? 이 ? 에 ??? 인 ? 실 ??? 습 ? 다. `;
        }
        responseText += `\n\n ? 각 ? 된 ? 세 ? 이 ? 는 ? 래 ? 리미엄 분석 차트 ?? 해 직 ?? 으 ?? 인 ?? 주세 ?? `;
    } else {
        responseText += `? 재 ? 당 조건 ??? 효 ??? 적 금액 ?? 존재 ?  ? ? 습 ? 다.`;
    }

    const parentMsg = addChatMessage('bot', responseText);

    // Format text inside message
    parentMsg.innerHTML = parentMsg.textContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    if (totalAmount > 0) {
        renderDynamicChatChart(parentMsg, sortedLabels, aggregated, chartType);
    }
}

function renderDynamicChatChart(parentElement, labels, aggregated, chartType) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dynamic-chart-wrapper';
    wrapper.style.height = chartType === 'pie' ? '300px' : '250px';
    const canvas = document.createElement('canvas');
    wrapper.appendChild(canvas);
    parentElement.appendChild(wrapper);

    // PDF Download Button
    const pdfBtn = document.createElement('button');
    pdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> 리포??PDF ?운로드';
    pdfBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.95); border: 1px solid #cbd5e1; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; color: #1e293b; display: none; z-index: 10; font-family: inherit; box-shadow: var(--shadow-sm);';
    parentElement.style.position = 'relative';
    parentElement.appendChild(pdfBtn);

    parentElement.onmouseenter = () => pdfBtn.style.display = 'block';
    parentElement.onmouseleave = () => pdfBtn.style.display = 'none';

    pdfBtn.onclick = () => {
        pdfBtn.style.display = 'none';
        const opt = {
            margin: 5,
            filename: `AI_ ? 업분석리포 ?? ${ new Date().getTime() }.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#2d3748' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(parentElement).save().then(() => {
            pdfBtn.style.display = 'block';
        });
    };

    const chartData = labels.map(l => aggregated[l]);

    new Chart(canvas.getContext('2d'), {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: chartType === 'pie' ?
                    ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b'] :
                    (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return 'rgba(59, 130, 246, 0.8)';
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.95)');
                        return gradient;
                    },
                borderColor: chartType === 'line' ? '#3b82f6' : (chartType === 'pie' ? '#ffffff' : '#2563eb'),
                borderWidth: chartType === 'line' ? 3 : (chartType === 'pie' ? 2 : 1),
                borderRadius: chartType === 'bar' ? 6 : 0,
                borderSkipped: false,
                fill: chartType !== 'line'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: chartType === 'pie',
                    position: 'right',
                    labels: { boxWidth: 12, font: { size: 11 } }
                },
                datalabels: {
                    color: chartType === 'pie' ? '#fff' : 'var(--accent-primary)',
                    font: { weight: 'bold', size: 11 },
                    anchor: chartType === 'pie' ? 'center' : 'end',
                    align: chartType === 'pie' ? 'center' : 'top',
                    formatter: (value, context) => {
                        if (value === 0) return '';
                        if (chartType === 'pie') {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                            return pct >= 5 ? `${ formatNumber(value, true) } ?? n(${ pct } %)` : '';
                        }
                        return `${ formatNumber(value, true) } ??;
                    }
}
            },
scales: {
    y: {
        display: chartType !== 'pie',
            beginAtZero: true,
                grid: { display: false }
    },
    x: {
        display: chartType !== 'pie',
            grid: { display: false }
    }
}
        },
plugins: [ChartDataLabels]
    });

const messagesEl = document.getElementById('chatbotMessages');
messagesEl.scrollTop = messagesEl.scrollHeight;
}

// --- Export Functions ---

function downloadDashboardPDF() {
    const element = document.querySelector('.app-container');
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `?업?적_??보??${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: 'avoid-all' }
    };

    // UI elements to hide during capture
    const headerControls = document.querySelector('.header-controls');
    const chatbotToggle = document.getElementById('chatbotToggle');
    const updateBtnArea = document.getElementById('updateBtn');
    const pdfBtn = document.getElementById('downloadDashboardBtn');

    if (pdfBtn) pdfBtn.style.display = 'none';
    if (updateBtnArea) updateBtnArea.style.display = 'none';
    if (chatbotToggle) chatbotToggle.style.display = 'none';

    html2pdf().set(opt).from(element).save().then(() => {
        if (pdfBtn) pdfBtn.style.display = 'flex';
        if (updateBtnArea) updateBtnArea.style.display = 'block';
        if (chatbotToggle) chatbotToggle.style.display = 'flex';
    });
}

function exportDetailToExcel() {
    const table = document.getElementById('drilldownDetailTable');
    if (!table) return;

    const teamName = document.getElementById('drilldownTeamName').textContent || '?세?역';
    const ws = XLSX.utils.table_to_sheet(table);

    // Set explicit column widths for beautiful excel layout
    ws['!cols'] = [
        { wpx: 100 }, // ?업?원
        { wpx: 200 }, // ??        { wpx: 120 }, // PORT
        { wpx: 60 },  // ?출??        { wpx: 150 }, // ?업
        { wpx: 80 },  // 권역
        { wpx: 60 },  // ?주??        { wpx: 80 },  // ?의진행?태
        { wpx: 60 },  // ?년계약
        { wpx: 80 },  // ?정금액
        { wpx: 60 },  // Lv3
        { wpx: 60 },  // Lv2
        { wpx: 60 },  // Lv1
        { wpx: 90 },  // ?주???계
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "?세?역");
    XLSX.writeFile(wb, `${teamName}_?주?적_${new Date().getTime()}.xlsx`);
}

function exportDetailToPDF() {
    const element = document.getElementById('drilldownDetailContainer');
    if (!element) return;

    element.classList.add('pdf-exporting');

    const teamName = document.getElementById('drilldownTeamName').textContent || '?세?역';
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${teamName}_?세?역_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1400 },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' },
        pagebreak: { mode: 'avoid-all' }
    };

    const exportBtns = element.querySelector('.export-actions');
    if (exportBtns) exportBtns.style.display = 'none';

    html2pdf().set(opt).from(element).save().then(() => {
        if (exportBtns) exportBtns.style.display = 'flex';
        element.classList.remove('pdf-exporting');
    });
}

function exportProgressToExcel() {
    const table = document.querySelector('.progress-table');
    if (!table) return;

    // table_to_sheet??용?여 커스? ???비 ??    const ws = XLSX.utils.table_to_sheet(table);
    ws['!cols'] = [
        { wpx: 150 }, // ?주
        { wpx: 100 }, // ?구분
        { wpx: 100 }, // ?업?원
        { wpx: 500 }, // ?전 주차
        { wpx: 500 }  // ?음 주차
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "주차??업진행?황");
    XLSX.writeFile(wb, `주차??업진행?황_${new Date().getTime()}.xlsx`);
}

function exportProgressToPDF() {
    const element = document.getElementById('progressView').querySelector('.chart-card');
    if (!element) return;

    // 컴팩??모드 ?래??추? (PDF 출력 ?용 ?트/?백 ?용)
    element.classList.add('pdf-exporting');

    const opt = {
        margin: [10, 10, 10, 10], // ?백 축소
        filename: `주차??업진행?황_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1600, scrollX: 0, scrollY: 0, x: 0, y: 0 },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'portrait' }, // A3 ?로?태
        pagebreak: { mode: 'avoid-all' }
    };

    const exportBtns = element.querySelector('div[style*="gap: 8px"]');
    if (exportBtns) exportBtns.style.display = 'none';

    html2pdf().set(opt).from(element).save().then(() => {
        if (exportBtns) exportBtns.style.display = 'flex';
        // 컴팩??모드 ?래???복
        element.classList.remove('pdf-exporting');
    });
}

// 주간 ?짜 범위 계산 ?수 (최근 목요??기?)
function getWeeklyDateRange() {
    const today = new Date();
    // 목요??4) 기??로 ?번 주차 계산 (0:?? 1:?? ..., 4:? 5:? 6:??
    let day = today.getDay();
    let diffToThursday = (day >= 4) ? day - 4 : day + 3; // 최근 ?간 목요???는 ?늘??목요????찾음

    const reportingThursday = new Date(today);
    reportingThursday.setDate(today.getDate() - diffToThursday);

    // ?전 주차 (보고 기? 목요?이 ?함??주의 ???
    const prevMonday = new Date(reportingThursday);
    prevMonday.setDate(reportingThursday.getDate() - 3); // 목요??- 3??= ?요??    const prevFriday = new Date(reportingThursday);
    prevFriday.setDate(reportingThursday.getDate() + 1); // 목요??+ 1??= 금요??
    // ?음 주차 (?전 주차 + 7??
    const nextMonday = new Date(prevMonday);
    nextMonday.setDate(prevMonday.getDate() + 7);
    const nextFriday = new Date(prevFriday);
    nextFriday.setDate(prevFriday.getDate() + 7);

    const getWeekNumber = (date) => {
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const pastDays = date.getDate() - 1;
        const firstDayWeekday = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay();
        return Math.ceil((pastDays + firstDayWeekday) / 7);
    };

    const formatRange = (mon, fri) => {
        return `${mon.getMonth() + 1}??${getWeekNumber(mon)}주차, ${mon.getMonth() + 1}/${mon.getDate()}~${fri.getMonth() + 1}/${fri.getDate()}`;
    };

    return {
        prevText: formatRange(prevMonday, prevFriday),
        nextText: formatRange(nextMonday, nextFriday)
    };
}

// 주차??업진행?황 ?이??더?function renderProgressTable(progressData) {
const tbody = document.getElementById('progressTableBody');
if (!tbody) return;

// ?이??더 ?짜 ?적 ?데?트
const dateRange = getWeeklyDateRange();
const prevHeader = document.getElementById('prevWeekHeader');
const nextHeader = document.getElementById('nextWeekHeader');
if (prevHeader) prevHeader.textContent = `?전 주차 진행?황 (${dateRange.prevText})`;
if (nextHeader) nextHeader.textContent = `?음 주차 계획 ??정?항 (${dateRange.nextText})`;

tbody.innerHTML = '';

if (!progressData || progressData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">?이?? ?습?다.</td></tr>';
    return;
}

progressData.forEach(item => {
    const tr = document.createElement('tr');

    // ?드?매핑 (user ??컬럼??는 ?? 컬럼?
    const customer = item.customer_name || item['?주'] || '-';
    const team = item.team_name || item['?구분'] || '-';
    const rep = item.sales_rep || item['?업?원'] || '-';
    const prev = item.prev_week_status || item['?전 주차'] || '';
    let curr = item.curr_week_plan || item['?음 주차'] || '';

    // ?음 주차 ?스?에???줄을 찾아 진한 ????볼드체로 감싸?        if (curr) {
    const lines = curr.split('\n');
    if (lines.length > 0 && lines[0].trim() !== '') {
        lines[0] = `<span style="color: #002D5B; font-weight: 800;">${lines[0]}</span>`;
        curr = lines.join('\n');
    }
}

        tr.innerHTML = `
            <td style="font-weight: 600;">${customer}</td>
            <td>${team}</td>
            <td>${rep}</td>
            <td>${prev}</td>
            <td>${curr}</td>
        `;
tbody.appendChild(tr);
    });
}


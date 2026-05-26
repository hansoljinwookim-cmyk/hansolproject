import sys

replacements = {
    "return '?? + new Intl.NumberFormat('ko - KR', { maximumFractionDigits: fractionDigits }).format(Math.abs(amount));": "return '-' + new Intl.NumberFormat('ko-KR', { maximumFractionDigits: fractionDigits }).format(Math.abs(amount));",
    "momGrowthText = `+${formatNumber(endMonthActual)}??;": "momGrowthText = `+${formatNumber(endMonthActual)}억`;",
    "momGrowthText = `${ sign }${ formatNumber(growth) }??;": "momGrowthText = `${sign}${formatNumber(growth)}억`;",
    "document.getElementById('kpiTargetAmount').textContent = formatNumber(cumulativePlan, true) + '??;": "document.getElementById('kpiTargetAmount').textContent = formatNumber(cumulativePlan, true) + '억';",
    "confirmedEl.innerHTML = `${formatNumber(cumulativeActual, true)}??<span style=\"font-size: 1.1rem; color: #64748b; font-weight: 500;\">(?ㅻ뀈怨꾩빟 ${formatNumber(futureMultiYearAmount, true)}???ы븿)</span>`;": "confirmedEl.innerHTML = `${formatNumber(cumulativeActual, true)}억 <span style=\"font-size: 1.1rem; color: #64748b; font-weight: 500;\">(다년계약 ${formatNumber(futureMultiYearAmount, true)}억 포함)</span>`;",
    "confirmedEl.textContent = formatNumber(cumulativeActual, true) + '??;": "confirmedEl.textContent = formatNumber(cumulativeActual, true) + '억';",
    "opt.value = `${i}??;": "opt.value = `${i}월`;",
    "opt.textContent = `${ i }??;": "opt.textContent = `${i}월`;",
    "formatter: (value) => value > 0 ? formatNumber(value, true) + '?? : '0'": "formatter: (value) => value > 0 ? formatNumber(value, true) + '억' : '0'",
    "return `${ formatNumber(value, true) } ?? (${ pct } %)`;": "return `${formatNumber(value, true)}억 (${pct}%)`;",
    "if (!monthsMap.has(`${ i }??)) {": "if (!monthsMap.has(`${i}월`)) {",
    "monthsMap.set(`${i}??, { plan: 0, actual: 0 });": "monthsMap.set(`${i}월`, { plan: 0, actual: 0 });",
    "< td style = \"padding-left: 3.5rem; color: var(--text-secondary); text-align: left;\" >?? <strong>${person}</strong></td >": "<td style=\"padding-left: 3.5rem; color: var(--text-secondary); text-align: left;\">└ <strong>${person}</strong></td>",
    "const isLineChart = /??異붿꽭|?쇱씤/.test(query);": "const isLineChart = /월별추세|라인/.test(query);",
    "addChatMessage('bot', `? 붿껌 ? 섏떊 議곌굔 ??? 쇱튂 ? 섎뒗 ? ㅼ쟻 ? 곗씠 ? 곌 ? ? 놁뒿 ? 덈떎.`);": "addChatMessage('bot', `요청하신 조건에 일치하는 실적 데이터가 없습니다.`);",
    "if (query.includes('?붾퀎') || query.includes('異붿씠') || query.includes('??)) {": "if (query.includes('월별') || query.includes('추이') || query.includes('라인')) {",
    "\"遺꾩꽍???꾨즺?덉뒿?덈떎.\",": "\"분석이 완료되었습니다.\",",
    "\"?붿껌?섏떊 ?곗씠?곕? 諛뷀깢?쇰줈 ?꾩텧???몄궗?댄듃?낅땲??\",": "\"요청하신 데이터를 바탕으로 도출한 인사이트입니다.\",",
    "\"?쒕??섏씠 AI 紐⑤뜽??湲곕컲?쇰줈 ?섏＜?ㅼ쟻??遺꾩꽍??寃곌낵?낅땲??\",": "\"제미나이 AI 모델을 기반으로 수주실적을 분석한 결과입니다.\",",
    "\"議고쉶?섏떊 議곌굔???€???ㅼ쟻 遺꾩꽍 由ы룷?몄엯?덈떎.\"": "\"조회하신 조건에 대한 실적 분석 리포트입니다.\"",
    "let responseText = `??** [AI 遺꾩꽍 由ы룷 ??**\\n\\n${ greeting } ** ${ contextName } ? ㅼ쟻 **??** ${ dimensionName } ** 湲곗 ?? 쇰줈 遺꾩꽍 ?? 蹂댁븯 ? 듬땲 ?? `;": "let responseText = `🤖 **[AI 분석 리포트]**\\n\\n${greeting} **${contextName} 실적**을 **${dimensionName}** 기준으로 분석해 보았습니다.`;",
    "responseText += `\\n\\n珥 ?? 섏＜?≪? ** ${ formatNumber(totalAmount, true) } ??*? 쇰줈 吏묎퀎 ? 섏뿀 ? 쇰ŉ, ?? 以 ?** ${ topKey } **?? 媛€) ** ${ formatNumber(topAmount, true) } ??? 꾩껜 ?? ${ topPct } %)**? 쇰줈 媛€??? 듭떖 ? 곸씤 鍮꾩쨷 ?? 李⑥?? 섍퀬 ? 덉뒿 ? 덈떎. `;": "responseText += `\\n\\n총 수주액은 **${formatNumber(totalAmount, true)}억**으로 집계되었으며, 이 중 **${topKey}**가 **${formatNumber(topAmount, true)}억(전체 중 ${topPct}%)**으로 가장 핵심적인 비중을 차지하고 있습니다.`;",
    "responseText += `? 댁뼱 ??** ${ secondKey } **?? 媛€) ** ${ formatNumber(secondAmt, true) } ?? ${ secondPct } %)**?? 湲곕줉 ? 섎ŉ 洹 ?? ㅻ ? ? 곕Ⅴ怨 ?? 덉뒿 ? 덈떎. `;": "responseText += `이어서 **${secondKey}**가 **${formatNumber(secondAmt, true)}억(${secondPct}%)**을 기록하며 그 뒤를 따르고 있습니다.`;",
    "responseText += `洹 ???? 섏쐞 ?? ぉ ?? 媛꾩쓽 寃⑹감 ??? 곗씠 ? 곗뿉 ??? 뺤씤 ? 섏떎 ??? 덉뒿 ? 덈떎. `;": "responseText += `그 밖의 하위 항목 간의 격차는 데이터에서 확인하실 수 있습니다.`;",
    "responseText += `\\n\\n ? 쒓컖 ? 붾맂 ? 곸꽭 ? 곗씠 ? 곕뒗 ? 꾨옒 ? 꾨━誘몄뾼 遺꾩꽍 李⑦듃瑜 ?? 듯빐 吏곴 ?? 곸쑝濡 ?? 뺤씤 ?? 二쇱꽭 ?? `;": "responseText += `\\n\\n시각화된 상세 데이터는 아래 프리미엄 분석 차트를 통해 직관적으로 확인해 주세요.`;",
    "responseText += `? 꾩옱 ? 대떦 議곌굔 ??? 좏슚 ??? ㅼ쟻 湲덉븸 ?? 議댁옱 ? 섏 ? ? 딆뒿 ? 덈떎.`;": "responseText += `현재 해당 조건에 유효한 실적 금액이 존재하지 않습니다.`;",
    "pdfBtn.innerHTML = '<i class=\"fas fa-file-pdf\"></i> 由ы룷??PDF ?ㅼ슫濡쒕뱶';": "pdfBtn.innerHTML = '<i class=\"fas fa-file-pdf\"></i> 리포트 PDF 다운로드';",
    "filename: `AI_ ? 곸뾽遺꾩꽍由ы룷 ?? ${ new Date().getTime() }.pdf`,": "filename: `AI_영업분석리포트_${new Date().getTime()}.pdf`,",
    "return pct >= 5 ? `${ formatNumber(value, true) } ?? n(${ pct } %)` : '';": "return pct >= 5 ? `${formatNumber(value, true)}억\\n(${pct}%)` : '';",
    "return `${ formatNumber(value, true) } ??;": "return `${formatNumber(value, true)}억`;",
    "filename: `?곸뾽?ㅼ쟻_?€?쒕낫??${new Date().getTime()}.pdf`,": "filename: `영업실적_대시보드_${new Date().getTime()}.pdf`,",
    "XLSX.utils.book_append_sheet(wb, ws, \"二쇱감蹂??곸뾽吏꾪뻾?꾪솴\");": "XLSX.utils.book_append_sheet(wb, ws, \"주차별영업진행현황\");",
    "XLSX.writeFile(wb, `二쇱감蹂??곸뾽吏꾪뻾?꾪솴_${new Date().getTime()}.xlsx`);": "XLSX.writeFile(wb, `주차별영업진행현황_${new Date().getTime()}.xlsx`);",
    "filename: `二쇱감蹂??곸뾽吏꾪뻾?꾪솴_${new Date().getTime()}.pdf`,": "filename: `주차별영업진행현황_${new Date().getTime()}.pdf`,"
}

def fix():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    for k, v in replacements.items():
        if k in content:
            content = content.replace(k, v)
        else:
            print(f"Warning: Could not find '{k}' in app.js")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Syntax fix applied successfully.")

if __name__ == '__main__':
    fix()

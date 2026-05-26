$log = Get-Content -Raw -Path 'C:\Users\Admin\.gemini\antigravity\brain\f7eeaa58-b2ad-4621-bcaf-c592af179994\.system_generated\logs\overview.txt'
$pattern = '"step_index":1552'
$lines = $log -split "`n"
foreach ($line in $lines) {
    if ($line -like "*$pattern*") {
        $json = $line | ConvertFrom-Json
        $code = $json.tool_calls[0].args.CodeContent
        # CodeContent is a string with literal \n and \t
        $code = $code -replace '\\n', "`n"
        $code = $code -replace '\\t', "`t"
        $code = $code -replace '\\"', '"'
        $code = $code -replace "\\\\", "\"
        $code | Set-Content -Path 'c:\Users\Admin/.gemini\antigravity\scratch\ContainerSalesDashboard\app.js' -Encoding UTF8
        break
    }
}

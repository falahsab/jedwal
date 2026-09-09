# PowerShell Script: تحميل صور الفرق بأسماء الفرق بالعربية
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$outputDir = "teams_images"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$teams = @(
    @{ Name = "برشلونة"; Url = "https://jdwel.com/image/teams/3337.png" },
    @{ Name = "شتوتغارت"; Url = "https://jdwel.com/image/teams/2036.png" },
    @{ Name = "مانشستر سيتي"; Url = "https://jdwel.com/image/teams/2185.png" },
    @{ Name = "أستون فيلا"; Url = "https://jdwel.com/image/teams/767.png" },
    @{ Name = "بوروسيا دورتموند"; Url = "https://jdwel.com/image/teams/1326.png" },
    @{ Name = "ريال بيتيس"; Url = "https://jdwel.com/image/teams/2776.png" },
    @{ Name = "ريال مدريد"; Url = "https://jdwel.com/image/teams/2605.png" },
    @{ Name = "آيك أثينا"; Url = "https://jdwel.com/image/teams/2306.png" },
    @{ Name = "آرسنال"; Url = "https://jdwel.com/image/teams/2999.png" },
    @{ Name = "أتلتيكو مدريد"; Url = "https://jdwel.com/image/teams/6403.png" },
    @{ Name = "بايرن ميونخ"; Url = "https://jdwel.com/image/teams/1300.png" },
    @{ Name = "بودو غليمت"; Url = "https://jdwel.com/image/teams/1459.png" },
    @{ Name = "كومو"; Url = "https://jdwel.com/image/teams/2520.png" },
    @{ Name = "فنربخشة"; Url = "https://jdwel.com/image/teams/1681.png" },
    @{ Name = "غلطة سراي"; Url = "https://jdwel.com/image/teams/1416.png" },
    @{ Name = "لانس"; Url = "https://jdwel.com/image/teams/fra_lens.png" },
    @{ Name = "ليفربول"; Url = "https://jdwel.com/image/teams/1512.png" },
    @{ Name = "مانشستر يونايتد"; Url = "https://jdwel.com/image/teams/3092.png" },
    @{ Name = "نابولي"; Url = "https://jdwel.com/image/teams/3854.png" },
    @{ Name = "باريس سان جيرمان"; Url = "https://jdwel.com/image/teams/2347.png" },
    @{ Name = "آيندهوفن"; Url = "https://jdwel.com/image/teams/1307.png" },
    @{ Name = "لايبزيغ"; Url = "https://jdwel.com/image/teams/2849.png" },
    @{ Name = "روما"; Url = "https://jdwel.com/image/teams/2435.png" },
    @{ Name = "صباح"; Url = "https://jdwel.com/image/teams/964.png" },
    @{ Name = "شاختار دونيتسك"; Url = "https://jdwel.com/image/teams/1408.png" },
    @{ Name = "سلافيا براغ"; Url = "https://jdwel.com/image/teams/1019.png" },
    @{ Name = "سلوفان براتيسلافا"; Url = "https://jdwel.com/image/teams/3369.png" },
    @{ Name = "سبورتينغ لشبونة"; Url = "https://jdwel.com/image/teams/5958.png" },
    @{ Name = "كلوب بروج"; Url = "https://jdwel.com/image/teams/5895.png" },
    @{ Name = "ليل"; Url = "https://jdwel.com/image/teams/3190.png" },
    @{ Name = "فياريال"; Url = "https://jdwel.com/image/teams/1680.png" },
    @{ Name = "إنتر ميلان"; Url = "https://jdwel.com/image/teams/2034.png" },
    @{ Name = "لاسك"; Url = "https://jdwel.com/image/teams/1167.png" },
    @{ Name = "فايكنغ"; Url = "https://jdwel.com/image/teams/2338.png" },
    @{ Name = "بورتو"; Url = "https://jdwel.com/image/teams/1443.png" },
    @{ Name = "فاينورد"; Url = "https://jdwel.com/image/teams/1406.png" }
)

Write-Host "⏳ بدء تحميل $($teams.Count) صورة إلى مجلد teams_images ..." -ForegroundColor Cyan

$i = 1
foreach ($team in $teams) {
    $filePath = Join-Path $outputDir "$($team.Name).png"
    try {
        Invoke-WebRequest -Uri $team.Url -OutFile $filePath -UserAgent "Mozilla/5.0"
        Write-Host "[$i/$($teams.Count)] ✔️ تم تحميل: $($team.Name).png" -ForegroundColor Green
    } catch {
        Write-Host "[$i/$($teams.Count)] ❌ خطأ في تحميل $($team.Name): $_" -ForegroundColor Red
    }
    $i++
}

Write-Host "`n🎉 اكتمل تحميل كافة الصور بنجاح في مجلد 'teams_images'!" -ForegroundColor Yellow

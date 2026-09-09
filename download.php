<?php
/**
 * سكربت تحميل صور الفرق وضغطها في ملف ZIP
 * متوافق مع جميع استضافات PHP و cPanel
 */

// إعدادات الوقت والذاكرة لتحميل جميع الصور دون انقطاع
@set_time_limit(300);
@ini_set('memory_limit', '256M');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

// إنشاء سياق للطلب يتضمن User-Agent لتخطي حظر 403
function fetchImageWithUserAgent($url) {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n" .
                        "Referer: https://jdwel.com/\r\n" .
                        "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8\r\n",
            'timeout' => 15,
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    return @file_get_contents($url, false, $context);
}

// 1. وضع البروكسي (إذا طلب المتصفح صورة مفردة)
if (isset($_GET['proxy_url'])) {
    $targetUrl = $_GET['proxy_url'];
    if (filter_var($targetUrl, FILTER_VALIDATE_URL)) {
        $imgData = fetchImageWithUserAgent($targetUrl);
        if ($imgData !== false) {
            header('Content-Type: image/png');
            header('Content-Disposition: inline; filename="team.png"');
            echo $imgData;
            exit;
        }
    }
    http_response_code(404);
    echo "Image not found";
    exit;
}

// 2. وضع استقبال الفرق عبر POST أو استخدام القائمة الافتراضية
$teams = [];

// التحقق مما إذا أرسلت الصفحة قائمة الفرق عبر POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJson = file_get_contents('php://input');
    $postData = json_decode($inputJson, true);
    if (!empty($postData) && is_array($postData)) {
        foreach ($postData as $item) {
            if (!empty($item['name']) && !empty($item['url'])) {
                $teams[] = [
                    'name' => trim($item['name']),
                    'url'  => trim($item['url'])
                ];
            }
        }
    }
}

// إذا لم يتم إرسال بيانات عبر POST، استخدام قائمة الفرق الـ 36 تلقائياً
if (empty($teams)) {
    $defaultTeams = [
        ["برشلونة", "https://jdwel.com/image/teams/3337.png"],
        ["شتوتغارت", "https://jdwel.com/image/teams/2036.png"],
        ["مانشستر سيتي", "https://jdwel.com/image/teams/2185.png"],
        ["أستون فيلا", "https://jdwel.com/image/teams/767.png"],
        ["بوروسيا دورتموند", "https://jdwel.com/image/teams/1326.png"],
        ["ريال بيتيس", "https://jdwel.com/image/teams/2776.png"],
        ["ريال مدريد", "https://jdwel.com/image/teams/2605.png"],
        ["آيك أثينا", "https://jdwel.com/image/teams/2306.png"],
        ["آرسنال", "https://jdwel.com/image/teams/2999.png"],
        ["أتلتيكو مدريد", "https://jdwel.com/image/teams/6403.png"],
        ["بايرن ميونخ", "https://jdwel.com/image/teams/1300.png"],
        ["بودو غليمت", "https://jdwel.com/image/teams/1459.png"],
        ["كومو", "https://jdwel.com/image/teams/2520.png"],
        ["فنربخشة", "https://jdwel.com/image/teams/1681.png"],
        ["غلطة سراي", "https://jdwel.com/image/teams/1416.png"],
        ["لانس", "https://jdwel.com/image/teams/fra_lens.png"],
        ["ليفربول", "https://jdwel.com/image/teams/1512.png"],
        ["مانشستر يونايتد", "https://jdwel.com/image/teams/3092.png"],
        ["نابولي", "https://jdwel.com/image/teams/3854.png"],
        ["باريس سان جيرمان", "https://jdwel.com/image/teams/2347.png"],
        ["آيندهوفن", "https://jdwel.com/image/teams/1307.png"],
        ["لايبزيغ", "https://jdwel.com/image/teams/2849.png"],
        ["روما", "https://jdwel.com/image/teams/2435.png"],
        ["صباح", "https://jdwel.com/image/teams/964.png"],
        ["شاختار دونيتسك", "https://jdwel.com/image/teams/1408.png"],
        ["سلافيا براغ", "https://jdwel.com/image/teams/1019.png"],
        ["سلوفان براتيسلافا", "https://jdwel.com/image/teams/3369.png"],
        ["سبورتينغ لشبونة", "https://jdwel.com/image/teams/5958.png"],
        ["كلوب بروج", "https://jdwel.com/image/teams/5895.png"],
        ["ليل", "https://jdwel.com/image/teams/3190.png"],
        ["فياريال", "https://jdwel.com/image/teams/1680.png"],
        ["إنتر ميلان", "https://jdwel.com/image/teams/2034.png"],
        ["لاسك", "https://jdwel.com/image/teams/1167.png"],
        ["فايكنغ", "https://jdwel.com/image/teams/2338.png"],
        ["بورتو", "https://jdwel.com/image/teams/1443.png"],
        ["فاينورد", "https://jdwel.com/image/teams/1406.png"]
    ];
    foreach ($defaultTeams as $t) {
        $teams[] = ['name' => $t[0], 'url' => $t[1]];
    }
}

// إنشاء مجلد لحفظ الصور على السيرفر أيضاً
$serverFolder = __DIR__ . '/teams_images';
if (!file_exists($serverFolder)) {
    @mkdir($serverFolder, 0755, true);
}

// التحقق من توفر إضافة ZipArchive
$useZip = class_exists('ZipArchive');
$zipPath = tempnam(sys_get_temp_dir(), 'teams_zip_');

if ($useZip) {
    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        $useZip = false;
    }
}

$successCount = 0;

foreach ($teams as $team) {
    $teamName = $team['name'];
    $imgUrl = $team['url'];
    $cleanName = preg_replace('/[\\\\\\/:"*?<>|]/', '', $teamName); // إزالة الرموز غير المسموحة في أسماء الملفات

    $imgData = fetchImageWithUserAgent($imgUrl);
    if ($imgData !== false && strlen($imgData) > 100) {
        // 1. حفظ نسخة في مجلد السيرفر
        @file_put_contents($serverFolder . '/' . $cleanName . '.png', $imgData);

        // 2. إضافة إلى ملف ZIP
        if ($useZip) {
            $zip->addFromString('teams_images/' . $cleanName . '.png', $imgData);
        }
        $successCount++;
    }
}

if ($useZip) {
    $zip->close();
}

// إذا كان الطلب من المتصفح عبر زر التحميل أو عبر GET
if (isset($_GET['download']) || $_SERVER['REQUEST_METHOD'] === 'POST' || isset($_GET['action'])) {
    if ($useZip && file_exists($zipPath) && filesize($zipPath) > 500) {
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="teams_images.zip"');
        header('Content-Length: ' . filesize($zipPath));
        header('Pragma: no-cache');
        readfile($zipPath);
        @unlink($zipPath);
        exit;
    }
}

// واجهة بسيطة في حال فتح الرابط مباشرة في المتصفح
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>تحميل صور الفرق</title>
    <style>
        body { font-family: Tahoma, sans-serif; background: #0f172a; color: #fff; text-align: center; padding: 50px 20px; }
        .box { background: #1e293b; max-width: 550px; margin: 0 auto; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
        h2 { color: #10b981; }
        .btn { display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .btn:hover { background: #2563eb; }
        .stat { margin: 15px 0; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🎉 اكتمل تجهيز وتحميل الصور!</h2>
        <div class="stat">تم تحميل <strong><?= $successCount ?></strong> صورة وحفظها في مجلد <code>teams_images/</code> على السيرفر.</div>
        <p>يمكنك تحميل جميع الصور مسماة بالعربية في ملف ZIP واحد:</p>
        <a href="download.php?action=zip" class="btn">📥 تحميل ملف teams_images.zip</a>
        <br><br>
        <a href="csvcreat.html" style="color: #94a3b8; font-size: 0.9rem;">العودة لصفحة توليد CSV</a>
    </div>
</body>
</html>

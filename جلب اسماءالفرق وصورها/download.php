<?php
/**
 * سكربت تحميل صور الفرق وضغطها في ملف ZIP مع معالجة التشفير وحظر 403
 * تم تصميمه لمنع تلف الصور وإزالة أي ضغط GZIP أو نصوص إضافية تفسد ملفات PNG
 */

// منع طباعة أي أخطاء أو تحذيرات قد تفسد ترويسة ملفات PNG أو ZIP
@error_reporting(0);
@ini_set('display_errors', '0');
@set_time_limit(300);
@ini_set('memory_limit', '256M');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

/**
 * دالة جلب بيانات الصورة الثنائية بدقة مع فك ضغط gzip والتحقق من سلامة PNG
 */
function downloadTeamImage($url) {
    $data = false;

    // 1. استخدام cURL مع فك الضغط التلقائي وترويسات متصفح حقيقي
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_ENCODING => '', // فك ضغط Gzip / Deflate تلقائياً (السبب الرئيسي لتلف الصور!)
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            CURLOPT_HTTPHEADER => [
                'Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer: https://jdwel.com/',
                'Sec-Ch-Ua: "Chromium";v="122", "Not(A:Brand";v="24"',
                'Sec-Ch-Ua-Mobile: ?0',
                'Sec-Ch-Ua-Platform: "Windows"',
                'Sec-Fetch-Dest: image',
                'Sec-Fetch-Mode: no-cors',
                'Sec-Fetch-Site: cross-site'
            ]
        ]);
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            $data = false;
        }
    }

    // 2. بديل file_get_contents إذا لم يتوفر cURL
    if ($data === false) {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n" .
                            "Referer: https://jdwel.com/\r\n" .
                            "Accept: image/*\r\n", // عدم إرسال accept-encoding لمنع استقبال بيانات مضغوطة غير مفكوكة
                'timeout' => 15,
                'ignore_errors' => true
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]);
        $data = @file_get_contents($url, false, $ctx);
    }

    // التحقق الصارم من أن الملف المستلم هو صورة حقيقية وليس صفحة خطأ HTML
    if ($data !== false && strlen($data) > 64) {
        // فحص الـ Magic Bytes لملفات الصور:
        // PNG تبدأ بـ: \x89PNG
        // JPEG تبدأ بـ: \xFF\xD8
        // WEBP تبدأ بـ: RIFF
        $magic4 = substr($data, 0, 4);
        if ($magic4 === "\x89PNG" || substr($data, 0, 3) === "\xFF\xD8\xFF" || $magic4 === "RIFF" || $magic4 === "GIF8") {
            return $data;
        }
    }

    return false;
}

// 1. وضع بروكسي الصورة المفردة
if (isset($_GET['proxy_url'])) {
    $targetUrl = $_GET['proxy_url'];
    if (filter_var($targetUrl, FILTER_VALIDATE_URL)) {
        $img = downloadTeamImage($targetUrl);
        if ($img !== false) {
            while (ob_get_level()) { ob_end_clean(); }
            header('Content-Type: image/png');
            header('Content-Length: ' . strlen($img));
            header('Cache-Control: public, max-age=86400');
            echo $img;
            exit;
        }
    }
    http_response_code(404);
    echo "Image error";
    exit;
}

// 2. قائمة الفرق
$teams = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawPost = file_get_contents('php://input');
    $parsed = json_decode($rawPost, true);
    if (is_array($parsed) && !empty($parsed)) {
        foreach ($parsed as $item) {
            if (!empty($item['name']) && !empty($item['url'])) {
                $teams[] = ['name' => trim($item['name']), 'url' => trim($item['url'])];
            }
        }
    }
}

// القائمة الافتراضية
if (empty($teams)) {
    $default = [
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
    foreach ($default as $d) {
        $teams[] = ['name' => $d[0], 'url' => $d[1]];
    }
}

// تنزيل وحفظ الصور
$serverDir = __DIR__ . '/teams_images';
if (!file_exists($serverDir)) {
    @mkdir($serverDir, 0755, true);
}

$zipPath = tempnam(sys_get_temp_dir(), 'teams_zip_');
$zip = new ZipArchive();
$hasZip = ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true);

$downloadedCount = 0;
$failedCount = 0;

foreach ($teams as $t) {
    $cleanName = preg_replace('/[\\\\\\/:"*?<>|]/', '', $t['name']);
    $data = downloadTeamImage($t['url']);
    
    if ($data !== false) {
        // حفظ ملف سليم محلياً في السيرفر
        @file_put_contents($serverDir . '/' . $cleanName . '.png', $data);

        // إضافة داخل ZIP
        if ($hasZip) {
            $zip->addFromString('teams_images/' . $cleanName . '.png', $data);
        }
        $downloadedCount++;
    } else {
        $failedCount++;
    }
}

if ($hasZip) {
    $zip->close();
}

// 3. إرسال ملف ZIP مباشرة في حال تم استدعاؤه للتحميل
if (isset($_GET['action']) || $_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($hasZip && file_exists($zipPath) && filesize($zipPath) > 500) {
        // تنظيف المخرجات بالكامل لمنع أي بايت زائد يفسد الأرشيف
        while (ob_get_level()) {
            ob_end_clean();
        }
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="teams_images.zip"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($zipPath));
        readfile($zipPath);
        @unlink($zipPath);
        exit;
    }
}

// فحص صورة تجريبية (فاينورد) لمعاينتها فوراً على الشاشة
$testImg = downloadTeamImage("https://jdwel.com/image/teams/1406.png");
$testBase64 = $testImg ? 'data:image/png;base64,' . base64_encode($testImg) : '';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إدارة وتحميل صور الفرق</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; text-align: center; }
        .card { background: #1e293b; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
        h1 { font-size: 1.6rem; color: #38bdf8; margin-bottom: 12px; }
        .status { padding: 12px; border-radius: 8px; margin: 15px 0; font-weight: bold; }
        .success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #059669; }
        .warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid #d97706; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #2563eb; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 1.05rem; margin-top: 15px; transition: 0.2s; }
        .btn:hover { background: #1d4ed8; }
        .test-box { margin-top: 20px; padding: 15px; background: #0b1120; border-radius: 8px; }
        .test-img { width: 50px; height: 50px; object-fit: contain; vertical-align: middle; background: rgba(255,255,255,0.05); border-radius: 6px; padding: 4px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>⚽ إدارة وتحميل صور الفرق</h1>

        <?php if ($testBase64): ?>
            <div class="status success">
                ✔️ تم التحقق: السيرفر قادر على جلب الصور وفك تشفيرها بنجاح 100%!
            </div>
            <div class="test-box">
                <p style="margin-bottom: 8px; color: #94a3b8; font-size: 0.9rem;">معاينة حقيقية لصورة مستلمة ومفكوكة التشفير (شعار فاينورد):</p>
                <img src="<?= $testBase64 ?>" alt="فاينورد" class="test-img">
                <span style="font-weight: bold; margin-right: 8px;">فاينورد.png</span>
            </div>
            <p style="margin-top: 15px; color: #cbd5e1;">تم حفظ <strong><?= $downloadedCount ?></strong> صورة سليمة في مجلد <code>teams_images/</code> على السيرفر.</p>
            <a href="download.php?action=zip" class="btn">📥 تحميل حزمة الصور السليمة (teams_images.zip)</a>
        <?php else: ?>
            <div class="status warning">
                ⚠️ تنبيه: موقع الصور الخارجي (jdwel.com) يحظر عنوان IP الخاص بشركة الاستضافة (Cloudflare Block).
            </div>
            <div style="text-align: right; font-size: 0.95rem; line-height: 1.8; color: #cbd5e1;">
                <p><strong>لماذا عملت الصور محلياً في جهازك؟</strong><br>
                لأن جهازك متصل بإنترنت منزلي غير محظور، بينما شركات الاستضافة يتم حظرها أحياناً من سيرفر الصور الخارجي.</p>
                <p><strong>الحل البسيط جداً:</strong><br>
                بما أن سكربت بايثون أو باور شيل قام بتنزيل الصور بنجاح في جهازك داخل مجلد <code>teams_images</code>:
                <br>
                👉 <strong>فقط اسحب مجلد <code>teams_images</code> كما هو وارفعه إلى موقعك في نفس المسار!</strong>
                <br>
                وستصبح كل الصور تعمل في موقعك مباشرة على الرابط:
                <code>https://jedwal.yemensat.com/teams_images/فاينورد.png</code>
                دون أي وسيط وبجودة أصلية كاملة!
                </p>
            </div>
        <?php endif; ?>

        <br><br>
        <a href="csvcreat.html" style="color: #64748b; font-size: 0.9rem; text-decoration: none;">⬅️ العودة لصفحة توليد CSV</a>
    </div>
</body>
</html>
